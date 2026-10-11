# ⚡ RunSync 2.0 — Cloud Extracter

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Drive API](https://img.shields.io/badge/Google_Drive-v3-4285F4?style=for-the-badge&logo=googledrive)](https://developers.google.com/drive)

> **High-speed, zero-disk cloud ingestion and dataset extraction platform.** Stream large AI models, Academic Torrents, and multi-gigabyte archives directly to cloud storage without consuming local disk space or bandwidth.

---

## 🌟 Overview

**RunSync 2.0 (Cloud Extracter)** addresses the bottleneck of downloading massive datasets (e.g., Hugging Face LLM checkpoints, academic torrents, and raw datasets). Instead of routing large files through local hardware:

1. You supply a link (Hugging Face repo, Torrent/Magnet, Direct archive).
2. The headless backend container triggers in the cloud (via GitHub Actions / Codespaces).
3. The transfer pipeline streams the data directly into your cloud remotes (Google Drive) via **`rclone rcat` zero-disk piping**.
4. The **always-online Next.js web dashboard** provides real-time telemetry, visual throughput curves, quota tracking, and task controls.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    User[User / Client] -->|Submit URLs / Monitor Tasks| Dashboard[Next.js 16 Web Dashboard]
    Dashboard -->|repository_dispatch| GHA[GitHub Actions / Codespace]
    GHA -->|Spawns On-Demand| Backend[FastAPI Extraction Engine]
    Backend -->|rclone rcat / Zero-Disk Pipe| GDrive[(Google Drive Cloud Storage)]
    Dashboard -->|Live Telemetry / ngrok tunnel| Backend
    Dashboard -->|Google Drive API v3| GDrive
```

---

## 🚀 Key Features

- **⚡ Multi-Source Extraction**:
  - Auto-detection for **Hugging Face** model repositories and dataset trees.
  - Native support for **Academic Torrents** and BitTorrent magnet links.
  - Direct HTTP/HTTPS large file extraction.
- **☁️ Zero-Disk Cloud Streaming**:
  - Piped standard streams straight to cloud storage (Google Drive) without allocating intermediate local disk storage.
- **📊 Real-Time Telemetry & Visual Analytics**:
  - **4 Top KPI Cards**: Active transfers, completed jobs, data volume extracted, and average network velocity with SVG sparklines.
  - **Recharts Data Visualization**: Real-time throughput area curves and 24-hour transfer volume bar charts.
  - **Active Job Controls**: Live progress percentages, ETA counters, transfer velocity, and pause/resume/cancel controls.
- **📁 Google Drive Integration**:
  - Real-time cloud storage meter (e.g., breakdown against quota).
  - Built-in file browsing and authenticated streaming proxy.
- **🤖 On-Demand Infrastructure Wake-Up**:
  - Wakes up headless Codespace/runner on demand via GitHub `repository_dispatch` to eliminate idle compute costs.
- **🎨 Obsidian Dark UI**:
  - Built with Tailwind CSS, custom slate-zinc card surfaces, glowing accents, and responsive layout.

---

## 📂 Repository Structure

```text
c:/Projects/A_Cloud_Extracter-V2/
├── Architecture.txt               # Full specification of backend & frontend pipeline
├── Frontend Stages.txt            # 10-phase frontend roadmap and implementation stages
├── README.md                      # Repository root documentation
│
└── web/                           # Next.js 16 Web Application
    ├── app/
    │   ├── api/drive/             # Google Drive API routes (storage calculation & proxy)
    │   ├── globals.css            # Dark mode tokens & sparkline styling
    │   ├── layout.tsx             # Root app shell with navigation & status headers
    │   └── page.tsx               # Main telemetry dashboard assembly
    ├── components/
    │   ├── dashboard/             # Dashboard cards (MetricsRow, ExtractionCard, AnalyticsGrid, etc.)
    │   ├── layout/                # Sidebar, Header, and Cluster status pill
    │   └── ui/                    # Reusable primitives (Badge, Button, Progress, Sparkline)
    ├── hooks/
    │   ├── useCodespaceStatus.ts  # Cluster online/offline detection & wake-up triggers
    │   └── useTelemetry.ts        # Polling telemetry state for live tasks & metrics
    ├── lib/
    │   ├── api.ts                 # Ngrok-tunnel resilient API client
    │   ├── github.ts              # GitHub repository_dispatch client
    │   └── utils.ts               # Byte formatting, ETA calculators, class merging
    └── types/
        ├── telemetry.ts           # Task, KPI, telemetry snapshot contracts
        └── api.ts                 # Request/response schemas for extract jobs
```

---

## 🛠️ Getting Started (Web Frontend)

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Setup & Run

1. Navigate to the `web` folder:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `.env.local` contains the required keys:
   ```env
   # Google Drive Service Account
   GDRIVE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   GDRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GDRIVE_FOLDER_ID="your_google_drive_folder_id"
   NEXT_PUBLIC_GDRIVE_FOLDER_ID="your_google_drive_folder_id"
   NEXT_PUBLIC_GDRIVE_API_KEY="AIzaSy..."

   # GitHub Dispatch Trigger
   NEXT_PUBLIC_GITHUB_OWNER="your-github-username"
   NEXT_PUBLIC_GITHUB_REPO="cloud-extracter"
   NEXT_PUBLIC_GH_DISPATCH_TOKEN="ghp_yourPersonalAccessToken"

   # Backend URL
   NEXT_PUBLIC_BACKEND_URL="https://your-ngrok-tunnel.ngrok-free.app"
   ```

4. Launch the local development server:
   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 📦 Available Scripts

Run from the `web` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Runs the Next.js development server with hot-reloading |
| `npm run build` | Builds the app for production |
| `npm run start` | Runs the production-built app |
| `npm run lint` | Lints the codebase with ESLint |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
