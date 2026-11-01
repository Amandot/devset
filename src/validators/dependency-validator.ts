import path from 'node:path';
import { dirExists, fileExists } from '../utils/filesystem.js';
import type { ProjectComponent } from '../types/project.js';

export interface ComponentDependencyStatus {
  componentName: string;
  isInstalled: boolean;
  details: string;
}

export class DependencyValidator {
  static validateComponent(component: ProjectComponent): ComponentDependencyStatus {
    const dir = component.absolutePath;

    // Node.js project validation
    if (component.manifestFiles.some(m => m.endsWith('package.json'))) {
      const nodeModules = path.join(dir, 'node_modules');
      if (!dirExists(nodeModules)) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'node_modules directory is missing',
        };
      }
      return {
        componentName: component.name,
        isInstalled: true,
        details: 'node_modules present',
      };
    }

    // Python project validation
    if (component.primaryLanguage === 'python') {
      const isWin = process.platform === 'win32';
      const venvPath = path.join(dir, '.venv');
      const pythonBin = isWin
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');

      if (!dirExists(venvPath) || !fileExists(pythonBin)) {
        return {
          componentName: component.name,
          isInstalled: false,
          details: 'Python virtual environment (.venv) not found or incomplete',
        };
      }
      return {
        componentName: component.name,
        isInstalled: true,
        details: '.venv virtual environment present',
      };
    }

    return {
      componentName: component.name,
      isInstalled: true,
      details: 'No dependency validation required',
    };
  }
}
