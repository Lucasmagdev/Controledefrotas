import { AlertCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ChipSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function ChipSelect({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  error,
}: ChipSelectProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-3 input-enhanced">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        {label} {required && <span className="text-red-500 text-base">*</span>}
      </label>
      
      {/* Chips com design moderno */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className={`group relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 overflow-hidden ${
              value === suggestion
                ? 'gradient-primary text-white shadow-premium-colored scale-105'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-premium border border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="relative z-10">{suggestion}</span>
            {value === suggestion && (
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Input customizado */}
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white text-gray-900 font-medium placeholder:text-gray-400 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
          }`}
        />
        
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
