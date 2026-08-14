/**
 * @file watcher.ts
 * @description File watcher for DAW project directories with debouncing and change detection.
 */

import * as path from 'path';
import * as chokidar from 'chokidar';

export type FileChangeHandler = (eventType: 'add' | 'change' | 'unlink', filePath: string) => void;

export class ProjectFileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private projectDir: string, private onFileChange: FileChangeHandler) {}

  public start(): void {
    if (this.watcher) return;

    // Supported DAW and Audio File Extensions
    const watchPatterns = [
      path.join(this.projectDir, '**/*.flp'),
      path.join(this.projectDir, '**/*.als'),
      path.join(this.projectDir, '**/*.rpp'),
      path.join(this.projectDir, '**/*.wav'),
      path.join(this.projectDir, '**/*.flac'),
      path.join(this.projectDir, '**/*.mp3'),
      path.join(this.projectDir, '**/*.aif'),
    ];

    this.watcher = chokidar.watch(watchPatterns, {
      ignored: [/(^|[\/\\])\../, '**/node_modules/**', '**/.git/**', '**/.gitmusic/**'],
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 800,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => this.debounceEvent('add', filePath))
      .on('change', (filePath) => this.debounceEvent('change', filePath))
      .on('unlink', (filePath) => this.debounceEvent('unlink', filePath))
      .on('error', (error) => console.error(`[FileWatcher] Error:`, error));

    console.log(`[FileWatcher] Monitoring DAW project files in: ${this.projectDir}`);
  }

  private debounceEvent(eventType: 'add' | 'change' | 'unlink', filePath: string): void {
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.onFileChange(eventType, filePath);
    }, 300);

    this.debounceTimers.set(filePath, timer);
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
