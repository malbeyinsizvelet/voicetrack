// ============================================================
// DOWNLOAD BUTTON — Phase 10
// Tip-aware (source / recorded), durum-aware indirme butonu.
//
// Props:
//   - file?      → AudioFile (yoksa disabled + tooltip)
//   - type       → 'source' | 'recorded'
//   - userRole   → erişim kontrolü
//   - userId     → kendi kaydı mı kontrolü
//   - ownerId    → recorded dosyanın sahibi
//   - variant    → 'icon' | 'compact' | 'full'
// ============================================================

import { useState } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  FileAudio,
  Mic2,
  Lock,
} from 'lucide-react';
import {
  downloadFile,
  canDownloadSource,
  canDownloadRecorded,
  getUnavailableReason,
} from '../../services/downloadService';
import type { AudioFile, UserRole } from '../../types';
import type { DownloadType, DownloadState } from '../../services/downloadService';
import { cn } from '../../utils/cn';

// ─── Config ──────────────────────────────────────────────────

const TYPE_CONFIG = {
  source: {
    label: 'Orijinali İndir',
    shortLabel: 'Orijinal',
    icon: <FileAudio className="w-3.5 h-3.5" />,
    iconSmall: <FileAudio className="w-3 h-3" />,
    idleClass: 'text-indigo-300 border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-400',
    activeClass: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10 cursor-wait',
    doneClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
    errorClass: 'text-red-400 border-red-500/40 bg-red-500/5',
  },
  recorded: {
    label: 'Kaydı İndir',
    shortLabel: 'Kayıt',
    icon: <Mic2 className="w-3.5 h-3.5" />,
    iconSmall: <Mic2 className="w-3 h-3" />,
    idleClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-400',
    activeClass: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 cursor-wait',
    doneClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20',
    errorClass: 'text-red-400 border-red-500/40 bg-red-500/5',
  },
} as const;

// ─── Props ───────────────────────────────────────────────────

interface Props {
  /** Dosya yok → disabled + tooltip */
  file?: AudioFile;
  type: DownloadType;
  userRole: UserRole;
  userId: string;
  /** Recorded dosyanın sahibi — artist erişim kontrolü için */
  ownerId?: string;
  /** Görünüm varyantı */
  variant?: 'icon' | 'compact' | 'full';
  className?: string;
  /** Test / demo: erişim iznini dışarıdan override et */
  forceDisabled?: boolean;
}

// ─── Bileşen ─────────────────────────────────────────────────

export function DownloadButton({
  file,
  type,
  userRole,
  userId,
  ownerId,
  variant = 'compact',
  className,
  forceDisabled = false,
}: Props) {
  const [dlState, setDlState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const cfg = TYPE_CONFIG[type];

  // ── Erişim kontrolü ──────────────────────────────────────
  const hasAccess =
    !forceDisabled &&
    (type === 'source'
      ? canDownloadSource(userRole)
      : canDownloadRecorded(userRole, userId, ownerId));

  const fileExists = !!file;
  const isAvailable = hasAccess && fileExists;

  const unavailableReason = !fileExists
    ? getUnavailableReason(type, false)
    : !hasAccess
    ? 'Erişim yetkiniz yok'
    : '';

  // ── Handler ──────────────────────────────────────────────
  const handleClick = async () => {
    if (!isAvailable || dlState === 'downloading' || dlState === 'preparing') return;
    if (!file) return;

    setDlState('preparing');
    setProgress(0);
    setErrorMsg('');

    const result = await downloadFile({
      file,
      type,
      userRole,
      userId,
      ownerId,
      onProgress: (pct) => {
        setDlState('downloading');
        setProgress(pct);
      },
    });

    if (result.success) {
      setDlState('done');
      setProgress(100);
      setTimeout(() => {
        setDlState('idle');
        setProgress(0);
      }, 3000);
    } else {
      setDlState('error');
      setErrorMsg(result.error ?? 'İndirme başarısız');
      setTimeout(() => {
        setDlState('idle');
        setErrorMsg('');
      }, 3000);
    }
  };

  // ── İkon seçici ──────────────────────────────────────────
  const stateIcon = () => {
    if (dlState === 'preparing' || dlState === 'downloading')
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    if (dlState === 'done')
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (dlState === 'error')
      return <XCircle className="w-3.5 h-3.5" />;
    if (!isAvailable)
      return !hasAccess
        ? <Lock className="w-3.5 h-3.5" />
        : <Download className="w-3.5 h-3.5 opacity-30" />;
    return <Download className="w-3.5 h-3.5" />;
  };

  const stateIconSmall = () => {
    if (dlState === 'preparing' || dlState === 'downloading')
      return <Loader2 className="w-3 h-3 animate-spin" />;
    if (dlState === 'done')
      return <CheckCircle2 className="w-3 h-3" />;
    if (dlState === 'error')
      return <XCircle className="w-3 h-3" />;
    if (!isAvailable)
      return !hasAccess
        ? <Lock className="w-3 h-3" />
        : <Download className="w-3 h-3 opacity-30" />;
    return <Download className="w-3 h-3" />;
  };

  const stateLabel = () => {
    if (dlState === 'preparing') return 'Hazırlanıyor...';
    if (dlState === 'downloading') return `${progress}%`;
    if (dlState === 'done') return 'İndirildi!';
    if (dlState === 'error') return errorMsg.length > 24 ? 'Hata oluştu' : errorMsg;
    if (!fileExists) return unavailableReason;
    if (!hasAccess) return 'Yetkisiz';
    return cfg.label;
  };

  const buttonClass = () => {
    if (!isAvailable) return 'text-slate-600 border-slate-700/40 bg-slate-800/30 cursor-not-allowed';
    if (dlState === 'done') return cfg.doneClass;
    if (dlState === 'error') return cfg.errorClass;
    if (dlState === 'downloading' || dlState === 'preparing') return cfg.activeClass;
    return cfg.idleClass;
  };

  const title = unavailableReason || stateLabel();

  // ── VARIANT: icon ─────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={!isAvailable || dlState === 'downloading' || dlState === 'preparing'}
        title={title}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-md transition-all border',
          buttonClass(),
          className
        )}
      >
        {stateIconSmall()}
      </button>
    );
  }

  // ── VARIANT: compact ──────────────────────────────────────
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={!isAvailable || dlState === 'downloading' || dlState === 'preparing'}
        title={title}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
          buttonClass(),
          className
        )}
      >
        {dlState === 'idle' || !isAvailable ? cfg.iconSmall : stateIconSmall()}
        <span className="truncate">{cfg.shortLabel}</span>
        {dlState === 'downloading' && (
          <span className="ml-1 font-mono tabular-nums">{progress}%</span>
        )}
      </button>
    );
  }

  // ── VARIANT: full ─────────────────────────────────────────
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleClick}
        disabled={!isAvailable || dlState === 'downloading' || dlState === 'preparing'}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border',
          buttonClass()
        )}
      >
        {/* Tip ikonu (sol) */}
        <span className="shrink-0">{cfg.icon}</span>

        {/* Metin */}
        <span className="flex-1 text-left truncate">{stateLabel()}</span>

        {/* Durum ikonu (sağ) */}
        <span className="shrink-0">{stateIcon()}</span>
      </button>

      {/* Progress bar alt çizgi */}
      {dlState === 'downloading' && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-current rounded-full transition-all duration-200"
          style={{ width: `${progress}%`, opacity: 0.6 }}
        />
      )}
    </div>
  );
}
