export type ActivityStatus =
  | "preparing"
  | "failed"
  | "transferred"
  | "downloaded"
  | "completed";

export interface RecentActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  status: ActivityStatus;
}

export interface SpeedDataPoint {
  time: string;
  speed: number;
}

export interface MetricValue {
  value: string | number;
  trend: string;
  isPositive: boolean;
}

export interface KpiMetrics {
  activeTransfers: MetricValue;
  completed: MetricValue;
  dataExtracted: MetricValue;
  avgSpeed: MetricValue;
}

export interface ActiveTaskItem {
  id: string;
  name: string;
  source: string;
  status: "downloading" | "transferring" | "completed" | "failed" | "queued" | "streaming";
  progress: number;
  speed: string;
  eta: string;
}

export interface TelemetrySnapshot {
  kpis: KpiMetrics;
  tasks: ActiveTaskItem[];
  transferSpeedMbps: number;
  speedHistory: SpeedDataPoint[];
  storage: {
    usedBytes: number;
    totalBytes: number;
  };
  isStale?: boolean;
  hourlyTransfers?: Record<string, number>;
}
