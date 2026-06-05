import { useState } from 'react';
import type { Job, JobStatus } from '../types';
import { STATUS_CONFIG } from '../types';
import StatusBadge from '../components/StatusBadge';
import type { AppUser } from '../types';

interface Props {
  jobs: Job[];
  user: AppUser;
  onOpenDetail: (id: string) => void;
  onUpdateStatus: (id: string, status: JobStatus) => Promise<void>;
}

export default function ActiveJobs({ jobs, user, onOpenDetail, onUpdateStatus }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');

  const myJobs = user.role === 'mechanic'
    ? jobs.filter(j => !j.assignedMechanic || j.assignedMechanic === user.name || j.assignedMechanic === user.id)
    : jobs;

  const filtered = myJobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      j.bikeNumber.toLowerCase().includes(q) ||
      j.customerPhone.includes(q) ||
      (j.customerName || '').toLowerCase().includes(q) ||
      j.jobNumber.toLowerCase().includes(q) ||
      (j.bikeModel || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' || j.status === filter;
    return matchSearch && matchFilter;
  });

  const statusFilters: (JobStatus | 'all')[] = ['all', 'pending', 'in-progress'];

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="bg-dark px-4 pt-10 pb-4">
        <h1 className="text-white text-xl font-bold">Active Jobs</h1>
        <p className="text-gray-400 text-sm">{filtered.length} bikes in workshop</p>
        <div className="mt-3 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none"
            placeholder="Search bike no, phone, name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-dark text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🔧</p>
            <p className="font-medium">No active jobs</p>
          </div>
        ) : filtered.map(job => (
          <JobCard
            key={job.id}
            job={job}
            user={user}
            onOpen={() => onOpenDetail(job.id)}
            onStatusChange={onUpdateStatus}
          />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, user, onOpen, onStatusChange }: {
  job: Job;
  user: AppUser;
  onOpen: () => void;
  onStatusChange: (id: string, s: JobStatus) => void;
}) {
  const canChangeStatus = user.role !== 'worker';
  const statuses: JobStatus[] = ['pending', 'in-progress', 'completed', 'delivered'];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={onOpen} className="w-full p-4 text-left active:bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-dark text-lg">{job.bikeNumber}</p>
              <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{job.jobNumber}</span>
            </div>
            {job.bikeModel && <p className="text-gray-500 text-sm">{job.bikeModel}</p>}
            {job.customerName && <p className="text-gray-400 text-xs">{job.customerName} · {job.customerPhone}</p>}
          </div>
          <StatusBadge status={job.status} />
        </div>
        {(job.complaint || job.problems.length > 0) && (
          <p className="text-xs text-gray-400 mt-2 truncate">
            {job.complaint || job.problems.join(' · ')}
          </p>
        )}
      </button>

      {canChangeStatus && (
        <div className="flex border-t border-gray-100">
          {statuses.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => onStatusChange(job.id, s)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  job.status === s
                    ? `${cfg.bg} ${cfg.color} font-bold`
                    : 'text-gray-400 active:bg-gray-50'
                }`}
              >{cfg.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
