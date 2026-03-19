import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function ImportUpload({ onFileSelect }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = null; // reset
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
        <UploadCloud size={32} />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-2">Upload Data</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Select your filled AllInBooks_ImportTemplate.xlsx file to securely import your data.
      </p>
      
      <label className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
        <UploadCloud size={20} />
        Choose .xlsx File
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange}
          className="hidden" 
        />
      </label>
    </div>
  );
}
