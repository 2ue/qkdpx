import { spawn } from 'child_process';

const execCommand = (command: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Command failed: ${stderr.trim() || stdout.trim()}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};

export class GitHelper {
  static async checkStatus(): Promise<{
    hasUncommitted: boolean;
    currentBranch: string;
    isClean: boolean;
  }> {
    try {
      // Get current branch
      const branch = await execCommand('git', [
        'rev-parse',
        '--abbrev-ref',
        'HEAD',
      ]);

      // Check if working directory is clean
      const status = await execCommand('git', ['status', '--porcelain']);
      const isClean = status.trim() === '';

      return {
        hasUncommitted: !isClean,
        currentBranch: branch,
        isClean,
      };
    } catch (error) {
      throw new Error(
        `Git status check failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  static async add(files: string | string[]): Promise<void> {
    const fileArgs = Array.isArray(files) ? files : [files];
    await execCommand('git', ['add', ...fileArgs]);
  }

  static async commit(message: string): Promise<void> {
    await execCommand('git', ['commit', '-m', message]);
  }

  static async tag(tagName: string): Promise<void> {
    await execCommand('git', ['tag', tagName]);
  }

  static async push(options?: { tags?: boolean }): Promise<void> {
    // Check if origin remote exists
    try {
      await execCommand('git', ['remote', 'get-url', 'origin']);
    } catch (error) {
      throw new Error('No remote repository configured. Please add a remote repository first:\ngit remote add origin <repository-url>');
    }

    const args = ['push', 'origin'];
    if (options?.tags) {
      args.push('--tags');
    }
    await execCommand('git', args);
  }

  static async deleteTag(tagName: string): Promise<void> {
    await execCommand('git', ['tag', '-d', tagName]);
  }

  static async tagExists(tagName: string): Promise<boolean> {
    try {
      await execCommand('git', ['tag', '-l', tagName]);
      const output = await execCommand('git', ['tag', '-l', tagName]);
      return output.trim() === tagName;
    } catch {
      return false;
    }
  }

  static async isGitRepository(): Promise<boolean> {
    try {
      await execCommand('git', ['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }
}
