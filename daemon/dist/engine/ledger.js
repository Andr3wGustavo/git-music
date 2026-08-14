"use strict";
/**
 * @file ledger.ts
 * @description Git-Music Ledger: Commit history, branching, and diff calculations.
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
exports.ProjectLedger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ProjectLedger {
    repoRoot;
    projectName;
    ledgerPath;
    manifest;
    constructor(repoRoot, projectName = 'Neon Pulse (Session)') {
        this.repoRoot = repoRoot;
        this.projectName = projectName;
        const gitMusicDir = path.join(this.repoRoot, '.gitmusic');
        if (!fs.existsSync(gitMusicDir)) {
            fs.mkdirSync(gitMusicDir, { recursive: true });
        }
        this.ledgerPath = path.join(gitMusicDir, 'ledger.json');
        this.manifest = this.loadOrCreateManifest();
    }
    loadOrCreateManifest() {
        if (fs.existsSync(this.ledgerPath)) {
            try {
                const raw = fs.readFileSync(this.ledgerPath, 'utf8');
                return JSON.parse(raw);
            }
            catch (e) {
                console.error('Failed to parse ledger.json, initializing fresh manifest:', e);
            }
        }
        const initialManifest = {
            projectName: this.projectName,
            currentBranch: 'main',
            branches: {},
            commits: {},
        };
        this.saveManifest(initialManifest);
        return initialManifest;
    }
    saveManifest(manifest = this.manifest) {
        fs.writeFileSync(this.ledgerPath, JSON.stringify(manifest, null, 2), 'utf8');
    }
    getCurrentBranch() {
        return this.manifest.currentBranch;
    }
    getHeadCommitHash() {
        return this.manifest.branches[this.manifest.currentBranch] || null;
    }
    getHeadCommit() {
        const headHash = this.getHeadCommitHash();
        return headHash ? this.manifest.commits[headHash] || null : null;
    }
    getBranches() {
        return Object.keys(this.manifest.branches).map((branchName) => {
            const headHash = this.manifest.branches[branchName];
            const commit = this.manifest.commits[headHash];
            return {
                name: branchName,
                headCommitHash: headHash,
                isCurrent: branchName === this.manifest.currentBranch,
                author: commit ? commit.author : 'Producer',
                lastUpdated: commit ? commit.timestamp : new Date().toISOString(),
            };
        });
    }
    getHistory() {
        const commits = Object.values(this.manifest.commits);
        return commits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    createCommit(params) {
        const parentHash = this.getHeadCommitHash();
        const timestamp = new Date().toISOString();
        // Deterministic commit hash from content
        const rawContent = `${parentHash}_${params.message}_${params.author}_${timestamp}_${params.dawProject.fileHash}`;
        const hash = require('crypto').createHash('sha256').update(rawContent).digest('hex').substring(0, 12);
        const totalSizeBytes = params.stems.reduce((acc, s) => acc + s.sizeBytes, 0);
        const commit = {
            hash,
            parentHash,
            branch: this.manifest.currentBranch,
            message: params.message,
            author: params.author,
            timestamp,
            dawProject: params.dawProject,
            stems: params.stems,
            comments: params.comments || [],
            totalSizeBytes,
            dedupSavedBytes: params.savedBytes || 0,
        };
        this.manifest.commits[hash] = commit;
        this.manifest.branches[this.manifest.currentBranch] = hash;
        this.saveManifest();
        return commit;
    }
    createBranch(branchName) {
        const headHash = this.getHeadCommitHash();
        if (!headHash) {
            this.manifest.branches[branchName] = '';
        }
        else {
            this.manifest.branches[branchName] = headHash;
        }
        this.saveManifest();
        return true;
    }
    checkoutBranch(branchName) {
        if (!(branchName in this.manifest.branches)) {
            this.createBranch(branchName);
        }
        this.manifest.currentBranch = branchName;
        this.saveManifest();
        return true;
    }
    addCommentToHead(comment) {
        const head = this.getHeadCommit();
        if (!head)
            return null;
        const newComment = {
            ...comment,
            id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString(),
            resolved: false,
        };
        head.comments.push(newComment);
        this.saveManifest();
        return newComment;
    }
    resolveComment(commentId) {
        const head = this.getHeadCommit();
        if (!head)
            return false;
        const comment = head.comments.find((c) => c.id === commentId);
        if (comment) {
            comment.resolved = !comment.resolved;
            this.saveManifest();
            return true;
        }
        return false;
    }
}
exports.ProjectLedger = ProjectLedger;
