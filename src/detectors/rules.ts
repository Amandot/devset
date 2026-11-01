import type { TechnologyDetectionRule } from '../types/detection.js';

export const LANGUAGE_RULES: TechnologyDetectionRule[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'language',
    language: 'javascript',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'package.json', weight: 15, description: 'package.json manifest' },
      { pathPattern: '**/*.js', weight: 8, description: 'JavaScript source files' },
      { pathPattern: '**/*.mjs', weight: 8, description: 'ES module source files' },
      { pathPattern: '**/*.jsx', weight: 10, description: 'JSX source files' },
    ],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'language',
    language: 'typescript',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'tsconfig.json', weight: 20, description: 'tsconfig.json configuration' },
      { pathPattern: '**/*.ts', weight: 10, description: 'TypeScript source files' },
      { pathPattern: '**/*.tsx', weight: 12, description: 'TSX source files' },
    ],
    dependencyRules: [
      { packageJsonField: 'devDependencies', packages: ['typescript', '@types/node'], weight: 15, description: 'TypeScript dependency' },
    ],
  },
  {
    id: 'python',
    name: 'Python',
    category: 'language',
    language: 'python',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'requirements.txt', weight: 15, description: 'requirements.txt dependency file' },
      { pathPattern: 'pyproject.toml', weight: 15, description: 'pyproject.toml modern Python configuration' },
      { pathPattern: 'Pipfile', weight: 15, description: 'Pipfile dependency declaration' },
      { pathPattern: 'setup.py', weight: 15, description: 'setup.py build configuration' },
      { pathPattern: 'setup.cfg', weight: 12, description: 'setup.cfg configuration' },
      { pathPattern: 'environment.yml', weight: 15, description: 'Conda environment.yml' },
      { pathPattern: '**/*.py', weight: 10, description: 'Python source files' },
    ],
  },
  {
    id: 'java',
    name: 'Java',
    category: 'language',
    language: 'java',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'pom.xml', weight: 20, description: 'Maven pom.xml' },
      { pathPattern: 'build.gradle', weight: 20, description: 'Gradle build.gradle' },
      { pathPattern: 'build.gradle.kts', weight: 20, description: 'Gradle Kotlin build file' },
      { pathPattern: 'mvnw', weight: 15, description: 'Maven wrapper' },
      { pathPattern: 'gradlew', weight: 15, description: 'Gradle wrapper' },
      { pathPattern: '**/*.java', weight: 10, description: 'Java source files' },
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'language',
    language: 'rust',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'Cargo.toml', weight: 25, description: 'Cargo.toml manifest' },
      { pathPattern: 'Cargo.lock', weight: 20, description: 'Cargo.lock lockfile' },
      { pathPattern: '**/*.rs', weight: 10, description: 'Rust source files' },
    ],
  },
  {
    id: 'go',
    name: 'Go',
    category: 'language',
    language: 'go',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'go.mod', weight: 25, description: 'go.mod module file' },
      { pathPattern: 'go.sum', weight: 20, description: 'go.sum checksum file' },
      { pathPattern: '**/*.go', weight: 10, description: 'Go source files' },
    ],
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'language',
    language: 'php',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'composer.json', weight: 25, description: 'composer.json manifest' },
      { pathPattern: 'composer.lock', weight: 20, description: 'composer.lock file' },
      { pathPattern: '**/*.php', weight: 10, description: 'PHP source files' },
    ],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'language',
    language: 'ruby',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'Gemfile', weight: 25, description: 'Gemfile manifest' },
      { pathPattern: 'Gemfile.lock', weight: 20, description: 'Gemfile.lock' },
      { pathPattern: '**/*.rb', weight: 10, description: 'Ruby source files' },
    ],
  },
  {
    id: 'csharp',
    name: 'C# / .NET',
    category: 'language',
    language: 'csharp',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: '**/*.csproj', weight: 25, description: 'C# project file' },
      { pathPattern: '**/*.sln', weight: 25, description: '.NET solution file' },
      { pathPattern: '**/*.cs', weight: 10, description: 'C# source files' },
    ],
  },
  {
    id: 'dart',
    name: 'Dart / Flutter',
    category: 'language',
    language: 'dart',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'pubspec.yaml', weight: 25, description: 'pubspec.yaml manifest' },
      { pathPattern: '**/*.dart', weight: 10, description: 'Dart source files' },
    ],
  },
];

