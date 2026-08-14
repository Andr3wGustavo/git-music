# Git-Music: Cloud Backend and Distributed Storage Architecture

This document specifies the technical design, data schemas, synchronization protocols, and infrastructure for the Git-Music Cloud Backend.

---

## 1. Architectural Overview

The Git-Music Cloud Backend is designed to handle high-throughput binary audio streaming, cryptographic chunk deduplication, real-time collaboration presence, and granular stem permissions across globally distributed music production teams.

```
                                  [Git-Music Local Daemon]
                                            |
                         +------------------+------------------+
                         | (HTTPS / REST)                      | (WSS / WebSockets)
                         v                                     v
             [API Gateway / Load Balancer]           [Real-Time Presence Cluster]
                         |                                     |
             +-----------+-----------+                         v
             |                       |                  [Redis Pub/Sub]
             v                       v                         |
    [Auth & Metadata API]  [Chunk Ingestion Service] <---------+
             |                       |
             v                       v
    [PostgreSQL Database]   [Object Storage (Cloudflare R2 / AWS S3)]
    (Ledger, PRs, Users)    (Content-Addressable Audio Chunks)
```

---

## 2. Infrastructure and Services

### 2.1 Chunk Storage Engine (Content-Addressable over S3/R2)
* **Zero Egress Architecture:** Utilizing **Cloudflare R2** eliminates egress bandwidth fees when producers frequently download and sync large audio stems (WAV/FLAC).
* **Chunk Key Format:** Chunks are addressed strictly by their SHA-256 hash using 2-level directory sharding:
  ```
  s3://git-music-chunks/{prefix_2_chars}/{remainder_62_chars}
  Example: s3://git-music-chunks/3f/8a9b2c4d5e6f70...
  ```
* **Immutability:** Chunks are written once and never updated. If a chunk already exists in the bucket, uploads are short-circuited via an initial `HEAD` request.

### 2.2 Relational Database Schema (PostgreSQL + Prisma)

```sql
-- Users and Studio Collaborators
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces and Collaborative Studios
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Music Projects (Songs, Albums, Sessions)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bpm DECIMAL(5, 2) DEFAULT 120.0,
    key_signature VARCHAR(10),
    time_signature VARCHAR(10) DEFAULT '4/4',
    default_branch VARCHAR(100) DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    head_commit_hash VARCHAR(64),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Commit DAG Ledger
CREATE TABLE commits (
    hash VARCHAR(64) PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_hash VARCHAR(64),
    branch_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    daw_type VARCHAR(20) NOT NULL, -- 'flp', 'als', 'rpp', 'logicx'
    daw_version VARCHAR(50),
    total_size_bytes BIGINT NOT NULL,
    dedup_saved_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stems and Audio Track Manifest
CREATE TABLE stems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_hash VARCHAR(64) REFERENCES commits(hash) ON DELETE CASCADE,
    track_name VARCHAR(255) NOT NULL,
    relative_path TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- CAS chunk pointer
    size_bytes BIGINT NOT NULL,
    duration_seconds DECIMAL(8, 2),
    sample_rate INT DEFAULT 44100,
    channels SMALLINT DEFAULT 2,
    missing_plugin VARCHAR(255),
    is_frozen BOOLEAN DEFAULT FALSE
);

-- Timestamped Audio Comments
CREATE TABLE audio_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    commit_hash VARCHAR(64) REFERENCES commits(hash) ON DELETE CASCADE,
    stem_id UUID REFERENCES stems(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bar_position DECIMAL(8, 3) NOT NULL,
    timestamp_seconds DECIMAL(8, 3) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stem Pull Requests and Remix Merges
CREATE TABLE pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_branch VARCHAR(100) NOT NULL,
    target_branch VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'merged', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. Real-Time Transport and Presence Protocol

Producers working simultaneously on the same project share live telemetry over WebSockets:

1. **Transport State Broadcast (`DAW_TRANSPORT_SYNC`):**
   * Transmits playhead position, BPM shifts, and playback status.
   * Enables remote collaborators to lock transport and audition changes in real time.
2. **Producer Studio Presence (`STUDIO_PRESENCE`):**
   * Displays which producer is active in which DAW channel or branch.
   * Prevents accidental overwrite collisions on active tracks.

---

## 4. Security and End-to-End Encryption

* **Presigned Upload URLs:** Audio chunks are uploaded directly from the local daemon to object storage via short-lived (15-minute) presigned S3 URLs, bypassing API server bottlenecks.
* **Optional Zero-Knowledge Encryption:** Stems can be encrypted client-side using AES-256-GCM before chunking, ensuring unreleased music files cannot be decrypted on the cloud servers.
