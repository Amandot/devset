import path from 'node:path';
import type { ScannedFile } from '../scanner/file-scanner.js';
import type { EnvironmentAnalysis } from '../types/project.js';
import { readFileSafe } from '../utils/filesystem.js';

export class EnvironmentDetector {
  /**
   * Safely parse variable names from an env file without storing or printing secret values
   */
  static parseEnvKeys(content: string): Set<string> {
    const keys = new Set<string>();
    const lines = content.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          keys.add(key);
        }
      }
    }
    return keys;
  }

  static detect(
    componentDir: string,
    files: ScannedFile[]
  ): EnvironmentAnalysis {
    const envFileNames = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
    ];

    const exampleFileNames = [
      '.env.example',
      '.env.sample',
      '.env.template',
      '.env.dist',
      'env.example',
    ];

    const existingEnvFiles: string[] = [];
    const exampleEnvFiles: string[] = [];

    for (const f of files) {
      if (envFileNames.includes(f.fileName)) {
        existingEnvFiles.push(f.relativePath);
      } else if (exampleFileNames.includes(f.fileName)) {
        exampleEnvFiles.push(f.relativePath);
      }
    }

    const declaredKeys = new Set<string>();
    for (const exRel of exampleEnvFiles) {
      const full = path.join(componentDir, path.basename(exRel));
      const content = readFileSafe(full);
      if (content) {
        for (const k of this.parseEnvKeys(content)) {
          declaredKeys.add(k);
        }
      }
    }

    const configuredKeys = new Set<string>();
    for (const envRel of existingEnvFiles) {
      const full = path.join(componentDir, path.basename(envRel));
      const content = readFileSafe(full);
      if (content) {
        for (const k of this.parseEnvKeys(content)) {
          configuredKeys.add(k);
        }
      }
    }

    // Find missing variables declared in example but not configured in .env
    const missingVariables: string[] = [];
    for (const key of declaredKeys) {
      if (!configuredKeys.has(key)) {
        missingVariables.push(key);
      }
    }

    return {
      existingEnvFiles,
      exampleEnvFiles,
      missingVariables,
      hasEnvConflict: existingEnvFiles.length > 3,
    };
  }
}
