import fs from 'node:fs';
import path from 'node:path';

export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function dirExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

export function readFileSafe(filePath: string, maxLength: number = 250000): string | null {
  try {
    if (!fileExists(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (stat.size > maxLength) {
      // Read only head of large files
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(maxLength);
      fs.readSync(fd, buffer, 0, maxLength, 0);
      fs.closeSync(fd);
      return buffer.toString('utf-8');
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function readJsonSafe<T = any>(filePath: string): T | null {
  const content = readFileSafe(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export function writeFileSafe(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}
