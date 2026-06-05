// ─── Job Status ───────────────────────────────────────────────────────────────
export type JobStatus = 'pending' | 'in-progress' | 'completed' | 'delivered';

// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'mechanic' | 'worker';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ─── Spare Part ───────────────────────────────────────────────────────────────
export interface SparePart {
  id: string;
  name: string;
  quantity: number;
  amount: number;
}

// ─── Bill ─────────────────────────────────────────────────────────────────────
export interface BillRecord {
  labour: number;
  parts: number;
  other: number;
  total: number;
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  jobNumber: string;       // JOB-0001, JOB-0002 …
  bikeNumber: string;
  bikeModel: string;
  customerPhone: string;
  customerName: string;
  complaint: string;
  problems: string[];
  repairNotes: string;
  spareParts: SparePart[];
  bill: BillRecord;
  finalWorkDone: string;
  status: JobStatus;
  assignedMechanic?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveredAt?: string;
  // sync metadata
  syncPending?: number;    // 1 = needs push, 0 = clean
  deviceId?: string;
  deletedAt?: string;      // soft-delete for cloud sync
}

// ─── Status Config ────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<JobStatus, {
  label: string;
  color: string;
  bg: string;
  dot: string;
  btnBg: string;
}> = {
  pending:     { label: 'Pending',     color: 'text-orange-600', bg: 'bg-orange-50',  dot: 'bg-orange-500',  btnBg: 'bg-orange-100' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600',   bg: 'bg-blue-50',   dot: 'bg-blue-500',   btnBg: 'bg-blue-100' },
  completed:   { label: 'Completed',   color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500',  btnBg: 'bg-green-100' },
  delivered:   { label: 'Delivered',   color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500', btnBg: 'bg-purple-100' },
};

// ─── Common Complaints ────────────────────────────────────────────────────────
export const PROBLEMS = [
  'Starting Problem',
  'Engine Noise',
  'Brake Problem',
  'Clutch Problem',
  'Battery Problem',
  'Electrical Problem',
  'Oil Leakage',
  'Tyre Puncture',
  'Chain Problem',
  'General Service',
  'Accident Work',
  'Gear Problem',
  'Other',
];
