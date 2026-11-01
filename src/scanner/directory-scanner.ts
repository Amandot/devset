import path from 'node:path';
import { readJsonSafe, readFileSafe, normalizePath } from '../utils/filesystem.js';
import type { ScannedFile } from './file-scanner.js';

export interface DiscoveredComponent {
  name: string;
  relativePath: string; // '.' for root or 'frontend', 'backend', 'packages/web'
  absolutePath: string;
  files: ScannedFile[];
  suggestedType: 'frontend' | 'backend' | 'admin' | 'shared' | 'service' | 'root';
}

export interface MonorepoConfig {
  isMonorepo: boolean;
  type?: 'pnpm' | 'npm-yarn' | 'turborepo' | 'lerna';
  workspacePatterns?: string[];
}

export class DirectoryScanner {
  /**
   * Discover monorepo patterns from root files
   */
  static detectMonorepo(rootDir: string, rootFiles: ScannedFile[]): MonorepoConfig {
    const fileNames = new Set(rootFiles.map(f => f.fileName));

    // Check pnpm-workspace.yaml
    if (fileNames.has('pnpm-workspace.yaml')) {
      return {
        isMonorepo: true,
        type: 'pnpm',
        workspacePatterns: ['packages/*', 'apps/*'],
      };
    }

    // Check turbo.json
    if (fileNames.has('turbo.json')) {
      return {
        isMonorepo: true,
        type: 'turborepo',
        workspacePatterns: ['apps/*', 'packages/*'],
      };
    }

    // Check lerna.json
    if (fileNames.has('lerna.json')) {
      return {
        isMonorepo: true,
        type: 'lerna',
        workspacePatterns: ['packages/*'],
      };
    }

    // Check package.json workspaces
    const rootPkgPath = path.join(rootDir, 'package.json');
    const rootPkg = readJsonSafe<{ workspaces?: string[] | { packages?: string[] } }>(rootPkgPath);
    if (rootPkg && rootPkg.workspaces) {
      const patterns = Array.isArray(rootPkg.workspaces)
        ? rootPkg.workspaces
        : rootPkg.workspaces.packages || [];
      return {
        isMonorepo: true,
        type: 'npm-yarn',
        workspacePatterns: patterns,
      };
    }

    return { isMonorepo: false };
  }

  /**
   * Discovers sub-projects / components in the repository
   */
  static discoverComponents(
    rootDir: string,
    allFiles: ScannedFile[]
  ): DiscoveredComponent[] {
    const componentDirs = new Map<string, ScannedFile[]>();

    // Manifest indicators of an independent project component
    const manifestNames = new Set([
      'package.json',
      'requirements.txt',
      'pyproject.toml',
      'Pipfile',
      'manage.py',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'Cargo.toml',
      'go.mod',
      'composer.json',
    ]);

    // Find directories containing manifest files
    for (const file of allFiles) {
      if (manifestNames.has(file.fileName)) {
        const dir = file.directory === '.' ? '.' : file.directory;
        if (!componentDirs.has(dir)) {
          componentDirs.set(dir, []);
        }
      }
    }

    // Always include root directory even if it has no manifests yet
    if (!componentDirs.has('.')) {
      componentDirs.set('.', []);
    }

    // Associate every scanned file to its closest component directory
    const sortedComponentDirs = Array.from(componentDirs.keys()).sort(
      (a, b) => b.length - a.length
    );

    for (const file of allFiles) {
      let matchedDir = '.';
      for (const compDir of sortedComponentDirs) {
        if (compDir === '.') continue;
        if (file.relativePath.startsWith(compDir + '/') || file.relativePath === compDir) {
          matchedDir = compDir;
          break;
        }
      }
      componentDirs.get(matchedDir)?.push(file);
    }

    // Transform into DiscoveredComponent list
    const components: DiscoveredComponent[] = [];

    for (const [dir, files] of componentDirs.entries()) {
      // Determine suggested type from folder name or contents
      const lowerDir = dir.toLowerCase();
      let suggestedType: DiscoveredComponent['suggestedType'] = 'root';

      if (dir === '.') {
        suggestedType = 'root';
      } else if (
        lowerDir.includes('front') ||
        lowerDir.includes('ui') ||
        lowerDir.includes('web') ||
        lowerDir.includes('client')
      ) {
        suggestedType = 'frontend';
      } else if (
        lowerDir.includes('back') ||
        lowerDir.includes('api') ||
        lowerDir.includes('server')
      ) {
        suggestedType = 'backend';
      } else if (lowerDir.includes('admin')) {
        suggestedType = 'admin';
      } else if (lowerDir.includes('shared') || lowerDir.includes('common')) {
        suggestedType = 'shared';
      } else {
        // Inspect files to suggest type
        const hasVite = files.some(f => f.fileName.includes('vite.config'));
        const hasNext = files.some(f => f.fileName.includes('next.config'));
        const hasManagePy = files.some(f => f.fileName === 'manage.py');

        if (hasVite || hasNext) suggestedType = 'frontend';
        else if (hasManagePy) suggestedType = 'backend';
        else suggestedType = 'service';
      }

      const name = dir === '.' ? path.basename(rootDir) : path.basename(dir);

      components.push({
        name,
        relativePath: dir,
        absolutePath: path.resolve(rootDir, dir),
        files,
        suggestedType,
      });
    }

    // Sort: components under root, with root first or last
    return components.sort((a, b) => {
      if (a.relativePath === '.') return -1;
      if (b.relativePath === '.') return 1;
      return a.relativePath.localeCompare(b.relativePath);
    });
  }
}
