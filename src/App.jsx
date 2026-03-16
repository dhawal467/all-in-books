import React from 'react';
import { useUiStore } from './stores/uiStore';
import Toast from './components/Toast';
import Modal from './components/Modal';
import Sheet from './components/Sheet';
import FAB from './components/FAB';
import BottomNav from './components/BottomNav';
import StatusDot from './components/StatusDot';
import EmptyState from './components/EmptyState';
import { FileText } from 'lucide-react';

function App() {
  const { showToast, openModal, activeTab } = useUiStore();

  return (
    <div className="min-h-screen bg-gray-50 pb-[80px] font-sans text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary text-white flex items-center justify-between px-4 z-20 shadow-sm">
        <h1 className="font-serif text-xl tracking-wide m-0">All in Books</h1>
        <StatusDot />
      </header>

      {/* Main Content Area */}
      <main className="pt-16 px-4 max-w-md mx-auto w-full">
        {activeTab === 0 && (
          <div className="space-y-4 pb-[80px]">
            <h2 className="font-serif text-lg">UI Component Sandbox</h2>
            
            <div className="bg-white p-4 rounded-[12px] border border-[#B8D0E8] shadow-sm space-y-4">
              <h3 className="font-medium">Toasts (min 44px target)</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => showToast('Income recorded successfully!', 'success')}
                  className="px-4 min-h-[44px] bg-income text-white rounded-lg active:scale-95 transition-transform font-medium"
                >
                  Success Toast
                </button>
                <button 
                  onClick={() => showToast('Failed to save entry', 'error')}
                  className="px-4 min-h-[44px] bg-expense text-white rounded-lg active:scale-95 transition-transform font-medium"
                >
                  Error Toast
                </button>
                <button 
                  onClick={() => showToast('Please check the internet connection', 'warning')}
                  className="px-4 min-h-[44px] bg-warning text-white rounded-lg active:scale-95 transition-transform font-medium"
                >
                  Warning Toast
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[12px] border border-[#B8D0E8] shadow-sm space-y-4">
              <h3 className="font-medium">Overlays</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => openModal('testModal')}
                  className="px-4 min-h-[44px] bg-accent/10 text-accent font-medium rounded-lg active:scale-95 transition-transform"
                >
                  Open Modal
                </button>
                <button 
                  onClick={() => openModal('testSheet')}
                  className="px-4 min-h-[44px] bg-accent/10 text-accent font-medium rounded-lg active:scale-95 transition-transform"
                >
                  Open Sheet
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-[12px] border border-[#B8D0E8] shadow-sm">
              <h3 className="font-medium mb-2">Empty State (No CTA)</h3>
              <div className="border border-dashed border-gray-300 rounded-lg">
                <EmptyState 
                  icon={FileText} 
                  title="No entries yet" 
                  message="Your recent transactions will appear here." 
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-[12px] border border-[#B8D0E8] shadow-sm">
              <h3 className="font-medium mb-2">Empty State (With CTA)</h3>
              <div className="border border-dashed border-gray-300 rounded-lg">
                <EmptyState 
                  icon={FileText} 
                  title="No entries yet" 
                  message="Start by adding your first income or expense."
                  ctaText="Add Entry"
                  onCtaClick={() => showToast('CTA Clicked!', 'success')}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab !== 0 && (
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-gray-400">Content for Tab {activeTab}</p>
          </div>
        )}
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
          <button className="flex items-center w-full min-h-[48px] px-4 rounded-lg hover:bg-red-50 text-expense transition-colors text-left font-medium">
            Delete Entry
          </button>
        </div>
      </Sheet>

      {/* Navigation */}
      <FAB onClick={() => showToast('FAB Clicked! Opens Entry Form.', 'success')} />
      <BottomNav />
    </div>
  );
}

export default App;
