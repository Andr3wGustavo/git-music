"use strict";
/**
 * @file watcher.ts
 * @description File watcher for DAW project directories with debouncing and change detection.
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
exports.ProjectFileWatcher = void 0;
const path = __importStar(require("path"));
const chokidar = __importStar(require("chokidar"));
class ProjectFileWatcher {
    projectDir;
    onFileChange;
    watcher = null;
    debounceTimers = new Map();
    constructor(projectDir, onFileChange) {
        this.projectDir = projectDir;
        this.onFileChange = onFileChange;
    }
    start() {
        if (this.watcher)
            return;
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
    debounceEvent(eventType, filePath) {
        const existing = this.debounceTimers.get(filePath);
        if (existing)
            clearTimeout(existing);
        const timer = setTimeout(() => {
            this.debounceTimers.delete(filePath);
            this.onFileChange(eventType, filePath);
        }, 300);
        this.debounceTimers.set(filePath, timer);
    }
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}
exports.ProjectFileWatcher = ProjectFileWatcher;
