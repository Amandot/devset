import path from 'node:path';
import type { ScannedFile } from '../scanner/file-scanner.js';
import type { DetectedTechnology, TechnologyEvidence } from '../types/project.js';
import { DATABASE_RULES } from './rules.js';
import { readFileSafe, readJsonSafe } from '../utils/filesystem.js';

export class DatabaseDetector {
  static detect(
    componentDir: string,
    files: ScannedFile[]
  ): { technologies: DetectedTechnology[]; hasDatabase: boolean } {
    const results: DetectedTechnology[] = [];
    const fileNames = new Set(files.map(f => f.fileName));

    const pkgPath = path.join(componentDir, 'package.json');
    const pkgJson = readJsonSafe<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(pkgPath);
    const allDeps = {
      ...(pkgJson?.dependencies || {}),
      ...(pkgJson?.devDependencies || {}),
    };

    const reqPath = path.join(componentDir, 'requirements.txt');
    const reqContent = readFileSafe(reqPath);

    const envExamplePath = path.join(componentDir, '.env.example');
    const envExampleContent = readFileSafe(envExamplePath);

    for (const rule of DATABASE_RULES) {
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
              score += fileRule.weight;
              evidence.push({
                source: `${matchCount} file(s) matching ${fileRule.pathPattern}`,
                weight: fileRule.weight,
                description: fileRule.description,
              });
            }
          } else {
            // Relative match in component or subfolder
            const hasExact = files.some(
              f => f.fileName === fileRule.pathPattern || f.relativePath.endsWith(fileRule.pathPattern)
            );
            if (hasExact) {
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

      // Dependency rules
      if (rule.dependencyRules && pkgJson) {
        for (const depRule of rule.dependencyRules) {
          const matched = (depRule.packages || []).filter(pkg => allDeps[pkg]);
          if (matched.length > 0) {
            score += depRule.weight;
            evidence.push({
              source: `package.json: ${matched.join(', ')}`,
              weight: depRule.weight,
              description: depRule.description,
            });
          }
        }
      }

      // Content rules
      if (rule.contentRules) {
        for (const contentRule of rule.contentRules) {
          const reg = typeof contentRule.pattern === 'string'
            ? new RegExp(contentRule.pattern, 'i')
            : contentRule.pattern;

          if (contentRule.filePattern === 'requirements.txt' && reqContent && reg.test(reqContent)) {
            score += contentRule.weight;
            evidence.push({
              source: 'requirements.txt database dependency',
              weight: contentRule.weight,
              description: contentRule.description,
            });
          } else if (contentRule.filePattern === '.env.example' && envExampleContent && reg.test(envExampleContent)) {
            score += contentRule.weight;
            evidence.push({
              source: '.env.example connection indicator',
              weight: contentRule.weight,
              description: contentRule.description,
            });
          }
        }
      }

      if (score >= rule.minScoreForPossible) {
        results.push({
          name: rule.name,
          category: 'database',
          confidence: score >= rule.threshold ? 'confirmed' : 'possible',
          score,
          evidence,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return {
      technologies: results,
      hasDatabase: results.length > 0,
    };
  }
}
