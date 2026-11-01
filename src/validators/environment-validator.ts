import type { EnvironmentAnalysis } from '../types/project.js';

export interface EnvValidationReport {
  isReady: boolean;
  missingVariables: string[];
  recommendation: string;
}

export class EnvironmentValidator {
  static validate(env: EnvironmentAnalysis): EnvValidationReport {
    if (env.exampleEnvFiles.length === 0) {
      return {
        isReady: true,
        missingVariables: [],
        recommendation: 'No .env.example required by project.',
      };
    }

    if (env.existingEnvFiles.length === 0) {
      return {
        isReady: false,
        missingVariables: env.missingVariables,
        recommendation: `Missing .env file. Create .env copied from ${env.exampleEnvFiles[0]} and configure required keys.`,
      };
    }

    if (env.missingVariables.length > 0) {
      return {
        isReady: false,
        missingVariables: env.missingVariables,
        recommendation: `Missing configuration for ${env.missingVariables.length} variable(s): ${env.missingVariables.join(', ')}.`,
      };
    }

    return {
      isReady: true,
      missingVariables: [],
      recommendation: 'All declared environment variables are configured.',
    };
  }
}
