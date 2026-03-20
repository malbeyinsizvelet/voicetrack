// AddCharacterModal – GitHub'dan çekildi
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

interface FormErrors { name?: string; lineCount?: string; }

const ARTIST_OPTIONS = [
  { value: '', label: '– Atama yapma (sonradan eklenebilir) –' },
  ...MOCK_USERS.filter((u) => u.role === 'voice_artist').map((u) => ({ value: u.id, label: u.name })),
];
const GENDER_OPTIONS = [
  { value: '', label: '– Belirtilmemiş –' },
  { value: 'male', label: '♂ Erkek' },
  { value: 'female', label: '♀ Kadın' },
  { value: 'neutral', label: '⛎ Nötr / İkincil' },
  { value: 'unknown', label: '? Belirsiz' },
];
const PRIORITY_OPTIONS = [
  { value: 'critical', label: '🔴 Kritik – En yüksek öncelik' },
  { value: 'high', label: '🟠 Yüksek' },
  { value: 'normal', label: '▪ Normal' },
  { value: 'low', label: '↙️ Düşük' },
];

const EMPTY_FORM: CharacterFormData = {
  name: '', description: '', voiceNotes: '',
  gender: undefined, priority: 'normal',
  assignedArtistId: '', assignedArtistName: '',
  lineCount: 0, completedCount: 0,
};

export function AddCharacterModal({ isOpen, onClose, projectId, onSuccess }: Props) {
  const { addCharacter } = useProjects();
  const [form, setForm] = useState<CharacterFormData>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const setField = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleArtistChange = (artistId: string) => {
    const artist = MOCK_USERS.find((u) => u.id === artistId);
    setForm((prev) => ({ ...prev, assignedArtistId: artistId || undefined, assignedArtistName: artist?.name || '' }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Karakter adı zorunludur.';
    else if (form.name.trim().length < 2) newErrors.name = 'En az 2 karakter olmalı.';
    const lc = Number(form.lineCount);
    if (form.lineCount !== undefined && (isNaN(lc) || lc < 0)) newErrors.lineCount = 'Geçerli bir sayı girin.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => { setForm({ ...EMPTY_FORM }); setErrors({}); setApiError(''); onClose(); };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true); setApiError('');
    try {
      await addCharacter(projectId, {
        ...form, name: form.name.trim(),
        description: form.description?.trim() || undefined,
        voiceNotes: form.voiceNotes?.trim() || undefined,
        lineCount: Number(form.lineCount) || 0, completedCount: 0,
        gender: (form.gender || undefined) as CharacterGender | undefined,
        priority: (form.priority || 'normal') as CharacterPriority,
      });
      handleClose(); onSuccess?.();
    } catch { setApiError('Karakter eklenirken bir hata oluştu.'); }
    finally { setIsSubmitting(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, projectId, addCharacter]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Yeni Karakter / Cast Ekle" subtitle="Karaktere ait tüm bilgileri girin" size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>İptal</Button>
          <Button leftIcon={<UserPlus className="w-3.5 h-3.5" />} onClick={handleSubmit} isLoading={isSubmitting}>Karakteri Ekle</Button>
        </div>
      }>
      <div className="space-y-5">
        {apiError && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{apiError}</span>
          </div>
        )}
        <Input label="Karakter Adı" placeholder="örn. Kahraman, Usta, Yardımcı..." required value={form.name} onChange={(e) => setField('name', e.target.value)} error={errors.name} maxLength={80} />
        <Textarea label="Kısa Açıklama" placeholder="Karakter hakkında kısa bir açıklama..." value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={2} maxLength={300} />
        <Textarea label="Ses Notları" placeholder="Ton, aksan, hız gibi yönlendirmeler..." value={form.voiceNotes ?? ''} onChange={(e) => setField('voiceNotes', e.target.value)} rows={2} maxLength={300} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Cinsiyet" options={GENDER_OPTIONS} value={form.gender ?? ''} onChange={(e) => setField('gender', e.target.value as CharacterGender)} />
          <Select label="Öncelik" options={PRIORITY_OPTIONS} value={form.priority ?? 'normal'} onChange={(e) => setField('priority', e.target.value as CharacterPriority)} />
        </div>
        <Input label="Toplam Replik Sayısı" type="number" min={0} value={String(form.lineCount ?? 0)} onChange={(e) => setField('lineCount', Number(e.target.value))} error={errors.lineCount} />
        <Select label="Seslendirme Sanatçısı (İsteğe Bağlı)" options={ARTIST_OPTIONS} value={form.assignedArtistId ?? ''} onChange={(e) => handleArtistChange(e.target.value)} />
      </div>
    </Modal>
  );
}
