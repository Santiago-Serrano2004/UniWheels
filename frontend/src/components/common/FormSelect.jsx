import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronDown } from 'lucide-react';

export const FormSelect = ({
  label,
  value,
  onChange,
  options = [],
  children,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
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
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none text-xs rounded-2xl pl-3.5 pr-9 py-2.5 border font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-lochmara-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ${
            isDark
              ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
          } ${error ? 'border-rose-500 focus:ring-rose-500' : ''} ${selectClassName}`}
        >
          {options.length > 0
            ? options.map((opt, idx) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option
                    key={idx}
                    value={optValue}
                    className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  >
                    {optLabel}
                  </option>
                );
              })
            : children}
        </select>

        <ChevronDown
          className={`w-4 h-4 absolute right-3 pointer-events-none transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        />
      </div>

      {helperText && !error && (
        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{helperText}</p>
      )}
      {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
    </div>
  );
};
