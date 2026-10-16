
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);

const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
transform: {
  '^.+\\.(t|j)s$': [
    'ts-jest',
    {
      useESM: true,
      tsconfig: './tsconfig.spec.json',
    },
  ],
},
  moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
  ...pathsToModuleNameMapper(paths, {
    prefix: '<rootDir>/',
  }),
},
testPathIgnorePatterns: [
  '/node_modules/',
  '/dist/',
  '/src-backup-before-esm-fix/',
],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
