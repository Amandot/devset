import path from 'node:path';
import { execa, type ResultPromise } from 'execa';
import chalk from 'chalk';
import type { ComponentService } from '../types/project.js';
import { logger } from '../utils/logger.js';
import { resolveExecutable } from '../utils/process.js';
import { PythonInstaller } from '../installers/python-installer.js';

export interface RunningService {
  name: string;
  service: ComponentService;
  subprocess?: ResultPromise;
  color: (text: string) => string;
  detectedUrl?: string;
  status: 'starting' | 'running' | 'stopped' | 'failed';
}

const SERVICE_COLORS = [
  chalk.cyan,
  chalk.magenta,
  chalk.yellow,
  chalk.green,
  chalk.blue,
  chalk.red,
];

export class ProcessManager {
  private services: RunningService[] = [];
  private isShuttingDown = false;

  constructor(services: ComponentService[]) {
    this.services = services.map((svc, i) => ({
      name: svc.name.toUpperCase(),
      service: svc,
      color: SERVICE_COLORS[i % SERVICE_COLORS.length],
      status: 'starting',
    }));
  }

  async startAll(projectRoot: string): Promise<void> {
    if (this.services.length === 0) {
      logger.warn('No development services configured to run.');
      return;
    }

    logger.banner('DEVSET - MULTI-SERVICE RUNNER', 'Press Ctrl+C to stop all services');

    this.registerSignalHandlers();

    for (const item of this.services) {
      this.startService(item, projectRoot);
    }

    // Keep running until shutdown
    await new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        if (this.isShuttingDown) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  private startService(item: RunningService, projectRoot: string): void {
    const svc = item.service;
    const workingDir = path.resolve(projectRoot, svc.directory);
    const prefix = item.color(`[${item.name}] `);

    console.log(prefix + chalk.dim(`Starting service in ${svc.directory}...`));

    // Resolve python executable in venv if python service
    let command = svc.command;
    const args = [...(svc.args || [])];

    if (command === 'python' || command === 'python3') {
      const venvPy = PythonInstaller.getVenvPython(workingDir);
      if (venvPy) {
        command = venvPy;
      }
    }

    const isWindows = process.platform === 'win32';
    const resolvedExe = resolveExecutable(command);

    try {
      const subprocess = execa(resolvedExe, args, {
        cwd: workingDir,
        env: { ...process.env, ...svc.env, FORCE_COLOR: '1' },
        reject: false,
        shell: isWindows,
      });

      item.subprocess = subprocess;
      item.status = 'running';

      const handleOutput = (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;

          // Detect URLs
          const urlMatch = line.match(/(https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):\d{2,5})/i);
          if (urlMatch && !item.detectedUrl) {
            item.detectedUrl = urlMatch[1];
            console.log(prefix + chalk.bold.green(`🚀 Ready at: ${item.detectedUrl}`));
          }

          console.log(prefix + line);
        }
      };

      if (subprocess.stdout) subprocess.stdout.on('data', handleOutput);
      if (subprocess.stderr) subprocess.stderr.on('data', handleOutput);

      subprocess.then(res => {
        if (!this.isShuttingDown) {
          if (res.exitCode !== 0) {
            console.log(prefix + chalk.red(`Process exited with code ${res.exitCode}`));
            item.status = 'failed';
          } else {
            console.log(prefix + chalk.gray(`Process terminated cleanly`));
            item.status = 'stopped';
          }
        }
      }).catch(err => {
        if (!this.isShuttingDown) {
          console.error(prefix + chalk.red(`Process error: ${err.message}`));
          item.status = 'failed';
        }
      });
    } catch (err: any) {
      console.error(prefix + chalk.red(`Failed to spawn: ${err.message}`));
      item.status = 'failed';
    }
  }

  private registerSignalHandlers(): void {
    const handleExit = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log('\n' + chalk.yellow('Shutting down all services gracefully...'));

      for (const item of this.services) {
        if (item.subprocess && item.subprocess.pid) {
          try {
            item.subprocess.kill('SIGTERM');
          } catch {
            // Process may already be dead
          }
        }
      }

      setTimeout(() => {
        // Force kill if lingering
        for (const item of this.services) {
          if (item.subprocess && item.subprocess.pid) {
            try {
              item.subprocess.kill('SIGKILL');
            } catch {}
          }
        }
        process.exit(0);
      }, 1500);
    };

    process.once('SIGINT', handleExit);
    process.once('SIGTERM', handleExit);
  }
}
