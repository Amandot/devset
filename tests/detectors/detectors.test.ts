import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { scanDirectory } from '../../src/scanner/file-scanner.js';
import { LanguageDetector } from '../../src/detectors/language-detector.js';
import { FrameworkDetector } from '../../src/detectors/framework-detector.js';
import { PackageManagerDetector } from '../../src/detectors/package-manager-detector.js';
import { DatabaseDetector } from '../../src/detectors/database-detector.js';
import { EnvironmentDetector } from '../../src/detectors/environment-detector.js';

describe('Detectors Engine', () => {
  it('should detect TypeScript, React, Vite, and npm in react-vite example', () => {
    const dir = path.resolve('examples/react-vite');
    const scan = scanDirectory(dir);

    const lang = LanguageDetector.detect(dir, scan.files);
    expect(lang.primary).toBe('typescript');

    const fw = FrameworkDetector.detect(dir, scan.files);
    const fwNames = fw.technologies.map(t => t.name);
    expect(fwNames).toContain('React');
    expect(fwNames).toContain('Vite');

    const pm = PackageManagerDetector.detect(dir, scan.files);
    expect(pm.primary).toBe('npm');
  });

  it('should detect Python, Django, pip, and PostgreSQL in django example', () => {
    const dir = path.resolve('examples/django');
    const scan = scanDirectory(dir);

    const lang = LanguageDetector.detect(dir, scan.files);
    expect(lang.primary).toBe('python');

    const fw = FrameworkDetector.detect(dir, scan.files);
    expect(fw.technologies.some(t => t.name === 'Django')).toBe(true);

    const pm = PackageManagerDetector.detect(dir, scan.files);
    expect(pm.primary).toBe('pip');

    const db = DatabaseDetector.detect(dir, scan.files);
    expect(db.technologies.some(t => t.name === 'PostgreSQL')).toBe(true);
  });

  it('should detect Next.js in nextjs example', () => {
    const dir = path.resolve('examples/nextjs');
    const scan = scanDirectory(dir);

    const fw = FrameworkDetector.detect(dir, scan.files);
    expect(fw.technologies.some(t => t.name === 'Next.js')).toBe(true);
  });

  it('should identify missing environment variables without logging secrets', () => {
    const dir = path.resolve('examples/fullstack-react-django');
    const scan = scanDirectory(dir);

    const envResult = EnvironmentDetector.detect(dir, scan.files);
    expect(envResult.exampleEnvFiles.length).toBeGreaterThan(0);
    expect(envResult.missingVariables).toContain('VITE_API_URL');
    expect(envResult.missingVariables).toContain('DATABASE_URL');
    expect(envResult.missingVariables).toContain('DJANGO_SECRET_KEY');
  });

  it('should detect lockfile conflict when multiple lockfiles exist', () => {
    // Simulated scanned files with package-lock.json AND yarn.lock
    const fakeFiles = [
      { relativePath: 'package.json', absolutePath: '/fake/package.json', fileName: 'package.json', extension: '.json', directory: '.', sizeBytes: 100 },
      { relativePath: 'package-lock.json', absolutePath: '/fake/package-lock.json', fileName: 'package-lock.json', extension: '.json', directory: '.', sizeBytes: 500 },
      { relativePath: 'yarn.lock', absolutePath: '/fake/yarn.lock', fileName: 'yarn.lock', extension: '.lock', directory: '.', sizeBytes: 500 },
    ];

    const pm = PackageManagerDetector.detect('/fake', fakeFiles as any);
    expect(pm.hasConflict).toBe(true);
    expect(pm.conflictingManagers).toContain('npm');
    expect(pm.conflictingManagers).toContain('yarn');
  });
});
