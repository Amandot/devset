import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { ProjectAnalyzer } from '../../src/analyzers/project-analyzer.js';
import { PlanGenerator } from '../../src/core/plan-generator.js';
import { ExecutionEngine } from '../../src/core/execution-engine.js';
import { DependencyValidator } from '../../src/validators/dependency-validator.js';
import { setupCommand } from '../../src/cli/commands/setup.js';
import { logger } from '../../src/utils/logger.js';

describe('Django Setup Idempotency & Dependency Detection', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devset-django-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  /**
   * Helper to set up a Django project structure in tempDir
   */
  function createDjangoProject(options: {
    hasEnv?: boolean;
    envContent?: string;
    hasExampleEnv?: boolean;
    requirements?: string[];
  } = {}) {
    // manage.py
    fs.writeFileSync(
      path.join(tempDir, 'manage.py'),
      '#!/usr/bin/env python\nimport os\nimport sys\ndef main(): pass\nif __name__ == "__main__": main()\n'
    );

    // requirements.txt
    const reqs = options.requirements ?? [
      'django>=4.2.0,<5.0.0',
      'psycopg2-binary>=2.9.9',
      'python-dotenv>=1.0.0',
    ];
    fs.writeFileSync(path.join(tempDir, 'requirements.txt'), reqs.join('\n'));

    // .env.example
    if (options.hasExampleEnv !== false) {
      fs.writeFileSync(
        path.join(tempDir, '.env.example'),
        'DEBUG=True\nSECRET_KEY=template-key\nDATABASE_URL=postgres://localhost/db\n'
      );
    }

    // .env
    if (options.hasEnv) {
      fs.writeFileSync(
        path.join(tempDir, '.env'),
        options.envContent ?? 'DEBUG=True\nSECRET_KEY=my-super-secret-production-key\n'
      );
    }
  }

  /**
   * Helper to create a virtual environment structure (cross-platform)
   */
  function createVirtualEnv(venvName: '.venv' | 'venv' = '.venv', installedPackages: Record<string, string> = {}) {
    const venvDir = path.join(tempDir, venvName);

    // Create binary directories for both Windows & Unix to ensure cross-platform test reliability
    const scriptsDir = path.join(venvDir, 'Scripts');
    const binDir = path.join(venvDir, 'bin');
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });

    fs.writeFileSync(path.join(scriptsDir, 'python.exe'), '');
    fs.writeFileSync(path.join(scriptsDir, 'python'), '');
    fs.writeFileSync(path.join(binDir, 'python'), '');
    fs.writeFileSync(path.join(binDir, 'python3'), '');

    // Create site-packages directories (Windows and Linux locations)
    const siteDirs = [
      path.join(venvDir, 'Lib', 'site-packages'),
      path.join(venvDir, 'lib', 'site-packages'),
    ];

    for (const siteDir of siteDirs) {
      fs.mkdirSync(siteDir, { recursive: true });
      for (const [pkgName, version] of Object.entries(installedPackages)) {
        fs.mkdirSync(path.join(siteDir, `${pkgName}-${version}.dist-info`), { recursive: true });
      }
    }

    return venvDir;
  }

  it('1. First-time Django setup generates all required steps', async () => {
    createDjangoProject({ hasEnv: false, hasExampleEnv: true });

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.projectType).toBe('backend');
    expect(analysis.technologies.some(t => t.name === 'Django')).toBe(true);
    expect(analysis.components[0].virtualEnv?.exists).toBe(false);
    expect(analysis.components[0].dependenciesInstalled).toBe(false);

    const plan = PlanGenerator.generate(analysis);

    // Verify all steps are generated for first-time run
    expect(plan.steps.length).toBe(5);
    const stepCategories = plan.steps.map(s => s.category);
    expect(stepCategories).toContain('runtime-check');
    expect(stepCategories).toContain('environment');
    expect(stepCategories).toContain('virtual-environment');
    expect(stepCategories).toContain('dependency-install');
    expect(stepCategories).toContain('validation');

    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep?.command).toBe('python -m venv .venv');

    const installStep = plan.steps.find(s => s.category === 'dependency-install');
    expect(installStep?.command).toBe('python -m pip install -r requirements.txt');
  });

  it('2. Second execution after successful setup reports project is already configured', async () => {
    createDjangoProject({
      hasEnv: true,
      hasExampleEnv: true,
      requirements: ['django>=4.2.0,<5.0.0', 'psycopg2-binary>=2.9.9', 'python-dotenv>=1.0.0'],
    });

    createVirtualEnv('.venv', {
      'django': '4.2.1',
      'psycopg2_binary': '2.9.9',
      'python_dotenv': '1.0.0',
    });

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.components[0].virtualEnv?.exists).toBe(true);
    expect(analysis.components[0].dependenciesInstalled).toBe(true);

    const plan = PlanGenerator.generate(analysis);

    // Since project is already configured, 0 steps should be generated
    expect(plan.steps.length).toBe(0);

    // ExecutionEngine handles 0-step plan cleanly
    const engine = new ExecutionEngine();
    const result = await engine.executePlan(plan);
    expect(result.success).toBe(true);
    expect(result.summary).toBe('No setup changes required. Project is already configured!');

    // Test setupCommand outputs the expected message
    const successSpy = vi.spyOn(logger, 'success');
    await setupCommand(tempDir, { yes: true });
    expect(successSpy).toHaveBeenCalledWith('No setup changes required. Project is already configured!');
    successSpy.mockRestore();
  });

  it('3. Existing virtual environment with missing dependencies generates only install step', async () => {
    createDjangoProject({
      hasEnv: true,
      hasExampleEnv: true,
      requirements: ['django>=4.2.0,<5.0.0', 'psycopg2-binary>=2.9.9', 'python-dotenv>=1.0.0'],
    });

    // Virtual environment has django, but is missing psycopg2-binary and python-dotenv
    createVirtualEnv('.venv', {
      'django': '4.2.1',
    });

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.components[0].virtualEnv?.exists).toBe(true);
    expect(analysis.components[0].dependenciesInstalled).toBe(false);

    const plan = PlanGenerator.generate(analysis);

    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep).toBeUndefined(); // NEVER re-create existing virtual environment!

    const installStep = plan.steps.find(s => s.category === 'dependency-install');
    expect(installStep).toBeDefined(); // MUST generate installation step for missing packages
    expect(installStep?.command).toBe('python -m pip install -r requirements.txt');

    const envStep = plan.steps.find(s => s.category === 'environment');
    expect(envStep).toBeUndefined(); // .env already exists, do not recreate
  });

  it('4. Existing virtual environment with all dependencies installed skips venv and install steps', async () => {
    createDjangoProject({
      hasEnv: false, // .env missing, but venv + deps ready
      hasExampleEnv: true,
      requirements: ['django>=4.2.0,<5.0.0', 'psycopg2-binary>=2.9.9'],
    });

    createVirtualEnv('.venv', {
      'django': '4.2.14',
      'psycopg2_binary': '2.9.9',
    });

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.components[0].virtualEnv?.exists).toBe(true);
    expect(analysis.components[0].dependenciesInstalled).toBe(true);

    const plan = PlanGenerator.generate(analysis);

    // Only .env creation and validation should be generated, NO venv or install steps
    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep).toBeUndefined();

    const installStep = plan.steps.find(s => s.category === 'dependency-install');
    expect(installStep).toBeUndefined();

    const envStep = plan.steps.find(s => s.category === 'environment');
    expect(envStep).toBeDefined();
  });

  it('5a. Missing virtual environment generates venv creation step', async () => {
    createDjangoProject({ hasEnv: true });

    // No .venv folder
    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.components[0].virtualEnv?.exists).toBe(false);

    const plan = PlanGenerator.generate(analysis);
    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep).toBeDefined();
    expect(venvStep?.command).toBe('python -m venv .venv');
  });

  it('5b. Invalid/incomplete virtual environment (missing executable) is detected and recreated', async () => {
    createDjangoProject({ hasEnv: true });

    // Create .venv directory without python executable
    const venvDir = path.join(tempDir, '.venv');
    fs.mkdirSync(venvDir, { recursive: true });
    // Empty directory, no Scripts/python.exe or bin/python

    expect(DependencyValidator.findVirtualEnv(tempDir)).toBeNull();

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.components[0].virtualEnv?.exists).toBe(false);

    const plan = PlanGenerator.generate(analysis);
    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep).toBeDefined();
  });

  it('5c. Reuses existing "venv" directory instead of ".venv"', async () => {
    createDjangoProject({ hasEnv: true });

    // Create "venv" (not ".venv") with all dependencies
    createVirtualEnv('venv', {
      'django': '4.2.1',
      'psycopg2_binary': '2.9.9',
      'python_dotenv': '1.0.0',
    });

    const venvInfo = DependencyValidator.findVirtualEnv(tempDir);
    expect(venvInfo).not.toBeNull();
    expect(venvInfo?.venvName).toBe('venv');

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.components[0].virtualEnv?.exists).toBe(true);
    expect(analysis.components[0].dependenciesInstalled).toBe(true);

    const plan = PlanGenerator.generate(analysis);
    const venvStep = plan.steps.find(s => s.category === 'virtual-environment');
    expect(venvStep).toBeUndefined(); // Reuses existing venv!
  });

  it('6. Existing .env file is preserved and not overwritten', async () => {
    const customSecret = 'SECRET_KEY=ultra-secret-user-production-value-12345';
    createDjangoProject({
      hasEnv: true,
      envContent: customSecret,
      hasExampleEnv: true,
    });

    const analysis = await ProjectAnalyzer.analyze(tempDir);
    expect(analysis.environment.existingEnvFiles).toContain('.env');

    const plan = PlanGenerator.generate(analysis);
    const envStep = plan.steps.find(s => s.category === 'environment');
    expect(envStep).toBeUndefined(); // No step generated to overwrite .env

    // Verify ExecutionEngine environment handler also explicitly preserves existing .env
    const envOnlyPlan = {
      ...plan,
      steps: [
        {
          id: 'setup-env',
          order: 1,
          category: 'environment' as const,
          title: 'Create .env configuration',
          description: 'Copy template from .env.example to .env',
          directory: '.',
          isOptional: true,
          status: 'pending' as const,
        },
      ],
      environmentSummary: {
        missingVariables: [],
        exampleFiles: ['.env.example'],
      },
    };

    const engine = new ExecutionEngine();
    await engine.executePlan(envOnlyPlan, { dryRun: false });

    const currentEnvContent = fs.readFileSync(path.join(tempDir, '.env'), 'utf-8');
    expect(currentEnvContent).toBe(customSecret);
  });
});
