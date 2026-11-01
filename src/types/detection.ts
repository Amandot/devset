import type { DetectedTechnology, SupportedLanguage, SupportedPackageManager } from './project.js';

export interface FileMatchRule {
  pathPattern: string; // glob or filename
  weight: number;
  description: string;
}

export interface ContentMatchRule {
  filePattern: string;
  pattern: RegExp | string;
  weight: number;
  description: string;
}

export interface DependencyMatchRule {
  packageJsonField?: 'dependencies' | 'devDependencies' | 'peerDependencies';
  packages?: string[];
  pythonPackages?: string[];
  weight: number;
  description: string;
}

export interface TechnologyDetectionRule {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'package-manager' | 'database' | 'docker' | 'tool';
  language?: SupportedLanguage;
  packageManager?: SupportedPackageManager;
  threshold: number; // minimum score to be considered 'confirmed'
  minScoreForPossible: number; // minimum score to be considered 'possible'
  fileRules?: FileMatchRule[];
  contentRules?: ContentMatchRule[];
  dependencyRules?: DependencyMatchRule[];
  conflictWith?: string[]; // IDs of technologies this might conflict with
}

export interface DetectionResult {
  technologies: DetectedTechnology[];
  matchedFiles: string[];
}
