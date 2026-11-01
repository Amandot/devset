import path from 'node:path';
import { BaseInstaller, type InstallContext } from './base-installer.js';
import type { SetupStep } from '../types/setup-plan.js';
import type { CommandResult } from '../utils/process.js';

export class DockerInstaller extends BaseInstaller {
  canHandle(step: SetupStep): boolean {
    return (
      step.category === 'dependency-install' &&
      Boolean(step.command?.includes('docker') || step.executable === 'docker')
    );
  }

  async execute(step: SetupStep, context: InstallContext): Promise<CommandResult> {
    const fullDir = path.resolve(context.projectRoot, step.directory);
    const executable = 'docker';
    const args = step.args || ['compose', 'build'];

    return await this.executeCommand(executable, args, fullDir, context);
  }
}
