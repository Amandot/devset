import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { ProjectAnalyzer } from '../../src/analyzers/project-analyzer.js';
import { PlanGenerator } from '../../src/core/plan-generator.js';
import { ServiceRunner } from '../../src/runner/service-runner.js';

describe('Integration Scenarios', () => {
  it('Scenario 1: React + Vite project', async () => {
    const analysis = await ProjectAnalyzer.analyze(path.resolve('examples/react-vite'));
    expect(analysis.projectType).toBe('frontend');
    expect(analysis.components[0].installCommand).toBe('npm install');

    const plan = PlanGenerator.generate(analysis);
    const installStep = plan.steps.find(s => s.category === 'dependency-install');
    expect(installStep?.command).toBe('npm install');
  });

  it('Scenario 2: Next.js project', async () => {
    const analysis = await ProjectAnalyzer.analyze(path.resolve('examples/nextjs'));
    expect(analysis.projectType).toBe('frontend');
    expect(analysis.technologies.some(t => t.name === 'Next.js')).toBe(true);
  });

  it('Scenario 3: Django project', async () => {
    const analysis = await ProjectAnalyzer.analyze(path.resolve('examples/django'));
    expect(analysis.projectType).toBe('backend');
    expect(analysis.technologies.some(t => t.name === 'Django')).toBe(true);

    const plan = PlanGenerator.generate(analysis);
    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep).toBeDefined();
    expect(venvStep?.command).toBe('python -m venv .venv');
  });

  it('Scenario 4: Fullstack React + Django project', async () => {
    const analysis = await ProjectAnalyzer.analyze(path.resolve('examples/fullstack-react-django'));
    expect(analysis.projectType).toBe('fullstack');
    expect(analysis.primaryFrontend?.name).toBe('frontend');
    expect(analysis.primaryBackend?.name).toBe('backend');
    expect(analysis.docker.hasCompose).toBe(true);
  });

  it('Scenario 5: devset.config.json persistence and loading', () => {
    const tempDir = path.resolve('examples/react-vite');
    const services = [{ name: 'web', command: 'npm', args: ['run', 'dev'], directory: '.' }];

    const saved = ServiceRunner.saveConfig(tempDir, 'test-project', services);
    expect(saved).toBe(true);

    const loaded = ServiceRunner.loadConfig(tempDir);
    expect(loaded?.projectName).toBe('test-project');
    expect(loaded?.services[0].name).toBe('web');

    // Clean up temp config
    const cfgPath = path.join(tempDir, ServiceRunner.CONFIG_FILE);
    if (fs.existsSync(cfgPath)) fs.unlinkSync(cfgPath);
  });
});
