import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ImportUpload from './ImportUpload';
import ImportReview from './ImportReview';
import ImportSummary from './ImportSummary';
import { ImportService } from '../../services/ImportService';
import { IMPORT_TEMPLATE_B64 } from '../../assets/importTemplate.b64.js';

export default function ImportPage() {
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'summary'
  const [parseResult, setParseResult] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplate = () => {
    try {
      const binary = atob(IMPORT_TEMPLATE_B64);
      const bytes = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AllInBooks_ImportTemplate.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download template:', err);
    }
  };

  const handleFileSelect = async (file) => {
    try {
      setIsProcessing(true);
      const result = await ImportService.parse(file);
      setParseResult(result);
      setStep('review');
    } catch (err) {
      console.error('Failed to parse file:', err);
      alert('Error parsing file. Please ensure it is a valid .xlsx template.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      const newBatchId = await ImportService.commit(parseResult.valid, 'main');
      setBatchId(newBatchId);
      setStep('summary');
    } catch (err) {
      console.error('Failed to commit import:', err);
      alert('Error committing import. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setParseResult(null);
    setStep('upload');
  };

  const handleDone = () => {
    setParseResult(null);
    setBatchId(null);
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[100px]">
      <div className="px-4 pt-3 pb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Import Data</p>
      </div>
      
      <div className="px-4 space-y-6">
        
        {step === 'upload' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Need the Template?</h2>
            <p className="text-sm text-gray-500 mb-4 max-w-xs">
              Download our standard Excel template to fill in your historical data.
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-200 transition-colors shadow-sm w-full"
            >
              <Download size={18} />
              Download Import Template
            </button>
          </div>
        )}

        {isProcessing && step === 'upload' && (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!isProcessing && step === 'upload' && (
          <ImportUpload onFileSelect={handleFileSelect} />
        )}

        {step === 'review' && parseResult && (
          <ImportReview 
            parseResult={parseResult} 
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isCommitting={isProcessing}
          />
        )}

        {step === 'summary' && batchId && (
          <ImportSummary 
            batchId={batchId}
            rowCount={parseResult?.valid?.length || 0}
            onDone={handleDone}
            onUndo={ImportService.undo}
          />
        )}
      </div>
    </div>
  );
}
