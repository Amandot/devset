import path from 'node:path';
import { BaseInstaller, type InstallContext } from './base-installer.js';
import type { SetupStep } from '../types/setup-plan.js';
import type { CommandResult } from '../utils/process.js';
import { fileExists, dirExists } from '../utils/filesystem.js';
import { RuntimeValidator } from '../validators/runtime-validator.js';
import { DependencyValidator } from '../validators/dependency-validator.js';

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
   * Get virtual environment python binary path (.venv or venv)
   */
  static getVenvPython(componentDir: string): string | null {
    const venv = DependencyValidator.findVirtualEnv(componentDir);
    return venv ? venv.pythonPath : null;
  }

  async execute(step: SetupStep, context: InstallContext): Promise<CommandResult> {
    const fullDir = path.resolve(context.projectRoot, step.directory);

    // Case 1: Create virtual environment
    if (step.category === 'virtual-environment') {
      const existing = DependencyValidator.findVirtualEnv(fullDir);
      if (existing) {
        return {
          stdout: `Reusing existing virtual environment at ${existing.dir}`,
          stderr: '',
          exitCode: 0,
          success: true,
          durationMs: 0,
        };
      }

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
      const match = step.command.match(/-r\s+([^\s]+)/);
      const reqFile = match ? match[1] : 'requirements.txt';
      const args = ['-m', 'pip', 'install', '-r', reqFile];

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
