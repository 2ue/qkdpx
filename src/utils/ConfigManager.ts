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
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskToken(token: string): string {
  if (token.length <= 6) return token;
  return token.slice(0, 3) + '***' + token.slice(-3);
}

export class ConfigManager {
  private projectConfigPath: string;
  private globalConfigPath: string;

  constructor() {
    this.projectConfigPath = path.join(process.cwd(), '.qkdpxrc');
    this.globalConfigPath = path.join(os.homedir(), '.qkdpx', 'config.json');
  }

  getProjectConfigPath(): string {
    return this.projectConfigPath;
  }

  getGlobalConfigPath(): string {
    return this.globalConfigPath;
  }

  async projectConfigExists(): Promise<boolean> {
    return await fs.pathExists(this.projectConfigPath);
  }

  async globalConfigExists(): Promise<boolean> {
    return await fs.pathExists(this.globalConfigPath);
  }

  async loadProjectConfig(): Promise<Partial<Config>> {
    if (await this.projectConfigExists()) {
      try {
        return await fs.readJson(this.projectConfigPath);
      } catch (error) {
        console.warn('Failed to parse .qkdpxrc, ignoring project config');
      }
    }
    return {};
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
    const projectConfig = await this.loadProjectConfig();
    const globalConfig = await this.loadGlobalConfig();

    // Project config takes precedence over global config
    return {
      registry: projectConfig.registry || globalConfig.registry || DEFAULT_REGISTRY,
      authToken: globalConfig.authToken, // Only from global config
    };
  }

  async saveProjectConfig(config: Partial<Config>): Promise<void> {
    // Only save registry to project config, never auth token
    const projectConfig = {
      registry: config.registry || DEFAULT_REGISTRY,
    };
    await fs.writeJson(this.projectConfigPath, projectConfig, { spaces: 2 });
  }

  async saveGlobalConfig(config: Partial<Config>): Promise<void> {
    // Ensure global config directory exists
    await fs.ensureDir(path.dirname(this.globalConfigPath));
    
    // Encrypt auth token before saving
    const globalConfig: any = {
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
    const projectConfig = await this.loadProjectConfig();
    const globalConfig = await this.loadGlobalConfig();

    const registrySource = projectConfig.registry ? 'project' : globalConfig.registry ? 'global' : 'default';
    const registry = projectConfig.registry || globalConfig.registry || DEFAULT_REGISTRY;

    const authToken = globalConfig.authToken 
      ? { value: maskToken(globalConfig.authToken), source: 'global' }
      : null;

    return {
      registry: { value: registry, source: registrySource },
      authToken,
    };
  }
}