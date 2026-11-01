import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { scanDirectory } from '../../src/scanner/file-scanner.js';
import { isIgnoredPath } from '../../src/scanner/ignore-rules.js';

describe('FileScanner', () => {
  it('should ignore node_modules and .venv directories', () => {
    expect(isIgnoredPath('node_modules/package/index.js')).toBe(true);
    expect(isIgnoredPath('.venv/Scripts/python.exe')).toBe(true);
    expect(isIgnoredPath('frontend/node_modules/vite/index.js')).toBe(true);
    expect(isIgnoredPath('src/components/Button.tsx')).toBe(false);
  });

  it('should scan example react-vite directory recursively', () => {
    const target = path.resolve('examples/react-vite');
    const result = scanDirectory(target);

    expect(result.totalFiles).toBeGreaterThan(0);
    const fileNames = result.files.map(f => f.fileName);
    expect(fileNames).toContain('package.json');
    expect(fileNames).toContain('vite.config.ts');
    expect(fileNames).toContain('App.tsx');
  });

  it('should respect maxDepth safeguard', () => {
    const target = path.resolve('examples');
    const shallow = scanDirectory(target, { maxDepth: 1 });
    const deep = scanDirectory(target, { maxDepth: 4 });

    expect(deep.totalFiles).toBeGreaterThanOrEqual(shallow.totalFiles);
  });
});
