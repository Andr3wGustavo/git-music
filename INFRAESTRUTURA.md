# 🌐 Arquitetura de Infraestrutura Cloud & DevOps — Git-Music

> **Guia Técnico de Engenharia de Infraestrutura, Topologia Global, Cloud, VPS e Custos**
> *Desenhado para Colaboração Musical em Tempo Real de Ultra-Baixa Latência (<20ms)*

---

## 🏛️ 1. Topologia da Arquitetura Global

O ecossistema do **Git-Music** opera em uma arquitetura híbrida **Edge + Local-First**:

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 🎧 PRODUTORES REMOTOS (In-DAW VST3 Plugins)                                            │
 │                                                                                        │
 │  ┌─────────────────────────┐                            ┌──────────────────────────┐   │
 │  │ Produtor A (FL Studio)  │                            │ Produtor B (Ableton)     │   │
 │  │ [Daemon Local :4848]    │                            │ [Daemon Local :4848]     │   │
 │  └───────────┬─────────────┘                            └───────────┬──────────────┘   │
 └──────────────┼──────────────────────────────────────────────────────┼──────────────────┘
                │ TLS 1.3 WebSockets                                   │
                ▼                                                      ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ ⚡ CLOUD RELAY & WEBRTC SIGNALING (VPS Global / Anycast Edge)                          │
 │  • Servidor de Sinalização & Broadcast: Go / uWebSockets.js (Latência <15ms)            │
 │  • STUN / TURN Server (coturn): NAT Traversal para conexões diretas P2P                │
 │  • Health Check & Room Broker: Gerenciamento de salas (#room-id) e presença online     │
 └──────────────┬──────────────────────────────────────────────────────┬──────────────────┘
                │                                                      │
                ▼                                                      ▼
 ┌──────────────────────────────────────────┐    ┌────────────────────────────────────────┐
 │ 📦 AUDIO CHUNK STORAGE (Zero-Egress)     │    │ 🗄️ METADATA & AUTH DATABASE (Postgres)  │
 │  • Cloudflare R2 / AWS S3                │    │  • Supabase / Neon Serverless Postgres │
 │  • Chunks de Áudio FastCDC (Blake3 Hash) │    │  • Ledger DAG, Usuários, Split Sheets  │
 │  • Global Edge Cache (Cloudflare CDN)    │    │  • Provas Criptográficas Ed25519       │
 └──────────────────────────────────────────┘    └────────────────────────────────────────┘
```

---

## ☁️ 2. Componentes da Infraestrutura & Soluções Recomendadas

### 🚀 2.1 Servidor de Relay em Tempo Real (WebSocket Broker & WebRTC)
- **Função:** Conectar os Daemons locais de produtores em cidades diferentes, sincronizar o Playhead da DAW em tempo real e retransmitir eventos MIDI e chat.
- **Stack Tecnológica:**
  - **Node.js com `uWebSockets.js`** ou **Go (Gorilla WebSockets)**: Suporta mais de **100.000 conexões simultâneas** com menos de 200MB de RAM e latência sub-milissegundo.
  - **coturn (STUN/TURN Server)**: Para transpor roteadores e firewalls domésticos (NAT Traversal) permitindo áudio P2P direto entre os produtores sem passar pelo servidor sempre que possível.
- **Hospedagem Recomendada (VPS):**
  - **Opção 1 (Melhor Custo-Benefício): Hetzner Cloud (Alemanha / EUA)**
    - Servidor CPX21 (3 vCPUs AMD, 4GB RAM, 80GB NVMe, 20TB Tráfego).
    - **Custo:** ~€7.00/mês (~R$ 42/mês).
  - **Opção 2 (Global Edge com Auto-Deploy): Fly.io**
    - Containers Anycast rodando perto dos usuários (São Paulo `gru`, Nova York `iad`, Frankfurt `fra`).
    - **Custo:** Gratuito até 3 instâncias pequenas; ~$15/mês em escala.

---

### 📦 2.2 Armazenamento de Áudio CAS (Object Storage com Zero-Egress)
- **Problema de Outros Clouds:** Arquivos de áudio WAV (stems) são pesados (20MB a 100MB cada). Se usar a AWS S3 tradicional, você paga **$0.09 por GB de download** (taxa de egress abusiva).
- **A Solução Git-Music: Cloudflare R2 Storage**
  - **$0.00 de taxa de saída (Zero Egress Fees)**: Downloads ilimitados de stems sem pagar taxa de transferência.
  - **Custo de Armazenamento:** $0.015 por GB/mês (100 GB = $1.50/mês).
  - **CDN Integrada:** Stems populares ficam cacheadas em mais de 300 data centers no mundo (incluindo Brasil: São Paulo, Rio, Fortaleza, Curitiba).

---

### 🗄️ 2.3 Banco de Dados de Metadados & Autenticação
- **Função:** Armazenar contas de produtores, projetos, permissões de branch, histórico de commits (árvore DAG) e assinaturas digitais de Split Sheets.
- **Solução Recomendada:**
  - **Supabase** ou **Neon Serverless PostgreSQL**
  - Schema gerenciado via **Prisma ORM** ou **Drizzle ORM**.
  - **Custo:** Tier Gratuito (até 500MB de banco de dados relacional e 50.000 usuários ativos/mês).

---

## 💰 3. Estimativa de Custos Mensais por Fase

| Fase do Projeto | Usuários Ativos | Infraestrutura Utilizada | Custo Mensal Estimado |
| :--- | :--- | :--- | :--- |
| **Fase 1: MVP / Beta Fechado** | 1 a 200 produtores | Fly.io (Free Tier) + Cloudflare R2 + Supabase Free | **$0.00 a $5.00 / mês** |
| **Fase 2: Lançamento Comercial** | 1.000 a 5.000 produtores | Hetzner CPX21 + Cloudflare R2 (500GB) + Supabase Pro | **~$35.00 / mês** (~R$ 190) |
| **Fase 3: Escala Global** | 50.000+ produtores | Cluster Multi-Região Fly.io + Cloudflare R2 (10TB) + RDS Postgres | **~$250.00 / mês** |

> 💡 **Conclusão de Engenharia:** Graças à **Deduplicação FastCDC** (que não reenvia áudios repetidos) e ao **Cloudflare R2** (zero egress fee), o custo de operação do Git-Music é **90% menor** do que soluções legadas como Splice ou Dropbox.

---

## 🔒 4. Segurança, Criptografia & Proteção de Direitos

1. **Criptografia em Trânsito:** Todo o tráfego de áudio e IPC passa por **TLS 1.3** e WebSockets Seguros (`wss://`).
2. **Criptografia em Repouso:** Chunks de áudio no Cloudflare R2 são criptografados com **AES-256**.
3. **Autenticação Baseada em Tokens JWT:** Chaves temporárias para acesso restrito às salas de estúdio (`#room-token`).
4. **Presigned URLs de Upload Direto:** O Daemon local gera URLs assinadas com tempo de expiração de 15 minutos para fazer upload direto do PC do produtor para o R2 sem sobrecarregar a CPU do servidor de Relay.

---

## ⚙️ 5. Pipeline de CI/CD & Deploy Automatizado (GitHub Actions)

### Workflow de Publicação:
```yaml
name: Git-Music Release CI/CD

on:
  push:
    tags:
      - 'v*'

jobs:
  build-vst3-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup MSVC & CMake
        uses: ilammy/msvc-dev-cmd@v1
      - name: Compile GitMusic.vst3
        run: |
          mkdir plugin/build
          cd plugin/build
          cmake .. -DCMAKE_BUILD_TYPE=Release
          cmake --build . --config Release
      - name: Upload Windows VST3 Artifact
        uses: actions/upload-artifact@v4
        with:
          name: GitMusic-Windows-VST3
          path: plugin/build/Release/git_music_plugin.vst3

  deploy-relay-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: flyctl deploy --remote-only
```

---

## 📦 6. Resumo dos Entregáveis de Infraestrutura

- [x] **Definição de Stack de Baixo Custo & Alta Performance:** Hetzner / Fly.io + Cloudflare R2 + Supabase.
- [x] **Protocolo de Comunicação de Baixa Latência:** WebSockets com `uWebSockets.js` + coturn STUN/TURN.
- [x] **Topologia Híbrida Local-First:** Processamento pesado na máquina do produtor (Daemon) e apenas troca de mensagens leves no Relay.
- [ ] **Configuração do Bucket R2 de Produção:** Criação das chaves de API para deploy comercial.
