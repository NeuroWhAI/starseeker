import chalk from 'chalk';

export class Logger {
  log(message: string) {
    console.log(message);
  }

  info(message: string) {
    console.log(`${chalk.green('i')} ${message}`);
  }

  warn(message: string) {
    console.log(`${chalk.bgYellow.black(' WARN ')} ${message}`);
    console.log();
  }

  error(message: string, error?: Error) {
    console.log(`${chalk.bgRed.black(' ERROR ')} ${message}`);
    if (error) {
      console.error(error.stack || error.message || error);
    }
    console.log();
  }
}

export const logger = new Logger();
