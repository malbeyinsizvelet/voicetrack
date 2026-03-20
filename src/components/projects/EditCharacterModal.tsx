// ============================================================
// EDIT CHARACTER MODAL — Phase 4
// Mevcut karakter/cast bilgilerini düzenler.
// Tüm alanlar: ad, açıklama, ses notu, cinsiyet, öncelik,
// atanmış sanatçı, toplam replik, tamamlanan replik.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { Edit3, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useProjects } from '../../context/ProjectContext';
import { MOCK_USERS } from '../../mock/users';
import type { Character, CharacterFormData, CharacterGender, CharacterPriority } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  character: Character;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  lineCount?: string;
  completedCount?: string;
}

// ─── Options ──────────────────────────────────────────────────
const ARTIST_OPTIONS = [
  { value: '', label: '— Sanatçı atanmamış —' },
  ...MOCK_USERS.filter((u) => u.role === 'voice_artist').map((u) => ({
    value: u.id,
    label: u.name,
  })),
];

const GENDER_OPTIONS: { value: CharacterGender | ''; label: string }[] = [
  { value: '',        label: '— Belirtilmemiş —' },
  { value: 'male',    label: '♂ Erkek' },
  { value: 'female',  label: '♀ Kadın' },
  { value: 'neutral', label: '◎ Nötr / İkincil' },
  { value: 'unknown', label: '? Belirsiz' },
];

const PRIORITY_OPTIONS: { value: CharacterPriority; label: string }[] = [
  { value: 'critical', label: '🔴 Kritik — En yüksek öncelik' },
  { value: 'high',     label: '🟠 Yüksek' },
  { value: 'normal',   label: '⚪ Normal' },
  { value: 'low',      label: '⬇️ Düşük' },
];

// ─── Component ────────────────────────────────────────────────
export function EditCharacterModal({ isOpen, onClose, projectId, character, onSuccess }: Props) {
  const { updateCharacter } = useProjects();

  const [form, setForm] = useState<CharacterFormData>({
    name: character.name,
    description: character.description ?? '',
    voiceNotes: character.voiceNotes ?? '',
    gender: character.gender,
    priority: character.priority ?? 'normal',
    assignedArtistId: character.assignedArtistId ?? '',
    assignedArtistName: character.assignedArtistName ?? '',
    lineCount: character.lineCount ?? 0,
    completedCount: character.completedCount ?? 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Modal açıldığında formu sıfırla
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: character.name,
        description: character.description ?? '',
        voiceNotes: character.voiceNotes ?? '',
        gender: character.gender,
        priority: character.priority ?? 'normal',
        assignedArtistId: character.assignedArtistId ?? '',
        assignedArtistName: character.assignedArtistName ?? '',
        lineCount: character.lineCount ?? 0,
        completedCount: character.completedCount ?? 0,
      });
      setErrors({});
      setApiError('');
    }
  }, [isOpen, character]);

  // ── Field helpers ─────────────────────────────────────────
  const setField = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((p) => ({ ...p, [key]: undefined }));
    }
  };

  const handleArtistChange = (artistId: string) => {
    const artist = MOCK_USERS.find((u) => u.id === artistId);
    setForm((p) => ({
      ...p,
      assignedArtistId: artistId || undefined,
      assignedArtistName: artist?.name || '',
    }));
  };

  // ── Validation ───────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Karakter adı zorunludur.';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'En az 2 karakter olmalı.';
    }
    const lc = Number(form.lineCount);
    const cc = Number(form.completedCount);
    if (form.lineCount !== undefined && (isNaN(lc) || lc < 0)) {
      newErrors.lineCount = 'Geçerli bir sayı girin (0 veya üzeri).';
    }
    if (form.completedCount !== undefined && (isNaN(cc) || cc < 0)) {
      newErrors.completedCount = 'Geçerli bir sayı girin.';
    }
    if (!isNaN(lc) && !isNaN(cc) && cc > lc && lc > 0) {
      newErrors.completedCount = 'Tamamlanan, toplam replik sayısını geçemez.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError('');

    try {
      const payload: Partial<CharacterFormData> = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        voiceNotes: form.voiceNotes?.trim() || undefined,
        lineCount: Number(form.lineCount) || 0,
        completedCount: Number(form.completedCount) || 0,
        gender: form.gender || undefined,
        priority: form.priority || 'normal',
      };
      await updateCharacter(projectId, character.id, payload);
      onSuccess?.();
      onClose();
    } catch {
      setApiError('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, projectId, character.id, updateCharacter, onClose, onSuccess]);

  // ── Derived ──────────────────────────────────────────────
  const lineCount = Number(form.lineCount) || 0;
  const completedCount = Number(form.completedCount) || 0;
  const progress = lineCount > 0 ? Math.min(Math.round((completedCount / lineCount) * 100), 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Karakteri Düzenle"
      subtitle={character.name}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Değişiklikleri Kaydet
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* API Error */}
        {apiError && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{apiError}</p>
          </div>
        )}

        {/* ── Temel Bilgiler ─────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Temel Bilgiler
          </h4>
          <div className="space-y-4">
            <Input
              label="Karakter Adı"
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={errors.name}
              placeholder="ör. Kaptan Nova"
            />
            <Input
              label="Açıklama"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Karakterin kısa tanımı (isteğe bağlı)"
            />
          </div>
        </div>

        {/* ── Ses & Yönetmen Notu ────────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Ses Direktifi
          </h4>
          <Textarea
            label="Ses Notu / Yönetmen Direktifi"
            value={form.voiceNotes}
            onChange={(e) => setField('voiceNotes', e.target.value)}
            placeholder="ör. Orta-derin erkek sesi, otoriter ama sıcak. Ep01-03 öncelikli."
            rows={3}
          />
        </div>

        {/* ── Karakter Özellikleri ───────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Karakter Özellikleri
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ses Cinsiyeti"
              value={form.gender ?? ''}
              onChange={(e) => setField('gender', (e.target.value as CharacterGender) || undefined)}
              options={GENDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <Select
              label="Öncelik"
              value={form.priority ?? 'normal'}
              onChange={(e) => setField('priority', e.target.value as CharacterPriority)}
              options={PRIORITY_OPTIONS}
            />
          </div>
        </div>

        {/* ── Sanatçı Atama ──────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Sanatçı Atama
          </h4>
          <Select
            label="Seslendirme Sanatçısı"
            value={form.assignedArtistId ?? ''}
            onChange={(e) => handleArtistChange(e.target.value)}
            options={ARTIST_OPTIONS}
          />
        </div>

        {/* ── Replik Takibi ──────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Replik & İlerleme Takibi
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Toplam Replik Sayısı"
              type="number"
              min={0}
              value={form.lineCount ?? 0}
              onChange={(e) => setField('lineCount', Number(e.target.value))}
              error={errors.lineCount}
              hint="Bu karaktere ait toplam ses satırı"
            />
            <Input
              label="Tamamlanan Replik"
              type="number"
              min={0}
              max={form.lineCount ?? 0}
              value={form.completedCount ?? 0}
              onChange={(e) => setField('completedCount', Number(e.target.value))}
              error={errors.completedCount}
              hint="Onaylanan / biten replik sayısı"
            />
          </div>

          {/* Live progress preview */}
          {lineCount > 0 && (
            <div className="mt-3 bg-slate-900/40 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-500">Anlık İlerleme Önizlemesi</span>
                <span className="text-xs font-semibold text-indigo-400">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: progress >= 100 ? '#10b981' : progress >= 50 ? '#6366f1' : '#f59e0b',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
