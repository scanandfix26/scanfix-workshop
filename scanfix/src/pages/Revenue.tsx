import type { Job } from '../types';

interface Props {
  jobs: Job[];
}

function getMonthName(d: Date) {
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function Revenue({ jobs }: Props) {
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'delivered');

  const now = new Date();
  const todayStr = now.toDateString();
  const thisMonth = `${now.getMonth()}-${now.getFullYear()}`;

  const todayJobs = completedJobs.filter(j => j.completedAt && new Date(j.completedAt).toDateString() === todayStr);
  const monthJobs = completedJobs.filter(j => {
    if (!j.completedAt) return false;
    const d = new Date(j.completedAt);
    return `${d.getMonth()}-${d.getFullYear()}` === thisMonth;
  });

  const todayRev = todayJobs.reduce((s, j) => s + (j.bill?.total || 0), 0);
  const monthRev = monthJobs.reduce((s, j) => s + (j.bill?.total || 0), 0);
  const totalRev = completedJobs.reduce((s, j) => s + (j.bill?.total || 0), 0);

  // Group by month for history
  const monthMap = new Map<string, { label: string; revenue: number; count: number }>();
  for (const job of completedJobs) {
    if (!job.completedAt) continue;
    const d = new Date(job.completedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const label = getMonthName(d);
    const existing = monthMap.get(key) || { label, revenue: 0, count: 0 };
    monthMap.set(key, { ...existing, revenue: existing.revenue + (job.bill?.total || 0), count: existing.count + 1 });
  }
  const monthHistory = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([, v]) => v);

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="bg-dark px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-bold">Revenue</h1>
        <p className="text-gray-400 text-sm">Workshop income overview</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-yellow rounded-2xl p-4 col-span-2">
            <p className="text-dark text-xs font-bold uppercase tracking-wide">Total Revenue (All Time)</p>
            <p className="text-dark text-4xl font-bold mt-1">₹{totalRev.toLocaleString()}</p>
            <p className="text-dark/60 text-xs mt-1">{completedJobs.length} completed jobs</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Today</p>
            <p className="text-dark text-2xl font-bold mt-1">₹{todayRev.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">{todayJobs.length} jobs</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">This Month</p>
            <p className="text-dark text-2xl font-bold mt-1">₹{monthRev.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">{monthJobs.length} jobs</p>
          </div>
        </div>

        {/* Monthly History */}
        {monthHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">Monthly Breakdown</h3>
            <div className="space-y-2">
              {monthHistory.map((m, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-semibold text-dark text-sm">{m.label}</p>
                    <p className="text-gray-400 text-xs">{m.count} jobs completed</p>
                  </div>
                  <p className="text-dark font-bold text-lg">₹{m.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Jobs Detail */}
        {todayJobs.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">Today's Completed</h3>
            <div className="space-y-2">
              {todayJobs.map(job => (
                <div key={job.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-semibold text-dark text-sm">{job.bikeNumber}</p>
                    <p className="text-gray-400 text-xs">{job.jobNumber} · {job.customerName || job.customerPhone}</p>
                  </div>
                  <p className="text-green-600 font-bold">₹{(job.bill?.total || 0).toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span className="text-gray-600">Today Total</span>
                <span className="text-yellow text-lg">₹{todayRev.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {completedJobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">💰</p>
            <p className="font-medium">No revenue data yet</p>
            <p className="text-sm mt-1">Complete jobs to see revenue</p>
          </div>
        )}
      </div>
    </div>
  );
}
