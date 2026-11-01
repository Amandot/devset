import path from 'node:path';
import { scanDirectory, type ScannerOptions } from '../scanner/file-scanner.js';
import { DirectoryScanner } from '../scanner/directory-scanner.js';
import { LanguageDetector } from '../detectors/language-detector.js';
import { FrameworkDetector } from '../detectors/framework-detector.js';
import { PackageManagerDetector } from '../detectors/package-manager-detector.js';
import { DatabaseDetector } from '../detectors/database-detector.js';
import { DockerDetector } from '../detectors/docker-detector.js';
import { EnvironmentDetector } from '../detectors/environment-detector.js';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { StructureAnalyzer } from './structure-analyzer.js';
import type {
  ProjectAnalysis,
  ProjectComponent,
  DetectedTechnology,
} from '../types/project.js';

export class ProjectAnalyzer {
  static async analyze(
    rootDir: string,
    options: ScannerOptions = {}
  ): Promise<ProjectAnalysis> {
    const startTime = Date.now();
    const scanResult = scanDirectory(rootDir, options);
    const projectName = path.basename(path.resolve(rootDir));

    const monorepoConfig = DirectoryScanner.detectMonorepo(rootDir, scanResult.files);
    const discoveredComps = DirectoryScanner.discoverComponents(rootDir, scanResult.files);

    const components: ProjectComponent[] = [];
    const allTechsMap = new Map<string, DetectedTechnology>();
    const warnings: string[] = [];
    const unsupportedEcosystems: string[] = [];

    for (const comp of discoveredComps) {
      const compDir = comp.absolutePath;
      const langResult = LanguageDetector.detect(compDir, comp.files);
      const fwResult = FrameworkDetector.detect(compDir, comp.files);
      const pmResult = PackageManagerDetector.detect(compDir, comp.files);
      const dbResult = DatabaseDetector.detect(compDir, comp.files);
      const envResult = EnvironmentDetector.detect(compDir, comp.files);

      // Report lockfile conflicts
      if (pmResult.hasConflict && pmResult.conflictingManagers) {
        warnings.push(
          `Conflicting lockfiles detected in [${comp.relativePath}]: ${pmResult.conflictingManagers.join(' and ')}. Please standardize on one package manager.`
        );
      }

      // Record unsupported ecosystems
      const unsupportedList = ['rust', 'go', 'php', 'ruby', 'csharp', 'dart', 'elixir', 'swift'];
      for (const lang of langResult.technologies) {
        const lowerName = lang.name.toLowerCase();
        for (const unsupp of unsupportedList) {
          if (lowerName.includes(unsupp) && !unsupportedEcosystems.includes(lang.name)) {
            unsupportedEcosystems.push(lang.name);
          }
        }
      }

      // Collect services / dev scripts
      let runCommands = comp.suggestedType === 'frontend' || langResult.primary === 'javascript' || langResult.primary === 'typescript'
        ? DependencyAnalyzer.analyzeNodeComponent(compDir, comp.name, comp.relativePath).runServices
        : [];

      if (langResult.primary === 'python') {
        const pyServices = DependencyAnalyzer.analyzePythonComponent(
          compDir,
          comp.name,
          comp.relativePath,
          comp.files
        );
        runCommands = [...runCommands, ...pyServices];
      }

      // Determine component type
      let resolvedType = comp.suggestedType;
      if (resolvedType === 'root' && discoveredComps.length > 1) {
        resolvedType = 'root';
      } else if (resolvedType === 'root' || resolvedType === 'service') {
        if (fwResult.primary && ['React', 'Next.js', 'Vue.js', 'Vite', 'Svelte', 'Angular'].includes(fwResult.primary)) {
          resolvedType = 'frontend';
        } else if (
          langResult.primary === 'python' ||
          (fwResult.primary && ['Django', 'Flask', 'FastAPI', 'Express', 'NestJS'].includes(fwResult.primary))
        ) {
          resolvedType = 'backend';
        }
      }

      const manifestFiles = comp.files
        .filter(f => ['package.json', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'pom.xml', 'build.gradle', 'Cargo.toml'].includes(f.fileName))
        .map(f => f.relativePath);

      const componentObj: ProjectComponent = {
        id: comp.relativePath === '.' ? 'root' : comp.relativePath.replace(/[\\/]/g, '-'),
        name: comp.name,
        path: comp.relativePath,
        absolutePath: comp.absolutePath,
        type: resolvedType,
        languages: langResult.technologies,
        frameworks: fwResult.technologies,
        packageManagers: pmResult.technologies,
        databases: dbResult.technologies,
        primaryPackageManager: pmResult.primary,
        primaryLanguage: langResult.primary,
        primaryFramework: fwResult.primary,
        installCommand: pmResult.installCommand,
        runCommands,
        manifestFiles,
        lockfiles: pmResult.lockfiles,
        envFiles: {
          existing: envResult.existingEnvFiles,
          examples: envResult.exampleEnvFiles,
          missingVariables: envResult.missingVariables,
        },
      };

      components.push(componentObj);

      // Aggregate global technologies
      for (const t of [...langResult.technologies, ...fwResult.technologies, ...pmResult.technologies, ...dbResult.technologies]) {
        const key = `${t.category}:${t.name}`;
        if (!allTechsMap.has(key) || (allTechsMap.get(key)!.score < t.score)) {
          allTechsMap.set(key, t);
        }
      }
    }

    // Root environment and Docker analysis
    const rootEnv = EnvironmentDetector.detect(rootDir, scanResult.files);
    const dockerAnalysis = await DockerDetector.detect(rootDir, scanResult.files);

    const { projectType, primaryFrontend, primaryBackend } = StructureAnalyzer.classifyProject(
      components,
      monorepoConfig
    );

    return {
      projectRoot: rootDir,
      projectName,
      projectType,
      components,
      primaryFrontend,
      primaryBackend,
      technologies: Array.from(allTechsMap.values()),
      environment: rootEnv,
      docker: dockerAnalysis,
      warnings,
      unsupportedEcosystems,
      stats: {
        scannedFiles: scanResult.totalFiles,
        scannedDirectories: scanResult.totalDirectories,
        scanDurationMs: Date.now() - startTime,
      },
    };
  }
}
