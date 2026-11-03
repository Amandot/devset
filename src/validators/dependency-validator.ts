import fs from 'node:fs';
import path from 'node:path';
import { dirExists, fileExists, readFileSafe } from '../utils/filesystem.js';
import { runProcess } from '../utils/process.js';
import type { ProjectComponent } from '../types/project.js';

export interface VirtualEnvInfo {
  dir: string;
  pythonPath: string;
  venvName: string;
}

export interface DependencyCheckResult {
  satisfied: boolean;
  missing: string[];
  conflicts: string[];
  details: string;
}

export interface ParsedRequirement {
  name: string;
  normalizedName: string;
  spec?: string;
  raw: string;
}

export interface ComponentDependencyStatus {
  componentName: string;
  isInstalled: boolean;
  details: string;
  virtualEnv?: {
    exists: boolean;
    path?: string;
    pythonPath?: string;
  };
  missingDependencies?: string[];
  dependencyConflicts?: string[];
}

export function isRealExecutable(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    return stat.size > 100;
  } catch {
    return false;
  }
}

export function normalizePackageName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

export function parseVersion(v: string): number[] {
  return v
    .split(/[.\-+]/)
    .map(part => parseInt(part, 10))
    .filter(n => !isNaN(n));
}

export function compareVersions(v1: string, v2: string): number {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function checkSingleConstraint(installed: string, op: string, target: string): boolean {
  const cmp = compareVersions(installed, target);
  switch (op) {
    case '==':
    case '===':
      return cmp === 0;
    case '!=':
      return cmp !== 0;
    case '>=':
      return cmp >= 0;
    case '<=':
      return cmp <= 0;
    case '>':
      return cmp > 0;
    case '<':
      return cmp < 0;
    case '~=': {
      if (cmp < 0) return false;
      const targetParts = parseVersion(target);
      if (targetParts.length <= 1) return true;
      const prefixParts = targetParts.slice(0, targetParts.length - 1);
      prefixParts[prefixParts.length - 1] += 1;
      const maxVer = prefixParts.join('.');
      return compareVersions(installed, maxVer) < 0;
    }
    default:
      return true;
  }
}

export function checkSpecifier(installed: string, spec?: string): boolean {
  if (!spec || !spec.trim()) return true;
  const clauses = spec.split(',').map(c => c.trim()).filter(Boolean);
  for (const clause of clauses) {
    const match = clause.match(/^([<>=!~]+)\s*([0-9a-zA-Z.\-_+]+)$/);
    if (!match) continue;
    const [, op, target] = match;
    if (!checkSingleConstraint(installed, op, target)) {
      return false;
    }
  }
  return true;
}

export function parseRequirementsTxt(content: string): ParsedRequirement[] {
  const lines = content.split('\n');
  const reqs: ParsedRequirement[] = [];

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim();
    if (!line || line.startsWith('-')) continue;

    const match = line.match(/^([a-zA-Z0-9_\-\.]+)(?:\[[^\]]*\])?\s*([<>=!~].*)?$/);
    if (match) {
      const name = match[1];
      const spec = match[2]?.trim();
      reqs.push({
        name,
        normalizedName: normalizePackageName(name),
        spec,
        raw: line,
      });
    }
  }

  return reqs;
}

export function parsePyprojectToml(content: string): ParsedRequirement[] {
  const reqs: ParsedRequirement[] = [];
  const lines = content.split('\n');
  let inDependencies = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('dependencies = [') || line.startsWith('[tool.poetry.dependencies]')) {
      inDependencies = true;
      continue;
    }
    if (inDependencies && line.startsWith(']')) {
      inDependencies = false;
      continue;
    }
    if (inDependencies && (line.startsWith('[') || line.startsWith('optional-dependencies'))) {
      inDependencies = false;
      continue;
    }

    if (inDependencies) {
      const match = line.match(/["']([a-zA-Z0-9_\-\.]+)(?:\[[^\]]*\])?\s*([<>=!~^].*?)?["']/);
      if (match) {
        const name = match[1];
        const spec = match[2]?.trim();
        reqs.push({
          name,
          normalizedName: normalizePackageName(name),
          spec,
          raw: line,
        });
      }
    }
  }
  return reqs;
}

export function parsePipfile(content: string): ParsedRequirement[] {
  const reqs: ParsedRequirement[] = [];
  const lines = content.split('\n');
  let inPackages = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '[packages]') {
      inPackages = true;
      continue;
    }
    if (inPackages && line.startsWith('[')) {
      inPackages = false;
      continue;
    }

    if (inPackages) {
      const match = line.match(/^([a-zA-Z0-9_\-\.]+)\s*=\s*["']([^"']+)["']/);
      if (match) {
        const name = match[1];
        const val = match[2].trim();
        const spec = val === '*' ? undefined : val;
        reqs.push({
          name,
          normalizedName: normalizePackageName(name),
          spec,
          raw: line,
        });
      }
    }
  }
  return reqs;
}

