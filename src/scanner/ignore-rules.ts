/**
 * Directories and patterns ignored during project scanning
 */
export const DEFAULT_IGNORE_DIRECTORIES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '.venv',
  'venv',
  'env',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.output',
  'coverage',
  '.nyc_output',
  'target', // Rust/Maven
  'vendor', // PHP/Go
  'bin',
  'obj', // .NET
  '.idea',
  '.vscode',
  '.devstart',
  'tmp',
  'temp',
  '.turbo',
  '.cache',
];

export const DEFAULT_IGNORE_PATTERNS = [
  ...DEFAULT_IGNORE_DIRECTORIES.map(dir => `**/${dir}/**`),
  ...DEFAULT_IGNORE_DIRECTORIES.map(dir => `**/${dir}`),
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
  '**/*.pyc',
  '**/*.pyo',
  '**/*.pyd',
  '**/*.class',
  '**/*.jar',
  '**/*.zip',
  '**/*.tar.gz',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.ico',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.eot',
  '**/*.exe',
  '**/*.dll',
  '**/*.so',
  '**/*.dylib',
];

export function isIgnoredPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments.some(seg => DEFAULT_IGNORE_DIRECTORIES.includes(seg));
}
