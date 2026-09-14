import { Pressable, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';

type BannerType = 'error' | 'success' | 'info';

const CONFIG: Record<
  BannerType,
  { bg: string; border: string; text: string; desc: string; badgeBg: string; iconColor: string; Icon: any; defaultTitle: string }
> = {
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    text: 'text-rose-950 dark:text-rose-200',
    desc: 'text-rose-800 dark:text-rose-300',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
    iconColor: '#e11d48',
    Icon: AlertCircle,
    defaultTitle: 'Atención',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900',
    text: 'text-emerald-950 dark:text-emerald-200',
    desc: 'text-emerald-800 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconColor: '#10b981',
    Icon: CheckCircle2,
    defaultTitle: 'Completado',
  },
  info: {
    bg: 'bg-lochmara-50 dark:bg-slate-900',
    border: 'border-lochmara-200 dark:border-slate-800',
    text: 'text-lochmara-950 dark:text-lochmara-200',
    desc: 'text-lochmara-800 dark:text-lochmara-300',
    badgeBg: 'bg-lochmara-100 dark:bg-slate-800',
    iconColor: '#0284c7',
    Icon: Info,
    defaultTitle: 'Información',
  },
};

/** Equivalente a frontend/src/components/common/AlertBanner.jsx. */
export function AlertBanner({
  message,
  type = 'error',
  onClose,
  title,
}: {
  message?: string;
  type?: BannerType;
  onClose?: () => void;
  title?: string;
}) {
  if (!message) return null;
  const cfg = CONFIG[type];
  const Icon = cfg.Icon;

  return (
    <View className={`w-full p-3.5 rounded-2xl border flex-row items-start gap-3 ${cfg.bg} ${cfg.border}`}>
      <View className={`w-7 h-7 rounded-xl items-center justify-center shrink-0 mt-0.5 ${cfg.badgeBg}`}>
        <Icon size={16} color={cfg.iconColor} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className={`text-xs font-bold mb-0.5 ${cfg.text}`}>{title || cfg.defaultTitle}</Text>
        <Text className={`text-[11px] leading-relaxed font-medium ${cfg.desc}`}>{message}</Text>
      </View>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={6} className="p-0.5 -mr-1 -mt-1">
          <X size={14} color="#94a3b8" />
        </Pressable>
      )}
    </View>
  );
}
