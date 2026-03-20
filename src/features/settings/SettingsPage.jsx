import React from 'react';
import BackupSettings from './BackupSettings';
import InvoiceSettings from './InvoiceSettings';
import CategorySettings from './CategorySettings';

export default function SettingsPage() {
  return (
    <div className="w-full h-full bg-gray-50 animate-fade-in pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage app preferences and data</p>
      </div>
      
      <BackupSettings />
      <InvoiceSettings />
      <CategorySettings />
    </div>
  );
}
