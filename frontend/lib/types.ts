
// Runtime status for work centers
export type WorkCenterStatus = 'operational' | 'idle' | 'maintenance' | 'down';
export type UserRole = 'admin' | 'viewer' | 'developer';

// Runtime parameters for work centers
export interface RuntimeParameters {
  currentJob?: string;
  cycleTime?: number;
  oee?: number;
  mtbf?: number;
  mttr?: number;
  nextMaintenance?: Date;
  lastUpdated: Date;
  estimatedCompletion?: Date;
  [key: string]: any;
}

// Work Center - represents a single machine
export interface WorkCenter {
  id: string;
  workCenterId: string; // Unique identifier for parameters
  machineName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  icon?: string;
  status: WorkCenterStatus;
  parameters?: RuntimeParameters;
  areaId?: string; // Link to area
  detail?: string; // Tooltip info from CSV
}

// Line - collection of work centers
export interface Line {
  id: string;
  lineId: string;
  lineName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  workCenters: WorkCenter[];
  color?: string;
}

// Buffer - temporary storage between lines
export interface Buffer {
  id: string;
  bufferId: string;
  bufferName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  currentLevel: number;
}

// Storage Zone - static storage areas
export interface StorageZone {
  id: string;
  storageId: string;
  storageName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

// Area - section of factory containing lines and equipment
export interface Area {
  id: string;
  areaId: string; // Business ID
  areaName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  lines: Line[];
  buffers: Buffer[];
  storage: StorageZone[];
}

export interface Flow {
  id: string;
  fromWsId: string;
  toWsId: string;
  arrowType: string;
  label: string;
}

// Factory - top-level container
export interface Factory {
  id: string;
  name: string;
  width: number;
  height: number;
  gridUnit: number;
  areas: Area[];
  flows?: Flow[]; // Links for visualizations
}

// Configuration - complete layout snapshot
export interface Configuration {
  id: string;
  version: string;
  name: string;
  factory: Factory;
  isActive: boolean; // New field
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  adminComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  activatedBy?: string;
  activatedAt?: string; // Date or string
  createdAt: string; // Date or string
  updatedAt: string; // Date or string
}

// User session
export interface User {
  id: string;
  username: string;
  role: UserRole;
  lastLogin?: Date;
}
