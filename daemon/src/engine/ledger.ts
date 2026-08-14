/**
 * @file ledger.ts
 * @description Git-Music Ledger: Commit history, branching, and diff calculations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CommitNode, BranchInfo, StemInfo, AudioComment } from '../ipc/protocol';

export interface LedgerManifest {
  projectName: string;
  currentBranch: string;
  branches: Record<string, string>; // branchName -> headCommitHash
  commits: Record<string, CommitNode>; // commitHash -> CommitNode
}

export class ProjectLedger {
  private ledgerPath: string;
  private manifest: LedgerManifest;

  constructor(private repoRoot: string, private projectName: string = 'Neon Pulse (Session)') {
    const gitMusicDir = path.join(this.repoRoot, '.gitmusic');
    if (!fs.existsSync(gitMusicDir)) {
      fs.mkdirSync(gitMusicDir, { recursive: true });
    }
    this.ledgerPath = path.join(gitMusicDir, 'ledger.json');
    this.manifest = this.loadOrCreateManifest();
  }

  private loadOrCreateManifest(): LedgerManifest {
    if (fs.existsSync(this.ledgerPath)) {
      try {
        const raw = fs.readFileSync(this.ledgerPath, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse ledger.json, initializing fresh manifest:', e);
      }
    }

    const initialManifest: LedgerManifest = {
      projectName: this.projectName,
      currentBranch: 'main',
      branches: {},
      commits: {},
    };

    this.saveManifest(initialManifest);
    return initialManifest;
  }

  private saveManifest(manifest: LedgerManifest = this.manifest): void {
    fs.writeFileSync(this.ledgerPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  public getCurrentBranch(): string {
    return this.manifest.currentBranch;
  }

  public getHeadCommitHash(): string | null {
    return this.manifest.branches[this.manifest.currentBranch] || null;
  }

  public getHeadCommit(): CommitNode | null {
    const headHash = this.getHeadCommitHash();
    return headHash ? this.manifest.commits[headHash] || null : null;
  }

  public getBranches(): BranchInfo[] {
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

  public getHistory(): CommitNode[] {
    const commits = Object.values(this.manifest.commits);
    return commits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public createCommit(params: {
    message: string;
    author: string;
    dawProject: CommitNode['dawProject'];
    stems: StemInfo[];
    comments?: AudioComment[];
    savedBytes?: number;
  }): CommitNode {
    const parentHash = this.getHeadCommitHash();
    const timestamp = new Date().toISOString();
    
    // Deterministic commit hash from content
    const rawContent = `${parentHash}_${params.message}_${params.author}_${timestamp}_${params.dawProject.fileHash}`;
    const hash = require('crypto').createHash('sha256').update(rawContent).digest('hex').substring(0, 12);

    const totalSizeBytes = params.stems.reduce((acc, s) => acc + s.sizeBytes, 0);

    const commit: CommitNode = {
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

  public createBranch(branchName: string): boolean {
    const headHash = this.getHeadCommitHash();
    if (!headHash) {
      this.manifest.branches[branchName] = '';
    } else {
      this.manifest.branches[branchName] = headHash;
    }
    this.saveManifest();
    return true;
  }

  public checkoutBranch(branchName: string): boolean {
    if (!(branchName in this.manifest.branches)) {
      this.createBranch(branchName);
    }
    this.manifest.currentBranch = branchName;
    this.saveManifest();
    return true;
  }

  public addCommentToHead(comment: Omit<AudioComment, 'id' | 'createdAt' | 'resolved'>): AudioComment | null {
    const head = this.getHeadCommit();
    if (!head) return null;

    const newComment: AudioComment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    head.comments.push(newComment);
    this.saveManifest();
    return newComment;
  }

  public resolveComment(commentId: string): boolean {
    const head = this.getHeadCommit();
    if (!head) return false;

    const comment = head.comments.find((c) => c.id === commentId);
    if (comment) {
      comment.resolved = !comment.resolved;
      this.saveManifest();
      return true;
    }
    return false;
  }
}
