"use strict";
/**
 * @file cas.ts
 * @description Content-Addressable Storage (CAS) engine with chunking and cryptographic deduplication.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentAddressableStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class ContentAddressableStorage {
    repoRoot;
    objectsDir;
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.objectsDir = path.join(this.repoRoot, '.gitmusic', 'objects');
        this.ensureDirectoryExists(this.objectsDir);
    }
    ensureDirectoryExists(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    /**
     * Compute cryptographic SHA-256 hash for any buffer or string.
     */
    computeHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Compute hash directly from a file path via streaming.
     */
    async computeFileHash(filePath) {
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
    async storeFile(sourceFilePath) {
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
     * Store a raw Buffer directly in Content-Addressable Storage.
     */
    storeBuffer(buf) {
        const hash = this.computeHash(buf);
        const prefix = hash.substring(0, 2);
        const remainder = hash.substring(2);
        const subDir = path.join(this.objectsDir, prefix);
        this.ensureDirectoryExists(subDir);
        const targetBlobPath = path.join(subDir, remainder);
        let isNew = false;
        if (!fs.existsSync(targetBlobPath)) {
            fs.writeFileSync(targetBlobPath, buf);
            isNew = true;
        }
        return {
            hash,
            sizeBytes: buf.length,
            storedPath: targetBlobPath,
            isNew,
        };
    }
    /**
     * Retrieve the absolute path of a stored blob by its hash.
     */
    getBlobPath(hash) {
        const prefix = hash.substring(0, 2);
        const remainder = hash.substring(2);
        const blobPath = path.join(this.objectsDir, prefix, remainder);
        return fs.existsSync(blobPath) ? blobPath : null;
    }
    /**
     * Calculate total unique storage vs raw un-deduplicated usage.
     */
    getStorageMetrics(allReferences) {
        const uniqueHashes = new Set();
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
exports.ContentAddressableStorage = ContentAddressableStorage;
