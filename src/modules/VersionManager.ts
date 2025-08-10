import inquirer from 'inquirer';
import semver from 'semver';
import fs from 'fs-extra';
import { PackageInfo } from '../types/index.js';
import { CommitManager } from './CommitManager.js';

export class VersionManager {
  private commitManager = new CommitManager();

  async bumpVersion(
    packageInfo: PackageInfo,
    versionType?: 'patch' | 'minor' | 'major' | 'none'
  ): Promise<string> {
    let bumpType = versionType;

    if (!bumpType) {
      const { selectedVersion } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedVersion',
          message: 'Select version bump type:',
          choices: [
            {
              name: `none (keep current version ${packageInfo.version})`,
              value: 'none',
            },
            {
              name: `patch (${packageInfo.version} → ${semver.inc(packageInfo.version, 'patch')})`,
              value: 'patch',
            },
            {
              name: `minor (${packageInfo.version} → ${semver.inc(packageInfo.version, 'minor')})`,
              value: 'minor',
            },
            {
              name: `major (${packageInfo.version} → ${semver.inc(packageInfo.version, 'major')})`,
              value: 'major',
            },
          ],
        },
      ]);
      bumpType = selectedVersion;
    }

    // If no version bump is selected, return current version
    if (bumpType === 'none') {
      return packageInfo.version;
    }

    const newVersion = semver.inc(packageInfo.version, bumpType!);

    if (!newVersion) {
      throw new Error('Failed to generate new version');
    }

    // Update package.json
    const packageJson = await fs.readJson(packageInfo.path);
    packageJson.version = newVersion;
    await fs.writeJson(packageInfo.path, packageJson, { spaces: 2 });

    // Commit version change
    await this.commitManager.commitVersion(newVersion);

    return newVersion;
  }
}
