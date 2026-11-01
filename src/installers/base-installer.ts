import type { SetupStep } from '../types/setup-plan.js';
import { runProcess, type CommandResult } from '../utils/process.js';
import { logger } from '../utils/logger.js';

export interface InstallContext {
  projectRoot: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export abstract class BaseInstaller {
  abstract canHandle(step: SetupStep): boolean;
  abstract execute(step: SetupStep, context: InstallContext): Promise<CommandResult>;

  protected async executeCommand(
    executable: string,
    args: string[],
    cwd: string,
    context: InstallContext
  ): Promise<CommandResult> {
    if (context.dryRun) {
      logger.info(`[DRY-RUN] Would run: ${executable} ${args.join(' ')} in ${cwd}`);
      return {
        stdout: '[dry-run simulated success]',
        stderr: '',
        exitCode: 0,
        success: true,
        durationMs: 0,
      };
    }

    return await runProcess(executable, args, {
      cwd,
      timeoutMs: 600000, // 10 min timeout for large dependency installations
      onStdout: data => {
        if (context.verbose) {
          process.stdout.write(data);
        }
      },
      onStderr: data => {
        if (context.verbose) {
          process.stderr.write(data);
        }
      },
    });
  }
}
