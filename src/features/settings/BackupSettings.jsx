import React, { useState, useEffect } from 'react';
import DriveAuth from '../../services/DriveAuth';
import BackupService from '../../services/BackupService';
import ExportService from '../../services/ExportService';
import { useUiStore } from '../../stores/uiStore';
import { Cloud, CloudOff, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function BackupSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { showToast } = useUiStore();

  useEffect(() => {
    setIsConnected(DriveAuth.isConnected());
    const saved = localStorage.getItem('lastBackupAt');
    if (saved) {
      setLastBackup(parseInt(saved, 10));
    }
  }, []);

  const handleConnect = () => {
    DriveAuth.connect(); // This redirects the browser
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      await BackupService.run();
      setLastBackup(Date.now());
      showToast('Backup successful!', 'success');
    } catch (err) {
      console.error('Backup failed:', err);
      showToast('Backup failed. Please try again.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect Google Drive? Backups will stop working.')) {
      DriveAuth.disconnect();
      setIsConnected(false);
      setLastBackup(null);
      showToast('Google Drive disconnected', 'success');
    }
  };

  const handleExcelExport = async () => {
    try {
      const buffer = await ExportService.generate();
      const dateStr = new Date().toISOString().split('T')[0];
      ExportService.downloadNow(buffer, `AllInBooks_Export_${dateStr}.xlsx`);
      showToast('Excel export ready!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
          {isConnected ? <Cloud size={24} /> : <CloudOff size={24} />}
        </div>
        <div>
          <h2 className="text-base font-semibold text-primary">Google Drive Backup</h2>
          <p className="text-xs text-gray-500">
            {isConnected ? 'Connected to Google Drive' : 'Sync your data securely'}
          </p>
        </div>
      </div>

      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full py-3 px-4 bg-accent text-white rounded-lg font-medium active:scale-[0.98] transition-all hover:bg-accent/90"
        >
          Connect Google Drive
        </button>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">Last Backup:</span>{' '}
            {lastBackup ? new Date(lastBackup).toLocaleString() : 'Never'}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-accent text-white rounded-lg font-medium active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Backing up…
                </>
              ) : (
                'Backup Now'
              )}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isBackingUp}
              className="py-3 px-4 border border-gray-200 text-red-600 rounded-lg font-medium active:scale-[0.98] transition-all hover:bg-red-50 disabled:opacity-70"
            >
              Disconnect
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleExcelExport}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 text-green-700 rounded-lg font-medium active:scale-[0.98] transition-all hover:bg-green-100 border border-green-100"
            >
              <FileSpreadsheet size={18} />
              Export to Excel (.xlsx)
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-2 italic">
              Downloads all your data to this device (Offline)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
