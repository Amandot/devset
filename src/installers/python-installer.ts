import path from 'node:path';
import { BaseInstaller, type InstallContext } from './base-installer.js';
import type { SetupStep } from '../types/setup-plan.js';
import type { CommandResult } from '../utils/process.js';
import { fileExists, dirExists } from '../utils/filesystem.js';
import { RuntimeValidator } from '../validators/runtime-validator.js';

export class PythonInstaller extends BaseInstaller {
  canHandle(step: SetupStep): boolean {
    return (
      step.category === 'virtual-environment' ||
      (step.category === 'dependency-install' &&
        Boolean(
          step.command?.includes('pip') ||
            step.command?.includes('poetry') ||
            step.command?.includes('pipenv') ||
            step.command?.includes('uv') ||
            step.command?.includes('python')
        ))
    );
  }

  /**
   * Get virtual environment python binary path
   */
  static getVenvPython(componentDir: string): string | null {
    const isWin = process.platform === 'win32';
    const venvDir = path.join(componentDir, '.venv');

    if (!dirExists(venvDir)) return null;

    const bin = isWin
      ? path.join(venvDir, 'Scripts', 'python.exe')
      : path.join(venvDir, 'bin', 'python');

    return fileExists(bin) ? bin : null;
  }

  async execute(step: SetupStep, context: InstallContext): Promise<CommandResult> {
    const fullDir = path.resolve(context.projectRoot, step.directory);

    // Case 1: Create virtual environment
    if (step.category === 'virtual-environment') {
      const pyCheck = await RuntimeValidator.checkPython();
      const pythonCmd = pyCheck.executablePath || 'python';

      return await this.executeCommand(
        pythonCmd,
        ['-m', 'venv', '.venv'],
        fullDir,
        context
      );
    }

    // Case 2: Install dependencies into venv
    const venvPy = PythonInstaller.getVenvPython(fullDir);

    if (step.command?.includes('pip')) {
      const pythonExe = venvPy || 'python';
      const args = ['-m', 'pip', 'install', '-r', 'requirements.txt'];

      // Also upgrade pip quietly if needed
      return await this.executeCommand(pythonExe, args, fullDir, context);
    }

    if (step.command?.includes('poetry')) {
      return await this.executeCommand('poetry', ['install'], fullDir, context);
    }

    if (step.command?.includes('uv')) {
      return await this.executeCommand('uv', ['sync'], fullDir, context);
    }

    if (step.command?.includes('pipenv')) {
      return await this.executeCommand('pipenv', ['install'], fullDir, context);
    }

    // Default fallback
    const exe = step.executable || 'python';
    const args = step.args || [];
    return await this.executeCommand(exe, args, fullDir, context);
  }
}
