import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ProjectAnalyzer } from '../../src/analyzers/project-analyzer.js';
import { StructureAnalyzer } from '../../src/analyzers/structure-analyzer.js';

describe('Analyzers Engine', () => {
  it('should analyze fullstack project correctly', async () => {
    const root = path.resolve('examples/fullstack-react-django');
    const analysis = await ProjectAnalyzer.analyze(root);

    expect(analysis.projectType).toBe('fullstack');
    const subComponents = analysis.components.filter(c => c.path !== '.');
    expect(subComponents.length).toBe(2);

    const fe = analysis.components.find(c => c.type === 'frontend');
    const be = analysis.components.find(c => c.type === 'backend');

    expect(fe).toBeDefined();
    expect(be).toBeDefined();

    expect(fe?.primaryFramework).toBe('Vite');
    expect(be?.primaryFramework).toBe('Django');

    // Docker services
    expect(analysis.docker.hasCompose).toBe(true);
    expect(analysis.docker.services).toContain('db');
    expect(analysis.docker.services).toContain('redis');
  });

  it('should classify single frontend project', async () => {
    const root = path.resolve('examples/react-vite');
    const analysis = await ProjectAnalyzer.analyze(root);

    expect(analysis.projectType).toBe('frontend');
    expect(analysis.primaryFrontend).toBeDefined();
  });

  it('should classify single backend project', async () => {
    const root = path.resolve('examples/django');
    const analysis = await ProjectAnalyzer.analyze(root);

    expect(analysis.projectType).toBe('backend');
    expect(analysis.primaryBackend).toBeDefined();
  });
});
