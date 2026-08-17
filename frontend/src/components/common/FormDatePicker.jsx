import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Calendar } from 'lucide-react';

export const FormDatePicker = ({
  label,
  value,
  onChange,
  min,
  max,
  icon: Icon = Calendar,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  helperText,
  error,
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <span className="flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-lochmara-500" />}
            <span>{label}</span>
          </span>
          {required && <span className="text-[10px] text-rose-500 font-semibold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="date"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={`w-full text-xs rounded-2xl px-3.5 py-2.5 border font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-lochmara-500 cursor-pointer disabled:opacity-50 shadow-2xs ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
          } ${error ? 'border-rose-500 focus:ring-rose-500' : ''} ${inputClassName}`}
        />
      </div>

      {helperText && !error && (
        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{helperText}</p>
      )}
      {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
    </div>
  );
};
