import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ProjectAnalyzer } from '../../src/analyzers/project-analyzer.js';
import { PlanGenerator } from '../../src/core/plan-generator.js';
import { ExecutionEngine } from '../../src/core/execution-engine.js';

describe('Core Plan Generator & Execution Engine', () => {
  it('should generate ordered setup steps for fullstack project', async () => {
    const root = path.resolve('examples/fullstack-react-django');
    const analysis = await ProjectAnalyzer.analyze(root);
    const plan = PlanGenerator.generate(analysis);

    expect(plan.steps.length).toBeGreaterThanOrEqual(4);

    // Verify categories
    const categories = plan.steps.map(s => s.category);
    expect(categories).toContain('runtime-check');
    expect(categories).toContain('environment');
    expect(categories).toContain('virtual-environment');
    expect(categories).toContain('dependency-install');
    expect(categories).toContain('validation');

    // Verify run services
    expect(plan.runCommands.length).toBeGreaterThanOrEqual(2);
  });

  it('should safely simulate execution in dry-run mode without mutating system', async () => {
    const root = path.resolve('examples/fullstack-react-django');
    const analysis = await ProjectAnalyzer.analyze(root);
    const plan = PlanGenerator.generate(analysis);

    const engine = new ExecutionEngine();
    const result = await engine.executePlan(plan, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.completedSteps).toBe(plan.steps.length);
    expect(result.failedSteps).toBe(0);
  });
});
