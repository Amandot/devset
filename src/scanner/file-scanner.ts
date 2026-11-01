import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_IGNORE_DIRECTORIES, isIgnoredPath } from './ignore-rules.js';
import { normalizePath } from '../utils/filesystem.js';

export interface ScannedFile {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  extension: string;
  directory: string; // relative dir
  sizeBytes: number;
}

export interface ScannerOptions {
  maxDepth?: number;
  maxFiles?: number;
  ignoreDirs?: string[];
}

export interface ScanResult {
  files: ScannedFile[];
  directories: string[];
  totalFiles: number;
  totalDirectories: number;
  durationMs: number;
  truncated: boolean;
}

export function scanDirectory(
  rootDir: string,
  options: ScannerOptions = {}
): ScanResult {
  const startTime = Date.now();
  const maxDepth = options.maxDepth ?? 6;
  const maxFiles = options.maxFiles ?? 10000;
  const ignoreDirs = new Set([
    ...DEFAULT_IGNORE_DIRECTORIES,
    ...(options.ignoreDirs || []),
  ]);

  const files: ScannedFile[] = [];
  const directories: string[] = [];
  let truncated = false;

  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth || files.length >= maxFiles) {
      if (files.length >= maxFiles) truncated = true;
      return;
    }

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      // Ignore permission or inaccessible errors gracefully
      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) {
        truncated = true;
        break;
      }

      const fullPath = path.join(currentDir, entry.name);
      const relativePath = normalizePath(path.relative(rootDir, fullPath));

      if (isIgnoredPath(relativePath)) {
        continue;
      }

      if (entry.isSymbolicLink()) {
        // Avoid following symlinks indefinitely
        continue;
      }

      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          directories.push(relativePath);
          walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          const ext = path.extname(entry.name).toLowerCase();
          files.push({
            relativePath,
            absolutePath: fullPath,
            fileName: entry.name,
            extension: ext,
            directory: normalizePath(path.dirname(relativePath)),
            sizeBytes: stat.size,
          });
        } catch {
          // File may have been deleted or inaccessible
        }
      }
    }
  }

  walk(rootDir, 0);

  return {
    files,
    directories,
    totalFiles: files.length,
    totalDirectories: directories.length,
    durationMs: Date.now() - startTime,
    truncated,
  };
}
