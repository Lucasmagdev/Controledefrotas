import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se a app já está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('✅ App está instalado como PWA');
    }

    // Ouvir evento install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as InstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
      console.log('📦 Prompt de instalação disponível');
    };

    // Verificar se foi instalado
    const handleAppInstalled = () => {
      console.log('✅ App foi instalado como PWA');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt?.();
      const result = await deferredPrompt.userChoice;
      
      if (result?.outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalar a app');
        setShowPrompt(false);
      } else {
        console.log('❌ Usuário rejeitou a instalação');
      }
    } catch (error) {
      console.error('❌ Erro ao instalar:', error);
    }
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:max-w-xs z-50 animate-fade-in">
      <div className="flex gap-3 items-start">
        <div className="bg-red-100 p-2 rounded-lg">
          <Download className="w-5 h-5 text-red-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">Instalar App</h3>
          <p className="text-sm text-gray-600 mt-1">
            Instale o Sistema de Frotas como aplicativo para acesso rápido
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-red-700 hover:bg-red-800 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
