import path from 'node:path';
import type { ComponentService } from '../types/project.js';
import { readJsonSafe, writeFileSafe, fileExists } from '../utils/filesystem.js';
import { logger } from '../utils/logger.js';

export interface DevStartConfigFile {
  version: string;
  projectName: string;
  services: ComponentService[];
}

export class ServiceRunner {
  static readonly CONFIG_FILE = 'devstart.config.json';

  static saveConfig(
    projectRoot: string,
    projectName: string,
    services: ComponentService[]
  ): boolean {
    const configPath = path.join(projectRoot, this.CONFIG_FILE);
    const data: DevStartConfigFile = {
      version: '1.0.0',
      projectName,
      services,
    };
    return writeFileSafe(configPath, JSON.stringify(data, null, 2));
  }

  static loadConfig(projectRoot: string): DevStartConfigFile | null {
    const configPath = path.join(projectRoot, this.CONFIG_FILE);
    return readJsonSafe<DevStartConfigFile>(configPath);
  }

  static addScriptToPackageJson(projectRoot: string): boolean {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fileExists(pkgPath)) return false;

    const pkg = readJsonSafe<any>(pkgPath);
    if (!pkg) return false;

    pkg.scripts = pkg.scripts || {};
    if (pkg.scripts['dev:all']) {
      logger.info('Script "dev:all" already exists in package.json.');
      return true;
    }

    pkg.scripts['dev:all'] = 'devstart run';
    const saved = writeFileSafe(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    if (saved) {
      logger.success('Added "dev:all": "devstart run" to package.json');
    }
    return saved;
  }
}
