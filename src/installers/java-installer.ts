import path from 'node:path';
import { BaseInstaller, type InstallContext } from './base-installer.js';
import type { SetupStep } from '../types/setup-plan.js';
import type { CommandResult } from '../utils/process.js';
import { fileExists } from '../utils/filesystem.js';

export class JavaInstaller extends BaseInstaller {
  canHandle(step: SetupStep): boolean {
    return (
      step.category === 'dependency-install' &&
      Boolean(
        step.command?.includes('mvn') ||
          step.command?.includes('gradle') ||
          step.command?.includes('mvnw') ||
          step.command?.includes('gradlew')
      )
    );
  }

  async execute(step: SetupStep, context: InstallContext): Promise<CommandResult> {
    const fullDir = path.resolve(context.projectRoot, step.directory);
    const isWin = process.platform === 'win32';

    let executable = 'mvn';
    let args = ['clean', 'install'];

    if (step.command?.includes('gradle')) {
      executable = 'gradle';
      args = ['build'];

      const gradlew = isWin ? 'gradlew.bat' : './gradlew';
      if (fileExists(path.join(fullDir, isWin ? 'gradlew.bat' : 'gradlew'))) {
        executable = gradlew;
      }
    } else {
      const mvnw = isWin ? 'mvnw.cmd' : './mvnw';
      if (fileExists(path.join(fullDir, isWin ? 'mvnw.cmd' : 'mvnw'))) {
        executable = mvnw;
      }
    }

    return await this.executeCommand(executable, args, fullDir, context);
  }
}
