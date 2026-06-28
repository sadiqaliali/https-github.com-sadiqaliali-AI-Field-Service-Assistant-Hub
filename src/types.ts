export interface Location {
  x: number;
  y: number;
  label: string;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  status: string;
  location: Location;
  contact: string;
  skills: string[];
  battery: number;
  avatar: string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface HistoryEvent {
  date: string;
  label: string;
}

export interface WorkOrder {
  id: string;
  client: string;
  assetId: string;
  assetName: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Unassigned" | "Assigned" | "On-Route" | "In-Progress" | "Completed" | "Deferred";
  technicianId: string;
  location: Location;
  scheduledDate: string;
  slaGraceMs: number;
  createdAt: string;
  tasks: Task[];
  history: HistoryEvent[];
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  model: string;
  installationDate: string;
  location: string;
  status: string;
  lastService: string;
  telemetry: Record<string, any>;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  assetId: string;
  assetName: string;
  parameter: string;
  value: string;
  status: string;
  description: string;
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  summary: string;
  steps: string[];
}
