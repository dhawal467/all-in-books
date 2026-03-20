import { useEffect } from 'react';
import DriveAuth from '../services/DriveAuth';
import BackupService from '../services/BackupService';

export function useBackupSchedule() {
  useEffect(() => {
    const checkAndRunBackup = async () => {
      // 1. Is user connected to Drive?
      if (!DriveAuth.isConnected()) return;

      // 2. Is today Sunday? (0 = Sunday in JS Date)
      const now = new Date();
      if (now.getDay() !== 0) return;

      // 3. Has it been > 6 days since the last backup?
      const lastBackupStr = localStorage.getItem('lastBackupAt');
      if (lastBackupStr) {
        const lastBackupTime = Number(lastBackupStr);
        const daysSinceLastBackup = (now.getTime() - lastBackupTime) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastBackup < 6) {
          // Backup already ran recently (e.g. earlier today)
          return;
        }
      }

      // 4. Conditions met, run backup silently
      try {
        console.log('[Auto-Backup] Conditions met. Starting background backup...');
        await BackupService.run();
        localStorage.setItem('lastBackupAt', now.getTime().toString());
        console.log('[Auto-Backup] Success');
      } catch (err) {
        console.error('[Auto-Backup] Failed to run automated backup contextually:', err);
      }
    };

    checkAndRunBackup();
  }, []);
}
