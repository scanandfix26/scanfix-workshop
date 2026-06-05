import { useState, useEffect } from 'react';
import { getJob } from '../db';
import type { Job, JobStatus, SparePart, BillRecord } from '../types';
import { STATUS_CONFIG, PROBLEMS } from '../types';
import StatusBadge from '../components/StatusBadge';
import type { AppUser } from '../types';

interface Props {
  jobId: string;
  user: AppUser;
  onBack: () => void;
  onSave: (job: Job) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: JobStatus) => Promise<void>;
}

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function JobDetail({ jobId, user, onBack, onSave, onDelete, onUpdateStatus }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [draft, setDraft] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', qty: '1', amount: '' });

  const canEdit = user.role === 'admin' || user.role === 'mechanic';
  const canDelete = user.role === 'admin';

  useEffect(() => {
    getJob(jobId).then(j => { if (j) { setJob(j); setDraft(j); } });
  }, [jobId]);

  if (!job || !draft) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const updateBill = (field: keyof BillRecord, val: string) => {
    const n = parseFloat(val) || 0;
    setDraft(d => {
      if (!d) return d;
      const updated = { ...d.bill, [field]: n };
      updated.total = updated.labour + updated.parts + updated.other;
      return { ...d, bill: updated };
    });
  };

  const addPart = () => {
    if (!newPart.name.trim()) return;
    const part: SparePart = {
      id: makeId(),
      name: newPart.name.trim(),
      quantity: parseInt(newPart.qty) || 1,
      amount: parseFloat(newPart.amount) || 0,
    };
    setDraft(d => {
      if (!d) return d;
      const updated = [...d.spareParts, part];
      const partsTotal = updated.reduce((s, p) => s + p.amount, 0);
      return { ...d, spareParts: updated, bill: { ...d.bill, parts: partsTotal, total: d.bill.labour + partsTotal + d.bill.other } };
    });
    setNewPart({ name: '', qty: '1', amount: '' });
  };

  const removePart = (id: string) => {
    setDraft(d => {
      if (!d) return d;
      const updated = d.spareParts.filter(p => p.id !== id);
      const partsTotal = updated.reduce((s, p) => s + p.amount, 0);
      return { ...d, spareParts: updated, bill: { ...d.bill, parts: partsTotal, total: d.bill.labour + partsTotal + d.bill.other } };
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    const updated = {
      ...draft,
      updatedAt: new Date().toISOString(),
      ...(draft.status === 'completed' && !draft.completedAt ? { completedAt: new Date().toISOString() } : {}),
    };
    await onSave(updated);
    setJob(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStatusChange = async (s: JobStatus) => {
    if (user.role === 'worker') return;
    setSaving(true);
    const now = new Date().toISOString();
    const updated = {
      ...draft,
      status: s,
      updatedAt: now,
      ...(s === 'completed' && !draft.completedAt ? { completedAt: now } : {}),
      ...(s === 'delivered' ? { deliveredAt: now } : {}),
    };
    await onSave(updated);
    setJob(updated);
    setDraft(updated);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!confirm(`Delete job ${job.jobNumber} for ${job.bikeNumber}?`)) return;
    await onDelete(jobId);
    onBack();
  };

  const statuses: JobStatus[] = ['pending', 'in-progress', 'completed', 'delivered'];

  return (
    <div className="flex-1 pb-6 overflow-y-auto">
      {/* Sticky Header */}
      <div className="bg-dark px-4 pt-10 pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-white text-2xl p-1 -ml-1 active:scale-90">←</button>
          <img src="/logo.png" alt="" className="w-8 h-8 object-contain rounded-lg bg-yellow/10 p-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-yellow font-bold text-lg leading-none">{job.bikeNumber}</p>
              <span className="text-gray-500 text-xs font-mono">{job.jobNumber}</span>
            </div>
            <p className="text-gray-400 text-sm">{job.bikeModel || 'Unknown model'}</p>
          </div>
          <StatusBadge status={draft.status} />
        </div>

        {/* Status selector */}
        {user.role !== 'worker' && (
          <div className="flex gap-1">
            {statuses.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                    draft.status === s ? `${cfg.bg} ${cfg.color}` : 'bg-white/10 text-gray-400'
                  }`}
                >{cfg.label}</button>
              );
            })}
          </div>
        )}

        {/* Mechanic quick actions */}
        {user.role === 'mechanic' && (
          <div className="flex gap-2 mt-2">
            {draft.status === 'pending' && (
              <button
                onClick={() => handleStatusChange('in-progress')}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 font-bold text-sm active:scale-95"
              >▶ Start Work</button>
            )}
            {draft.status === 'in-progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-bold text-sm active:scale-95"
              >✓ Mark Completed</button>
            )}
            {draft.status === 'completed' && (
              <button
                onClick={() => handleStatusChange('delivered')}
                className="flex-1 bg-purple-600 text-white rounded-xl py-2.5 font-bold text-sm active:scale-95"
              >🏁 Mark Delivered</button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-3 space-y-3">

        {/* Bike & Customer Info */}
        <InfoCard title="Bike & Customer">
          <Row label="Bike No." value={job.bikeNumber} />
          {job.bikeModel && <Row label="Model" value={job.bikeModel} />}
          <Row label="Phone" value={job.customerPhone} />
          {job.customerName && <Row label="Name" value={job.customerName} />}
          {job.complaint && <Row label="Complaint" value={job.complaint} />}
          <Row label="Registered" value={new Date(job.createdAt).toLocaleString()} />
          {job.completedAt && <Row label="Completed" value={new Date(job.completedAt).toLocaleString()} />}
          {job.deliveredAt && <Row label="Delivered" value={new Date(job.deliveredAt).toLocaleString()} />}
        </InfoCard>

        {/* Complaints */}
        <InfoCard title="Complaints">
          <div className="flex flex-wrap gap-2">
            {PROBLEMS.map(p => (
              <button
                key={p}
                disabled={!canEdit}
                onClick={() => canEdit && setDraft(d => d ? {
                  ...d,
                  problems: d.problems.includes(p) ? d.problems.filter(x => x !== p) : [...d.problems, p]
                } : d)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${canEdit ? 'active:scale-95' : ''} ${
                  draft.problems.includes(p)
                    ? 'bg-yellow border-yellow text-dark'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
              >{p}</button>
            ))}
          </div>
        </InfoCard>

        {/* Repair Notes */}
        <InfoCard title="Repair Notes">
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-dark h-24 resize-none outline-none focus:border-yellow text-sm"
            value={draft.repairNotes}
            onChange={e => canEdit && setDraft(d => d ? { ...d, repairNotes: e.target.value } : d)}
            placeholder="What was found, what was done…&#10;e.g. Replaced spark plug. Cleaned air filter."
            readOnly={!canEdit}
          />
        </InfoCard>

        {/* Spare Parts */}
        <InfoCard title="Spare Parts Used">
          {draft.spareParts.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {draft.spareParts.map(p => (
                <div key={p.id} className="flex items-center bg-gray-50 rounded-xl px-3 py-2.5 gap-2">
                  <span className="flex-1 font-medium text-sm text-dark">{p.name}</span>
                  <span className="text-sm text-gray-500">×{p.quantity}</span>
                  <span className="w-20 text-right text-sm font-semibold text-dark">
                    {p.amount > 0 ? `₹${p.amount.toLocaleString()}` : '—'}
                  </span>
                  {canEdit && (
                    <button onClick={() => removePart(p.id)} className="text-red-400 font-bold text-xl w-6 flex items-center justify-center">×</button>
                  )}
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 bg-yellow/10 rounded-xl">
                <span className="text-sm text-gray-600 font-medium">Parts Total</span>
                <span className="font-bold text-dark">₹{draft.spareParts.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          {canEdit && (
            <div className={`space-y-2 ${draft.spareParts.length > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow"
                placeholder="Part name (e.g. Spark Plug, Brake Shoe)"
                value={newPart.name}
                onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Qty</p>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow text-center" type="number" value={newPart.qty} onChange={e => setNewPart(p => ({ ...p, qty: e.target.value }))} min="1" inputMode="numeric" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Amount (₹)</p>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow" type="number" value={newPart.amount} onChange={e => setNewPart(p => ({ ...p, amount: e.target.value }))} inputMode="numeric" placeholder="0" />
                </div>
                <div className="flex items-end">
                  <button onClick={addPart} className="bg-dark text-yellow rounded-xl px-4 h-[42px] font-bold text-xl active:scale-95">+</button>
                </div>
              </div>
            </div>
          )}
        </InfoCard>

        {/* Bill */}
        <InfoCard title="Bill">
          <div className="space-y-2">
            {[
              { field: 'labour' as keyof BillRecord, label: 'Labour Charge', editable: true },
              { field: 'parts' as keyof BillRecord, label: 'Parts Cost', editable: false },
              { field: 'other' as keyof BillRecord, label: 'Other Cost', editable: true },
            ].map(({ field, label, editable }) => (
              <div key={field} className="flex items-center gap-3">
                <label className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</label>
                <input
                  className={`flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none ${editable && canEdit ? 'border-gray-200 focus:border-yellow' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                  type="number"
                  value={draft.bill[field] || ''}
                  onChange={e => editable && canEdit && updateBill(field, e.target.value)}
                  readOnly={!editable || !canEdit}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            ))}
            <div className="flex items-center justify-between bg-dark rounded-xl px-4 py-3 mt-1">
              <span className="text-white font-semibold">Total Amount</span>
              <span className="text-yellow font-bold text-2xl">₹{draft.bill.total.toLocaleString()}</span>
            </div>
          </div>
        </InfoCard>

        {/* Final Work Done */}
        <InfoCard title="Final Work Done">
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-dark h-20 resize-none outline-none focus:border-yellow text-sm"
            value={draft.finalWorkDone}
            onChange={e => canEdit && setDraft(d => d ? { ...d, finalWorkDone: e.target.value } : d)}
            placeholder="Summary of all work completed…"
            readOnly={!canEdit}
          />
        </InfoCard>

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-2 pt-1 pb-4">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="bg-red-50 text-red-500 rounded-2xl py-3.5 px-5 font-bold active:scale-95"
              >🗑</button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 rounded-2xl py-3.5 font-bold text-base transition-all active:scale-95 disabled:opacity-50 ${
                saved ? 'bg-green-500 text-white' : 'bg-yellow text-dark'
              }`}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-dark font-medium text-right flex-1 break-all">{value}</span>
    </div>
  );
}
