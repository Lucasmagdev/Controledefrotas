import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    
    // Animação de progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onClose, duration]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div
        className={`relative overflow-hidden glass rounded-2xl shadow-premium-lg min-w-[320px] max-w-md ${
          type === 'success'
            ? 'border-2 border-green-500/30'
            : 'border-2 border-red-500/30'
        }`}
      >
        {/* Barra de progresso */}
        <div className="absolute top-0 left-0 h-1 bg-white/20">
          <div
            className={`h-full transition-all duration-50 ${
              type === 'success'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-4 p-5 pt-6">
          {/* Ícone com animação */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg animate-bounce-in ${
              type === 'success'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}
          >
            {type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : (
              <XCircle className="w-6 h-6 text-white" />
            )}
          </div>

          {/* Mensagem */}
          <div className="flex-1 pt-1">
            <p className="text-sm font-bold text-gray-900 mb-1">
              {type === 'success' ? 'Sucesso!' : 'Erro!'}
            </p>
            <p className="text-sm text-gray-700 font-medium leading-relaxed">{message}</p>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/50 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
