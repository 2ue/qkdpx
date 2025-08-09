import { GitStatus, PackageInfo } from '../types/index.js';
import { GitHelper } from '../utils/GitHelper.js';
import fs from 'fs-extra';
import path from 'path';

export class ChangeDetector {
  async checkGitStatus(): Promise<GitStatus> {
    // Check if current directory is a git repository
    if (!(await GitHelper.isGitRepository())) {
      throw new Error('Current directory is not a git repository');
    }

    return await GitHelper.checkStatus();
  }

  async getPackageInfo(): Promise<PackageInfo> {
    const packagePath = path.join(process.cwd(), 'package.json');

    if (!(await fs.pathExists(packagePath))) {
      throw new Error('package.json not found in current directory');
    }

    const packageJson = await fs.readJson(packagePath);

    if (!packageJson.name) {
      throw new Error('package.json must have a "name" field');
    }

    if (!packageJson.version) {
      throw new Error('package.json must have a "version" field');
    }

    return {
      name: packageJson.name,
      version: packageJson.version,
      path: packagePath,
    };
  }
}
