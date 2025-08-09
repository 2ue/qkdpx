import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Config } from '../types/index.js';

const DEFAULT_REGISTRY = 'https://registry.npmjs.org/';

// Simple encryption/decryption for auth token
const ENCRYPTION_KEY = crypto.scryptSync('qkdpx-config', 'salt', 32);

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskToken(token: string): string {
  if (token.length <= 6) return token;
  return token.slice(0, 3) + '***' + token.slice(-3);
}

export class ConfigManager {
  private globalConfigPath: string;

  constructor() {
    this.globalConfigPath = path.join(os.homedir(), '.qkdpx', 'config.json');
  }

  getGlobalConfigPath(): string {
    return this.globalConfigPath;
  }

  async globalConfigExists(): Promise<boolean> {
    return await fs.pathExists(this.globalConfigPath);
  }

  async loadGlobalConfig(): Promise<Partial<Config>> {
    if (await this.globalConfigExists()) {
      try {
        const config = await fs.readJson(this.globalConfigPath);
        // Decrypt auth token if present
        if (config.authToken) {
          try {
            config.authToken = decryptToken(config.authToken);
          } catch (error) {
            console.warn('Failed to decrypt auth token, ignoring');
            delete config.authToken;
          }
        }
        return config;
      } catch (error) {
        console.warn('Failed to parse global config, ignoring');
      }
    }
    return {};
  }

  async loadConfig(): Promise<Config> {
    const globalConfig = await this.loadGlobalConfig();

    return {
      registry: globalConfig.registry || DEFAULT_REGISTRY,
      authToken: globalConfig.authToken,
    };
  }

  async saveGlobalConfig(config: Partial<Config>): Promise<void> {
    // Ensure global config directory exists
    await fs.ensureDir(path.dirname(this.globalConfigPath));

    // Encrypt auth token before saving
    const globalConfig: Record<string, string> = {
      registry: config.registry || DEFAULT_REGISTRY,
    };

    if (config.authToken) {
      globalConfig.authToken = encryptToken(config.authToken);
    }

    await fs.writeJson(this.globalConfigPath, globalConfig, { spaces: 2 });
  }

  async getConfigSummary(): Promise<{
    registry: { value: string; source: string };
    authToken: { value: string; source: string } | null;
  }> {
    const globalConfig = await this.loadGlobalConfig();

    const registry = globalConfig.registry || DEFAULT_REGISTRY;
    const registrySource = globalConfig.registry ? 'global' : 'default';

    const authToken = globalConfig.authToken
      ? { value: maskToken(globalConfig.authToken), source: 'global' }
      : null;

    return {
      registry: { value: registry, source: registrySource },
      authToken,
    };
  }
}
