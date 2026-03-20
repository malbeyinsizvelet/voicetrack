// CastCard – stub
import type { Character, Task, Project } from '../../types';

interface CastCardProps {
  character: Character;
  task?: Task;
  project?: Project;
  canWrite: boolean;
  isArtist?: boolean;
  currentUserId?: string;
  onEdit: (character: Character) => void;
  onDelete: (characterId: string) => void;
  onAssign?: (character: Character) => void;
  onUpload?: (character: Character) => void;
  onTaskClick?: () => void;
}

export function CastCard({ character, canWrite, onEdit, onDelete, onAssign, onUpload }: CastCardProps) {
  return (
    <div className="p-4 rounded-xl border transition-colors" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{character.name}</p>
          {character.assignedArtistName && (
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{character.assignedArtistName}</p>
          )}
        </div>
        {canWrite && (
          <div className="flex gap-1 shrink-0">
            {onUpload && <button onClick={() => onUpload(character)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }} title="Yükle">↑</button>}
            {onAssign && <button onClick={() => onAssign(character)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }} title="Ata">👤</button>}
            <button onClick={() => onEdit(character)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }} title="Düzenle">✏️</button>
            <button onClick={() => onDelete(character.id)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }} title="Sil">🗑️</button>
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{character.lineCount ?? 0} replik · {character.completedCount ?? 0} tamamlandı</p>
    </div>
  );
}
