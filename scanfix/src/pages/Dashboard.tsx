import type { Job } from '../types';
import type { AppUser } from '../types';
import StatusBadge from '../components/StatusBadge';

interface Stats {
  total: number; pending: number; inProgress: number;
  completed: number; delivered: number;
  todayRevenue: number; monthRevenue: number;
}
interface Props {
  stats: Stats;
  jobs: Job[];
  user: AppUser;
  onOpenDetail: (id: string) => void;
  onNewEntry: () => void;
  onInstall: (() => void) | null;
}

export default function Dashboard({ stats, jobs, user, onOpenDetail, onNewEntry, onInstall }: Props) {
  const isAdmin = user.role === 'admin';

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-dark px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-yellow text-xs font-bold tracking-widest uppercase">Workshop Register</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">
              Scan<span className="text-yellow">&</span>Fix
            </h1>
          </div>
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-yellow/10">
            <img src="/logo.png" alt="Scan & Fix" className="w-full h-full object-contain p-0.5" />
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          Hello, <span className="text-white font-medium">{user.name}</span>
          <span className="ml-2 text-xs bg-yellow/20 text-yellow px-2 py-0.5 rounded-full capitalize">{user.role}</span>
        </p>

        {onInstall && (
          <button
            onClick={onInstall}
            className="mt-3 w-full flex items-center gap-2 bg-yellow/10 border border-yellow/30 text-yellow rounded-xl px-4 py-2.5 font-semibold text-sm active:scale-98 transition-transform"
          >
            <span>⬇</span>
            <span>Install App on this Device</span>
          </button>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Revenue Cards (Admin only) */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark rounded-2xl p-4 col-span-1">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Today</p>
              <p className="text-yellow text-2xl font-bold mt-1">₹{stats.todayRevenue.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-0.5">Revenue</p>
            </div>
            <div className="bg-dark rounded-2xl p-4 col-span-1">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">This Month</p>
              <p className="text-yellow text-2xl font-bold mt-1">₹{stats.monthRevenue.toLocaleString()}</p>
              <p className="text-gray-500 text-xs mt-0.5">Revenue</p>
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm col-span-2 flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-dark">{stats.total}</p>
              <p className="text-gray-400 text-sm mt-0.5">Total Jobs</p>
            </div>
            <span className="text-4xl">🏍️</span>
          </div>
          {[
            { label: 'Pending', value: stats.pending, color: 'bg-orange-50', text: 'text-orange-600', icon: '⏳' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-50', text: 'text-blue-600', icon: '🔧' },
            { label: 'Completed', value: stats.completed, color: 'bg-green-50', text: 'text-green-700', icon: '✅' },
            { label: 'Delivered', value: stats.delivered, color: 'bg-purple-50', text: 'text-purple-700', icon: '🏁' },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl p-4 ${c.color}`}>
              <div className="flex items-center justify-between">
                <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
                <span className="text-xl">{c.icon}</span>
              </div>
              <p className={`text-xs font-medium mt-1 ${c.text} opacity-80`}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* New Entry Button */}
        {(user.role === 'admin' || user.role === 'worker') && (
          <button
            onClick={onNewEntry}
            className="w-full bg-yellow text-dark rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="text-2xl leading-none">+</span>
            <span>Register New Bike</span>
          </button>
        )}

        {/* Recent Active Jobs */}
        {jobs.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Active Jobs</h2>
            <div className="space-y-2">
              {jobs.slice(0, 8).map(job => (
                <button
                  key={job.id}
                  onClick={() => onOpenDetail(job.id)}
                  className="w-full bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm active:scale-98 transition-transform text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-dark text-base">{job.bikeNumber}</p>
                      <span className="text-xs text-gray-400 font-mono">{job.jobNumber}</span>
                    </div>
                    <p className="text-gray-500 text-sm truncate">{job.bikeModel} {job.customerName ? `· ${job.customerName}` : ''}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </button>
              ))}
            </div>
          </div>
        )}

        {jobs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-3">🏍️</p>
            <p className="font-semibold text-gray-500">No active jobs</p>
            <p className="text-sm mt-1">Register a bike to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
