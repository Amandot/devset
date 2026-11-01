import path from 'node:path';
import type { ScannedFile } from '../scanner/file-scanner.js';
import type { DockerAnalysis } from '../types/project.js';
import { readFileSafe } from '../utils/filesystem.js';
import { checkToolInstalled } from '../utils/process.js';

export class DockerDetector {
  static async detect(
    rootDir: string,
    files: ScannedFile[]
  ): Promise<DockerAnalysis> {
    const fileNames = new Set(files.map(f => f.fileName));

    const dockerfiles = files
      .filter(f => f.fileName === 'Dockerfile' || f.fileName.startsWith('Dockerfile.'))
      .map(f => f.relativePath);

    const composeCandidates = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml',
    ];

    const composeFiles = files
      .filter(f => composeCandidates.includes(f.fileName))
      .map(f => f.relativePath);

    const services: string[] = [];

    // Parse simple service names from compose files without requiring heavy yaml parser
    for (const compRel of composeFiles) {
      const full = path.join(rootDir, compRel);
      const content = readFileSafe(full);
      if (content) {
        const lines = content.split('\n');
        let inServices = false;
        let indentLevel = 0;

        for (const line of lines) {
          if (/^services:\s*$/.test(line.trim())) {
            inServices = true;
            continue;
          }

          if (inServices) {
            // Check top level under services (indent 2 spaces)
            const match = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/);
            if (match) {
              services.push(match[1]);
            } else if (/^[a-zA-Z0-9_-]+:/.test(line)) {
              // Out of services block
              inServices = false;
            }
          }
        }
      }
    }

    const dockerCheck = await checkToolInstalled('docker');
    const composeCheck = await checkToolInstalled('docker', ['compose', 'version']);

    return {
      hasDockerfile: dockerfiles.length > 0,
      hasCompose: composeFiles.length > 0,
      composeFiles,
      dockerfiles,
      services: Array.from(new Set(services)),
      isDockerInstalled: dockerCheck.installed,
      isComposeInstalled: composeCheck.installed,
    };
  }
}
