// ============================================================
// ASSIGN ARTIST MODAL — Phase 5
// Bir karaktere seslendirme sanatçısı atar veya atamasını
// değiştirir. Mevcut sanatçı vurgulanır; atama kaldırılabilir.
// ============================================================

import { useState, useCallback } from 'react';
import {
  User,
  UserCheck,
  UserX,
  Mic2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MOCK_USERS } from '../../mock/users';
import { useProjects } from '../../context/ProjectContext';
import { cn } from '../../utils/cn';
import type { Character } from '../../types';

// ─── Sanatçı listesi (mock — gerçekte API'den gelir) ─────────
const VOICE_ARTISTS = MOCK_USERS.filter((u) => u.role === 'voice_artist');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  projectId: string;
  onSuccess?: (character: Character) => void;
}

// ─── Rol renk avatarı ─────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-indigo-700', 'bg-violet-700', 'bg-emerald-700',
  'bg-amber-700', 'bg-rose-700', 'bg-cyan-700',
];

function ArtistAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0', color)}>
      {initials}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────
export function AssignArtistModal({ isOpen, onClose, character, projectId, onSuccess }: Props) {
  const { assignArtist } = useProjects();

  const [selectedId, setSelectedId] = useState<string>(character.assignedArtistId ?? '');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredArtists = VOICE_ARTISTS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const artist = VOICE_ARTISTS.find((a) => a.id === selectedId);
      const updated = await assignArtist(projectId, character.id, {
        artistId: selectedId,
        artistName: artist?.name ?? 'Atanmamış',
      });
      if (updated) {
        onSuccess?.(updated);
        onClose();
      } else {
        setError('Atama sırasında bir hata oluştu.');
      }
    } catch {
      setError('Beklenmedik bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedId, assignArtist, projectId, character.id, onSuccess, onClose]);

  const handleRemove = useCallback(async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const updated = await assignArtist(projectId, character.id, {
        artistId: '',
        artistName: 'Atanmamış',
      });
      if (updated) {
        onSuccess?.(updated);
        onClose();
      }
    } catch {
      setError('Atama kaldırılırken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  }, [assignArtist, projectId, character.id, onSuccess, onClose]);

  const hasCurrentArtist = !!character.assignedArtistId;
  const isUnchanged = selectedId === (character.assignedArtistId ?? '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seslendirme Sanatçısı Ata"
      size="md"
    >
      {/* ── Karakter bilgisi ──────────────────────────────────── */}
      <div className="mb-5 p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-800/40 flex items-center justify-center shrink-0">
          <Mic2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-slate-200 font-semibold text-sm truncate">{character.name}</p>
          {character.description && (
            <p className="text-slate-500 text-xs truncate">{character.description}</p>
          )}
        </div>
        {hasCurrentArtist && (
          <div className="ml-auto shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">
              <UserCheck className="w-3 h-3" />
              Atanmış
            </span>
          </div>
        )}
      </div>

      {/* ── Mevcut sanatçı (varsa) ───────────────────────────── */}
      {hasCurrentArtist && (
        <div className="mb-4 p-3 bg-indigo-900/20 border border-indigo-800/30 rounded-xl">
          <p className="text-[11px] text-indigo-400/70 uppercase tracking-wider mb-2">Mevcut Atama</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArtistAvatar name={character.assignedArtistName!} />
              <div>
                <p className="text-slate-200 text-sm font-medium">{character.assignedArtistName}</p>
                <p className="text-slate-500 text-xs">
                  {VOICE_ARTISTS.find((a) => a.id === character.assignedArtistId)?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400
                         bg-red-900/20 border border-red-800/30 hover:bg-red-900/40
                         transition-colors disabled:opacity-50"
            >
              <UserX className="w-3.5 h-3.5" />
              Atamayı Kaldır
            </button>
          </div>
        </div>
      )}

      {/* ── Arama ────────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sanatçı ara..."
          className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl
                     text-slate-200 text-sm placeholder-slate-500
                     focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                     transition-colors"
        />
      </div>

      {/* ── Sanatçı listesi ───────────────────────────────────── */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-4">
        {/* "Atama yapma" seçeneği */}
        <button
          onClick={() => setSelectedId('')}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
            selectedId === ''
              ? 'bg-slate-700/60 border-slate-500 ring-1 ring-slate-500/30'
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/40'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-dashed border-slate-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Atama yapma</p>
            <p className="text-slate-600 text-xs">Sanatçı daha sonra atanabilir</p>
          </div>
          {selectedId === '' && (
            <CheckCircle2 className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
          )}
        </button>

        {filteredArtists.length === 0 && (
          <div className="py-6 text-center text-slate-600 text-sm">
            Sanatçı bulunamadı
          </div>
        )}

        {filteredArtists.map((artist) => {
          const isSelected = selectedId === artist.id;
          const isCurrent = character.assignedArtistId === artist.id;
          return (
            <button
              key={artist.id}
              onClick={() => setSelectedId(artist.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                isSelected
                  ? 'bg-indigo-900/30 border-indigo-600/50 ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/40'
              )}
            >
              <ArtistAvatar name={artist.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-slate-200 text-sm font-medium truncate">{artist.name}</p>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/30 shrink-0">
                      Mevcut
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs truncate">{artist.email}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Hata ─────────────────────────────────────────────── */}
      {error && (
        <p className="text-red-400 text-xs mb-3 px-1">{error}</p>
      )}

      {/* ── Aksiyonlar ───────────────────────────────────────── */}
      <div className="flex gap-3 pt-2 border-t border-slate-700/50">
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
          İptal
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={isUnchanged}
          leftIcon={<UserCheck className="w-4 h-4" />}
        >
          {selectedId
            ? (isUnchanged ? 'Değişiklik Yok' : 'Ata')
            : 'Atamasız Kaydet'}
        </Button>
      </div>
    </Modal>
  );
}
