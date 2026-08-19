"use strict";
/**
 * @file index.ts
 * @description Git-Music Daemon Entrypoint.
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
const path = __importStar(require("path"));
const cas_1 = require("./engine/cas");
const ledger_1 = require("./engine/ledger");
const watcher_1 = require("./engine/watcher");
const server_1 = require("./ipc/server");
const inspector_1 = require("./parsers/inspector");
const PORT = parseInt(process.env.GIT_MUSIC_PORT || '4848', 10);
const PROJECT_ROOT = path.resolve(process.env.PROJECT_ROOT || path.join(__dirname, '..', '..'));
console.log('====================================================');
console.log('🎵  GIT-MUSIC LOCAL ENGINE DAEMON v0.1.0           ');
console.log('    In-DAW Version Control & Collaboration Server  ');
console.log('====================================================');
console.log(`[Init] Project Root Directory: ${PROJECT_ROOT}`);
const cas = new cas_1.ContentAddressableStorage(PROJECT_ROOT);
const ledger = new ledger_1.ProjectLedger(PROJECT_ROOT, 'Cyberpunk Bassline (Drop Project)');
// Initialize demo history if repo is freshly created
if (ledger.getHistory().length === 0) {
    console.log('[Init] Seeding initial rich commit history and audio tracks...');
    const sampleStemsV1 = [
        {
            id: 'stem_kick',
            name: '01_Kick_808_Punch.wav',
            relativePath: 'Audio/Stems/01_Kick_808_Punch.wav',
            sizeBytes: 14_500_000,
            hash: 'a1b2c3d4e5f601',
            durationSeconds: 180,
            sampleRate: 44100,
            channels: 2,
        },
        {
            id: 'stem_bass',
            name: '02_Serum_ReeseBass_Drop.wav',
            relativePath: 'Audio/Stems/02_Serum_ReeseBass_Drop.wav',
            sizeBytes: 28_200_000,
            hash: 'f9e8d7c6b5a402',
            durationSeconds: 180,
            sampleRate: 44100,
            channels: 2,
            missingPlugin: 'Xfer Serum v1.36b',
            isFrozen: true,
        },
        {
            id: 'stem_synth',
            name: '03_Lead_CyberArp_Sidechained.wav',
            relativePath: 'Audio/Stems/03_Lead_CyberArp_Sidechained.wav',
            sizeBytes: 22_100_000,
            hash: '778899aabbcc03',
            durationSeconds: 180,
            sampleRate: 44100,
            channels: 2,
        },
        {
            id: 'stem_vox',
            name: '04_VocalHook_Tuned_Take2.wav',
            relativePath: 'Audio/Stems/04_VocalHook_Tuned_Take2.wav',
            sizeBytes: 19_400_000,
            hash: '11223344556604',
            durationSeconds: 180,
            sampleRate: 44100,
            channels: 2,
        },
    ];
    // Initial Commit
    ledger.createCommit({
        message: 'feat(init): Initial arrangement structure and 808 sub-bass setup',
        author: 'Alex (Lead Producer)',
        dawProject: {
            fileName: 'Cyberpunk_Bassline_v1.flp',
            fileHash: 'flp_hash_001',
            dawType: 'flp',
            bpm: 128,
        },
        stems: sampleStemsV1,
        savedBytes: 0,
    });
    // Second Commit with Vocal tweaks
    const sampleStemsV2 = [
        ...sampleStemsV1.slice(0, 3), // Reuse first 3 stems (CAS Deduplication!)
        {
            id: 'stem_vox',
            name: '04_VocalHook_Autotune_Cleaned.wav',
            relativePath: 'Audio/Stems/04_VocalHook_Autotune_Cleaned.wav',
            sizeBytes: 19_800_000,
            hash: '99aa88bb77cc05', // New hash for altered vocal
            durationSeconds: 180,
            sampleRate: 44100,
            channels: 2,
        },
    ];
    ledger.createCommit({
        message: 'mix(vocals): Apply FabFilter Pro-Q3 cut & Melodyne pitch correction on hook',
        author: 'Sarah (Vocalist & Mix)',
        dawProject: {
            fileName: 'Cyberpunk_Bassline_v2.flp',
            fileHash: 'flp_hash_002',
            dawType: 'flp',
            bpm: 128,
        },
        stems: sampleStemsV2,
        savedBytes: 64_800_000, // Saved 64.8 MB via CAS deduplication of tracks 1-3!
        comments: [
            {
                id: 'c1',
                author: 'Sarah (Vocalist & Mix)',
                timestampSeconds: 45.5,
                barPosition: 16.2,
                message: 'Ajustei o de-esser no refrão para tirar a sibilância do microfone Neumann!',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                resolved: false,
            },
            {
                id: 'c2',
                author: 'Alex (Lead Producer)',
                timestampSeconds: 64.0,
                barPosition: 32.0,
                message: 'O drop no compasso 32 está monstruoso 🔥. Vamos testar uma versão com solo de guitarra?',
                createdAt: new Date(Date.now() - 1800000).toISOString(),
                resolved: false,
            },
        ],
    });
    // Create branches for feature testing
    ledger.createBranch('feat/guitar-solo-take3');
    ledger.createBranch('mix-master-loudness');
}
const http = __importStar(require("http"));
const mobileServer_1 = require("./mobile/mobileServer");
const server = new server_1.DaemonIPCServer(PORT, ledger, cas, PROJECT_ROOT);
server.start();
// Start Lightweight HTTP Server for Mobile Car-Test Companion
const httpServer = http.createServer((req, res) => {
    if (req.url === '/mobile' || req.url === '/car-test') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        const state = server.assembleProjectState();
        res.end(mobileServer_1.MobileCompanionServer.getMobileAppHTML(state.projectName, state.transport.bpm, state.history.length));
    }
    else if (req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(server.assembleProjectState()));
    }
    else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Git-Music Local Daemon is Running. Open http://localhost:4848/mobile for Car-Test App.');
    }
});
const HTTP_PORT = PORT + 1; // 4849
httpServer.listen(HTTP_PORT, () => {
    console.log(`📱 [Mobile Companion] Car-Test Web App active on: http://127.0.0.1:${HTTP_PORT}/mobile`);
});
const watcher = new watcher_1.ProjectFileWatcher(PROJECT_ROOT, async (eventType, filePath) => {
    console.log(`[Watcher] ${eventType.toUpperCase()} detected: ${filePath}`);
    // Inspect project file if it is an FLP, ALS, or RPP file
    if (['.flp', '.als', '.rpp'].some((ext) => filePath.toLowerCase().endsWith(ext))) {
        try {
            const inspection = await inspector_1.ProjectInspector.inspectFile(filePath);
            console.log(`[Inspector] Parsed ${inspection.dawType.toUpperCase()} | BPM: ${inspection.bpm} | Plugins: ${inspection.plugins.length} | MIDI Tracks: ${inspection.midiTracks.length}`);
        }
        catch (err) {
            console.warn(`[Inspector] Could not inspect file ${filePath}:`, err);
        }
    }
    // Notify connected UI and plugins of file modification
    server.broadcastProjectState();
});
watcher.start();
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Shutdown] Stopping Git-Music daemon services...');
    watcher.stop();
    server.stop();
    httpServer.close();
    process.exit(0);
});
