import path from 'node:path';
import type { ScannedFile } from '../scanner/file-scanner.js';
import type {
  DetectedTechnology,
  TechnologyEvidence,
  SupportedPackageManager,
} from '../types/project.js';
import { PACKAGE_MANAGER_RULES } from './rules.js';
import { readFileSafe, readJsonSafe } from '../utils/filesystem.js';

export interface PackageManagerDetectionResult {
  technologies: DetectedTechnology[];
  primary?: SupportedPackageManager;
  installCommand?: string;
  hasConflict: boolean;
  conflictingManagers?: SupportedPackageManager[];
  lockfiles: string[];
}

export class PackageManagerDetector {
  static detect(
    componentDir: string,
    files: ScannedFile[]
  ): PackageManagerDetectionResult {
    const results: DetectedTechnology[] = [];
    const fileNames = new Set(files.map(f => f.fileName));

    const pkgPath = path.join(componentDir, 'package.json');
    const pkgJson = readJsonSafe<{ packageManager?: string }>(pkgPath);

    const pyprojectPath = path.join(componentDir, 'pyproject.toml');
    const pyprojectContent = readFileSafe(pyprojectPath);

    const lockfilesFound: string[] = [];

    for (const rule of PACKAGE_MANAGER_RULES) {
      let score = 0;
      const evidence: TechnologyEvidence[] = [];

      if (rule.fileRules) {
        for (const fileRule of rule.fileRules) {
          if (fileNames.has(fileRule.pathPattern)) {
            score += fileRule.weight;
            evidence.push({
              source: fileRule.pathPattern,
              weight: fileRule.weight,
              description: fileRule.description,
            });

            if (fileRule.pathPattern.includes('lock') || fileRule.pathPattern.includes('Pipfile.lock')) {
              lockfilesFound.push(fileRule.pathPattern);
            }
          }
        }
      }

      // Check packageManager field in package.json (e.g. "pnpm@8.15.0")
      if (pkgJson && pkgJson.packageManager && rule.packageManager) {
        if (pkgJson.packageManager.startsWith(rule.packageManager)) {
          const weight = 35;
          score += weight;
          evidence.push({
            source: `package.json packageManager: "${pkgJson.packageManager}"`,
            weight,
            description: `Explicit packageManager field in package.json`,
          });
        }
      }

      // Check pyproject.toml tools
      if (rule.contentRules && pyprojectContent) {
        for (const contentRule of rule.contentRules) {
          const reg = typeof contentRule.pattern === 'string'
            ? new RegExp(contentRule.pattern, 'i')
            : contentRule.pattern;
          if (reg.test(pyprojectContent)) {
            score += contentRule.weight;
            evidence.push({
              source: 'pyproject.toml tool section',
              weight: contentRule.weight,
              description: contentRule.description,
            });
          }
        }
      }

      if (score >= rule.minScoreForPossible) {
        results.push({
          name: rule.name,
          category: 'package-manager',
          confidence: score >= rule.threshold ? 'confirmed' : 'possible',
          score,
          evidence,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    // Check for lockfile conflict in JS ecosystem
    const nodeLocks = [
      { name: 'npm', file: 'package-lock.json' },
      { name: 'yarn', file: 'yarn.lock' },
      { name: 'pnpm', file: 'pnpm-lock.yaml' },
      { name: 'bun', file: 'bun.lockb' },
      { name: 'bun', file: 'bun.lock' },
    ].filter(l => fileNames.has(l.file));

    const distinctNodeManagers = Array.from(new Set(nodeLocks.map(l => l.name))) as SupportedPackageManager[];
    const hasConflict = distinctNodeManagers.length > 1;

    // Resolve primary package manager
    let primary: SupportedPackageManager | undefined;
    if (results.length > 0) {
      const topName = results[0].name.toLowerCase();
      if (topName === 'npm') primary = 'npm';
      else if (topName === 'yarn') primary = 'yarn';
      else if (topName === 'pnpm') primary = 'pnpm';
      else if (topName === 'bun') primary = 'bun';
      else if (topName === 'pip') primary = 'pip';
      else if (topName === 'poetry') primary = 'poetry';
      else if (topName === 'pipenv') primary = 'pipenv';
      else if (topName === 'uv') primary = 'uv';
      else if (topName === 'conda') primary = 'conda';
      else if (topName === 'maven') primary = 'maven';
      else if (topName === 'gradle') primary = 'gradle';
    }

    // Determine deterministic install command
    let installCommand: string | undefined;
    if (primary === 'npm') {
      installCommand = fileNames.has('package-lock.json') ? 'npm ci' : 'npm install';
    } else if (primary === 'yarn') {
      installCommand = fileNames.has('yarn.lock') ? 'yarn install --frozen-lockfile' : 'yarn install';
    } else if (primary === 'pnpm') {
      installCommand = fileNames.has('pnpm-lock.yaml') ? 'pnpm install --frozen-lockfile' : 'pnpm install';
    } else if (primary === 'bun') {
      installCommand = (fileNames.has('bun.lockb') || fileNames.has('bun.lock'))
        ? 'bun install --frozen-lockfile'
        : 'bun install';
    } else if (primary === 'pip') {
      installCommand = 'python -m pip install -r requirements.txt';
    } else if (primary === 'poetry') {
      installCommand = 'poetry install';
    } else if (primary === 'pipenv') {
      installCommand = 'pipenv install';
    } else if (primary === 'uv') {
      installCommand = 'uv sync';
    } else if (primary === 'conda') {
      installCommand = 'conda env update --file environment.yml';
    } else if (primary === 'maven') {
      const isWin = process.platform === 'win32';
      installCommand = fileNames.has('mvnw') || fileNames.has('mvnw.cmd')
        ? (isWin ? 'mvnw.cmd clean install' : './mvnw clean install')
        : 'mvn clean install';
    } else if (primary === 'gradle') {
      const isWin = process.platform === 'win32';
      installCommand = fileNames.has('gradlew') || fileNames.has('gradlew.bat')
        ? (isWin ? 'gradlew.bat build' : './gradlew build')
        : 'gradle build';
    }

    return {
      technologies: results,
      primary,
      installCommand,
      hasConflict,
      conflictingManagers: hasConflict ? distinctNodeManagers : undefined,
      lockfiles: lockfilesFound,
    };
  }
}
