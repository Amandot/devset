import type { ProjectComponent, ProjectType } from '../types/project.js';
import type { MonorepoConfig } from '../scanner/directory-scanner.js';

export class StructureAnalyzer {
  static classifyProject(
    components: ProjectComponent[],
    monorepoConfig: MonorepoConfig
  ): {
    projectType: ProjectType;
    primaryFrontend?: ProjectComponent;
    primaryBackend?: ProjectComponent;
  } {
    if (monorepoConfig.isMonorepo) {
      return {
        projectType: 'monorepo',
      };
    }

    const frontendComps = components.filter(c => c.type === 'frontend');
    const backendComps = components.filter(c => c.type === 'backend');

    if (frontendComps.length > 0 && backendComps.length > 0) {
      return {
        projectType: 'fullstack',
        primaryFrontend: frontendComps[0],
        primaryBackend: backendComps[0],
      };
    }

    // Check single component cases
    if (components.length === 1 && components[0].path === '.') {
      const rootComp = components[0];
      const hasFrontend = rootComp.frameworks.some(f =>
        ['React', 'Next.js', 'Vue.js', 'Svelte', 'Angular', 'Vite'].includes(f.name)
      );
      const hasBackend = rootComp.frameworks.some(f =>
        ['Django', 'Flask', 'FastAPI', 'Express', 'NestJS', 'Fastify', 'Spring Boot'].includes(f.name)
      );

      if (hasFrontend && hasBackend) {
        return {
          projectType: 'fullstack',
          primaryFrontend: rootComp,
          primaryBackend: rootComp,
        };
      }

      if (hasFrontend) {
        return { projectType: 'frontend', primaryFrontend: rootComp };
      }

      if (hasBackend) {
        return { projectType: 'backend', primaryBackend: rootComp };
      }

      // Check library indicator
      if (rootComp.primaryLanguage === 'typescript' || rootComp.primaryLanguage === 'javascript') {
        const hasBuild = rootComp.runCommands.some(r => r.args?.includes('build'));
        if (hasBuild && rootComp.runCommands.length === 0) {
          return { projectType: 'library' };
        }
      }
    }

    if (frontendComps.length > 0) {
      return { projectType: 'frontend', primaryFrontend: frontendComps[0] };
    }

    if (backendComps.length > 0) {
      return { projectType: 'backend', primaryBackend: backendComps[0] };
    }

    if (components.length > 2) {
      return { projectType: 'microservice' };
    }

    return { projectType: 'unknown' };
  }
}
