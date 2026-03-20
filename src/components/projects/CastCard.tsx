import { useState, useRef, useEffect } from 'react';
import {
  Mic2, User, UserPlus, MoreVertical, Edit3, Trash2,
  FileAudio, Upload, Clock, AlertTriangle, ArrowUp, Minus, StickyNote, FolderUp,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import { cn } from '../../utils/cn';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/formatters';
import { computeCastProgress } from '../../services/progressService';
import type { Character, Task, CharacterPriority, CharacterGender, Project } from '../../types';

const PRIORITY_CONFIG: Record<CharacterPriority, { label: string; icon: React.ReactNode }> = {
  critical: { label: 'Kritik',  icon: <AlertTriangle className="w-3 h-3" /> },
  high:     { label: 'Yüksek',  icon: <ArrowUp className="w-3 h-3" /> },
  normal:   { label: 'Normal',  icon: <Minus className="w-3 h-3" /> },
  low:      { label: 'Düşük',   icon: <Minus className="w-3 h-3" /> },
};

const GENDER_LABELS: Record<CharacterGender, string> = {
  male:    '♂ Erkek',
  female:  '♀ Kadın',
  neutral: '◎ Nötr',
  unknown: '? Belirsiz',
};

// ─── Artist Avatar ───────────────────────────────────────────
function ArtistAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold shrink-0',
        size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
      )}
      style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
    >
      {initials}
    </div>
  );
}

