import { Option } from 'commander';

export interface GlobalCliOptions {
  dryRun?: boolean;
  verbose?: boolean;
  yes?: boolean;
  json?: boolean;
}

export const dryRunOption = new Option(
  '--dry-run',
  'Simulate setup and output plan without executing commands'
);

export const verboseOption = new Option(
  '--verbose',
  'Display detailed debug output and process streams'
);

export const yesOption = new Option(
  '-y, --yes',
  'Skip interactive confirmation and proceed with defaults'
);

export const jsonOption = new Option(
  '--json',
  'Output results in JSON format'
);
