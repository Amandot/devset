import path from 'node:path';
import type { ScannedFile } from '../scanner/file-scanner.js';
import type { DetectedTechnology, TechnologyEvidence, SupportedLanguage } from '../types/project.js';
import { LANGUAGE_RULES } from './rules.js';
import { readFileSafe, readJsonSafe } from '../utils/filesystem.js';

export class LanguageDetector {
  static detect(
    componentDir: string,
    files: ScannedFile[]
  ): { technologies: DetectedTechnology[]; primary?: SupportedLanguage } {
    const results: DetectedTechnology[] = [];
    const fileNames = new Set(files.map(f => f.fileName));
    const relativePaths = new Set(files.map(f => f.relativePath));

    // Read package.json if present
    const pkgPath = path.join(componentDir, 'package.json');
    const pkgJson = readJsonSafe<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }>(pkgPath);

    for (const rule of LANGUAGE_RULES) {
      let score = 0;
      const evidence: TechnologyEvidence[] = [];

      // Check file rules
      if (rule.fileRules) {
        for (const fileRule of rule.fileRules) {
          if (fileRule.pathPattern.startsWith('**/')) {
            const extOrName = fileRule.pathPattern.replace('**/', '');
            const count = files.filter(f =>
              extOrName.startsWith('*.')
                ? f.extension === extOrName.replace('*', '')
                : f.fileName === extOrName
            ).length;

            if (count > 0) {
              const weight = Math.min(fileRule.weight + Math.min(count * 2, 10), 30);
              score += weight;
              evidence.push({
                source: `${count} matching file(s) for ${fileRule.pathPattern}`,
                weight,
                description: fileRule.description,
              });
            }
          } else {
            // Exact file in component
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

      // Check dependency rules
      if (rule.dependencyRules && pkgJson) {
        for (const depRule of rule.dependencyRules) {
          const field = depRule.packageJsonField || 'dependencies';
          const deps = pkgJson[field] || {};
          const found = (depRule.packages || []).filter(p => deps[p]);
          if (found.length > 0) {
            score += depRule.weight;
            evidence.push({
              source: `package.json ${field} (${found.join(', ')})`,
              weight: depRule.weight,
              description: depRule.description,
            });
          }
        }
      }

      if (score >= rule.minScoreForPossible) {
        results.push({
          name: rule.name,
          category: 'language',
          confidence: score >= rule.threshold ? 'confirmed' : 'possible',
          score,
          evidence,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Determine primary language
    let primary: SupportedLanguage | undefined;
    if (results.length > 0) {
      const topName = results[0].name.toLowerCase();
      if (topName.includes('typescript')) primary = 'typescript';
      else if (topName.includes('javascript')) primary = 'javascript';
      else if (topName.includes('python')) primary = 'python';
      else if (topName.includes('java')) primary = 'java';
      else if (topName.includes('rust')) primary = 'rust';
      else if (topName.includes('go')) primary = 'go';
      else if (topName.includes('php')) primary = 'php';
      else if (topName.includes('ruby')) primary = 'ruby';
      else if (topName.includes('c#')) primary = 'csharp';
    }

    return { technologies: results, primary };
  }
}