export function parseDeclaredDependencies(componentDir: string, manifestFiles: string[] = []): ParsedRequirement[] {
  const reqs: ParsedRequirement[] = [];
  const visited = new Set<string>();

  const reqFiles = manifestFiles.filter(f => f.toLowerCase().includes('requirement') && f.endsWith('.txt'));
  if (reqFiles.length === 0 && fileExists(path.join(componentDir, 'requirements.txt'))) {
    reqFiles.push('requirements.txt');
  }

  for (const file of reqFiles) {
    const full = path.resolve(componentDir, file);
    if (visited.has(full)) continue;
    visited.add(full);
    const content = readFileSafe(full);
    if (content) {
      reqs.push(...parseRequirementsTxt(content));
    }
  }

  if (reqs.length === 0) {
    const pyproject = path.join(componentDir, 'pyproject.toml');
    if (fileExists(pyproject)) {
      const content = readFileSafe(pyproject);
      if (content) {
        reqs.push(...parsePyprojectToml(content));
      }
    }
  }

  if (reqs.length === 0) {
    const pipfile = path.join(componentDir, 'Pipfile');
    if (fileExists(pipfile)) {
      const content = readFileSafe(pipfile);
      if (content) {
        reqs.push(...parsePipfile(content));
      }
    }
  }

  return reqs;
}

export class DependencyValidator {
  /**
   * Detect existing .venv and venv directories.
   * Windows: Scripts/python.exe
   * Linux/macOS: bin/python
   */
  static findVirtualEnv(componentDir: string): VirtualEnvInfo | null {
    const isWin = process.platform === 'win32';
    const candidates = ['.venv', 'venv'];

    for (const candidate of candidates) {
      const venvDir = path.resolve(componentDir, candidate);
      if (!dirExists(venvDir)) continue;

      const binCandidates = isWin
        ? [
            path.join(venvDir, 'Scripts', 'python.exe'),
            path.join(venvDir, 'Scripts', 'python'),
            path.join(venvDir, 'bin', 'python'),
            path.join(venvDir, 'bin', 'python3'),
          ]
        : [
            path.join(venvDir, 'bin', 'python'),
            path.join(venvDir, 'bin', 'python3'),
            path.join(venvDir, 'Scripts', 'python.exe'),
            path.join(venvDir, 'Scripts', 'python'),
          ];

      for (const bin of binCandidates) {
        if (fileExists(bin)) {
          return {
            dir: venvDir,
            pythonPath: bin,
            venvName: candidate,
          };
        }
      }
    }

    return null;
  }

  /**
   * Inspect site-packages on filesystem directly
   */
  static getInstalledPackagesFromSitePackages(venvDir: string): Record<string, string> {
    const dists: Record<string, string> = {};
    const searchDirs: string[] = [
      path.join(venvDir, 'Lib', 'site-packages'),
      path.join(venvDir, 'lib', 'site-packages'),
    ];

    const libDir = path.join(venvDir, 'lib');
    if (dirExists(libDir)) {
      try {
        const entries = fs.readdirSync(libDir);
        for (const ent of entries) {
          if (ent.startsWith('python')) {
            searchDirs.push(path.join(libDir, ent, 'site-packages'));
          }
        }
      } catch {}
    }

    for (const siteDir of searchDirs) {
      if (!dirExists(siteDir)) continue;
      try {
        const entries = fs.readdirSync(siteDir);
        for (const ent of entries) {
          if (ent.endsWith('.dist-info') || ent.endsWith('.egg-info')) {
            const base = ent.replace(/\.(dist|egg)-info$/, '');
            const match = base.match(/^(.+?)-([0-9a-zA-Z.\-_+]+)$/);
            if (match) {
              const rawName = match[1];
              const version = match[2];
              dists[normalizePackageName(rawName)] = version;
            }
          }
        }
      } catch {}
    }

    return dists;
  }

  /**
   * Query installed distributions from Python using standard library importlib.metadata
   */
  static async getInstalledPackagesFromPython(pythonBin: string): Promise<Record<string, string> | null> {
    if (!isRealExecutable(pythonBin)) {
      return null;
    }

    const script =
      "import json, sys\n" +
      "try:\n" +
      "    import importlib.metadata as md\n" +
      "    d = {dist.metadata['Name'].lower().replace('_', '-').replace('.', '-'): dist.version for dist in md.distributions() if dist.metadata and 'Name' in dist.metadata}\n" +
      "    print(json.dumps(d))\n" +
      "except Exception:\n" +
      "    try:\n" +
      "        import pkg_resources\n" +
      "        d = {dist.key.lower().replace('_', '-').replace('.', '-'): dist.version for dist in pkg_resources.working_set}\n" +
      "        print(json.dumps(d))\n" +
      "    except Exception:\n" +
      "        print(json.dumps({}))";

    try {
      const res = await runProcess(pythonBin, ['-c', script], { timeoutMs: 5000 });
      if (res.success && res.stdout.trim()) {
        return JSON.parse(res.stdout.trim());
      }
    } catch {}
    return null;
  }

