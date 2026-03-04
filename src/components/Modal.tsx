import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-screen items-end sm:items-center justify-center p-2 sm:p-4">
        {/* Backdrop com blur */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div
          className={`relative glass rounded-2xl sm:rounded-3xl shadow-premium-lg w-full ${sizeClasses[size]} max-h-[92vh] overflow-hidden animate-scale-in`}
        >
          {/* Header Premium */}
          <div className="sticky top-0 glass-dark border-b border-white/10 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full gradient-primary"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="group relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(92vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
