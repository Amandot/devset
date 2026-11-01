import path from 'node:path';
import type { ScannedFile } from '../scanner/file-scanner.js';
import type { DetectedTechnology, TechnologyEvidence } from '../types/project.js';
import { FRAMEWORK_RULES } from './rules.js';
import { readFileSafe, readJsonSafe } from '../utils/filesystem.js';

export class FrameworkDetector {
  static detect(
    componentDir: string,
    files: ScannedFile[]
  ): { technologies: DetectedTechnology[]; primary?: string } {
    const results: DetectedTechnology[] = [];
    const fileNames = new Set(files.map(f => f.fileName));

    // Cache content of key manifests for regex checks
    const reqPath = path.join(componentDir, 'requirements.txt');
    const reqContent = readFileSafe(reqPath);

    const pyprojectPath = path.join(componentDir, 'pyproject.toml');
    const pyprojectContent = readFileSafe(pyprojectPath);

    const pkgPath = path.join(componentDir, 'package.json');
    const pkgJson = readJsonSafe<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    }>(pkgPath);

    const allDeps = {
      ...(pkgJson?.dependencies || {}),
      ...(pkgJson?.devDependencies || {}),
    };

    // Also inspect python source files for imports if needed
    const pyFiles = files.filter(f => f.extension === '.py');
    let pySampleContent = '';
    for (const pyf of pyFiles.slice(0, 5)) {
      const c = readFileSafe(pyf.absolutePath, 10000);
      if (c) pySampleContent += '\n' + c;
    }

    for (const rule of FRAMEWORK_RULES) {
      let score = 0;
      const evidence: TechnologyEvidence[] = [];

      // File rules
      if (rule.fileRules) {
        for (const fileRule of rule.fileRules) {
          if (fileRule.pathPattern.startsWith('**/')) {
            const extOrName = fileRule.pathPattern.replace('**/', '');
            const matchCount = files.filter(f =>
              extOrName.startsWith('*.')
                ? f.extension === extOrName.replace('*', '')
                : f.fileName === extOrName
            ).length;

            if (matchCount > 0) {
              const weight = Math.min(fileRule.weight + Math.min(matchCount, 10), 30);
              score += weight;
              evidence.push({
                source: `${matchCount} file(s) matching ${fileRule.pathPattern}`,
                weight,
                description: fileRule.description,
              });
            }
          } else {
            if (fileNames.has(fileRule.pathPattern)) {
              score += fileRule.weight;
              evidence.push({
                source: fileRule.pathPattern,
                weight: fileRule.weight,
                description: fileRule.description,
              });
            }
          }
        }
      }

      // Dependency rules (package.json)
      if (rule.dependencyRules && pkgJson) {
        for (const depRule of rule.dependencyRules) {
          const matched = (depRule.packages || []).filter(pkg => allDeps[pkg]);
          if (matched.length > 0) {
            score += depRule.weight;
            evidence.push({
              source: `package.json dependencies: ${matched.join(', ')}`,
              weight: depRule.weight,
              description: depRule.description,
            });
          }
        }
      }

      // Content rules (regex on manifests or code)
      if (rule.contentRules) {
        for (const contentRule of rule.contentRules) {
          const reg = typeof contentRule.pattern === 'string'
            ? new RegExp(contentRule.pattern, 'i')
            : contentRule.pattern;

          if (contentRule.filePattern === 'requirements.txt' && reqContent) {
            if (reg.test(reqContent)) {
              score += contentRule.weight;
              evidence.push({
                source: 'requirements.txt declaration',
                weight: contentRule.weight,
                description: contentRule.description,
              });
            }
          } else if (contentRule.filePattern === 'pyproject.toml' && pyprojectContent) {
            if (reg.test(pyprojectContent)) {
              score += contentRule.weight;
              evidence.push({
                source: 'pyproject.toml declaration',
                weight: contentRule.weight,
                description: contentRule.description,
              });
            }
          } else if (contentRule.filePattern === '**/*.py' && pySampleContent) {
            if (reg.test(pySampleContent)) {
              score += contentRule.weight;
              evidence.push({
                source: 'Python source code import',
                weight: contentRule.weight,
                description: contentRule.description,
              });
            }
          }
        }
      }

      if (score >= rule.minScoreForPossible) {
        results.push({
          name: rule.name,
          category: 'framework',
          confidence: score >= rule.threshold ? 'confirmed' : 'possible',
          score,
          evidence,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const primary = results.length > 0 ? results[0].name : undefined;

    return { technologies: results, primary };
  }
}