  /**
   * Check pip dry-run functionality
   */
  static async checkPipDryRun(
    pythonBin: string,
    reqPath: string,
    componentDir: string
  ): Promise<{ success: boolean; allSatisfied: boolean; wouldInstall: string[]; error?: string; hasConflict: boolean }> {
    if (!isRealExecutable(pythonBin)) {
      return { success: false, allSatisfied: false, wouldInstall: [], hasConflict: false };
    }

    try {
      const res = await runProcess(
        pythonBin,
        ['-m', 'pip', 'install', '--dry-run', '-r', reqPath],
        { cwd: componentDir, timeoutMs: 10000 }
      );

      const combinedOutput = `${res.stdout}\n${res.stderr}`;
      const hasConflict = /conflict|conflicting|ResolutionImpossible|incompatible/i.test(combinedOutput);

      if (res.success) {
        const wouldInstall: string[] = [];
        const lines = res.stdout.split('\n');
        for (const line of lines) {
          if (line.includes('Would install')) {
            wouldInstall.push(line.replace(/.*Would install\s+/, '').trim());
          }
        }
        const allSatisfied = wouldInstall.length === 0 && res.stdout.includes('Requirement already satisfied');
        return {
          success: true,
          allSatisfied,
          wouldInstall,
          hasConflict,
        };
      } else {
        return {
          success: false,
          allSatisfied: false,
          wouldInstall: [],
          error: res.stderr || res.stdout,
          hasConflict,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        allSatisfied: false,
        wouldInstall: [],
        error: err.message,
        hasConflict: false,
      };
    }
  }

  /**
   * Check pip check for broken dependencies / conflicts
   */
  static async checkPipCheck(pythonBin: string, componentDir: string): Promise<string[]> {
    if (!isRealExecutable(pythonBin)) {
      return [];
    }

    try {
      const res = await runProcess(pythonBin, ['-m', 'pip', 'check'], { cwd: componentDir, timeoutMs: 5000 });
      if (!res.success && res.stdout.trim()) {
        return res.stdout
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.toLowerCase().includes('no broken requirements'));
      }
    } catch {}
    return [];
  }

  /**
   * Determine whether all declared dependencies in a Python component are satisfied
   */
  static async checkPythonDependencies(
    componentDir: string,
    manifestFiles: string[] = [],
    pythonBin?: string
  ): Promise<DependencyCheckResult> {
    const venv = pythonBin
      ? { dir: path.dirname(path.dirname(pythonBin)), pythonPath: pythonBin, venvName: path.basename(path.dirname(path.dirname(pythonBin))) }
      : this.findVirtualEnv(componentDir);

    if (!venv) {
      return {
        satisfied: false,
        missing: ['Virtual environment not found or incomplete'],
        conflicts: [],
        details: 'Python virtual environment (.venv or venv) not found or incomplete',
      };
    }

    const declaredReqs = parseDeclaredDependencies(componentDir, manifestFiles);
    if (declaredReqs.length === 0) {
      return {
        satisfied: true,
        missing: [],
        conflicts: [],
        details: 'No Python dependency manifests found',
      };
    }

    const conflicts: string[] = [];

    // Check for conflicts using pip check
    const pipConflicts = await this.checkPipCheck(venv.pythonPath, componentDir);
    conflicts.push(...pipConflicts);

    // Try pip install --dry-run on requirements.txt if present
    const reqFile = manifestFiles.find(f => f === 'requirements.txt' || f.endsWith('requirements.txt')) || 'requirements.txt';
    const reqFullPath = path.resolve(componentDir, reqFile);

    if (fileExists(reqFullPath)) {
      const dryRun = await this.checkPipDryRun(venv.pythonPath, reqFullPath, componentDir);
      if (dryRun.hasConflict && dryRun.error) {
        conflicts.push(dryRun.error.trim());
      }
      if (dryRun.success && dryRun.allSatisfied && conflicts.length === 0) {
        return {
          satisfied: true,
          missing: [],
          conflicts: [],
          details: 'All dependencies satisfied (verified via pip dry-run)',
        };
      }
      if (dryRun.wouldInstall.length > 0) {
        return {
          satisfied: false,
          missing: dryRun.wouldInstall,
          conflicts,
          details: `Missing dependencies: ${dryRun.wouldInstall.join(', ')}`,
        };
      }
    }

    // Direct comparison with installed packages
    let installedPackages = await this.getInstalledPackagesFromPython(venv.pythonPath);
    if (!installedPackages || Object.keys(installedPackages).length === 0) {
      installedPackages = this.getInstalledPackagesFromSitePackages(venv.dir);
    }

    const missing: string[] = [];
    for (const req of declaredReqs) {
      const installedVer = installedPackages[req.normalizedName];
      if (!installedVer) {
        missing.push(req.name);
      } else if (req.spec && !checkSpecifier(installedVer, req.spec)) {
        missing.push(`${req.name}${req.spec} (installed: ${installedVer})`);
      }
    }

    if (missing.length === 0 && conflicts.length === 0) {
      return {
        satisfied: true,
        missing: [],
        conflicts: [],
        details: `All dependencies satisfied in ${venv.venvName}`,
      };
    }

    return {
      satisfied: false,
      missing,
      conflicts,
      details: missing.length > 0
        ? `Missing dependencies: ${missing.join(', ')}`
        : `Dependency conflicts detected: ${conflicts.join('; ')}`,
    };
  }