export const FRAMEWORK_RULES: TechnologyDetectionRule[] = [
  // Frontend Frameworks
  {
    id: 'react',
    name: 'React',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['react', 'react-dom'], weight: 25, description: 'React dependencies' },
    ],
    fileRules: [
      { pathPattern: '**/*.jsx', weight: 8, description: 'JSX files present' },
      { pathPattern: '**/*.tsx', weight: 8, description: 'TSX files present' },
    ],
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'next.config.js', weight: 25, description: 'next.config.js configuration' },
      { pathPattern: 'next.config.mjs', weight: 25, description: 'next.config.mjs configuration' },
      { pathPattern: 'next.config.ts', weight: 25, description: 'next.config.ts configuration' },
    ],
    dependencyRules: [
      { packages: ['next'], weight: 25, description: 'Next.js dependency in package.json' },
    ],
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'vite.config.js', weight: 25, description: 'vite.config.js configuration' },
      { pathPattern: 'vite.config.ts', weight: 25, description: 'vite.config.ts configuration' },
      { pathPattern: 'vite.config.mjs', weight: 25, description: 'vite.config.mjs configuration' },
    ],
    dependencyRules: [
      { packages: ['vite'], weight: 25, description: 'Vite dependency' },
    ],
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['vue'], weight: 25, description: 'Vue dependency' },
    ],
    fileRules: [
      { pathPattern: '**/*.vue', weight: 15, description: 'Vue Single-File Components' },
    ],
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'svelte.config.js', weight: 25, description: 'svelte.config.js configuration' },
      { pathPattern: '**/*.svelte', weight: 15, description: 'Svelte components' },
    ],
    dependencyRules: [
      { packages: ['svelte', '@sveltejs/kit'], weight: 25, description: 'Svelte dependencies' },
    ],
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'framework',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'angular.json', weight: 30, description: 'angular.json configuration' },
    ],
    dependencyRules: [
      { packages: ['@angular/core'], weight: 25, description: 'Angular core dependency' },
    ],
  },
  // Backend Node Frameworks
  {
    id: 'express',
    name: 'Express',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['express'], weight: 25, description: 'Express dependency' },
    ],
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    category: 'framework',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'nest-cli.json', weight: 30, description: 'nest-cli.json configuration' },
    ],
    dependencyRules: [
      { packages: ['@nestjs/core', '@nestjs/common'], weight: 25, description: 'NestJS core packages' },
    ],
  },
  {
    id: 'fastify',
    name: 'Fastify',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['fastify'], weight: 25, description: 'Fastify dependency' },
    ],
  },
  // Python Frameworks
  {
    id: 'django',
    name: 'Django',
    category: 'framework',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'manage.py', weight: 25, description: 'manage.py Django entry script' },
    ],
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /django/i, weight: 20, description: 'django in requirements.txt' },
      { filePattern: 'pyproject.toml', pattern: /django/i, weight: 20, description: 'django in pyproject.toml' },
    ],
  },
  {
    id: 'flask',
    name: 'Flask',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /flask/i, weight: 20, description: 'flask in requirements.txt' },
      { filePattern: 'pyproject.toml', pattern: /flask/i, weight: 20, description: 'flask in pyproject.toml' },
      { filePattern: '**/*.py', pattern: /from\s+flask\s+import|import\s+flask/, weight: 15, description: 'Flask import in python source' },
    ],
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /fastapi/i, weight: 20, description: 'fastapi in requirements.txt' },
      { filePattern: 'pyproject.toml', pattern: /fastapi/i, weight: 20, description: 'fastapi in pyproject.toml' },
      { filePattern: '**/*.py', pattern: /from\s+fastapi\s+import|import\s+fastapi/, weight: 15, description: 'FastAPI import in python source' },
    ],
  },
  {
    id: 'streamlit',
    name: 'Streamlit',
    category: 'framework',
    threshold: 15,
    minScoreForPossible: 8,
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /streamlit/i, weight: 20, description: 'streamlit in requirements.txt' },
      { filePattern: 'pyproject.toml', pattern: /streamlit/i, weight: 20, description: 'streamlit in pyproject.toml' },
    ],
  },
  // Java Frameworks
  {
    id: 'springboot',
    name: 'Spring Boot',
    category: 'framework',
    threshold: 20,
    minScoreForPossible: 10,
    contentRules: [
      { filePattern: 'pom.xml', pattern: /spring-boot/i, weight: 25, description: 'spring-boot in pom.xml' },
      { filePattern: 'build.gradle', pattern: /spring-boot/i, weight: 25, description: 'spring-boot in build.gradle' },
    ],
  },
];

