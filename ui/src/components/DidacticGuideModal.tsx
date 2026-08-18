/**
 * @file DidacticGuideModal.tsx
 * @description Master-level Interactive Didactic Guide for Music Producers.
 * Explains audio versioning, FastCDC deduplication, equal-power A/B crossfading, and real-time collaboration.
 */

import React, { useState } from 'react';
import { BookOpen, CheckCircle, Cpu, Radio, Music, Award, X, Sparkles, Sliders } from 'lucide-react';

interface DidacticGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DidacticGuideModal: React.FC<DidacticGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTopic, setActiveTopic] = useState<'basics' | 'ab_crossfade' | 'fastcdc' | 'collisions' | 'splits'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#080808] border-2 border-[#222] shadow-2xl p-5 space-y-4 font-mono text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-[#FF5500]/20 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                Guia Mestre de Engenharia & Produção Git-Music
                <span className="text-[9px] px-1.5 py-0.2 bg-[#FF5500] text-black font-bold">DIDÁTICA PRO</span>
              </h2>
              <p className="text-[11px] text-[#777]">
                Aprenda a lógica de código e os conceitos de estúdio por trás do plugin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777] hover:text-white hover:bg-[#181818] transition-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Topic Selector Tabs */}
        <div className="grid grid-cols-5 gap-1 bg-black p-1 border border-[#1a1a1a]">
          <button
            onClick={() => setActiveTopic('basics')}
            className={`py-1.5 text-[10px] uppercase font-bold transition-none ${
              activeTopic === 'basics' ? 'bg-[#FF5500] text-black' : 'text-[#777] hover:text-white'
            }`}
          >
            1. SNAPSHOTS
          </button>
          <button
            onClick={() => setActiveTopic('ab_crossfade')}
            className={`py-1.5 text-[10px] uppercase font-bold transition-none ${
              activeTopic === 'ab_crossfade' ? 'bg-[#0070F3] text-white' : 'text-[#777] hover:text-white'
            }`}
          >
            2. CROSSFADER A/B
          </button>
          <button
            onClick={() => setActiveTopic('fastcdc')}
            className={`py-1.5 text-[10px] uppercase font-bold transition-none ${
              activeTopic === 'fastcdc' ? 'bg-[#10B981] text-black' : 'text-[#777] hover:text-white'
            }`}
          >
            3. DEDUPLICAÇÃO CAS
          </button>
          <button
            onClick={() => setActiveTopic('collisions')}
            className={`py-1.5 text-[10px] uppercase font-bold transition-none ${
              activeTopic === 'collisions' ? 'bg-[#ffb703] text-black' : 'text-[#777] hover:text-white'
            }`}
          >
            4. COLISÕES DE GRAVE
          </button>
          <button
            onClick={() => setActiveTopic('splits')}
            className={`py-1.5 text-[10px] uppercase font-bold transition-none ${
              activeTopic === 'splits' ? 'bg-[#d946ef] text-white' : 'text-[#777] hover:text-white'
            }`}
          >
            5. SPLIT SHEETS
          </button>
        </div>

        {/* Topic Content Body */}
        <div className="bg-black border border-[#1a1a1a] p-4 min-h-[220px] max-h-[260px] overflow-y-auto space-y-3 text-xs leading-relaxed">
          {activeTopic === 'basics' && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#FF5500]">📸 Como funcionam os Snapshots no Git-Music?</h3>
              <p className="text-[#ccc]">
                Diferente do <em>"Save As"</em> tradicional da DAW que cria dezenas de arquivos duplicados (<code>track_final_v2_edit.flp</code>), o Git-Music grava uma árvore DAG criptográfica leve em <code>.gitmusic/ledger.json</code>.
              </p>
              <div className="p-2 bg-[#0c0c0c] border border-[#222] text-[11px] text-[#aaa]">
                <strong className="text-white block mb-1">Dica de Engenharia:</strong>
                O botão <strong>SNAP</strong> lê apenas o estado alterado das pistas em segundo plano sem pausar o motor de áudio (thread real-time da DAW com zero dropouts).
              </div>
            </div>
          )}

          {activeTopic === 'ab_crossfade' && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#0070F3]">🎚️ Por que usamos Equal-Power Crossfade (cos/sin)?</h3>
              <p className="text-[#ccc]">
                Um crossfade linear simples causa uma queda de volume de <strong>-3dB no centro (50%)</strong>, enganando o ouvido do produtor e parecendo que a mixagem perdeu força.
              </p>
              <div className="p-2 bg-[#0c0c0c] border border-[#222] text-[11px] text-[#aaa] font-mono">
                <code>liveGain = cos(mix * π / 2);</code><br />
                <code>snapshotGain = sin(mix * π / 2);</code>
              </div>
              <p className="text-[#888] text-[11px]">
                A curva de potência constante garante que o volume percebido seja 100% idêntico em qualquer posição do fader A/B.
              </p>
            </div>
          )}

          {activeTopic === 'fastcdc' && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#10B981]">📦 Fast Content-Defined Chunking (FastCDC)</h3>
              <p className="text-[#ccc]">
                Se você tem um projeto com 30 pistas de WAV (1.5 GB) e alterou apenas uma linha de vocal de 15 segundos:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[#aaa] text-[11px]">
                <li>As 29 pistas inalteradas têm o hash Blake3 reaproveitado instantaneamente.</li>
                <li>Apenas a nova stem de vocal é enviada e salva no disco.</li>
                <li><strong>Resultado:</strong> 70% a 90% de economia de espaço em disco e upload em milissegundos para a nuvem.</li>
              </ul>
            </div>
          )}

          {activeTopic === 'collisions' && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#ffb703]">⚠️ Detecção Automática de Colisão Espectral</h3>
              <p className="text-[#ccc]">
                Ao fazer o merge de stems de outro colaborador (ex: o beatmaker gravou um novo 808 sub e o baixista gravou um baixo elétrico):
              </p>
              <p className="text-[#aaa] text-[11px]">
                O motor do Git-Music calcula a energia nas bandas de <strong>40 Hz a 100 Hz</strong> e avisa caso haja cancelamento de fase ou embolamento antes de você aprovar o Pull Request.
              </p>
            </div>
          )}

          {activeTopic === 'splits' && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#d946ef]">📜 Split Sheets Legais com Assinatura Criptográfica</h3>
              <p className="text-[#ccc]">
                Cada commit e gravação de stem gera uma prova matemática imutável vinculada ao hash da árvore Merkle.
              </p>
              <p className="text-[#aaa] text-[11px]">
                Ao finalizar a música, você clica em <strong>SPLITS</strong> para gerar um PDF com as porcentagens reais de cada colaborador prontas para registro autoral (UBC / ECAD / BMI / ASCAP).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#181818] pt-2 text-[10px] text-[#666]">
          <span>Engenharia de Software para Produção Musical</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#FF5500] text-black font-bold uppercase hover:bg-[#ff6600]"
          >
            ENTENDI, VAMOS PRODUZIR!
          </button>
        </div>
      </div>
    </div>
  );
};