  /**
   * Synchronous validation method
   */
  static validateComponent(component: ProjectComponent): ComponentDependencyStatus {
    const dir = component.absolutePath;

    // Node.js project validation
    if (component.manifestFiles.some(m => m.endsWith('package.json'))) {
      const nodeModules = path.join(dir, 'node_modules');
      if (!dirExists(nodeModules)) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'node_modules directory is missing',
        };
      }
      return {
        componentName: component.name,
        isInstalled: true,
        details: 'node_modules present',
      };
    }

    // Python project validation
    if (component.primaryLanguage === 'python') {
      const venv = this.findVirtualEnv(dir);
      if (!venv) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'Python virtual environment (.venv or venv) not found or incomplete',
        };
      }

      const declaredReqs = parseDeclaredDependencies(dir, component.manifestFiles);
      if (declaredReqs.length === 0) {
        return {
          componentName: component.name,
          isInstalled: true,
          details: `${venv.venvName} virtual environment present`,
          virtualEnv: { exists: true, path: venv.dir, pythonPath: venv.pythonPath },
        };
      }

      const installedPackages = this.getInstalledPackagesFromSitePackages(venv.dir);
      if (Object.keys(installedPackages).length === 0) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'Virtual environment present but no site-packages found',
          virtualEnv: { exists: true, path: venv.dir, pythonPath: venv.pythonPath },
        };
      }

      const missing: string[] = [];
      for (const req of declaredReqs) {
        const installedVer = installedPackages[req.normalizedName];
        if (!installedVer) {
          missing.push(req.name);
        } else if (req.spec && !checkSpecifier(installedVer, req.spec)) {
          missing.push(`${req.name}${req.spec}`);
        }
      }

      if (missing.length > 0) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: `Missing dependencies: ${missing.join(', ')}`,
          virtualEnv: { exists: true, path: venv.dir, pythonPath: venv.pythonPath },
          missingDependencies: missing,
        };
      }

      return {
        componentName: component.name,
        isInstalled: true,
        details: `${venv.venvName} virtual environment present and all dependencies satisfied`,
        virtualEnv: { exists: true, path: venv.dir, pythonPath: venv.pythonPath },
      };
    }

    return {
      componentName: component.name,
      isInstalled: true,
      details: 'No dependency validation required',
    };
  }

  /**
   * Asynchronous validation method
   */
  static async validateComponentAsync(component: ProjectComponent): Promise<ComponentDependencyStatus> {
    const dir = component.absolutePath;

    if (component.manifestFiles.some(m => m.endsWith('package.json'))) {
      const nodeModules = path.join(dir, 'node_modules');
      if (!dirExists(nodeModules)) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'node_modules directory is missing',
        };
      }
      return {
        componentName: component.name,
        isInstalled: true,
        details: 'node_modules present',
      };
    }

    if (component.primaryLanguage === 'python') {
      const venv = this.findVirtualEnv(dir);
      if (!venv) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'Python virtual environment (.venv or venv) not found or incomplete',
        };
      }

      const res = await this.checkPythonDependencies(dir, component.manifestFiles, venv.pythonPath);
      return {
        componentName: component.name,
        isInstalled: res.satisfied,
        details: res.details,
        virtualEnv: { exists: true, path: venv.dir, pythonPath: venv.pythonPath },
        missingDependencies: res.missing,
        dependencyConflicts: res.conflicts,
      };
    }

    return {
      componentName: component.name,
      isInstalled: true,
      details: 'No dependency validation required',
    };
  }
}
