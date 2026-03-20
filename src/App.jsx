import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import DriveAuth from './services/DriveAuth.js';
import { Settings } from 'lucide-react';
import { useUiStore } from './stores/uiStore';
import Toast from './components/Toast';
import Modal from './components/Modal';
import Sheet from './components/Sheet';
import FAB from './components/FAB';
import BottomNav from './components/BottomNav';
import StatusDot from './components/StatusDot';
import EmptyState from './components/EmptyState';
import EntryForm from './features/entries/EntryForm/EntryForm';
import EntriesPage from './features/entries/EntriesPage';
import EntryDetail from './features/entries/EntryDetail';
import PartiesPage from './features/parties/PartiesPage';
import PartyForm from './features/parties/PartyForm';
import Dashboard from './features/dashboard/Dashboard';
import InvoicesPage from './features/invoices/InvoicesPage';
import InvoiceForm from './features/invoices/InvoiceForm';
import ReportsPage from './features/reports/ReportsPage';
import SettingsPage from './features/settings/SettingsPage';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingFlow from './features/onboarding/OnboardingFlow';
import { useBackupSchedule } from './hooks/useBackupSchedule';

/**
 * Handles the Google OAuth 2.0 callback redirect.
 * Extracts `code` from the URL, exchanges it for tokens via DriveAuth,
 * then redirects the user to the Settings page.
 */
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      DriveAuth.handleCallback(code)
        .then(() => navigate('/settings', { replace: true }))
        .catch((err) => {
          console.error('DriveAuth callback error:', err);
          navigate('/settings', { replace: true });
        });
    } else {
      // No code present (e.g. user denied permission) — go back to settings
      navigate('/settings', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-gray-500 text-sm">Connecting to Google Drive…</p>
    </div>
  );
}

function App() {
  const { showToast, openModal } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => localStorage.getItem('hasSeenOnboarding') === 'true'
  );

  useBackupSchedule();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 pb-[80px] font-sans text-primary relative">
        {!hasSeenOnboarding && (
          <OnboardingFlow onComplete={() => setHasSeenOnboarding(true)} />
        )}
        
        {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary text-white flex items-center justify-between px-4 z-20 shadow-sm">
        <h1 className="font-serif text-xl tracking-wide m-0">All in Books</h1>
        <div className="flex items-center gap-3">
          <StatusDot />
          <button 
            onClick={() => navigate('/settings')}
            className="p-1 active:scale-95 transition-transform" 
            aria-label="Settings"
          >
            <Settings size={20} className="text-white/90" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 px-4 max-w-md mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          <Route path="/entries" element={<EntriesPage />} />
          
          <Route path="/parties" element={<PartiesPage />} />
          
          <Route path="/invoices" element={<InvoicesPage />} />

          <Route path="/reports" element={<ReportsPage />} />

          <Route path="/import" element={<ImportPage />} />

          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>

      {/* Overlays */}
      <Toast />
      
      <Modal name="testModal" title="Sample Modal">
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          This is a reusable modal component. It prevents background scrolling and uses a backdrop blur effect.
        </p>
        <div className="flex justify-end">
          <button 
            onClick={() => useUiStore.getState().closeModal('testModal')}
            className="px-4 min-h-[44px] bg-accent text-white rounded-lg active:scale-95 transition-transform font-medium"
          >
            Got it
          </button>
        </div>
      </Modal>

      <Sheet name="testSheet" title="Action Menu">
        <div className="flex flex-col gap-2 pb-safe">
          <button className="flex items-center w-full min-h-[48px] px-4 rounded-lg hover:bg-gray-100 transition-colors text-left font-medium">
            Export to Excel
          </button>
          <button className="flex items-center w-full min-h-[48px] px-4 rounded-lg hover:bg-gray-100 transition-colors text-left font-medium">
            Generate PDF
          </button>
        </div>
      </Sheet>

      {/* Entry Detail Sheet */}
      <Sheet name="entryDetail" title="Entry Details">
        {() => <EntryDetail />}
      </Sheet>

      {/* Entry Form Sheet */}
      <Sheet name="entryForm" title="New Entry">
        {() => <EntryForm />}
      </Sheet>

      {/* Party Form Sheet */}
      <Sheet name="partyForm" title="New Party">
        {() => <PartyForm />}
      </Sheet>

      {/* Party Statement Sheet */}
      <Sheet name="partyStatement" title="Party Statement">
        {() => <PartyStatement />}
      </Sheet>

      {/* Invoice Form Sheet */}
      <Sheet name="invoiceForm" title="New Invoice">
        {() => <InvoiceForm />}
      </Sheet>

      {/* Navigation */}
      {location.pathname !== '/parties' && location.pathname !== '/invoices' && location.pathname !== '/reports' && location.pathname !== '/import' && location.pathname !== '/settings' && <FAB onClick={() => openModal('entryForm')} />}
      <BottomNav />
    </div>
    </ErrorBoundary>
  );
}

export default App;
