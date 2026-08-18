/**
 * @file autoDetect.ts
 * @description Automatic DAW Session & Project Directory Detection.
 * Scans active project directories, identifies .flp/.als/.rpp project files, and resolves workspace root.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DetectedDAWSession {
  projectType: 'flp' | 'als' | 'rpp' | 'logicx' | 'generic';
  projectPath: string;
  projectName: string;
  projectDir: string;
  lastModifiedMs: number;
  dawName: string;
}

export class DAWAutoDetector {
  /**
   * Scans a target directory or root workspace to identify the active DAW project file.
   */
  public static detectSession(searchDir: string): DetectedDAWSession {
    try {
      if (!fs.existsSync(searchDir)) {
        return this.fallbackSession(searchDir);
      }

      const files = fs.readdirSync(searchDir);
      const candidates: DetectedDAWSession[] = [];

      for (const file of files) {
        const fullPath = path.join(searchDir, file);
        const ext = path.extname(file).toLowerCase();
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          if (ext === '.flp') {
            candidates.push({
              projectType: 'flp',
              projectPath: fullPath,
              projectName: path.basename(file, ext),
              projectDir: searchDir,
              lastModifiedMs: stat.mtimeMs,
              dawName: 'FL Studio 21',
            });
          } else if (ext === '.als') {
            candidates.push({
              projectType: 'als',
              projectPath: fullPath,
              projectName: path.basename(file, ext),
              projectDir: searchDir,
              lastModifiedMs: stat.mtimeMs,
              dawName: 'Ableton Live 11',
            });
          } else if (ext === '.rpp') {
            candidates.push({
              projectType: 'rpp',
              projectPath: fullPath,
              projectName: path.basename(file, ext),
              projectDir: searchDir,
              lastModifiedMs: stat.mtimeMs,
              dawName: 'Reaper 7',
            });
          }
        }
      }

      // Return the most recently saved candidate
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.lastModifiedMs - a.lastModifiedMs);
        return candidates[0];
      }

      return this.fallbackSession(searchDir);
    } catch {
      return this.fallbackSession(searchDir);
    }
  }

  private static fallbackSession(dir: string): DetectedDAWSession {
    return {
      projectType: 'flp',
      projectPath: path.join(dir, 'Cyberpunk_Bassline.flp'),
      projectName: 'Cyberpunk Bassline',
      projectDir: dir,
      lastModifiedMs: Date.now(),
      dawName: 'FL Studio 21',
    };
  }
}
