export type ProjectType =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'monorepo'
  | 'library'
  | 'microservice'
  | 'unknown';

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'rust'
  | 'go'
  | 'php'
  | 'ruby'
  | 'csharp'
  | 'dart'
  | 'elixir'
  | 'swift';

export type SupportedPackageManager =
  | 'npm'
  | 'yarn'
  | 'pnpm'
  | 'bun'
  | 'pip'
  | 'poetry'
  | 'pipenv'
  | 'uv'
  | 'conda'
  | 'maven'
  | 'gradle'
  | 'cargo'
  | 'go'
  | 'composer'
  | 'bundler';

export interface TechnologyEvidence {
  source: string;
  weight: number;
  description: string;
}

export interface DetectedTechnology {
  name: string;
  category: 'language' | 'framework' | 'package-manager' | 'database' | 'docker' | 'tool';
  version?: string;
  confidence: 'confirmed' | 'possible';
  score: number;
  evidence: TechnologyEvidence[];
}

export interface ComponentService {
  name: string;
  command: string;
  args?: string[];
  directory: string;
  port?: number;
  env?: Record<string, string>;
  framework?: string;
}

export interface ProjectComponent {
  id: string;
  name: string;
  path: string; // relative to project root
  absolutePath: string;
  type: 'frontend' | 'backend' | 'admin' | 'shared' | 'service' | 'root';
  languages: DetectedTechnology[];
  frameworks: DetectedTechnology[];
  packageManagers: DetectedTechnology[];
  databases: DetectedTechnology[];
  primaryPackageManager?: SupportedPackageManager;
  primaryLanguage?: SupportedLanguage;
  primaryFramework?: string;
  installCommand?: string;
  runCommands: ComponentService[];
  manifestFiles: string[];
  lockfiles: string[];
  envFiles: {
    existing: string[];
    examples: string[];
    missingVariables: string[];
  };
}

export interface EnvironmentAnalysis {
  existingEnvFiles: string[];
  exampleEnvFiles: string[];
  missingVariables: string[];
  envTemplate?: Record<string, string>;
  hasEnvConflict: boolean;
}

export interface DockerAnalysis {
  hasDockerfile: boolean;
  hasCompose: boolean;
  composeFiles: string[];
  dockerfiles: string[];
  services: string[];
  isDockerInstalled: boolean;
  isComposeInstalled: boolean;
}

export interface ProjectAnalysis {
  projectRoot: string;
  projectName: string;
  projectType: ProjectType;
  components: ProjectComponent[];
  primaryFrontend?: ProjectComponent;
  primaryBackend?: ProjectComponent;
  technologies: DetectedTechnology[];
  environment: EnvironmentAnalysis;
  docker: DockerAnalysis;
  warnings: string[];
  unsupportedEcosystems: string[];
  stats: {
    scannedFiles: number;
    scannedDirectories: number;
    scanDurationMs: number;
  };
}
