import chalk from 'chalk';
import { RuntimeValidator } from '../../validators/runtime-validator.js';
import { logger } from '../../utils/logger.js';
import { showBanner } from '../banner.js';
import type { GlobalCliOptions } from '../options.js';

export async function doctorCommand(options: GlobalCliOptions = {}): Promise<void> {
  if (options.verbose) logger.setLevel('verbose');

  if (!options.json) {
    showBanner();
    logger.info('Diagnosing installed runtimes and system tools...');
  }

  const results = await RuntimeValidator.checkAll();

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const rows = results.map(r => [
    chalk.bold(r.name),
    r.category,
    r.installed ? chalk.green('✓ INSTALLED') : chalk.red('✖ NOT FOUND'),
    r.version ? chalk.dim(r.version) : '-',
    r.notes ? chalk.yellow(r.notes) : '',
  ]);

  logger.section('System Environment Diagnostics');
  logger.table(['Tool / Runtime', 'Category', 'Status', 'Version', 'Notes'], rows);

  const missingCrucial = results.filter(
    r => !r.installed && (r.name === 'Node.js' || r.name === 'Python')
  );

  if (missingCrucial.length > 0) {
    console.log();
    logger.warn(`Notice: ${missingCrucial.map(m => m.name).join(', ')} is not installed.`);
  } else {
    console.log();
    logger.success('All primary core runtimes (Node.js & Python) are available!');
  }
}
