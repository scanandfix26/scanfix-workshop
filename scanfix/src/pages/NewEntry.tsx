import { useState } from 'react';
import type { Job } from '../types';
import { PROBLEMS } from '../types';

interface Props {
  onAdd: (data: Omit<Job, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  onDone: (jobId: string) => void;
}

export default function NewEntry({ onAdd, onDone }: Props) {
  const [bikeNumber, setBikeNumber] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [complaint, setComplaint] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleProblem = (p: string) =>
    setProblems(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bikeNumber.trim()) e.bikeNumber = 'Bike number is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (!complaint.trim() && problems.length === 0) e.complaint = 'Please describe the complaint';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const job = await onAdd({
      bikeNumber: bikeNumber.toUpperCase().trim(),
      bikeModel: bikeModel.trim(),
      customerPhone: phone.trim(),
      customerName: name.trim(),
      complaint: complaint.trim(),
      problems,
      repairNotes: '',
      spareParts: [],
      bill: { labour: 0, parts: 0, other: 0, total: 0 },
      finalWorkDone: '',
      status: 'pending',
    });
    setSaving(false);
    onDone(job.id);
  };

  return (
    <div className="flex-1 pb-6 overflow-y-auto">
      <div className="bg-dark px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-10 h-10 object-contain rounded-xl bg-yellow/10 p-0.5" />
          <div>
            <h1 className="text-white text-xl font-bold">Register Bike</h1>
            <p className="text-gray-400 text-sm">Enter customer & complaint details</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Bike Details */}
        <Section title="Bike Details">
          <Field label="Bike Number *" error={errors.bikeNumber}>
            <input
              className={input(errors.bikeNumber)}
              value={bikeNumber}
              onChange={e => setBikeNumber(e.target.value.toUpperCase())}
              placeholder="AP09AB1234"
              autoCapitalize="characters"
            />
          </Field>
          <Field label="Bike Model">
            <input
              className={input()}
              value={bikeModel}
              onChange={e => setBikeModel(e.target.value)}
              placeholder="Honda Activa 6G"
            />
          </Field>
        </Section>

        {/* Customer Details */}
        <Section title="Customer Details">
          <Field label="Phone Number *" error={errors.phone}>
            <input
              className={input(errors.phone)}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="9876543210"
              type="tel"
              inputMode="numeric"
            />
          </Field>
          <Field label="Customer Name">
            <input
              className={input()}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ravi Kumar"
            />
          </Field>
        </Section>

        {/* Complaint */}
        <Section title="Complaint *">
          <Field label="Describe the problem" error={errors.complaint}>
            <textarea
              className={`${input(errors.complaint)} h-20 resize-none`}
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              placeholder="e.g. Bike not starting, strange sound from engine…"
            />
          </Field>
          <p className="text-xs text-gray-400 mb-2">Or select common complaints:</p>
          <div className="flex flex-wrap gap-2">
            {PROBLEMS.map(p => (
              <button
                key={p}
                onClick={() => toggleProblem(p)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors active:scale-95 ${
                  problems.includes(p)
                    ? 'bg-yellow border-yellow text-dark'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >{p}</button>
            ))}
          </div>
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-yellow text-dark rounded-2xl py-4 font-bold text-lg disabled:opacity-50 active:scale-95 transition-transform mb-4 shadow-sm"
        >
          {saving ? 'Registering…' : '✓  Register & Open Job Card'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <h3 className="font-bold text-dark text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  return `w-full border ${error ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-dark outline-none focus:border-yellow transition-all text-base`;
}
