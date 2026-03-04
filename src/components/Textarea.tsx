import { TextareaHTMLAttributes, useState } from 'react';
import { AlertCircle, MessageSquare } from 'lucide-react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, required, className = '', ...props }: TextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxLength = props.maxLength || 500;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className="space-y-2 input-enhanced">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        {label} {required && <span className="text-red-500 text-base">*</span>}
      </label>
      <div className="relative group">
        <textarea
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white text-gray-900 font-medium placeholder:text-gray-400 min-h-[100px] resize-y ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
          } ${className}`}
          {...props}
        />
        
        {/* Contador de caracteres */}
        <div className="absolute bottom-3 right-3 text-xs font-medium text-gray-400">
          {charCount}/{maxLength}
        </div>

        {/* Barra de progresso no focus */}
        {isFocused && !error && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"></div>
        )}
      </div>
      
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 animate-slide-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
