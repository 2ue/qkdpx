export interface Config {
  registry: string;
  authToken?: string; // Only in global config
}

export interface PublishOptions {
  version?: 'patch' | 'minor' | 'major';
  skipConfirm?: boolean;
  dryRun?: boolean;
}

export interface GitStatus {
  hasUncommitted: boolean;
  currentBranch: string;
  isClean: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
}
