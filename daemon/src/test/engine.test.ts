/**
 * @file engine.test.ts
 * @description Comprehensive automated test suite for Git-Music Core Engine.
 * Tests CAS Deduplication, Ledger DAG, FLP/ALS/RPP Parsers, Stem Merge Engine, and Cloud Sync.
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as zlib from 'zlib';
import { ContentAddressableStorage } from '../engine/cas';
import { ProjectLedger } from '../engine/ledger';
import { FLPParser } from '../parsers/flpParser';
import { ALSParser } from '../parsers/alsParser';
import { RPPParser } from '../parsers/rppParser';
import { StemMergeEngine } from '../cloud/mergeEngine';
import { CloudCASSyncGateway } from '../cloud/cloudSync';
import { StemInfo, CommitNode } from '../ipc/protocol';

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING GIT-MUSIC ENGINE TEST SUITE             ');
  console.log('====================================================\n');

  const testRoot = path.join(os.tmpdir(), `git_music_test_${Date.now()}`);
  fs.mkdirSync(testRoot, { recursive: true });

  let passedCount = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedCount++;
      } catch (err: any) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err?.message || err}`);
        throw err;
      }
    })();
  }

  // 1. CAS Engine Tests
  await test('CAS: SHA-256 computation and deduplication metrics', async () => {
    const cas = new ContentAddressableStorage(testRoot);
    const hash1 = cas.computeHash('AudioBuffer_Kick_Stem_Data_1');
    const hash2 = cas.computeHash('AudioBuffer_Kick_Stem_Data_1');
    const hash3 = cas.computeHash('AudioBuffer_Vocal_Stem_Data_2');

    assert.strictEqual(hash1, hash2, 'Identical buffers must produce identical hashes');
    assert.notStrictEqual(hash1, hash3, 'Different buffers must produce distinct hashes');

    const metrics = cas.getStorageMetrics([
      { hash: hash1, sizeBytes: 10_000_000 },
      { hash: hash2, sizeBytes: 10_000_000 }, // Duplicate of 1
      { hash: hash3, sizeBytes: 15_000_000 },
    ]);

    assert.strictEqual(metrics.totalReferencedBytes, 35_000_000);
    assert.strictEqual(metrics.uniqueStoredBytes, 25_000_000);
    assert.strictEqual(metrics.savedBytes, 10_000_000);
    assert.strictEqual(metrics.savingsPercentage, 29);
  });

  // 2. Project Ledger DAG Tests
  await test('Ledger: Commit DAG encodings, parent links and branch checkouts', () => {
    const ledger = new ProjectLedger(testRoot, 'Test Beat');

    const sampleStems: StemInfo[] = [
      { id: '1', name: 'Kick.wav', relativePath: 'Audio/Kick.wav', sizeBytes: 5000000, hash: 'h_kick', durationSeconds: 120, sampleRate: 44100, channels: 2 },
    ];

    const c1 = ledger.createCommit({
      message: 'feat(init): First drum beat',
      author: 'Alex',
      dawProject: { fileName: 'Beat.flp', fileHash: 'flp_1', dawType: 'flp', bpm: 128 },
      stems: sampleStems,
    });

    assert.strictEqual(c1.parentHash, null);
    assert.strictEqual(ledger.getCurrentBranch(), 'main');
    assert.strictEqual(ledger.getHeadCommitHash(), c1.hash);

    ledger.createBranch('feat/synth-drop');
    ledger.checkoutBranch('feat/synth-drop');
    assert.strictEqual(ledger.getCurrentBranch(), 'feat/synth-drop');

    const c2 = ledger.createCommit({
      message: 'feat(synth): Add Serum lead arp',
      author: 'Sarah',
      dawProject: { fileName: 'Beat_v2.flp', fileHash: 'flp_2', dawType: 'flp', bpm: 128 },
      stems: [
        ...sampleStems,
        { id: '2', name: 'Synth.wav', relativePath: 'Audio/Synth.wav', sizeBytes: 8000000, hash: 'h_synth', durationSeconds: 120, sampleRate: 44100, channels: 2 },
      ],
    });

    assert.strictEqual(c2.parentHash, c1.hash);
    assert.strictEqual(ledger.getHistory().length, 2);
  });

  // 3. FL Studio Parser Tests
  await test('FLP Parser: Decodes binary FLhd and FLdt chunks correctly', () => {
    // Construct a synthetic FLP binary buffer
    const flhd = Buffer.alloc(14);
    flhd.write('FLhd', 0, 'ascii');
    flhd.writeUInt32LE(6, 4); // Header length
    flhd.writeUInt16LE(0, 8); // Format
    flhd.writeUInt16LE(4, 10); // Num channels
    flhd.writeUInt16LE(96, 12); // PPQ

    const fldtHeader = Buffer.alloc(8);
    fldtHeader.write('FLdt', 0, 'ascii');

    // Build event stream: Tempo word event (66 -> 140 BPM)
    const event1 = Buffer.from([66, 140, 0]); // ID 66, uint16 140
    fldtHeader.writeUInt32LE(event1.length, 4);

    const syntheticFLP = Buffer.concat([flhd, fldtHeader, event1]);
    const inspection = FLPParser.parseBuffer(syntheticFLP);

    assert.strictEqual(inspection.dawType, 'flp');
    assert.strictEqual(inspection.bpm, 140);
  });

  // 4. Ableton Live Parser Tests
  await test('ALS Parser: Gunzips and extracts tracks, tempo and plugin devices', () => {
    const rawXml = `
      <Ableton MajorVersion="5" Creator="Ableton Live 11.3.10">
        <LiveSet>
          <Transport>
            <Tempo><Manual Value="135.5" /></Tempo>
            <TimeSignature><Numerator Value="4" /><Denominator Value="4" /></TimeSignature>
          </Transport>
          <Tracks>
            <MidiTrack>
              <EffectiveName Value="Reese Bass" />
              <DeviceChain>
                <PluginDevice><PluginDesc><VstPluginInfo><PlugName Value="Serum" /></VstPluginInfo></PluginDesc></PluginDevice>
              </DeviceChain>
            </MidiTrack>
          </Tracks>
        </LiveSet>
      </Ableton>
    `;

    const compressed = zlib.gzipSync(Buffer.from(rawXml, 'utf8'));
    const inspection = ALSParser.parseBuffer(compressed);

    assert.strictEqual(inspection.dawType, 'als');
    assert.strictEqual(inspection.bpm, 135.5);
    assert.strictEqual(inspection.version, 'Ableton Live 11.3.10');
    assert.strictEqual(inspection.plugins.length, 1);
    assert.strictEqual(inspection.plugins[0].name, 'Serum');
  });

  // 5. Reaper Parser Tests
  await test('RPP Parser: Extracts Reaper project AST and tempo maps', () => {
    const rppText = `
      <REAPER_PROJECT 0.1 "7.15/win64" 1723637123
        TEMPO 174 4 4
        <TRACK {GUID}
          NAME "Drum & Bass Break"
          <FXCHAIN
            <VST "VST3: FabFilter Pro-Q 3" "Pro-Q 3.vst3" 0 "" >
          >
          <ITEM
            FILE "Audio/Amen_Break.wav"
          >
        >
      >
    `;

    const inspection = RPPParser.parseString(rppText);
    assert.strictEqual(inspection.dawType, 'rpp');
    assert.strictEqual(inspection.bpm, 174);
    assert.strictEqual(inspection.plugins.length, 1);
    assert.strictEqual(inspection.plugins[0].name, 'FabFilter Pro-Q 3');
  });

  // 6. Stem Merge Engine & Spectral Masking Tests
  await test('Merge Engine: Analyzes 3-way stem diffs and identifies spectral collisions', () => {
    const baseCommit: CommitNode = {
      hash: 'c_base',
      parentHash: null,
      branch: 'main',
      message: 'Base mix',
      author: 'Alex',
      timestamp: new Date().toISOString(),
      dawProject: { fileName: 'Track.flp', fileHash: 'h0', dawType: 'flp', bpm: 128 },
      stems: [
        { id: '1', name: '01_Kick_808.wav', relativePath: 'Audio/01_Kick_808.wav', sizeBytes: 1000, hash: 'h_k', durationSeconds: 120, sampleRate: 44100, channels: 2 },
      ],
      comments: [],
      totalSizeBytes: 1000,
      dedupSavedBytes: 0,
    };

    const branchCommit: CommitNode = {
      ...baseCommit,
      hash: 'c_branch',
      branch: 'feat/sub-bass',
      stems: [
        ...baseCommit.stems,
        { id: '2', name: '02_Sub_Bass.wav', relativePath: 'Audio/02_Sub_Bass.wav', sizeBytes: 2000, hash: 'h_b', durationSeconds: 120, sampleRate: 44100, channels: 2 },
      ],
    };

    const mergePlan = StemMergeEngine.analyzeMerge(branchCommit, baseCommit);
    assert.strictEqual(mergePlan.canAutoMerge, true);
    assert.strictEqual(mergePlan.mergedStems.length, 2);

    const bassAnalysis = mergePlan.stemAnalyses.find((s) => s.name === '02_Sub_Bass.wav');
    assert.ok(bassAnalysis);
    assert.strictEqual(bassAnalysis?.action, 'added');
    assert.ok(bassAnalysis?.spectralCollision, 'Expected spectral collision detection with kick drum');
  });

  // 7. Cloud CAS Sync Gateway Tests
  await test('Cloud Sync: Delta calculation and zero-egress chunk tracking', async () => {
    const gateway = new CloudCASSyncGateway();
    const cas = new ContentAddressableStorage(testRoot);

    // Create 3 real test stem files
    const file1 = path.join(testRoot, 'stem1.wav');
    const file2 = path.join(testRoot, 'stem2.wav');
    const file3 = path.join(testRoot, 'stem3.wav');
    fs.writeFileSync(file1, 'WAV_AUDIO_PCM_DATA_1');
    fs.writeFileSync(file2, 'WAV_AUDIO_PCM_DATA_2');
    fs.writeFileSync(file3, 'WAV_AUDIO_PCM_DATA_3');

    const blob1 = await cas.storeFile(file1);
    const blob2 = await cas.storeFile(file2);
    const blob3 = await cas.storeFile(file3);

    const localHashes = [blob1.hash, blob2.hash, blob3.hash];
    const stemSizes = new Map<string, number>([
      [blob1.hash, blob1.sizeBytes],
      [blob2.hash, blob2.sizeBytes],
      [blob3.hash, blob3.sizeBytes],
    ]);

    const delta1 = gateway.calculateSyncDelta(localHashes, stemSizes);
    assert.strictEqual(delta1.toUpload.length, 3);
    assert.strictEqual(delta1.status, 'upload_required');

    const pushResult = await gateway.pushChunks(cas, localHashes);
    assert.strictEqual(pushResult.uploadedCount, 3);

    const delta2 = gateway.calculateSyncDelta(localHashes, stemSizes);
    assert.strictEqual(delta2.toUpload.length, 0);
    assert.strictEqual(delta2.status, 'synced');
  });

  // Cleanup sandbox safely (handling Windows filesystem locks)
  try {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  } catch {
    // Ignore transient Windows file handle release delays
  }

  console.log('\n====================================================');
  console.log(`✨ ALL ${passedCount} TESTS PASSED WITH 100% SUCCESS!`);
  console.log('====================================================\n');
}

runAllTests().catch((e) => {
  console.error('Test runner encountered an error:', e);
  process.exit(1);
});
