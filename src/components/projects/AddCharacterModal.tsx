// ============================================================
// ADD CHARACTER MODAL — Phase 4 (güncellendi)
// Projeye yeni karakter ekler; opsiyonel olarak sanatçı atar.
// Yeni: gender, priority, lineCount, completedCount alanları.
// Karakter oluşturulduğunda otomatik bir Task da oluşur.
// ============================================================

import { useState, useCallback } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useProjects } from '../../context/ProjectContext';
import { MOCK_USERS } from '../../mock/users';
import type { CharacterFormData, CharacterGender, CharacterPriority } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  lineCount?: string;
}

// ─── Options ──────────────────────────────────────────────────
const ARTIST_OPTIONS = [
  { value: '', label: '— Atama yapma (sonradan eklenebilir) —' },
  ...MOCK_USERS.filter((u) => u.role === 'voice_artist').map((u) => ({
    value: u.id,
    label: u.name,
  })),
];

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: '',        label: '— Belirtilmemiş —' },
  { value: 'male',    label: '♂ Erkek' },
  { value: 'female',  label: '♀ Kadın' },
  { value: 'neutral', label: '◎ Nötr / İkincil' },
  { value: 'unknown', label: '? Belirsiz' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'critical', label: '🔴 Kritik — En yüksek öncelik' },
  { value: 'high',     label: '🟠 Yüksek' },
  { value: 'normal',   label: '⚪ Normal' },
  { value: 'low',      label: '⬇️ Düşük' },
];

const EMPTY_FORM: CharacterFormData = {
  name: '',
  description: '',
  voiceNotes: '',
  gender: undefined,
  priority: 'normal',
  assignedArtistId: '',
  assignedArtistName: '',
  lineCount: 0,
  completedCount: 0,
};

// ─── Component ────────────────────────────────────────────────
export function AddCharacterModal({ isOpen, onClose, projectId, onSuccess }: Props) {
  const { addCharacter } = useProjects();
  const [form, setForm] = useState<CharacterFormData>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const setField = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleArtistChange = (artistId: string) => {
    const artist = MOCK_USERS.find((u) => u.id === artistId);
    setForm((prev) => ({
      ...prev,
      assignedArtistId: artistId || undefined,
      assignedArtistName: artist?.name || '',
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Karakter adı zorunludur.';
    else if (form.name.trim().length < 2) newErrors.name = 'En az 2 karakter olmalı.';
    const lc = Number(form.lineCount);
    if (form.lineCount !== undefined && (isNaN(lc) || lc < 0)) {
      newErrors.lineCount = 'Geçerli bir sayı girin.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setApiError('');
    onClose();
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError('');

    try {
      await addCharacter(projectId, {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        voiceNotes: form.voiceNotes?.trim() || undefined,
        lineCount: Number(form.lineCount) || 0,
        completedCount: 0,
        gender: (form.gender || undefined) as CharacterGender | undefined,
        priority: (form.priority || 'normal') as CharacterPriority,
      });
      handleClose();
      onSuccess?.();
    } catch {
      setApiError('Karakter eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, projectId, addCharacter]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni Karakter / Cast Ekle"
      subtitle="Karaktere ait tüm bilgileri girin"
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Karakteri Ekle
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
              placeholder="ör. Kaptan Nova, Profesör Kıvılcım…"
              autoFocus
            />
            <Input
              label="Açıklama"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Karakterin kısa tanımı (isteğe bağlı)"
            />
          </div>
        </div>

        {/* ── Ses Direktifi ──────────────────────────────────── */}
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
              options={GENDER_OPTIONS}
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
            Sanatçı Atama <span className="text-slate-600 font-normal">(isteğe bağlı)</span>
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
            Replik Takibi <span className="text-slate-600 font-normal">(isteğe bağlı)</span>
          </h4>
          <Input
            label="Toplam Replik Sayısı"
            type="number"
            min={0}
            value={form.lineCount ?? 0}
            onChange={(e) => setField('lineCount', Number(e.target.value))}
            error={errors.lineCount}
            hint="Oluşturulduktan sonra düzenlenebilir"
          />
        </div>
      </div>
    </Modal>
  );
}
