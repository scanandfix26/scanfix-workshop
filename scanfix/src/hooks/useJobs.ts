import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllJobs, createJob, updateJob, deleteJob, syncNow, getPendingCount, getNextJobNumber } from '../db';
import type { Job, JobStatus } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncLock = useRef(false);

  const load = useCallback(async () => {
    const all = await getAllJobs();
    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setJobs(all);
    setLoading(false);
    const pending = await getPendingCount();
    setPendingCount(pending);
  }, []);

  useEffect(() => { load(); }, [load]);

  const doSync = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    if (syncLock.current) return;
    syncLock.current = true;
    setSyncStatus('syncing');
    try {
      const result = await syncNow();
      if (result.errors.length > 0) {
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
        setLastSyncAt(new Date());
      }
      await load();
    } catch {
      setSyncStatus('error');
    } finally {
      syncLock.current = false;
    }
  }, [load]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const handleOnline = () => { setSyncStatus('idle'); doSync(); };
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) doSync();
    else setSyncStatus('offline');
    const interval = setInterval(() => { if (navigator.onLine) doSync(); }, 30_000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [doSync]);

  const addJob = useCallback(async (jobData: Omit<Job, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const jobNumber = await getNextJobNumber();
    const job: Job = {
      ...jobData,
      id: crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2)),
      jobNumber,
      createdAt: now,
      updatedAt: now,
    };
    await createJob(job);
    await load();
    if (navigator.onLine && isSupabaseConfigured) doSync();
    return job;
  }, [load, doSync]);

  const saveJob = useCallback(async (job: Job) => {
    await updateJob({ ...job, updatedAt: new Date().toISOString() });
    await load();
    if (navigator.onLine && isSupabaseConfigured) doSync();
  }, [load, doSync]);

  const removeJob = useCallback(async (id: string) => {
    await deleteJob(id);
    await load();
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: JobStatus) => {
    const all = await getAllJobs();
    const job = all.find(j => j.id === id);
    if (!job) return;
    const now = new Date().toISOString();
    const updated: Job = {
      ...job,
      status,
      updatedAt: now,
      ...(status === 'completed' && !job.completedAt ? { completedAt: now } : {}),
      ...(status === 'delivered' ? { deliveredAt: now } : {}),
    };
    await updateJob(updated);
    await load();
    if (navigator.onLine && isSupabaseConfigured) doSync();
  }, [load, doSync]);

  const activeJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'delivered');
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'delivered');

  // Revenue stats
  const todayStr = new Date().toDateString();
  const thisMonthKey = `${new Date().getMonth()}-${new Date().getFullYear()}`;

  const todayRevenue = completedJobs
    .filter(j => j.completedAt && new Date(j.completedAt).toDateString() === todayStr)
    .reduce((s, j) => s + (j.bill?.total || 0), 0);

  const monthRevenue = completedJobs
    .filter(j => {
      if (!j.completedAt) return false;
      const d = new Date(j.completedAt);
      return `${d.getMonth()}-${d.getFullYear()}` === thisMonthKey;
    })
    .reduce((s, j) => s + (j.bill?.total || 0), 0);

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    inProgress: jobs.filter(j => j.status === 'in-progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    delivered: jobs.filter(j => j.status === 'delivered').length,
    todayRevenue,
    monthRevenue,
  };

  return {
    jobs, activeJobs, completedJobs, stats, loading,
    syncStatus, pendingCount, lastSyncAt,
    addJob, saveJob, removeJob, updateStatus,
    reload: load,
    syncNow: doSync,
  };
}
