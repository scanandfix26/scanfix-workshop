import { useState } from 'react';
import type { Job } from '../types';
import StatusBadge from '../components/StatusBadge';

interface Props {
  jobs: Job[];
  onOpenDetail: (id: string) => void;
}

type Filter = 'all' | 'today' | 'week' | 'month';

function filterJobs(jobs: Job[], f: Filter): Job[] {
  if (f === 'all') return jobs;
  const now = new Date();
  return jobs.filter(j => {
    const d = new Date(j.completedAt || j.updatedAt);
    if (f === 'today') return d.toDateString() === now.toDateString();
    if (f === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (f === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });
}

export default function Completed({ jobs, onOpenDetail }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filterJobs(jobs, filter).filter(j => {
    const q = search.toLowerCase();
    return !q || j.bikeNumber.toLowerCase().includes(q) || j.customerPhone.includes(q) ||
      (j.customerName || '').toLowerCase().includes(q) || j.jobNumber.toLowerCase().includes(q);
  });

  const totalRevenue = filtered.reduce((s, j) => s + (j.bill?.total || 0), 0);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' }, { id: 'month', label: 'This Month' },
  ];

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="bg-dark px-4 pt-10 pb-4">
        <h1 className="text-white text-xl font-bold">Completed Jobs</h1>
        <p className="text-gray-400 text-sm">
          {filtered.length} jobs · <span className="text-yellow font-semibold">₹{totalRevenue.toLocaleString()} revenue</span>
        </p>
        <div className="mt-3 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none"
            placeholder="Search bike, phone, job number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${
              filter === f.id ? 'bg-green-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >{f.label}</button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-medium">No completed jobs</p>
          </div>
        ) : filtered.map(job => (
          <button
            key={job.id}
            onClick={() => onOpenDetail(job.id)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between text-left active:scale-98"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-dark">{job.bikeNumber}</p>
                <span className="text-xs text-gray-400 font-mono">{job.jobNumber}</span>
              </div>
              <p className="text-gray-500 text-sm">{job.bikeModel || job.customerName || '—'}</p>
              {job.completedAt && (
                <p className="text-gray-400 text-xs mt-0.5">{new Date(job.completedAt).toLocaleDateString('en-IN')}</p>
              )}
            </div>
            <div className="text-right ml-3 flex-shrink-0">
              <StatusBadge status={job.status} />
              {(job.bill?.total || 0) > 0 && (
                <p className="text-green-600 font-bold text-sm mt-1">₹{job.bill.total.toLocaleString()}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
