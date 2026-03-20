// AssignArtistModal – GitHub'dan çekildi
import { useState, useCallback } from 'react';
import { User, UserCheck, UserX, Mic2, CheckCircle2, Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MOCK_USERS } from '../../mock/users';
import { useProjects } from '../../context/ProjectContext';
import { cn } from '../../utils/cn';
import type { Character } from '../../types';

const VOICE_ARTISTS = MOCK_USERS.filter((u) => u.role === 'voice_artist');
const AVATAR_COLORS = ['bg-indigo-700','bg-violet-700','bg-emerald-700','bg-amber-700','bg-rose-700','bg-cyan-700'];

function ArtistAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0', color)}>{initials}</div>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  projectId: string;
  onSuccess?: (character: Character) => void;
}

export function AssignArtistModal({ isOpen, onClose, character, projectId, onSuccess }: Props) {
  const { assignArtist } = useProjects();
  const [selectedId, setSelectedId] = useState<string>(character.assignedArtistId ?? '');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredArtists = VOICE_ARTISTS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = useCallback(async () => {
    setError(''); setIsSubmitting(true);
    try {
      const artist = VOICE_ARTISTS.find((a) => a.id === selectedId);
      const updated = await assignArtist(projectId, character.id, { artistId: selectedId, artistName: artist?.name ?? 'Atanmamış' });
      if (updated) { onSuccess?.(updated); onClose(); }
      else setError('Atama sırasında bir hata oluştu.');
    } catch { setError('Beklenmedik bir hata oluştu.'); }
    finally { setIsSubmitting(false); }
  }, [selectedId, assignArtist, projectId, character.id, onSuccess, onClose]);

  const handleRemove = useCallback(async () => {
    setError(''); setIsSubmitting(true);
    try {
      const updated = await assignArtist(projectId, character.id, { artistId: '', artistName: 'Atanmamış' });
      if (updated) { onSuccess?.(updated); onClose(); }
    } catch { setError('Atama kaldırılırken hata oluştu.'); }
    finally { setIsSubmitting(false); }
  }, [assignArtist, projectId, character.id, onSuccess, onClose]);

  const hasCurrentArtist = !!character.assignedArtistId;
  const isUnchanged = selectedId === (character.assignedArtistId ?? '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seslendirme Sanatçısı Ata" size="md">
      <div className="mb-5 p-4 rounded-xl border flex items-center gap-3" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-hover)' }}>
          <Mic2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{character.name}</p>
          {character.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{character.description}</p>}
        </div>
        {hasCurrentArtist && (
          <div className="ml-auto shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>
              <UserCheck className="w-3 h-3" /> Atanmış
            </span>
          </div>
        )}
      </div>

      {error && <div className="mb-4 text-sm text-red-400 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>{error}</div>}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sanatçı ara…"
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
        <button onClick={() => setSelectedId('')}
          className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors', !selectedId && 'ring-1')}
          style={{ background: !selectedId ? 'var(--bg-active)' : 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          <User className="w-8 h-8 rounded-full p-1.5 shrink-0" style={{ background: 'var(--bg-hover)' }} />
          <span className="flex-1 text-left">Atanmamış</span>
          {!selectedId && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        </button>
        {filteredArtists.map((a) => (
          <button key={a.id} onClick={() => setSelectedId(a.id)}
            className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors', selectedId === a.id && 'ring-1')}
            style={{ background: selectedId === a.id ? 'var(--bg-active)' : 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            <ArtistAvatar name={a.name} />
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium truncate">{a.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{a.email}</p>
            </div>
            {selectedId === a.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        {hasCurrentArtist && <Button variant="ghost" onClick={handleRemove} isLoading={isSubmitting} leftIcon={<UserX className="w-3.5 h-3.5" />}>Kaldır</Button>}
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>İptal</Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={isUnchanged}>Kaydet</Button>
      </div>
    </Modal>
  );
}
