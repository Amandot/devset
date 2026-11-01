import type { ProjectType, ComponentService } from './project.js';

export type StepCategory =
  | 'runtime-check'
  | 'environment'
  | 'virtual-environment'
  | 'dependency-install'
  | 'database'
  | 'validation';

export interface SetupStep {
  id: string;
  order: number;
  category: StepCategory;
  title: string;
  description: string;
  componentName?: string;
  directory: string; // relative to project root
  command?: string;
  args?: string[];
  executable?: string;
  runtimeRequired?: {
    name: string;
    minVersion?: string;
  };
  isOptional: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
  output?: string;
}

export interface SetupPlan {
  id: string;
  createdAt: string;
  projectRoot: string;
  projectName: string;
  projectType: ProjectType;
  steps: SetupStep[];
  runCommands: ComponentService[];
  unsupportedEcosystems: string[];
  warnings: string[];
  environmentSummary: {
    missingVariables: string[];
    exampleFiles: string[];
    actionRecommended?: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  stepResults: Array<{
    stepId: string;
    title: string;
    status: 'completed' | 'failed' | 'skipped';
    durationMs: number;
    error?: string;
  }>;
  summary: string;
}
