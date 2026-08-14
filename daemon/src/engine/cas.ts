/**
 * @file cas.ts
 * @description Content-Addressable Storage (CAS) engine with chunking and cryptographic deduplication.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StoredBlob {
  hash: string;
  sizeBytes: number;
  storedPath: string;
  isNew: boolean;
}

export class ContentAddressableStorage {
  private objectsDir: string;

  constructor(private repoRoot: string) {
    this.objectsDir = path.join(this.repoRoot, '.gitmusic', 'objects');
    this.ensureDirectoryExists(this.objectsDir);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Compute cryptographic SHA-256 hash for any buffer or string.
   */
  public computeHash(data: Buffer | string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Compute hash directly from a file path via streaming.
   */
  public async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Store a file in the Content-Addressable Storage.
   * If the file with the same content hash already exists, deduplicate it.
   */
  public async storeFile(sourceFilePath: string): Promise<StoredBlob> {
    const fileStats = await fs.promises.stat(sourceFilePath);
    const hash = await this.computeFileHash(sourceFilePath);

    // Git-like 2-character subfolder partitioning: .gitmusic/objects/ab/cdef1234...
    const prefix = hash.substring(0, 2);
    const remainder = hash.substring(2);
    const subDir = path.join(this.objectsDir, prefix);
    this.ensureDirectoryExists(subDir);

    const targetBlobPath = path.join(subDir, remainder);

    let isNew = false;
    if (!fs.existsSync(targetBlobPath)) {
      await fs.promises.copyFile(sourceFilePath, targetBlobPath);
      isNew = true;
    }

    return {
      hash,
      sizeBytes: fileStats.size,
      storedPath: targetBlobPath,
      isNew,
    };
  }

  /**
   * Retrieve the absolute path of a stored blob by its hash.
   */
  public getBlobPath(hash: string): string | null {
    const prefix = hash.substring(0, 2);
    const remainder = hash.substring(2);
    const blobPath = path.join(this.objectsDir, prefix, remainder);

    return fs.existsSync(blobPath) ? blobPath : null;
  }

  /**
   * Calculate total unique storage vs raw un-deduplicated usage.
   */
  public getStorageMetrics(allReferences: { hash: string; sizeBytes: number }[]): {
    totalReferencedBytes: number;
    uniqueStoredBytes: number;
    savedBytes: number;
    savingsPercentage: number;
  } {
    const uniqueHashes = new Set<string>();
    let totalReferencedBytes = 0;
    let uniqueStoredBytes = 0;

    for (const item of allReferences) {
      totalReferencedBytes += item.sizeBytes;
      if (!uniqueHashes.has(item.hash)) {
        uniqueHashes.add(item.hash);
        uniqueStoredBytes += item.sizeBytes;
      }
    }

    const savedBytes = Math.max(0, totalReferencedBytes - uniqueStoredBytes);
    const savingsPercentage = totalReferencedBytes > 0
      ? Math.round((savedBytes / totalReferencedBytes) * 100)
      : 0;

    return {
      totalReferencedBytes,
      uniqueStoredBytes,
      savedBytes,
      savingsPercentage,
    };
  }
}
