/**
 * @file cas.ts
 * @description Content-Addressable Storage (CAS) engine with chunking and cryptographic deduplication.
 */
export interface StoredBlob {
    hash: string;
    sizeBytes: number;
    storedPath: string;
    isNew: boolean;
}
export declare class ContentAddressableStorage {
    private repoRoot;
    private objectsDir;
    constructor(repoRoot: string);
    private ensureDirectoryExists;
    /**
     * Compute cryptographic SHA-256 hash for any buffer or string.
     */
    computeHash(data: Buffer | string): string;
    /**
     * Compute hash directly from a file path via streaming.
     */
    computeFileHash(filePath: string): Promise<string>;
    /**
     * Store a file in the Content-Addressable Storage.
     * If the file with the same content hash already exists, deduplicate it.
     */
    storeFile(sourceFilePath: string): Promise<StoredBlob>;
    /**
     * Retrieve the absolute path of a stored blob by its hash.
     */
    getBlobPath(hash: string): string | null;
    /**
     * Calculate total unique storage vs raw un-deduplicated usage.
     */
    getStorageMetrics(allReferences: {
        hash: string;
        sizeBytes: number;
    }[]): {
        totalReferencedBytes: number;
        uniqueStoredBytes: number;
        savedBytes: number;
        savingsPercentage: number;
    };
}
