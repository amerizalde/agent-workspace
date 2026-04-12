import { mkdir, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export const bundleTextures = async (): Promise<{ path: string; files: number }> => {
  const texturesDir = join(__dirname, '..', 'textures');
  const zipPath = join(texturesDir, 'textures.zip');
  
  console.log(`Bundling ${texturesDir}...`);
  
  // In production, would use jszip or similar to create ZIP
  const files = await readdir(texturesDir);
  
  return {
    path: zipPath,
    files: files.length
  };
};

export const optimizeBuild = async (): Promise<{ size: number | string }> => {
  const distDir = join(__dirname, '..', 'dist');
  const stats = await (await import('fs')).stat(distDir);
  
  console.log(`Build ready at ${distDir} (${stats.size} bytes)`);
  
  return {
    size: stats.size
  };
};

export const createDeploymentPackage = async (): Promise<string> => {
  const packageDir = join(__dirname, '..', 'dist');
  
  console.log('Creating deployment package...');
  
  // List files in package
  const files = await (await import('fs/promises')).readdir(packageDir);
  
  console.log('Package contents:', files);
  
  return packageDir;
};

export default {
  bundleTextures,
  optimizeBuild,
  createDeploymentPackage
};
