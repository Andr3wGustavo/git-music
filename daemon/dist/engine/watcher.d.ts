/**
 * @file watcher.ts
 * @description File watcher for DAW project directories with debouncing and change detection.
 */
export type FileChangeHandler = (eventType: 'add' | 'change' | 'unlink', filePath: string) => void;
export declare class ProjectFileWatcher {
    private projectDir;
    private onFileChange;
    private watcher;
    private debounceTimers;
    constructor(projectDir: string, onFileChange: FileChangeHandler);
    start(): void;
    private debounceEvent;
    stop(): void;
}