export const PACKAGE_MANAGER_RULES: TechnologyDetectionRule[] = [
  {
    id: 'npm',
    name: 'npm',
    category: 'package-manager',
    packageManager: 'npm',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'package-lock.json', weight: 30, description: 'package-lock.json lockfile' },
      { pathPattern: 'package.json', weight: 10, description: 'package.json without lockfile defaults to npm' },
    ],
  },
  {
    id: 'yarn',
    name: 'Yarn',
    category: 'package-manager',
    packageManager: 'yarn',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'yarn.lock', weight: 30, description: 'yarn.lock lockfile' },
      { pathPattern: '.yarnrc', weight: 15, description: '.yarnrc configuration' },
      { pathPattern: '.yarnrc.yml', weight: 20, description: '.yarnrc.yml configuration' },
    ],
  },
  {
    id: 'pnpm',
    name: 'pnpm',
    category: 'package-manager',
    packageManager: 'pnpm',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'pnpm-lock.yaml', weight: 30, description: 'pnpm-lock.yaml lockfile' },
      { pathPattern: 'pnpm-workspace.yaml', weight: 25, description: 'pnpm-workspace.yaml configuration' },
    ],
  },
  {
    id: 'bun',
    name: 'Bun',
    category: 'package-manager',
    packageManager: 'bun',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'bun.lockb', weight: 30, description: 'bun.lockb binary lockfile' },
      { pathPattern: 'bun.lock', weight: 30, description: 'bun.lock lockfile' },
      { pathPattern: 'bunfig.toml', weight: 20, description: 'bunfig.toml configuration' },
    ],
  },
  {
    id: 'pip',
    name: 'pip',
    category: 'package-manager',
    packageManager: 'pip',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: 'requirements.txt', weight: 25, description: 'requirements.txt file' },
    ],
  },
  {
    id: 'poetry',
    name: 'Poetry',
    category: 'package-manager',
    packageManager: 'poetry',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'poetry.lock', weight: 30, description: 'poetry.lock file' },
    ],
    contentRules: [
      { filePattern: 'pyproject.toml', pattern: /\[tool\.poetry\]/i, weight: 25, description: 'tool.poetry in pyproject.toml' },
    ],
  },
  {
    id: 'pipenv',
    name: 'Pipenv',
    category: 'package-manager',
    packageManager: 'pipenv',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'Pipfile', weight: 25, description: 'Pipfile' },
      { pathPattern: 'Pipfile.lock', weight: 30, description: 'Pipfile.lock' },
    ],
  },
  {
    id: 'uv',
    name: 'uv',
    category: 'package-manager',
    packageManager: 'uv',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'uv.lock', weight: 30, description: 'uv.lock lockfile' },
    ],
    contentRules: [
      { filePattern: 'pyproject.toml', pattern: /\[tool\.uv\]/i, weight: 25, description: 'tool.uv in pyproject.toml' },
    ],
  },
  {
    id: 'conda',
    name: 'Conda',
    category: 'package-manager',
    packageManager: 'conda',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'environment.yml', weight: 30, description: 'environment.yml Conda file' },
      { pathPattern: 'environment.yaml', weight: 30, description: 'environment.yaml Conda file' },
    ],
  },
  {
    id: 'maven',
    name: 'Maven',
    category: 'package-manager',
    packageManager: 'maven',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'mvnw', weight: 25, description: 'mvnw Maven wrapper' },
      { pathPattern: 'mvnw.cmd', weight: 25, description: 'mvnw.cmd Windows Maven wrapper' },
      { pathPattern: 'pom.xml', weight: 20, description: 'pom.xml project descriptor' },
    ],
  },
  {
    id: 'gradle',
    name: 'Gradle',
    category: 'package-manager',
    packageManager: 'gradle',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'gradlew', weight: 25, description: 'gradlew Gradle wrapper' },
      { pathPattern: 'gradlew.bat', weight: 25, description: 'gradlew.bat Windows Gradle wrapper' },
      { pathPattern: 'build.gradle', weight: 20, description: 'build.gradle script' },
      { pathPattern: 'build.gradle.kts', weight: 20, description: 'build.gradle.kts Kotlin script' },
    ],
  },
];

