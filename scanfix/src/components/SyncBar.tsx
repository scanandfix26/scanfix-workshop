import type { SyncStatus } from '../hooks/useJobs';
import { isSupabaseConfigured } from '../lib/supabase';

interface Props {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  onSync: () => void;
}

export default function SyncBar({ status, pendingCount, lastSyncAt, onSync }: Props) {
  if (!isSupabaseConfigured) return null;

  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  const bars: Record<SyncStatus, { bg: string; dot: string; label: string }> = {
    idle:    { bg: 'bg-gray-800',   dot: 'bg-gray-400',               label: 'Ready' },
    syncing: { bg: 'bg-blue-900',   dot: 'bg-blue-400 animate-pulse', label: 'Syncing…' },
    synced:  { bg: 'bg-green-900',  dot: 'bg-green-400',              label: lastSyncAt ? `Synced ${timeAgo(lastSyncAt)}` : 'Synced' },
    error:   { bg: 'bg-red-900',    dot: 'bg-red-400',                label: 'Sync error — tap to retry' },
    offline: { bg: 'bg-yellow-900', dot: 'bg-yellow-400',             label: 'Offline — will sync when online' },
  };

  const cfg = bars[status];

  return (
    <div className={`${cfg.bg} px-4 py-1.5 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="text-xs text-gray-300 truncate">{cfg.label}</span>
        {pendingCount > 0 && (
          <span className="text-xs bg-yellow-500 text-black rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">
            {pendingCount} pending
          </span>
        )}
      </div>
      {(status === 'error' || status === 'offline' || pendingCount > 0) && (
        <button onClick={onSync} className="text-xs text-blue-300 underline flex-shrink-0 active:opacity-60">
          Retry
        </button>
      )}
    </div>
  );
}
