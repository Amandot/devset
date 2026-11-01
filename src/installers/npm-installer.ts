import path from 'node:path';
import { BaseInstaller, type InstallContext } from './base-installer.js';
import type { SetupStep } from '../types/setup-plan.js';
import type { CommandResult } from '../utils/process.js';
import { resolveExecutable } from '../utils/process.js';

export class NpmInstaller extends BaseInstaller {
  canHandle(step: SetupStep): boolean {
    const mgrs = ['npm', 'yarn', 'pnpm', 'bun'];
    return (
      step.category === 'dependency-install' &&
      mgrs.some(m => step.command?.startsWith(m) || step.executable === m)
    );
  }

  async execute(step: SetupStep, context: InstallContext): Promise<CommandResult> {
    const fullDir = path.resolve(context.projectRoot, step.directory);
    const executable = resolveExecutable(step.executable || 'npm');
    const args = step.args || (step.command ? step.command.split(' ').slice(1) : ['install']);

    return await this.executeCommand(executable, args, fullDir, context);
  }
}