export const DATABASE_RULES: TechnologyDetectionRule[] = [
  {
    id: 'prisma',
    name: 'Prisma ORM',
    category: 'database',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'prisma/schema.prisma', weight: 30, description: 'Prisma schema file' },
      { pathPattern: 'schema.prisma', weight: 30, description: 'schema.prisma file' },
    ],
    dependencyRules: [
      { packages: ['@prisma/client', 'prisma'], weight: 25, description: 'Prisma packages' },
    ],
  },
  {
    id: 'drizzle',
    name: 'Drizzle ORM',
    category: 'database',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'drizzle.config.ts', weight: 30, description: 'drizzle.config.ts' },
      { pathPattern: 'drizzle.config.js', weight: 30, description: 'drizzle.config.js' },
    ],
    dependencyRules: [
      { packages: ['drizzle-orm', 'drizzle-kit'], weight: 25, description: 'Drizzle ORM dependencies' },
    ],
  },
  {
    id: 'sequelize',
    name: 'Sequelize',
    category: 'database',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: '.sequelizerc', weight: 30, description: '.sequelizerc configuration' },
    ],
    dependencyRules: [
      { packages: ['sequelize'], weight: 25, description: 'sequelize dependency' },
    ],
  },
  {
    id: 'mongoose',
    name: 'Mongoose (MongoDB)',
    category: 'database',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['mongoose'], weight: 25, description: 'mongoose dependency' },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['pg', 'pg-promise', 'postgres'], weight: 20, description: 'Node PostgreSQL client' },
    ],
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /psycopg2|asyncpg/i, weight: 20, description: 'Python PostgreSQL driver' },
      { filePattern: '.env.example', pattern: /postgres(ql)?:\/\//i, weight: 15, description: 'Postgres connection string in .env.example' },
    ],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['mysql', 'mysql2'], weight: 20, description: 'Node MySQL client' },
    ],
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /mysqlclient|pymysql/i, weight: 20, description: 'Python MySQL driver' },
    ],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    category: 'database',
    threshold: 15,
    minScoreForPossible: 8,
    fileRules: [
      { pathPattern: '**/*.sqlite', weight: 25, description: 'SQLite database file' },
      { pathPattern: '**/*.sqlite3', weight: 25, description: 'SQLite3 database file' },
      { pathPattern: '**/*.db', weight: 15, description: 'Database file' },
    ],
    dependencyRules: [
      { packages: ['sqlite3', 'better-sqlite3'], weight: 20, description: 'Node SQLite driver' },
    ],
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    threshold: 15,
    minScoreForPossible: 8,
    dependencyRules: [
      { packages: ['redis', 'ioredis'], weight: 25, description: 'Node Redis client' },
    ],
    contentRules: [
      { filePattern: 'requirements.txt', pattern: /redis/i, weight: 20, description: 'Python redis package' },
    ],
  },
  {
    id: 'alembic',
    name: 'Alembic (SQLAlchemy)',
    category: 'database',
    threshold: 20,
    minScoreForPossible: 10,
    fileRules: [
      { pathPattern: 'alembic.ini', weight: 30, description: 'alembic.ini configuration' },
    ],
  },
];
