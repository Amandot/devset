import path from 'node:path';
import type { ComponentService } from '../types/project.js';
import type { ScannedFile } from '../scanner/file-scanner.js';
import { readJsonSafe, readFileSafe } from '../utils/filesystem.js';

export interface AnalyzedDependencies {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines?: Record<string, string>;
  runServices: ComponentService[];
}

export class DependencyAnalyzer {
  static analyzeNodeComponent(
    componentDir: string,
    componentName: string,
    relativeDir: string
  ): AnalyzedDependencies {
    const pkgPath = path.join(componentDir, 'package.json');
    const pkg = readJsonSafe<{
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      engines?: Record<string, string>;
    }>(pkgPath) || {};

    const scripts = pkg.scripts || {};
    const dependencies = pkg.dependencies || {};
    const devDependencies = pkg.devDependencies || {};
    const runServices: ComponentService[] = [];

    // Find dev or start command
    let devScriptKey: string | undefined;
    if (scripts['dev']) devScriptKey = 'dev';
    else if (scripts['start:dev']) devScriptKey = 'start:dev';
    else if (scripts['start']) devScriptKey = 'start';
    else if (scripts['serve']) devScriptKey = 'serve';

    if (devScriptKey) {
      const scriptVal = scripts[devScriptKey];
      let port: number | undefined;

      // Extract port if specified in script (e.g. -p 3000 or --port 5173 or PORT=3000)
      const portMatch = scriptVal.match(/(?:--port|-p|PORT=)\s*(\d{4,5})/);
      if (portMatch) {
        port = parseInt(portMatch[1], 10);
      } else if (devDependencies['vite'] || dependencies['vite']) {
        port = 5173;
      } else if (dependencies['next'] || devDependencies['next']) {
        port = 3000;
      }

      runServices.push({
        name: componentName,
        command: 'npm',
        args: ['run', devScriptKey],
        directory: relativeDir,
        port,
      });
    }

    return {
      scripts,
      dependencies,
      devDependencies,
      engines: pkg.engines,
      runServices,
    };
  }

  static analyzePythonComponent(
    componentDir: string,
    componentName: string,
    relativeDir: string,
    files: ScannedFile[]
  ): ComponentService[] {
    const fileNames = new Set(files.map(f => f.fileName));
    const runServices: ComponentService[] = [];

    // Check for manage.py (Django)
    if (fileNames.has('manage.py')) {
      runServices.push({
        name: componentName,
        command: 'python',
        args: ['manage.py', 'runserver'],
        directory: relativeDir,
        port: 8000,
        framework: 'Django',
      });
      return runServices;
    }

    // Check for FastAPI / Uvicorn
    const reqPath = path.join(componentDir, 'requirements.txt');
    const reqContent = readFileSafe(reqPath) || '';

    const hasFastApi = reqContent.toLowerCase().includes('fastapi') ||
      files.some(f => f.fileName === 'main.py' || f.fileName === 'app.py');

    if (reqContent.toLowerCase().includes('fastapi')) {
      const entryFile = fileNames.has('main.py') ? 'main:app' : (fileNames.has('app.py') ? 'app:app' : undefined);
      if (entryFile) {
        runServices.push({
          name: componentName,
          command: 'python',
          args: ['-m', 'uvicorn', entryFile, '--reload', '--port', '8000'],
          directory: relativeDir,
          port: 8000,
          framework: 'FastAPI',
        });
        return runServices;
      }
    }

    // Check for Streamlit
    if (reqContent.toLowerCase().includes('streamlit') || files.some(f => f.fileName.includes('streamlit'))) {
      const entryFile = files.find(f => f.fileName === 'app.py' || f.fileName === 'main.py');
      if (entryFile) {
        runServices.push({
          name: componentName,
          command: 'streamlit',
          args: ['run', entryFile.fileName],
          directory: relativeDir,
          port: 8501,
          framework: 'Streamlit',
        });
        return runServices;
      }
    }

    // Check for Flask
    if (reqContent.toLowerCase().includes('flask')) {
      const entryFile = fileNames.has('app.py') ? 'app.py' : (fileNames.has('main.py') ? 'main.py' : undefined);
      if (entryFile) {
        runServices.push({
          name: componentName,
          command: 'python',
          args: [entryFile],
          directory: relativeDir,
          port: 5000,
          framework: 'Flask',
        });
        return runServices;
      }
    }

    return runServices;
  }
}
