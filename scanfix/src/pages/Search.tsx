import { useState } from 'react';
import type { Job } from '../types';
import StatusBadge from '../components/StatusBadge';

interface Props {
  jobs: Job[];
  allJobs: Job[];
  onOpenDetail: (id: string) => void;
}

export default function Search({ allJobs, onOpenDetail }: Props) {
  const [query, setQuery] = useState('');

  const results = query.trim().length < 2 ? [] : allJobs.filter(j => {
    const q = query.toLowerCase().trim();
    return (
      j.bikeNumber.toLowerCase().includes(q) ||
      j.customerPhone.includes(q) ||
      (j.customerName || '').toLowerCase().includes(q) ||
      j.jobNumber.toLowerCase().includes(q) ||
      (j.bikeModel || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="bg-dark px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-bold">Search</h1>
        <p className="text-gray-400 text-sm mb-3">Find any customer or job</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          <input
            className="w-full bg-white/10 text-white placeholder-gray-400 rounded-xl pl-11 pr-4 py-3 text-base outline-none autofocus"
            placeholder="Bike no, phone, name, job no…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
            >✕</button>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {query.length > 0 && query.length < 2 && (
          <p className="text-center text-gray-400 py-8 text-sm">Type at least 2 characters to search</p>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium">No results for "{query}"</p>
            <p className="text-sm mt-1">Try bike number, phone, or name</p>
          </div>
        )}

        {results.map(job => (
          <button
            key={job.id}
            onClick={() => onOpenDetail(job.id)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between text-left active:scale-98"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-dark">{job.bikeNumber}</p>
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{job.jobNumber}</span>
              </div>
              {job.bikeModel && <p className="text-gray-500 text-sm">{job.bikeModel}</p>}
              <p className="text-gray-400 text-xs mt-0.5">
                {job.customerName && `${job.customerName} · `}{job.customerPhone}
              </p>
            </div>
            <div className="ml-3 flex-shrink-0">
              <StatusBadge status={job.status} />
              {(job.bill?.total || 0) > 0 && (
                <p className="text-green-600 text-xs font-semibold text-right mt-1">₹{job.bill.total.toLocaleString()}</p>
              )}
            </div>
          </button>
        ))}

        {query.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold">Search Records</p>
            <div className="mt-4 space-y-1.5 text-sm">
              {['By bike number: AP09AB1234', 'By phone: 9876543210', 'By customer name: Ravi', 'By job number: JOB-0001'].map(hint => (
                <p key={hint} className="text-gray-300">{hint}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
