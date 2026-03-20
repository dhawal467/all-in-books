import React, { useState } from 'react';
import { CheckCircle2, Building2, ArrowRight } from 'lucide-react';

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');

  const handleNext = () => {
    if (step === 2) {
      if (businessName.trim()) {
        const details = { name: businessName.trim(), address: '', phone: '', gstin: '' };
        localStorage.setItem('businessDetails', JSON.stringify(details));
      }
    }
    setStep(prev => prev + 1);
  };

  const handeFinish = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      {step === 1 && (
        <div className="w-full max-w-sm space-y-6 flex flex-col items-center animate-fade-in font-sans">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-3xl font-serif text-primary tracking-tight">Welcome to<br/>All in Books</h1>
          <p className="text-gray-500 leading-relaxed max-w-[280px]">
            The simplest, offline-first personal accounting app built for you.
          </p>
          <button
            onClick={handleNext}
            className="w-full py-4 mt-8 bg-accent text-white font-medium text-lg rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-sm space-y-6 flex flex-col items-center animate-fade-in font-sans">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
            <Building2 size={32} />
          </div>
          <h2 className="text-2xl font-serif text-primary tracking-tight">Your Business Name</h2>
          <p className="text-gray-500 text-sm max-w-[260px]">
            This name will be displayed on your invoices and reports.
          </p>
          
          <input
            type="text"
            placeholder="e.g. Ramesh Traders"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-4 py-4 min-h-[56px] bg-gray-50 border border-gray-200 rounded-xl text-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all text-center"
            autoFocus
          />

          <button
            onClick={handleNext}
            disabled={!businessName.trim()}
            className="w-full py-4 mt-4 bg-accent text-white font-medium text-lg rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-sm space-y-6 flex flex-col items-center animate-fade-in font-sans">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-serif text-primary tracking-tight">You're Ready!</h2>
          <p className="text-gray-500 leading-relaxed max-w-[280px]">
            Your data stays securely on your device. Let's record your first transaction.
          </p>
          <button
            onClick={handeFinish}
            className="w-full py-4 mt-8 bg-green-600 text-white font-medium text-lg rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
