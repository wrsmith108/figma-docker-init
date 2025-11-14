import fs from 'fs/promises';
import path from 'path';

export class DetectionCache {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.cacheDir = path.join(projectRoot, '.vibe-docker', 'cache');
    this.cacheFile = path.join(this.cacheDir, 'detection.json');
  }

  async get() {
    try {
      const cache = JSON.parse(await fs.readFile(this.cacheFile, 'utf8'));

      // Check if cache is stale (package.json changed)
      const pkgStat = await fs.stat(path.join(this.projectRoot, 'package.json'));
      if (pkgStat.mtimeMs > cache.timestamp) {
        return null; // Stale cache
      }

      return cache.result;
    } catch {
      return null; // No cache or error
    }
  }

  async set(detectionResult) {
    await fs.mkdir(this.cacheDir, { recursive: true });

    // Get package.json mtime and ensure cache timestamp is after it
    const pkgStat = await fs.stat(path.join(this.projectRoot, 'package.json'));
    const timestamp = Math.max(Date.now(), pkgStat.mtimeMs + 1);

    await fs.writeFile(this.cacheFile, JSON.stringify({
      timestamp,
      result: detectionResult
    }, null, 2));
  }

  async clear() {
    try {
      await fs.unlink(this.cacheFile);
    } catch {}
  }
}
