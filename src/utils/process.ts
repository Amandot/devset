import { execa, type Options as ExecaOptions } from 'execa';
import { logger } from './logger.js';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
  durationMs: number;
}

export interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  captureOutput?: boolean;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

/**
 * Resolve executable name for Windows if needed (e.g. npm -> npm.cmd)
 */
export function resolveExecutable(name: string): string {
  if (process.platform === 'win32') {
    const cmdTools = ['npm', 'npx', 'yarn', 'pnpm', 'bun', 'pip', 'poetry', 'mvn', 'gradle'];
    if (cmdTools.includes(name.toLowerCase())) {
      // execa on Windows handles PATH resolution with shell or direct binary
      return name;
    }
  }
  return name;
}

/**
 * Execute command with safe argument array
 */
export async function runProcess(
  file: string,
  args: string[] = [],
  options: RunOptions = {}
): Promise<CommandResult> {
  const startTime = Date.now();
  const cwd = options.cwd || process.cwd();

  const isWindows = process.platform === 'win32';
  const execaOpts: ExecaOptions = {
    cwd,
    env: { ...process.env, ...options.env },
    timeout: options.timeoutMs ?? 300000, // 5 min default
    reject: false,
    shell: isWindows, // Ensures .cmd/.bat resolution on Windows
  };

  logger.debug(`Executing: ${file} ${args.join(' ')} in ${cwd}`);

  try {
    const subprocess = execa(file, args, execaOpts);

    if (options.onStdout && subprocess.stdout) {
      subprocess.stdout.on('data', (chunk: Buffer) => {
        options.onStdout?.(chunk.toString());
      });
    }

    if (options.onStderr && subprocess.stderr) {
      subprocess.stderr.on('data', (chunk: Buffer) => {
        options.onStderr?.(chunk.toString());
      });
    }

    const result = await subprocess;
    const durationMs = Date.now() - startTime;

    return {
      stdout: (result.stdout as string) || '',
      stderr: (result.stderr as string) || '',
      exitCode: result.exitCode ?? 0,
      success: (result.exitCode ?? 0) === 0,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || String(error),
      exitCode: error.exitCode ?? 1,
      success: false,
      durationMs,
    };
  }
}

/**
 * Check if an executable tool is installed and get its version
 */
export async function checkToolInstalled(
  tool: string,
  versionArgs: string[] = ['--version']
): Promise<{ installed: boolean; version?: string }> {
  try {
    const result = await runProcess(tool, versionArgs, { timeoutMs: 8000 });
    if (result.success) {
      const output = (result.stdout || result.stderr).trim().split('\n')[0];
      return { installed: true, version: output };
    }
    return { installed: false };
  } catch {
    return { installed: false };
  }
}
