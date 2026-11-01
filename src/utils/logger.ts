import chalk from 'chalk';
import Table from 'cli-table3';

export type LogLevel = 'silent' | 'normal' | 'verbose' | 'debug';

export class Logger {
  private level: LogLevel = 'normal';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  isVerbose(): boolean {
    return this.level === 'verbose' || this.level === 'debug';
  }

  banner(title: string, subtitle?: string): void {
    if (this.level === 'silent') return;
    const width = 56;
    const pad = (s: string, w: number) => {
      const p = Math.max(0, w - s.length);
      const left = Math.floor(p / 2);
      const right = p - left;
      return ' '.repeat(left) + s + ' '.repeat(right);
    };

    console.log();
    console.log(chalk.cyan('╔' + '═'.repeat(width) + '╗'));
    console.log(chalk.cyan('║') + chalk.bold.white(pad(title, width)) + chalk.cyan('║'));
    if (subtitle) {
      console.log(chalk.cyan('║') + chalk.dim.gray(pad(subtitle, width)) + chalk.cyan('║'));
    }
    console.log(chalk.cyan('╚' + '═'.repeat(width) + '╝'));
    console.log();
  }

  section(title: string): void {
    if (this.level === 'silent') return;
    console.log();
    console.log(chalk.bold.cyan(`▶ ${title}`));
    console.log(chalk.dim('─'.repeat(Math.max(40, title.length + 4))));
  }

  info(msg: string): void {
    if (this.level === 'silent') return;
    console.log(chalk.blue('ℹ ') + msg);
  }

  success(msg: string): void {
    if (this.level === 'silent') return;
    console.log(chalk.green('✓ ') + msg);
  }

  warn(msg: string): void {
    if (this.level === 'silent') return;
    console.log(chalk.yellow('⚠ ') + chalk.yellow(msg));
  }

  error(msg: string, err?: unknown): void {
    console.error(chalk.red('✖ ') + chalk.bold.red(msg));
    if (err && this.isVerbose()) {
      if (err instanceof Error && err.stack) {
        console.error(chalk.dim(err.stack));
      } else {
        console.error(chalk.dim(String(err)));
      }
    }
  }

  debug(msg: string): void {
    if (this.level === 'debug') {
      console.log(chalk.magenta('🔍 [DEBUG] ') + chalk.dim(msg));
    }
  }

  step(num: number, total: number, msg: string): void {
    if (this.level === 'silent') return;
    console.log(chalk.cyan(`[${num}/${total}] `) + chalk.bold(msg));
  }

  log(msg: string = ''): void {
    if (this.level === 'silent') return;
    console.log(msg);
  }

  table(head: string[], rows: (string | number)[][]): void {
    if (this.level === 'silent') return;
    const table = new Table({
      head: head.map(h => chalk.cyan.bold(h)),
      style: { head: [], border: ['dim'] },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    });

    for (const r of rows) {
      table.push(r as any);
    }
    console.log(table.toString());
  }
}

export const logger = new Logger();
