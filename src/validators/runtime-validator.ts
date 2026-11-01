import { checkToolInstalled, runProcess } from '../utils/process.js';

export interface RuntimeCheckResult {
  name: string;
  category: 'runtime' | 'package-manager' | 'tool';
  installed: boolean;
  version?: string;
  executablePath?: string;
  notes?: string;
}

export class RuntimeValidator {
  /**
   * Check Python executable availability across Windows and Unix platforms
   */
  static async checkPython(): Promise<RuntimeCheckResult> {
    // Try 'python' then 'python3'
    let check = await checkToolInstalled('python', ['--version']);
    if (check.installed) {
      return {
        name: 'Python',
        category: 'runtime',
        installed: true,
        version: check.version,
        executablePath: 'python',
      };
    }

    check = await checkToolInstalled('python3', ['--version']);
    if (check.installed) {
      return {
        name: 'Python',
        category: 'runtime',
        installed: true,
        version: check.version,
        executablePath: 'python3',
      };
    }

    return {
      name: 'Python',
      category: 'runtime',
      installed: false,
      notes: 'Python 3 is required for Python projects.',
    };
  }

  /**
   * Check Node.js
   */
  static async checkNode(): Promise<RuntimeCheckResult> {
    const check = await checkToolInstalled('node', ['-v']);
    return {
      name: 'Node.js',
      category: 'runtime',
      installed: check.installed,
      version: check.version,
      notes: check.installed ? undefined : 'Node.js 18+ is recommended.',
    };
  }

  /**
   * Run full doctor inspection on all common development runtimes and tools
   */
  static async checkAll(): Promise<RuntimeCheckResult[]> {
    const checks = await Promise.all([
      this.checkNode(),
      checkToolInstalled('npm', ['-v']).then(r => ({ name: 'npm', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('yarn', ['-v']).then(r => ({ name: 'Yarn', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('pnpm', ['-v']).then(r => ({ name: 'pnpm', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('bun', ['-v']).then(r => ({ name: 'Bun', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      this.checkPython(),
      checkToolInstalled('pip', ['--version']).then(r => ({ name: 'pip', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('poetry', ['--version']).then(r => ({ name: 'Poetry', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('uv', ['--version']).then(r => ({ name: 'uv', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('java', ['-version']).then(r => ({ name: 'Java', category: 'runtime' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('mvn', ['-v']).then(r => ({ name: 'Maven', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('gradle', ['-v']).then(r => ({ name: 'Gradle', category: 'package-manager' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('docker', ['--version']).then(r => ({ name: 'Docker', category: 'tool' as const, installed: r.installed, version: r.version })),
      checkToolInstalled('git', ['--version']).then(r => ({ name: 'Git', category: 'tool' as const, installed: r.installed, version: r.version })),
    ]);

    return checks;
  }
}
