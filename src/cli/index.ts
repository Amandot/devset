#!/usr/bin/env node
import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { analyzeCommand } from './commands/analyze.js';
import { doctorCommand } from './commands/doctor.js';
import { runCommand } from './commands/run.js';
import { cleanCommand } from './commands/clean.js';
import {
  dryRunOption,
  verboseOption,
  yesOption,
  jsonOption,
} from './options.js';

const program = new Command();

program
  .name('devset')
  .description('Universal, rule-based project analysis and automated environment setup tool')
  .version('1.0.0');

// Global options
program.addOption(dryRunOption);
program.addOption(verboseOption);
program.addOption(yesOption);
program.addOption(jsonOption);

// Default action: devset [path]
program
  .argument('[directory]', 'Target project directory', '.')
  .action(async (directory, cmdOpts, cmd) => {
    const opts = { ...program.opts(), ...(cmdOpts || {}), ...(cmd?.opts() || {}) };
    await setupCommand(directory, opts);
  });

// setup command
program
  .command('setup')
  .description('Analyze project and execute automated dependency installation')
  .argument('[directory]', 'Target project directory', '.')
  .addOption(dryRunOption)
  .addOption(verboseOption)
  .addOption(yesOption)
  .action(async (directory, cmdOpts, cmd) => {
    const opts = { ...program.opts(), ...(cmdOpts || {}), ...(cmd?.opts() || {}) };
    await setupCommand(directory, opts);
  });

// analyze command
program
  .command('analyze')
  .description('Scan and analyze project structure, languages, frameworks, and configuration without installing anything')
  .argument('[directory]', 'Target project directory', '.')
  .addOption(verboseOption)
  .addOption(jsonOption)
  .action(async (directory, cmdOpts, cmd) => {
    const opts = { ...program.opts(), ...(cmdOpts || {}), ...(cmd?.opts() || {}) };
    await analyzeCommand(directory, opts);
  });

// doctor command
program
  .command('doctor')
  .description('Diagnose installed runtimes, package managers, and tools on host system')
  .addOption(verboseOption)
  .addOption(jsonOption)
  .action(async (cmdOpts, cmd) => {
    const opts = { ...program.opts(), ...(cmdOpts || {}), ...(cmd?.opts() || {}) };
    await doctorCommand(opts);
  });

// run command
program
  .command('run')
  .description('Concurrently run all detected frontend/backend services with colored prefix logs')
  .addOption(verboseOption)
  .action(async (cmdOpts, cmd) => {
    const opts = { ...program.opts(), ...(cmdOpts || {}), ...(cmd?.opts() || {}) };
    await runCommand(opts);
  });

// clean command
program
  .command('clean')
  .description('Safely remove DevSet-generated virtual environments and configuration files after confirmation')
  .addOption(yesOption)
  .action(async (cmdOpts, cmd) => {
    const opts = { ...program.opts(), ...(cmdOpts || {}), ...(cmd?.opts() || {}) };
    await cleanCommand(opts);
  });

program.parseAsync(process.argv).catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
