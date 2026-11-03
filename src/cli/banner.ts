import chalk from 'chalk';

export function showBanner(): void {
  const line = '═'.repeat(48);
  console.log();
  console.log(chalk.cyan(`╔${line}╗`));
  console.log(chalk.cyan('║') + chalk.bold.white('                   DEVSET CLI                   ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.dim.gray('          One Command. Complete Setup.          ') + chalk.cyan('║'));
  console.log(chalk.cyan(`╚${line}╝`));
  console.log();
}
