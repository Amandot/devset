import path from 'node:path';
import type { ProjectAnalysis, ProjectComponent, ComponentService } from '../types/project.js';
import type { SetupPlan, SetupStep } from '../types/setup-plan.js';

export class PlanGenerator {
  static generate(analysis: ProjectAnalysis): SetupPlan {
    const steps: SetupStep[] = [];
    let order = 1;

    // 1. Runtime checks
    const neededRuntimes = new Set<string>();
    for (const comp of analysis.components) {
      if (comp.primaryLanguage === 'javascript' || comp.primaryLanguage === 'typescript') {
        neededRuntimes.add('Node.js');
      }
      if (comp.primaryLanguage === 'python') {
        neededRuntimes.add('Python');
      }
      if (comp.primaryLanguage === 'java') {
        neededRuntimes.add('Java');
      }
    }

    for (const runtime of neededRuntimes) {
      steps.push({
        id: `check-${runtime.toLowerCase()}`,
        order: order++,
        category: 'runtime-check',
        title: `Verify ${runtime} runtime installation`,
        description: `Ensure ${runtime} is installed and available in PATH`,
        directory: '.',
        runtimeRequired: { name: runtime },
        isOptional: false,
        status: 'pending',
      });
    }

    // 2. Environment configuration steps
    if (analysis.environment.exampleEnvFiles.length > 0 && analysis.environment.existingEnvFiles.length === 0) {
      const exampleFile = analysis.environment.exampleEnvFiles[0];
      steps.push({
        id: 'setup-env',
        order: order++,
        category: 'environment',
        title: `Create .env configuration`,
        description: `Copy template from ${exampleFile} to .env for local configuration`,
        directory: '.',
        isOptional: true,
        status: 'pending',
      });
    }

    // 3. Virtual environment creation for Python components
    for (const comp of analysis.components) {
      if (comp.primaryLanguage === 'python') {
        steps.push({
          id: `venv-${comp.id}`,
          order: order++,
          category: 'virtual-environment',
          title: `Create Python virtual environment (.venv) for ${comp.name}`,
          description: `Create an isolated Python environment in ${comp.path}/.venv`,
          componentName: comp.name,
          directory: comp.path,
          command: 'python -m venv .venv',
          runtimeRequired: { name: 'Python' },
          isOptional: false,
          status: 'pending',
        });
      }
    }

    // 4. Dependency installation steps
    for (const comp of analysis.components) {
      if (comp.installCommand) {
        steps.push({
          id: `install-${comp.id}`,
          order: order++,
          category: 'dependency-install',
          title: `Install ${comp.name} dependencies (${comp.primaryPackageManager || 'package manager'})`,
          description: `Run: ${comp.installCommand} in ${comp.path}`,
          componentName: comp.name,
          directory: comp.path,
          command: comp.installCommand,
          isOptional: false,
          status: 'pending',
        });
      }
    }

    // 5. Validation step
    steps.push({
      id: 'validate-setup',
      order: order++,
      category: 'validation',
      title: 'Validate environment and dependency setup',
      description: 'Check installed packages and service readiness',
      directory: '.',
      isOptional: false,
      status: 'pending',
    });

    // Consolidate run commands from all components
    const runCommands: ComponentService[] = [];
    for (const comp of analysis.components) {
      for (const service of comp.runCommands) {
        // Avoid duplicate service names
        const existingIdx = runCommands.findIndex(s => s.name === service.name);
        if (existingIdx >= 0) {
          service.name = `${comp.name}-${service.framework || 'svc'}`.toLowerCase();
        }
        runCommands.push(service);
      }
    }

    return {
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      projectRoot: analysis.projectRoot,
      projectName: analysis.projectName,
      projectType: analysis.projectType,
      steps,
      runCommands,
      unsupportedEcosystems: analysis.unsupportedEcosystems,
      warnings: analysis.warnings,
      environmentSummary: {
        missingVariables: analysis.environment.missingVariables,
        exampleFiles: analysis.environment.exampleEnvFiles,
        actionRecommended: analysis.environment.exampleEnvFiles.length > 0 && analysis.environment.existingEnvFiles.length === 0
          ? `Create .env by copying from ${analysis.environment.exampleEnvFiles[0]}`
          : undefined,
      },
    };
  }
}
