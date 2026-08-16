import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, CheckCircle2, Info } from 'lucide-react';

export const AlertBanner = ({
  message,
  type = 'error', // 'error' | 'success' | 'info'
  onClose,
  title,
}) => {
  if (!message) return null;

  const config = {
    error: {
      bg: 'bg-rose-50/90',
      border: 'border-rose-200/90',
      text: 'text-rose-950',
      descText: 'text-rose-800',
      badgeBg: 'bg-rose-100 text-rose-600',
      icon: AlertCircle,
      defaultTitle: 'Atención',
    },
    success: {
      bg: 'bg-emerald-50/90',
      border: 'border-emerald-200/90',
      text: 'text-emerald-950',
      descText: 'text-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-600',
      icon: CheckCircle2,
      defaultTitle: 'Completado',
    },
    info: {
      bg: 'bg-lochmara-50/90',
      border: 'border-lochmara-200/90',
      text: 'text-lochmara-950',
      descText: 'text-lochmara-800',
      badgeBg: 'bg-lochmara-100 text-lochmara-600',
      icon: Info,
      defaultTitle: 'Información',
    },
  }[type] || config.error;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`w-full p-3.5 rounded-2xl ${config.bg} border ${config.border} shadow-2xs flex items-start gap-3 select-none text-left`}
    >
      <div className={`w-7 h-7 rounded-xl ${config.badgeBg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-xs font-bold ${config.text} leading-none mb-1`}>
          {title || config.defaultTitle}
        </p>
        <p className={`text-[11px] ${config.descText} leading-relaxed font-medium`}>
          {message}
        </p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};
