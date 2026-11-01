import inquirer from 'inquirer';
import chalk from 'chalk';
import { ProjectAnalyzer } from '../../analyzers/project-analyzer.js';
import { PlanGenerator } from '../../core/plan-generator.js';
import { ExecutionEngine } from '../../core/execution-engine.js';
import { ServiceRunner } from '../../runner/service-runner.js';
import { logger } from '../../utils/logger.js';
import { showBanner } from '../banner.js';
import type { GlobalCliOptions } from '../options.js';

export async function setupCommand(
  targetDir: string = '.',
  options: GlobalCliOptions = {}
): Promise<void> {
  const rootDir = targetDir;
  if (options.verbose) logger.setLevel('verbose');

  showBanner();
  logger.info(`Scanning project at: ${chalk.bold(rootDir)}...`);

  const analysis = await ProjectAnalyzer.analyze(rootDir);

  // Print detected stack
  console.log();
  for (const tech of analysis.technologies) {
    if (tech.confidence === 'confirmed') {
      logger.success(`${tech.name} detected (${tech.category})`);
    }
  }

  console.log();
  console.log(chalk.bold('PROJECT TYPE: ') + chalk.bold.cyan(analysis.projectType.toUpperCase()));

  for (const comp of analysis.components) {
    console.log();
    console.log(chalk.bold.magenta(comp.name.toUpperCase()) + (comp.path !== '.' ? chalk.dim(` (${comp.path})`) : ''));
    if (comp.primaryFramework) {
      console.log(`  Framework: ${chalk.white(comp.primaryFramework)}`);
    }
    if (comp.primaryLanguage) {
      console.log(`  Language: ${chalk.white(comp.primaryLanguage)}`);
    }
    if (comp.primaryPackageManager) {
      console.log(`  Package Manager: ${chalk.white(comp.primaryPackageManager)}`);
    }
  }

  if (analysis.environment.exampleEnvFiles.length > 0) {
    console.log();
    console.log(chalk.bold.yellow('ENVIRONMENT'));
    console.log(`  Example: ${analysis.environment.exampleEnvFiles.join(', ')}`);
    if (analysis.environment.existingEnvFiles.length === 0) {
      console.log(chalk.yellow(`  Status: .env file missing (template available)`));
    } else {
      console.log(chalk.green(`  Status: .env file present`));
    }
  }

  if (analysis.warnings.length > 0) {
    console.log();
    for (const w of analysis.warnings) {
      logger.warn(w);
    }
  }

  // Generate Setup Plan
  const plan = PlanGenerator.generate(analysis);

  logger.section('SETUP PLAN');
  plan.steps.forEach((step, idx) => {
    console.log(`  ${idx + 1}. ${chalk.bold(step.title)}`);
    if (step.command) {
      console.log(chalk.dim(`     Command: ${step.command} (in ${step.directory})`));
    }
  });

  console.log();

  if (options.dryRun) {
    logger.info(chalk.yellow.bold('[DRY-RUN MODE ACTIVE]'));
    logger.info('Simulating plan execution without modifying files or installing packages...');
    const engine = new ExecutionEngine();
    const result = await engine.executePlan(plan, { dryRun: true, verbose: options.verbose });
    console.log();
    logger.success(result.summary);
    return;
  }

  // Confirmation
  let shouldProceed = options.yes;
  if (!shouldProceed) {
    const response = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with setup and dependency installation?',
        default: true,
      },
    ]);
    shouldProceed = response.proceed;
  }

  if (!shouldProceed) {
    logger.info('Setup aborted by user.');
    return;
  }

  // Execute
  const engine = new ExecutionEngine();
  const execResult = await engine.executePlan(plan, { verbose: options.verbose });

  console.log();
  if (execResult.success) {
    logger.banner('SETUP COMPLETE', 'Your development environment is ready!');

    // Save config for runner
    if (plan.runCommands.length > 0) {
      ServiceRunner.saveConfig(rootDir, analysis.projectName, plan.runCommands);

      console.log(chalk.bold.cyan('Configured Services:'));
      for (const svc of plan.runCommands) {
        console.log(`  • ${chalk.bold(svc.name)}: ${svc.command} ${(svc.args || []).join(' ')} (in ${svc.directory})`);
      }
      console.log();

      // Offer adding dev:all to package.json
      if (!options.yes) {
        const addScriptAns = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addScript',
            message: 'Add "dev:all": "devstart run" script to package.json for unified startup?',
            default: true,
          },
        ]);
        if (addScriptAns.addScript) {
          ServiceRunner.addScriptToPackageJson(rootDir);
        }
      } else {
        ServiceRunner.addScriptToPackageJson(rootDir);
      }

      console.log();
      logger.info('To start all services together, run:');
      console.log(chalk.bold.green('   devstart run'));
      console.log(chalk.dim('   or'));
      console.log(chalk.bold.green('   npm run dev:all'));
    }
  } else {
    logger.error('Setup encountered issues. Check the log above for details.');
  }
}
