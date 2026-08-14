/**
 * @file ledger.ts
 * @description Git-Music Ledger: Commit history, branching, and diff calculations.
 */
import { CommitNode, BranchInfo, StemInfo, AudioComment } from '../ipc/protocol';
export interface LedgerManifest {
    projectName: string;
    currentBranch: string;
    branches: Record<string, string>;
    commits: Record<string, CommitNode>;
}
export declare class ProjectLedger {
    private repoRoot;
    private projectName;
    private ledgerPath;
    private manifest;
    constructor(repoRoot: string, projectName?: string);
    private loadOrCreateManifest;
    private saveManifest;
    getCurrentBranch(): string;
    getHeadCommitHash(): string | null;
    getHeadCommit(): CommitNode | null;
    getBranches(): BranchInfo[];
    getHistory(): CommitNode[];
    createCommit(params: {
        message: string;
        author: string;
        dawProject: CommitNode['dawProject'];
        stems: StemInfo[];
        comments?: AudioComment[];
        savedBytes?: number;
    }): CommitNode;
    createBranch(branchName: string): boolean;
    checkoutBranch(branchName: string): boolean;
    addCommentToHead(comment: Omit<AudioComment, 'id' | 'createdAt' | 'resolved'>): AudioComment | null;
    resolveComment(commentId: string): boolean;
}
