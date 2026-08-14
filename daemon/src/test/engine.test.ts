/**
 * @file engine.test.ts
 * @description Comprehensive automated test suite for Git-Music Extended Engine.
 * Tests CAS Deduplication, Ledger DAG, FLP/ALS/RPP Parsers, Stem Merge Engine, Cloud Sync,
 * AI Stem Separation, Auto-Freezer, Cross-DAW Music-IR, and Legal Split Sheets.
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
import { AISourceSeparationBridge } from '../ai/demucsBridge';
import { SmartAutoFreezer } from '../engine/autoFreezer';
import { MusicIRCompiler } from '../parsers/musicIR';
import { SplitSheetGenerator } from '../legal/splitSheets';
import { StemInfo, CommitNode, DAWProjectInspection } from '../ipc/protocol';

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING GIT-MUSIC EXTENDED ENGINE TEST SUITE     ');
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
      { hash: hash2, sizeBytes: 10_000_000 },
      { hash: hash3, sizeBytes: 15_000_000 },
    ]);

    assert.strictEqual(metrics.totalReferencedBytes, 35_000_000);
    assert.strictEqual(metrics.uniqueStoredBytes, 25_000_000);
    assert.strictEqual(metrics.savingsPercentage, 29);
  });

  // 2. Ledger DAG and Branching Tests
  await test('Ledger: Commit DAG encodings, parent links and branch checkouts', async () => {
    const ledger = new ProjectLedger(testRoot);
    const dummyStems: StemInfo[] = [
      {
        id: 'stem_1',
        name: 'Drums.wav',
        relativePath: 'Audio/Drums.wav',
        sizeBytes: 12000000,
        hash: 'hash_drums_v1',
        durationSeconds: 180,
        sampleRate: 44100,
        channels: 2,
      },
    ];

    const c1 = ledger.createCommit({
      message: 'Initial stem bounce',
      author: 'Alex (Producer)',
      stems: dummyStems,
      dawProject: {
        fileName: 'Project.flp',
        fileHash: 'hash1',
        dawType: 'flp',
        bpm: 128.0,
      },
    });

    assert.ok(c1.hash && c1.hash.length === 12);
    assert.strictEqual(c1.parentHash, null);

    ledger.createBranch('vocal-experiments');
    ledger.checkoutBranch('vocal-experiments');

    const c2 = ledger.createCommit({
      message: 'Add lead vocal take',
      author: 'Sarah (Vocalist)',
      stems: dummyStems,
      dawProject: {
        fileName: 'Project.flp',
        fileHash: 'hash2',
        dawType: 'flp',
        bpm: 128.0,
      },
    });

    assert.strictEqual(c2.parentHash, c1.hash);
    assert.strictEqual(ledger.getCurrentBranch(), 'vocal-experiments');
  });

  // 3. FLP Parser Tests
  await test('FLP Parser: Decodes binary FLhd and FLdt chunks correctly', async () => {
    const headerBuf = Buffer.alloc(14);
    headerBuf.write('FLhd', 0, 4, 'ascii');
    headerBuf.writeUInt32LE(6, 4);
    headerBuf.writeUInt16LE(0, 8);
    headerBuf.writeUInt16LE(16, 10);
    headerBuf.writeUInt16LE(96, 12);

    const dataBuf = Buffer.alloc(30);
    dataBuf.write('FLdt', 0, 4, 'ascii');
    dataBuf.writeUInt32LE(22, 4);
    dataBuf.writeUInt8(64, 8);
    dataBuf.writeUInt16LE(130, 9);
    dataBuf.writeUInt8(192, 11); // Text Event ID for Channel / Plugin Name
    dataBuf.writeUInt8(5, 12);   // Length = 5
    dataBuf.write('Serum', 13, 5, 'utf8');

    const fullFlp = Buffer.concat([headerBuf, dataBuf]);
    const parsed = FLPParser.parseBuffer(fullFlp);

    assert.strictEqual(parsed.bpm, 130);
    assert.strictEqual(parsed.dawType, 'flp');
    assert.ok(parsed.plugins.some((p) => p.name === 'Serum'));
  });

  // 4. ALS Parser Tests
  await test('ALS Parser: Gunzips and extracts tracks, tempo and plugin devices', async () => {
    const mockAbletonXml = `<?xml version="1.0" encoding="UTF-8"?>
    <Ableton MajorVersion="5" MinorVersion="11.0_11300" SchemaChangeCount="4" Creator="Ableton Live 11.3">
      <LiveSet>
        <MasterTrack>
          <MasterChain>
            <Mixer>
              <Tempo>
                <Manual Value="140.0" />
              </Tempo>
            </Mixer>
          </MasterChain>
        </MasterTrack>
        <Tracks>
          <MidiTrack Id="1">
            <Name><EffectiveName Value="808 Sub Bass" /></Name>
            <DeviceChain>
              <MainSequencer>
                <ClipTimeable>
                  <ArrangerAutomation>
                    <Events>
                      <MidiClip Time="0">
                        <Notes>
                          <KeyTracks>
                            <KeyTrack>
                              <MidiKey Value="36" />
                              <Notes>
                                <MidiNote Time="0" Duration="1.5" Velocity="100" />
                              </Notes>
                            </KeyTrack>
                          </KeyTracks>
                        </Notes>
                      </MidiClip>
                    </Events>
                  </ArrangerAutomation>
                </ClipTimeable>
              </MainSequencer>
              <DeviceChain>
                <Devices>
                  <PluginDesc Id="10">
                    <Vst3PluginDesc>
                      <Name Value="FabFilter Saturn 2" />
                    </Vst3PluginDesc>
                  </PluginDesc>
                </Devices>
              </DeviceChain>
            </DeviceChain>
          </MidiTrack>
        </Tracks>
      </LiveSet>
    </Ableton>`;

    const gzipped = zlib.gzipSync(Buffer.from(mockAbletonXml, 'utf8'));
    const parsed = ALSParser.parseBuffer(gzipped);

    assert.strictEqual(parsed.bpm, 140.0);
    assert.strictEqual(parsed.midiTracks.length, 1);
    assert.strictEqual(parsed.midiTracks[0].name, '808 Sub Bass');
    assert.ok(parsed.plugins.some((p) => p.name === 'FabFilter Saturn 2'));
    assert.strictEqual(parsed.midiTracks[0].notes.length, 1);
    assert.strictEqual(parsed.midiTracks[0].notes[0].pitch, 36);
  });

  // 5. RPP Parser Tests
  await test('RPP Parser: Extracts Reaper project AST and tempo maps', async () => {
    const mockRpp = `<REAPER_PROJECT 0.1 "6.80/x64" 1680000000
  TEMPO 124.0 4 4
  <TRACK {A1B2C3D4-E5F6}
    NAME "Guitar Lead"
    <FXCHAIN
      <VST "VST3: Neural DSP Archetype Nolly" "Archetype Nolly.vst3" 0 "" >
    >
  >
>`;
    const parsed = RPPParser.parseString(mockRpp);

    assert.strictEqual(parsed.bpm, 124.0);
    assert.strictEqual(parsed.plugins.length, 1);
    assert.ok(parsed.plugins.some((p) => p.name.includes('Neural DSP Archetype Nolly')));
  });

  // 6. Merge Engine Tests
  await test('Merge Engine: Analyzes 3-way stem diffs and identifies spectral collisions', async () => {
    const sourceCommit: CommitNode = {
      hash: 'src_commit',
      parentHash: null,
      branch: 'feat/sub-bass',
      message: 'Add sub-bass',
      author: 'Producer A',
      timestamp: new Date().toISOString(),
      stems: [
        { id: '1', name: 'Kick.wav', relativePath: 'Audio/Kick.wav', sizeBytes: 1000, hash: 'h_k1', durationSeconds: 180, sampleRate: 44100, channels: 2 },
        { id: '2', name: 'Sub_808.wav', relativePath: 'Audio/Sub_808.wav', sizeBytes: 2000, hash: 'h_s1', durationSeconds: 180, sampleRate: 44100, channels: 2 },
      ],
      dawProject: { fileName: 'p.flp', fileHash: 'h', dawType: 'flp', bpm: 128 },
      comments: [],
      totalSizeBytes: 3000,
      dedupSavedBytes: 0,
    };

    const targetCommit: CommitNode = {
      hash: 'tgt_commit',
      parentHash: null,
      branch: 'main',
      message: 'Base mix',
      author: 'Producer B',
      timestamp: new Date().toISOString(),
      stems: [
        { id: '1', name: 'Kick.wav', relativePath: 'Audio/Kick.wav', sizeBytes: 1000, hash: 'h_k1', durationSeconds: 180, sampleRate: 44100, channels: 2 },
      ],
      dawProject: { fileName: 'p.flp', fileHash: 'h', dawType: 'flp', bpm: 128 },
      comments: [],
      totalSizeBytes: 1000,
      dedupSavedBytes: 0,
    };

    const plan = StemMergeEngine.analyzeMerge(sourceCommit, targetCommit);
    assert.strictEqual(plan.stemAnalyses.length, 2);
    assert.ok(plan.stemAnalyses.some((a) => a.name === 'Sub_808.wav' && a.action === 'added'));
    assert.ok(plan.stemAnalyses.some((a) => a.spectralCollision !== undefined), 'Must detect spectral collision');
  });

  // 7. Cloud CAS Sync Tests
  await test('Cloud Sync: Delta calculation and zero-egress chunk tracking', async () => {
    const gateway = new CloudCASSyncGateway();
    const cas = new ContentAddressableStorage(testRoot);
    const hashA = cas.computeHash('synth_audio_chunk_1');
    const hashB = cas.computeHash('kick_audio_chunk_2');
    const localHashes = [hashA, hashB];
    const stemSizes = new Map<string, number>([
      [hashA, 5000000],
      [hashB, 2000000],
    ]);

    const delta1 = gateway.calculateSyncDelta(localHashes, stemSizes);
    assert.strictEqual(delta1.toUpload.length, 2);
    assert.strictEqual(delta1.status, 'upload_required');

    cas.storeBuffer(Buffer.from('synth_audio_chunk_1'));
    cas.storeBuffer(Buffer.from('kick_audio_chunk_2'));
    await gateway.pushChunks(cas, [hashA, hashB]);

    const delta2 = gateway.calculateSyncDelta(localHashes, stemSizes);
    assert.strictEqual(delta2.toUpload.length, 0);
    assert.strictEqual(delta2.status, 'synced');
  });

  // 8. AI Source Separation Tests
  await test('AI Stem Separator: Derives 4 isolated stems from stereo mix and computes CAS hashes', async () => {
    const cas = new ContentAddressableStorage(testRoot);
    const aiBridge = new AISourceSeparationBridge(cas);
    const result = await aiBridge.separateStereoTrack('C:/Music/Master_Bounce_128bpm.wav');

    assert.strictEqual(result.stems.length, 4);
    assert.ok(result.stems.some((s) => s.name.includes('(AI_Drums)')));
    assert.ok(result.stems.some((s) => s.name.includes('(AI_Bass)')));
    assert.ok(result.stems.some((s) => s.name.includes('(AI_Vocals)')));
    assert.ok(result.stems.some((s) => s.name.includes('(AI_Other_Synths)')));
    assert.strictEqual(result.modelUsed, 'HTDemucs-v4-Hybrid');
  });

  // 9. Smart Auto-Freezer Tests
  await test('Auto-Freezer: Detects missing VSTs and auto-renders offline frozen stem proxies', async () => {
    const cas = new ContentAddressableStorage(testRoot);
    const autoFreezer = new SmartAutoFreezer(cas);

    const projectPlugins = [
      { name: 'Serum', format: 'vst3' as const, isMissing: false },
      { name: 'FabFilter Pro-Q 3', format: 'vst3' as const, isMissing: false },
      { name: 'FLEX', format: 'vst3' as const, isMissing: false },
    ];

    const results = autoFreezer.autoFreezeMissingPlugins(projectPlugins, [], ['FLEX']);
    assert.strictEqual(results.length, 2, 'Should freeze Serum and Pro-Q 3');
    assert.ok(results.some((r) => r.pluginName === 'Serum'));
    assert.ok(results.some((r) => r.pluginName === 'FabFilter Pro-Q 3'));
    assert.strictEqual(results[0].renderedStem.isFrozen, true);
  });

  // 10. Music-IR Cross-DAW Compiler Tests
  await test('Music-IR: Compiles session AST and exports valid Reaper .rpp text project', async () => {
    const inspection: DAWProjectInspection = {
      dawType: 'flp',
      bpm: 126.0,
      timeSigNumerator: 4,
      timeSigDenominator: 4,
      title: 'Summer Anthem',
      plugins: [{ name: 'Sylenth1', format: 'vst3', isMissing: false }],
      audioSamples: ['Audio/Drums.wav'],
      midiTracks: [
        {
          id: 'midi_1',
          name: 'Main Chords',
          instrument: 'Sylenth1',
          notes: [{ id: 'n1', pitch: 60, velocity: 100, startBar: 1.0, durationBars: 4.0 }],
        },
      ],
    };

    const dummyStems: StemInfo[] = [
      { id: 's1', name: 'Drums.wav', relativePath: 'Audio/Drums.wav', sizeBytes: 5000, hash: 'h_d', durationSeconds: 120, sampleRate: 44100, channels: 2 },
    ];

    const irSession = MusicIRCompiler.fromInspection(inspection, dummyStems);
    assert.strictEqual(irSession.bpm, 126.0);
    assert.strictEqual(irSession.tracks.length, 2);

    const rppOutput = MusicIRCompiler.exportToReaperRPP(irSession);
    assert.ok(rppOutput.includes('<REAPER_PROJECT'));
    assert.ok(rppOutput.includes('TEMPO 126 4 4'));
    assert.ok(rppOutput.includes('NAME "Drums"'));
  });

  // 11. Legal Split Sheet & Cryptographic Proof Tests
  await test('Legal Split Sheet: Calculates royalty percentages and generates Ed25519 proof receipt', async () => {
    const dummyCommits: CommitNode[] = [
      {
        hash: 'a1b2c3d4e5f6',
        parentHash: null,
        branch: 'main',
        author: 'Alex (Producer)',
        message: 'Initial project setup & drums',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        stems: [{ id: '1', name: 'Drums.wav', relativePath: 'Audio/Drums.wav', sizeBytes: 1000, hash: 'h1', durationSeconds: 180, sampleRate: 44100, channels: 2 }],
        dawProject: { fileName: 'song.flp', fileHash: 'h1', bpm: 128, dawType: 'flp' },
        comments: [],
        totalSizeBytes: 1000,
        dedupSavedBytes: 0,
      },
      {
        hash: 'b2c3d4e5f6a1',
        parentHash: 'a1b2c3d4e5f6',
        branch: 'main',
        author: 'Sarah (Vocalist)',
        message: 'Record verse and chorus vocals',
        timestamp: new Date().toISOString(),
        stems: [{ id: '2', name: 'Lead_Vocal.wav', relativePath: 'Audio/Lead_Vocal.wav', sizeBytes: 2000, hash: 'h2', durationSeconds: 180, sampleRate: 44100, channels: 2 }],
        dawProject: { fileName: 'song.flp', fileHash: 'h2', bpm: 128, dawType: 'flp' },
        comments: [],
        totalSizeBytes: 2000,
        dedupSavedBytes: 0,
      },
    ];

    const splitSheet = SplitSheetGenerator.generateSplitSheet('Neon Glow', dummyCommits, 'v1.0.0-master');
    assert.strictEqual(splitSheet.songTitle, 'Neon Glow');
    assert.strictEqual(splitSheet.shares.length, 2);
    assert.strictEqual(splitSheet.cryptographicProof.algorithm, 'Ed25519-SHA256-Merkle');
    assert.ok(splitSheet.cryptographicProof.manifestHash.length === 64);
    assert.ok(splitSheet.shares.reduce((sum, s) => sum + s.percentage, 0) >= 99);
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
  console.log(`✨ ALL ${passedCount} EXTENDED ENGINE TESTS PASSED!`);
  console.log('====================================================\n');
}

runAllTests().catch((e) => {
  console.error('Test runner encountered an error:', e);
  process.exit(1);
});
