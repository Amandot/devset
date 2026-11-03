import chalk from 'chalk';
import { ProjectAnalyzer } from '../../analyzers/project-analyzer.js';
import { logger } from '../../utils/logger.js';
import { showBanner } from '../banner.js';
import type { GlobalCliOptions } from '../options.js';

export async function analyzeCommand(
  targetDir: string = '.',
  options: GlobalCliOptions = {}
): Promise<void> {
  const rootDir = targetDir;
  if (options.verbose) logger.setLevel('verbose');

  if (!options.json) {
    showBanner();
    logger.info(`Analyzing project at: ${chalk.bold(rootDir)}`);
  }

  const analysis = await ProjectAnalyzer.analyze(rootDir);

  if (options.json) {
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  // Terminal report
  console.log();
  console.log(chalk.bold('PROJECT CLASSIFICATION: ') + chalk.bold.cyan(analysis.projectType.toUpperCase()));
  console.log(chalk.dim(`Files scanned: ${analysis.stats.scannedFiles} (${analysis.stats.scanDurationMs}ms)`));

  // Components Table
  logger.section('Components Detected');
  const compRows = analysis.components.map(c => [
    chalk.bold(c.name),
    c.path === '.' ? 'root' : c.path,
    c.type,
    c.primaryLanguage || 'none',
    c.primaryFramework || 'none',
    c.primaryPackageManager || 'none',
  ]);
  logger.table(['Component', 'Path', 'Type', 'Language', 'Framework', 'Package Mgr'], compRows);

  // Evidence and Technologies
  logger.section('Detected Technologies & Confidence');
  const techRows = analysis.technologies.map(t => [
    chalk.bold(t.name),
    t.category,
    t.confidence === 'confirmed' ? chalk.green('CONFIRMED') : chalk.yellow('POSSIBLE'),
    t.score.toString(),
    t.evidence.map(e => e.source).join('; '),
  ]);
  logger.table(['Technology', 'Category', 'Status', 'Score', 'Primary Evidence'], techRows);

  // Environment analysis
  logger.section('Environment & Configuration');
  if (analysis.environment.exampleEnvFiles.length > 0) {
    logger.info(`Example files: ${analysis.environment.exampleEnvFiles.join(', ')}`);
  }
  if (analysis.environment.existingEnvFiles.length > 0) {
    logger.success(`Configured env files: ${analysis.environment.existingEnvFiles.join(', ')}`);
  } else {
    logger.warn('No active .env file found.');
  }
  if (analysis.environment.missingVariables.length > 0) {
    logger.warn(`Missing required variables (${analysis.environment.missingVariables.length}): ${analysis.environment.missingVariables.join(', ')}`);
  }

  // Docker
  if (analysis.docker.hasDockerfile || analysis.docker.hasCompose) {
    logger.section('Docker Services');
    logger.info(`Docker Compose: ${analysis.docker.hasCompose ? chalk.green('Yes') : chalk.gray('No')}`);
    if (analysis.docker.services.length > 0) {
      logger.info(`Services: ${analysis.docker.services.join(', ')}`);
    }
  }

  // Warnings
  if (analysis.warnings.length > 0) {
    logger.section('Warnings & Advisories');
    for (const w of analysis.warnings) {
      logger.warn(w);
    }
  }

  // Unsupported ecosystems
  if (analysis.unsupportedEcosystems.length > 0) {
    logger.section('Unsupported Ecosystems');
    for (const uns of analysis.unsupportedEcosystems) {
      logger.info(`${uns}: Detected accurately, automated installation not yet supported in v1.`);
    }
  }

  console.log();
  logger.info('Run `devset` or `devset setup` to proceed with automated environment setup.');
}
