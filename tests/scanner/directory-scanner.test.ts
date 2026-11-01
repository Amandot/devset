import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { scanDirectory } from '../../src/scanner/file-scanner.js';
import { DirectoryScanner } from '../../src/scanner/directory-scanner.js';

describe('DirectoryScanner', () => {
  it('should discover nested components in fullstack example', () => {
    const root = path.resolve('examples/fullstack-react-django');
    const scanResult = scanDirectory(root);
    const components = DirectoryScanner.discoverComponents(root, scanResult.files);

    const compPaths = components.map(c => c.relativePath);
    expect(compPaths).toContain('frontend');
    expect(compPaths).toContain('backend');

    const frontendComp = components.find(c => c.relativePath === 'frontend');
    expect(frontendComp?.suggestedType).toBe('frontend');

    const backendComp = components.find(c => c.relativePath === 'backend');
    expect(backendComp?.suggestedType).toBe('backend');
  });

  it('should detect root component in single-tier project', () => {
    const root = path.resolve('examples/react-vite');
    const scanResult = scanDirectory(root);
    const components = DirectoryScanner.discoverComponents(root, scanResult.files);

    expect(components.length).toBe(1);
    expect(components[0].relativePath).toBe('.');
  });
});
