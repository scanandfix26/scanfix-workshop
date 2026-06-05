import { useState } from 'react';
import { getAllJobs, clearAllJobs, exportBackup, importBackup } from '../db';
import { exportCSV, exportPDF } from '../utils/export';
import type { SyncStatus } from '../hooks/useJobs';
import type { AppUser } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface Props {
  user: AppUser;
  reload: () => void;
  onInstall: (() => void) | null;
  onLogout: () => void;
  syncNow: () => void;
  syncStatus: SyncStatus;
}

export default function Settings({ user, reload, onInstall, onLogout, syncNow, syncStatus }: Props) {
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const toast = (m: string, type: 'success' | 'error' = 'success') => {
    setMsg(m); setMsgType(type); setTimeout(() => setMsg(''), 3000);
  };

  const handleExportCSV = async () => {
    const jobs = await getAllJobs();
    if (!jobs.length) { toast('No records to export', 'error'); return; }
    exportCSV(jobs);
    toast('CSV exported!');
  };

  const handleExportPDF = async () => {
    const jobs = await getAllJobs();
    if (!jobs.length) { toast('No records to export', 'error'); return; }
    await exportPDF(jobs);
    toast('PDF exported!');
  };

  const handleBackup = async () => {
    const json = await exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanfix-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded!');
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        await importBackup(text);
        reload();
        toast('Backup restored!');
      } catch {
        toast('Invalid backup file', 'error');
      }
    };
    input.click();
  };

  const handleClear = async () => {
    if (!confirm('Delete ALL workshop data? This cannot be undone!')) return;
    if (!confirm('Final confirmation: permanently delete everything?')) return;
    await clearAllJobs();
    reload();
    toast('All data cleared');
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="bg-dark px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm">Manage data, export & account</p>
      </div>

      {msg && (
        <div className={`mx-4 mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
          msgType === 'success' ? 'bg-green-500 text-white' : 'bg-red-100 text-red-700'
        }`}>{msg}</div>
      )}

      <div className="px-4 pt-4 space-y-4">

        {/* Profile */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow/20 rounded-2xl flex items-center justify-center text-2xl">
            {user.role === 'admin' ? '👨‍💼' : user.role === 'mechanic' ? '🔧' : '👷'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-dark">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <span className="text-xs bg-yellow/20 text-yellow-700 font-semibold px-2 py-0.5 rounded-full capitalize">{user.role}</span>
          </div>
          <button onClick={onLogout} className="bg-gray-100 text-gray-600 text-sm font-semibold px-3 py-2 rounded-xl active:scale-95">
            Logout
          </button>
        </div>

        {/* Cloud Sync */}
        {isSupabaseConfigured && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-dark text-sm uppercase tracking-wide mb-3">☁️ Cloud Sync</h3>
            <ActionButton
              icon="🔄"
              label={syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'offline' ? 'Offline' : 'Sync Now'}
              sub="Push & pull records from cloud"
              onClick={() => { syncNow(); toast('Sync started…'); }}
              color="blue"
            />
          </div>
        )}

        {/* Export */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-dark text-sm uppercase tracking-wide mb-3">Export Records</h3>
          <div className="space-y-2">
            <ActionButton icon="📊" label="Export as CSV" sub="Spreadsheet format" onClick={handleExportCSV} color="blue" />
            <ActionButton icon="📕" label="Export as PDF" sub="Printable report" onClick={handleExportPDF} color="red" />
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-dark text-sm uppercase tracking-wide mb-3">Backup & Restore</h3>
          <div className="space-y-2">
            <ActionButton icon="💾" label="Download Backup" sub="Save full database as JSON" onClick={handleBackup} color="yellow" />
            <ActionButton icon="📂" label="Restore Backup" sub="Import from backup file" onClick={handleRestore} color="blue" />
          </div>
        </div>

        {/* Install */}
        {onInstall && (
          <div className="bg-dark rounded-2xl p-4">
            <h3 className="font-bold text-yellow text-sm uppercase tracking-wide mb-1">Install App</h3>
            <p className="text-gray-400 text-xs mb-3">Add to home screen — works offline</p>
            <button onClick={onInstall} className="w-full flex items-center justify-center gap-2 bg-yellow text-dark rounded-xl py-3.5 font-bold active:scale-95">
              <span>⬇</span> Install Scan & Fix
            </button>
          </div>
        )}

        {/* Danger Zone (admin only) */}
        {user.role === 'admin' && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <h3 className="font-bold text-red-600 text-sm uppercase tracking-wide mb-3">⚠️ Danger Zone</h3>
            <ActionButton icon="🗑️" label="Clear All Data" sub="Permanently delete all jobs" onClick={handleClear} color="danger" />
          </div>
        )}

        {/* About */}
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden bg-yellow/10">
            <img src="/logo.png" alt="Scan & Fix" className="w-full h-full object-contain p-1" />
          </div>
          <p className="font-bold text-dark text-lg">Scan<span className="text-yellow">&</span>Fix</p>
          <p className="text-gray-400 text-sm">Workshop Management v2.0</p>
          <p className="text-gray-300 text-xs mt-1">Offline-first · Multi-device · PWA</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, sub, onClick, color }: {
  icon: string; label: string; sub: string; onClick: () => void; color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
    yellow: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
  };
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${colors[color] || 'bg-gray-50 text-gray-600'} active:scale-98 text-left`}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs opacity-70">{sub}</p>
      </div>
    </button>
  );
}
