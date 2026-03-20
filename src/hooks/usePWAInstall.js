import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!promptEvent) return;
    
    // Show the install prompt
    promptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    await promptEvent.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setPromptEvent(null);
  };

  return { canInstall: !!promptEvent, promptInstall };
}
