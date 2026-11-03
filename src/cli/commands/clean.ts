import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { fileExists, dirExists } from '../../utils/filesystem.js';
import { logger } from '../../utils/logger.js';
import { showBanner } from '../banner.js';
import type { GlobalCliOptions } from '../options.js';

export async function cleanCommand(options: GlobalCliOptions = {}): Promise<void> {
  const projectRoot = process.cwd();
  showBanner();
  logger.info('Scanning for DevSet artifacts and generated virtual environments...');

  const targets: Array<{ label: string; path: string; isDir: boolean }> = [];

  const configFile = path.join(projectRoot, 'devset.config.json');
  if (fileExists(configFile)) {
    targets.push({ label: 'DevSet configuration (devset.config.json)', path: configFile, isDir: false });
  }

  // Scan for .venv directories in root and immediate subdirs
  const venvRoot = path.join(projectRoot, '.venv');
  if (dirExists(venvRoot)) {
    targets.push({ label: 'Root Python virtual environment (.venv)', path: venvRoot, isDir: true });
  }

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory() && ent.name !== 'node_modules' && !ent.name.startsWith('.')) {
        const subVenv = path.join(projectRoot, ent.name, '.venv');
        if (dirExists(subVenv)) {
          targets.push({ label: `Component virtual environment (${ent.name}/.venv)`, path: subVenv, isDir: true });
        }
      }
    }
  } catch {}

  if (targets.length === 0) {
    logger.info('No DevSet-generated virtual environments or configuration files found to clean.');
    return;
  }

  console.log();
  logger.warn('The following items were found:');
  for (const t of targets) {
    console.log(chalk.yellow(`  • ${t.label}`));
  }
  console.log();

  let confirmed = options.yes;
  if (!confirmed) {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmClean',
        message: 'Do you want to safely remove these generated files/environments?',
        default: false,
      },
    ]);
    confirmed = answer.confirmClean;
  }

  if (!confirmed) {
    logger.info('Clean cancelled by user.');
    return;
  }

  for (const t of targets) {
    try {
      if (t.isDir) {
        fs.rmSync(t.path, { recursive: true, force: true });
      } else {
        fs.unlinkSync(t.path);
      }
      logger.success(`Removed: ${t.label}`);
    } catch (err: any) {
      logger.error(`Failed to remove ${t.path}: ${err.message}`);
    }
  }

  logger.success('Cleanup completed.');
}
