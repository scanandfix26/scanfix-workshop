import { useState, lazy, Suspense, useEffect } from 'react';
import { useJobs } from './hooks/useJobs';
import { useAuth } from './hooks/useAuth';
import BottomNav from './components/BottomNav';
import Calculator from './components/Calculator';
import LoadingSpinner from './components/LoadingSpinner';
import SyncBar from './components/SyncBar';
import Login from './pages/Login';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const NewEntry   = lazy(() => import('./pages/NewEntry'));
const ActiveJobs = lazy(() => import('./pages/ActiveJobs'));
const Completed  = lazy(() => import('./pages/Completed'));
const Revenue    = lazy(() => import('./pages/Revenue'));
const Search     = lazy(() => import('./pages/Search'));
const Settings   = lazy(() => import('./pages/Settings'));
const JobDetail  = lazy(() => import('./pages/JobDetail'));

export type Page = 'dashboard' | 'new-entry' | 'active' | 'completed' | 'revenue' | 'search' | 'settings';

export default function App() {
  const [page, setPage]               = useState<Page>('dashboard');
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [calcOpen, setCalcOpen]       = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const { authState, user, error: authError, login, logout, resetPassword } = useAuth();
  const jobsData = useJobs();

  // PWA install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setIsInstalled(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setShowInstallBanner(false); setInstallPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setShowInstallBanner(false); setInstallPrompt(null); }
  };

  const openDetail  = (id: string) => setDetailJobId(id);
  const closeDetail = () => setDetailJobId(null);
  const navigateTo  = (p: Page) => { setDetailJobId(null); setPage(p); };

  // ── Auth states ──────────────────────────────────────────────────────────────
  if (authState === 'loading') return <LoadingSpinner text="Starting Scan&Fix…" />;

  if (authState === 'unauthenticated' || !user) {
    return <Login onLogin={login} onReset={resetPassword} error={authError} />;
  }

  // ── Resolved install handler to pass down ─────────────────────────────────
  const installHandler = showInstallBanner && !isInstalled ? handleInstall
    : installPrompt && !isInstalled ? handleInstall
    : null;

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col max-w-md mx-auto relative">

      {/* Sync status bar */}
      <SyncBar
        status={jobsData.syncStatus}
        pendingCount={jobsData.pendingCount}
        lastSyncAt={jobsData.lastSyncAt}
        onSync={jobsData.syncNow}
      />

      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 px-3 pt-3">
          <div className="bg-dark rounded-2xl shadow-xl flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-yellow/10">
              <img src="/logo.png" alt="Scan & Fix" className="w-full h-full object-contain p-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Install Scan & Fix</p>
              <p className="text-gray-400 text-xs">Works offline · No internet needed</p>
            </div>
            <button onClick={handleInstall} className="bg-yellow text-dark text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 active:scale-95">Install</button>
            <button onClick={() => setShowInstallBanner(false)} className="text-gray-500 text-lg px-1 flex-shrink-0">✕</button>
          </div>
        </div>
      )}

      <Suspense fallback={<LoadingSpinner />}>
        {detailJobId ? (
          <JobDetail
            jobId={detailJobId}
            user={user}
            onBack={closeDetail}
            onSave={jobsData.saveJob}
            onDelete={jobsData.removeJob}
            onUpdateStatus={jobsData.updateStatus}
          />
        ) : page === 'dashboard' ? (
          <Dashboard
            stats={jobsData.stats}
            jobs={jobsData.activeJobs}
            user={user}
            onOpenDetail={openDetail}
            onNewEntry={() => navigateTo('new-entry')}
            onInstall={installHandler}
          />
        ) : page === 'new-entry' ? (
          <NewEntry
            onAdd={jobsData.addJob}
            onDone={(jobId) => { openDetail(jobId); }}
          />
        ) : page === 'active' ? (
          <ActiveJobs
            jobs={jobsData.activeJobs}
            user={user}
            onOpenDetail={openDetail}
            onUpdateStatus={jobsData.updateStatus}
          />
        ) : page === 'completed' ? (
          <Completed
            jobs={jobsData.completedJobs}
            onOpenDetail={openDetail}
          />
        ) : page === 'revenue' ? (
          <Revenue jobs={jobsData.jobs} />
        ) : page === 'search' ? (
          <Search
            jobs={jobsData.activeJobs}
            allJobs={jobsData.jobs}
            onOpenDetail={openDetail}
          />
        ) : page === 'settings' ? (
          <Settings
            user={user}
            reload={jobsData.reload}
            onInstall={installHandler}
            onLogout={logout}
            syncNow={jobsData.syncNow}
            syncStatus={jobsData.syncStatus}
          />
        ) : null}
      </Suspense>

      {!detailJobId && (
        <BottomNav current={page} onChange={navigateTo} user={user} />
      )}

      {/* Floating calculator button */}
      <button
        onClick={() => setCalcOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-dark shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
        aria-label="Calculator"
      >
        <span className="text-yellow text-lg font-bold">⌗</span>
      </button>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
    </div>
  );
}
