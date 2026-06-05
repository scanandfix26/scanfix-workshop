import { openDB, IDBPDatabase } from 'idb';
import type { Job } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DB_NAME   = 'scanfix-db';
const DB_VERSION = 3;
const STORE     = 'jobs';
const META_STORE = 'meta';

let db: IDBPDatabase | null = null;

// ─── Device ID ───────────────────────────────────────────────────────────────
function getDeviceId(): string {
  let id = localStorage.getItem('scanfix-device-id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('scanfix-device-id', id);
  }
  return id;
}
export const DEVICE_ID = getDeviceId();

// ─── DB Init ──────────────────────────────────────────────────────────────────
export async function getDB() {
  if (db) return db;
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const store = database.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('bikeNumber', 'bikeNumber');
        store.createIndex('customerPhone', 'customerPhone');
        store.createIndex('completedAt', 'completedAt');
      }
      if (oldVersion < 2) {
        // Add syncPending index using the upgrade transaction
        const store = transaction.objectStore(STORE);
        if (!store.indexNames.contains('syncPending')) {
          store.createIndex('syncPending', 'syncPending');
        }
      }
      if (oldVersion < 3) {
        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      }
    }
  });
  return db;
}

// ─── Job Counter ──────────────────────────────────────────────────────────────
export async function getNextJobNumber(): Promise<string> {
  const database = await getDB();
  const meta = await database.get(META_STORE, 'jobCounter');
  const next = (meta?.value || 0) + 1;
  await database.put(META_STORE, { key: 'jobCounter', value: next });
  return `JOB-${String(next).padStart(4, '0')}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export async function createJob(job: Job): Promise<void> {
  const database = await getDB();
  const stamped = { ...job, deviceId: DEVICE_ID, syncPending: isSupabaseConfigured ? 1 : 0 };
  await database.put(STORE, stamped);
  if (isSupabaseConfigured) schedulePush();
}

export async function updateJob(job: Job): Promise<void> {
  const database = await getDB();
  const stamped = { ...job, deviceId: DEVICE_ID, syncPending: isSupabaseConfigured ? 1 : 0 };
  await database.put(STORE, stamped);
  if (isSupabaseConfigured) schedulePush();
}

export async function getJob(id: string): Promise<Job | undefined> {
  const database = await getDB();
  return database.get(STORE, id);
}

export async function getAllJobs(): Promise<Job[]> {
  const database = await getDB();
  const all = await database.getAll(STORE);
  return all.filter((j: any) => !j.deletedAt);
}

export async function deleteJob(id: string): Promise<void> {
  const database = await getDB();
  const job = await database.get(STORE, id);
  if (job) {
    await database.put(STORE, { ...job, deletedAt: new Date().toISOString(), syncPending: isSupabaseConfigured ? 1 : 0 });
  }
  if (isSupabaseConfigured) schedulePush();
}

export async function clearAllJobs(): Promise<void> {
  const database = await getDB();
  await database.clear(STORE);
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────
export async function exportBackup(): Promise<string> {
  const jobs = await getAllJobs();
  return JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), jobs });
}

export async function importBackup(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (!data.jobs || !Array.isArray(data.jobs)) throw new Error('Invalid backup file');
  const database = await getDB();
  const tx = database.transaction(STORE, 'readwrite');
  for (const job of data.jobs) {
    await tx.store.put({ ...job, syncPending: isSupabaseConfigured ? 1 : 0 });
  }
  await tx.done;
  if (isSupabaseConfigured) schedulePush();
}

// ─── Supabase Cloud Sync ──────────────────────────────────────────────────────
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePush(delayMs = 1500) {
  if (!isSupabaseConfigured) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushTimer = null; pushPendingToCloud(); }, delayMs);
}

export async function pushPendingToCloud(): Promise<{ pushed: number; errors: string[] }> {
  if (!isSupabaseConfigured || !supabase) return { pushed: 0, errors: [] };
  const database = await getDB();
  const all = await database.getAll(STORE);
  const pending = all.filter((j: any) => j.syncPending === 1);
  if (!pending.length) return { pushed: 0, errors: [] };

  try {
    // Map to snake_case for Supabase
    const rows = pending.map((j: any) => ({
      id: j.id,
      job_number: j.jobNumber,
      bike_number: j.bikeNumber,
      bike_model: j.bikeModel,
      customer_phone: j.customerPhone,
      customer_name: j.customerName,
      complaint: j.complaint,
      problems: j.problems,
      repair_notes: j.repairNotes,
      spare_parts: j.spareParts,
      bill: j.bill,
      final_work_done: j.finalWorkDone,
      status: j.status,
      assigned_mechanic: j.assignedMechanic,
      created_at: j.createdAt,
      updated_at: j.updatedAt,
      completed_at: j.completedAt,
      delivered_at: j.deliveredAt,
      device_id: j.deviceId,
      deleted_at: j.deletedAt,
    }));

    const { error } = await supabase.from('jobs').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);

    const tx = database.transaction(STORE, 'readwrite');
    for (const job of pending) {
      await tx.store.put({ ...job, syncPending: 0 });
    }
    await tx.done;
    return { pushed: pending.length, errors: [] };
  } catch (err: any) {
    return { pushed: 0, errors: [err.message] };
  }
}

export async function pullFromCloud(): Promise<{ pulled: number; merged: number; errors: string[] }> {
  if (!isSupabaseConfigured || !supabase) return { pulled: 0, merged: 0, errors: [] };
  try {
    const { data: cloudRows, error } = await supabase
      .from('jobs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!cloudRows) return { pulled: 0, merged: 0, errors: [] };

    const cloudJobs: Job[] = cloudRows.map((r: any) => ({
      id: r.id,
      jobNumber: r.job_number,
      bikeNumber: r.bike_number,
      bikeModel: r.bike_model,
      customerPhone: r.customer_phone,
      customerName: r.customer_name,
      complaint: r.complaint,
      problems: r.problems || [],
      repairNotes: r.repair_notes || '',
      spareParts: r.spare_parts || [],
      bill: r.bill || { labour: 0, parts: 0, other: 0, total: 0 },
      finalWorkDone: r.final_work_done || '',
      status: r.status,
      assignedMechanic: r.assigned_mechanic,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      completedAt: r.completed_at,
      deliveredAt: r.delivered_at,
      deviceId: r.device_id,
      deletedAt: r.deleted_at,
    }));

    const database = await getDB();
    const tx = database.transaction(STORE, 'readwrite');
    let merged = 0;

    for (const cloudJob of cloudJobs) {
      const local: any = await tx.store.get(cloudJob.id);
      if (!local) {
        await tx.store.put({ ...cloudJob, syncPending: 0 });
        merged++;
      } else {
        const cloudTime = new Date(cloudJob.updatedAt).getTime();
        const localTime = new Date(local.updatedAt).getTime();
        if (cloudTime > localTime && local.syncPending !== 1) {
          await tx.store.put({ ...cloudJob, syncPending: 0 });
          merged++;
        }
      }
    }
    await tx.done;
    return { pulled: cloudRows.length, merged, errors: [] };
  } catch (err: any) {
    return { pulled: 0, merged: 0, errors: [err.message] };
  }
}

export async function syncNow(): Promise<{ pushed: number; pulled: number; merged: number; errors: string[] }> {
  const [pushResult, pullResult] = await Promise.all([pushPendingToCloud(), pullFromCloud()]);
  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    merged: pullResult.merged,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

export async function getPendingCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const database = await getDB();
  const all = await database.getAll(STORE);
  return all.filter((j: any) => j.syncPending === 1).length;
}
