export interface ActiveStreamMeta {
  speed: string;
  progress: string;
  eta: string;
}

export interface BackendTaskMeta {
  id: string;
  name: string;
  type?: "huggingface" | "torrent";
  status: string;
  progress: number;
  speed: string;
  eta: string;
}

export interface BackendEngineStatus {
  status: string;
  name?: string;
  progress?: string;
  speed?: string;
  peers?: number;
  disk_free?: string;
  upload_progress?: string;
  upload_speed?: string;
  upload_eta?: string;
  active_tasks?: BackendTaskMeta[];
  active_streams?: Record<string, ActiveStreamMeta>;
  queue?: Array<{ id: string; name: string; size_gb: number; status: string }>;
  allocated_torrent_gb?: number;
  idle_seconds_left?: number;
}

export interface BackendHealthResponse {
  status: "online" | "offline" | "standby";
  cluster?: string;
  active?: boolean;
  engine?: string;
  active_tasks?: number;
  queued?: number;
}

export interface EnqueueResponse {
  status: "success" | "ignored" | "error" | "queued";
  message: string;
}

export interface WakeResponse {
  status: "dispatched" | "failed";
  message: string;
  timestamp: string;
}

export interface EnqueueTaskRequest {
  url: string;
  detectionMode?: "auto" | "huggingface" | "academic_torrent";
  pipelineMode?: "cloud_extract" | "local_fetch";
  advancedOptions?: {
    destinationFolder?: string;
    maxBandwidth?: string;
    priority?: string;
  };
}