// ─── Action Menu ─────────────────────────────────────────────
function ActionMenu({ onEdit, onDelete, onUpload }: { onEdit: () => void; onDelete: () => void; onUpload?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 rounded-lg transition-colors vt-hover"
        style={{ color: 'var(--text-muted)' }}
        title="Aksiyonlar"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-20 w-44 rounded-xl overflow-hidden shadow-xl animate-scale-in"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
          }}
        >
          {onUpload && (
            <>
              <button
                onClick={() => { setOpen(false); onUpload(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors vt-hover"
                style={{ color: 'var(--text-primary)' }}
              >
                <FolderUp className="w-3.5 h-3.5" />
                Ses Yükle
              </button>
              <div style={{ borderTop: '1px solid var(--border)' }} />
            </>
          )}
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors vt-hover"
            style={{ color: 'var(--text-primary)' }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Düzenle
          </button>
          <div style={{ borderTop: '1px solid var(--border)' }} />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors vt-hover"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sil
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Micro Stat ──────────────────────────────────────────────
function MicroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

// ─── CastCard Props ──────────────────────────────────────────
interface CastCardProps {
  character: Character;
  task?: Task;
  project?: Project;
  canWrite: boolean;
  onEdit: (character: Character) => void;
  onDelete: (characterId: string) => void;
  onAssign?: (character: Character) => void;
  onUpload?: (character: Character) => void;
}

export function CastCard({ character, task, project, canWrite, onEdit, onDelete, onAssign, onUpload }: CastCardProps) {
  const castProgress = (project && task) ? computeCastProgress(project, task) : null;

  const lineCount      = castProgress?.totalLines     ?? character.lineCount     ?? task?.lineCount     ?? 0;
  const completedCount = castProgress?.completedLines ?? character.completedCount ?? 0;
  const progress       = castProgress?.progressPercent
    ?? (lineCount > 0 ? Math.min(Math.round((completedCount / lineCount) * 100), 100) : 0);

  const stackedSegments = castProgress ? [
    { value: castProgress.approvedLines,  colorClass: 'vt-progress-fill', label: 'Onaylı' },
    { value: castProgress.recordedLines,  colorClass: 'bg-white/40',      label: 'Yüklendi' },
    { value: castProgress.rejectedLines + castProgress.retakeLines, colorClass: 'bg-white/20', label: 'Red' },
    { value: castProgress.pendingLines,   colorClass: 'vt-progress-track', label: 'Bekliyor' },
  ] : null;

  const priority     = character.priority ?? 'normal';
  const priorityConf = PRIORITY_CONFIG[priority];
  const hasArtist    = !!character.assignedArtistName;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Top progress accent */}
      <div className="h-0.5 w-full" style={{ background: 'var(--progress-track)' }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, background: 'var(--progress-fill)' }}
        />
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Mic2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                {character.name}
              </h3>
              {character.description && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                  {character.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {priorityConf.icon}
                  {priorityConf.label}
                </span>

                {character.gender && character.gender !== 'unknown' && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {GENDER_LABELS[character.gender]}
                  </span>
                )}

                {task && (
                  <Badge
                    label={TASK_STATUS_LABELS[task.status]}
                    className={cn(TASK_STATUS_COLORS[task.status], 'text-[10px]')}
                  />
                )}
              </div>
            </div>
          </div>

          {canWrite && (
            <ActionMenu
              onEdit={() => onEdit(character)}
              onDelete={() => onDelete(character.id)}
              onUpload={onUpload ? () => onUpload(character) : undefined}
            />
          )}
        </div>

        {/* Progress section */}
        {lineCount > 0 ? (
          <div
            className="mb-4 rounded-xl p-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <CircularProgress percent={progress} size={48} strokeWidth={5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Replik İlerlemesi</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {completedCount}/{lineCount}
                  </span>
                </div>
                {stackedSegments ? (
                  <StackedProgress total={lineCount} segments={stackedSegments} height={5} />
                ) : (
                  <div className="h-1.5 rounded-full overflow-hidden vt-progress-track">
                    <div className="h-full rounded-full vt-progress-fill transition-all duration-700"
                         style={{ width: `${progress}%` }} />
                  </div>
                )}
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {progress >= 100 ? 'Tamamlandı' : progress >= 50 ? 'Devam Ediyor' : progress > 0 ? 'Başlangıç' : 'Henüz Başlanmadı'}
                </p>
              </div>
            </div>

            {castProgress && (
              <div
                className="grid grid-cols-4 gap-1 mt-2.5 pt-2.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <MicroStat value={castProgress.approvedLines} label="Onaylı" />
                <MicroStat value={castProgress.recordedLines} label="Yüklendi" />
                <MicroStat value={castProgress.rejectedLines + castProgress.retakeLines} label="Red" />
                <MicroStat value={castProgress.pendingLines} label="Bekliyor" />
              </div>
            )}
          </div>
        ) : (
          <div
            className="mb-4 rounded-xl p-3 border-dashed"
            style={{ border: '1px dashed var(--border-strong)' }}
          >
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Henüz ses dosyası yüklenmedi
            </p>
          </div>
        )}

        {/* Artist section */}
        <div
          className="rounded-xl p-3 mb-3"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <p
            className="text-[10px] mb-1.5 uppercase tracking-wider flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <User className="w-3 h-3" />
            Seslendirme Sanatçısı
          </p>

          {hasArtist ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ArtistAvatar name={character.assignedArtistName!} size="sm" />
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {character.assignedArtistName}
                </span>
              </div>
              {canWrite && onAssign && (
                <button
                  onClick={() => onAssign(character)}
                  title="Sanatçıyı değiştir"
                  className="shrink-0 p-1 rounded transition-colors vt-hover"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <UserPlus className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center border-dashed"
                  style={{ border: '1px dashed var(--border-strong)', background: 'var(--bg-hover)' }}
                >
                  <User className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                </div>
                <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Atanmamış</span>
              </div>
              {canWrite && onAssign && (
                <button
                  onClick={() => onAssign(character)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors vt-hover"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <UserPlus className="w-3 h-3" />
                  Ata
                </button>
              )}
            </div>
          )}
        </div>

        {/* Voice notes */}
        {character.voiceNotes && (
          <div
            className="rounded-xl p-3 mb-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <p className="text-[10px] mb-1 uppercase tracking-wider flex items-center gap-1"
               style={{ color: 'var(--text-muted)' }}>
              <StickyNote className="w-3 h-3" />
              Ses Notu
            </p>
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {character.voiceNotes}
            </p>
          </div>
        )}

        {/* Footer stats */}
        {task && (
          <div
            className="flex items-center gap-3 pt-2.5 text-[11px]"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <FileAudio className="w-3 h-3" />
              {task.sourceFiles.length} kaynak
            </span>
            <span className="flex items-center gap-1">
              <Upload className="w-3 h-3" />
              {task.recordedFiles.length} kayıt
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(task.dueDate))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
