import { ServiceRunner } from '../../runner/service-runner.js';
import { ProcessManager } from '../../runner/process-manager.js';
import { ProjectAnalyzer } from '../../analyzers/project-analyzer.js';
import { logger } from '../../utils/logger.js';
import type { GlobalCliOptions } from '../options.js';

export async function runCommand(options: GlobalCliOptions = {}): Promise<void> {
  const projectRoot = process.cwd();
  if (options.verbose) logger.setLevel('verbose');

  // Try loading saved config first
  const config = ServiceRunner.loadConfig(projectRoot);
  let services = config?.services || [];

  if (services.length === 0) {
    logger.info('Analyzing project to detect runnable services...');
    const analysis = await ProjectAnalyzer.analyze(projectRoot);
    const discovered = analysis.components.flatMap(c => c.runCommands);
    if (discovered.length === 0) {
      logger.error('No runnable development services detected in this project.');
      logger.info('Ensure your components define dev/start scripts in package.json or manage.py / app.py.');
      return;
    }
    services = discovered;
    ServiceRunner.saveConfig(projectRoot, analysis.projectName, services);
  }

  const manager = new ProcessManager(services);
  await manager.startAll(projectRoot);
}
