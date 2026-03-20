// EditCharacterModal – GitHub'dan çekildi
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
interface FormErrors { name?: string; lineCount?: string; completedCount?: string; }

const ARTIST_OPTIONS = [
  { value: '', label: '– Sanatçı atanmamış –' },
  ...MOCK_USERS.filter((u) => u.role === 'voice_artist').map((u) => ({ value: u.id, label: u.name })),
];
const GENDER_OPTIONS: { value: CharacterGender | ''; label: string }[] = [
  { value: '', label: '– Belirtilmemiş –' },
  { value: 'male', label: '♂ Erkek' },
  { value: 'female', label: '♀ Kadın' },
  { value: 'neutral', label: '⛎ Nötr / İkincil' },
  { value: 'unknown', label: '? Belirsiz' },
];
const PRIORITY_OPTIONS: { value: CharacterPriority; label: string }[] = [
  { value: 'critical', label: '🔴 Kritik – En yüksek öncelik' },
  { value: 'high', label: '🟠 Yüksek' },
  { value: 'normal', label: '▪ Normal' },
  { value: 'low', label: '↙️ Düşük' },
];

export function EditCharacterModal({ isOpen, onClose, projectId, character, onSuccess }: Props) {
  const { updateCharacter } = useProjects();
  const [form, setForm] = useState<CharacterFormData>({
    name: character.name, description: character.description ?? '',
    voiceNotes: character.voiceNotes ?? '', gender: character.gender,
    priority: character.priority ?? 'normal',
    assignedArtistId: character.assignedArtistId ?? '',
    assignedArtistName: character.assignedArtistName ?? '',
    lineCount: character.lineCount ?? 0, completedCount: character.completedCount ?? 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: character.name, description: character.description ?? '',
        voiceNotes: character.voiceNotes ?? '', gender: character.gender,
        priority: character.priority ?? 'normal',
        assignedArtistId: character.assignedArtistId ?? '',
        assignedArtistName: character.assignedArtistName ?? '',
        lineCount: character.lineCount ?? 0, completedCount: character.completedCount ?? 0,
      });
      setErrors({}); setApiError('');
    }
  }, [isOpen, character]);

  const setField = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key as keyof FormErrors]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleArtistChange = (artistId: string) => {
    const artist = MOCK_USERS.find((u) => u.id === artistId);
    setForm((p) => ({ ...p, assignedArtistId: artistId || undefined, assignedArtistName: artist?.name || '' }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Karakter adı zorunludur.';
    else if (form.name.trim().length < 2) newErrors.name = 'En az 2 karakter olmalı.';
    const lc = Number(form.lineCount); const cc = Number(form.completedCount);
    if (form.lineCount !== undefined && (isNaN(lc) || lc < 0)) newErrors.lineCount = 'Geçerli bir sayı girin (0 veya üzeri).';
    if (form.completedCount !== undefined && (isNaN(cc) || cc < 0)) newErrors.completedCount = 'Geçerli bir sayı girin.';
    if (!isNaN(lc) && !isNaN(cc) && cc > lc && lc > 0) newErrors.completedCount = 'Tamamlanan, toplam replik sayısını geçemez.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true); setApiError('');
    try {
      await updateCharacter(projectId, character.id, {
        ...form, name: form.name.trim(),
        description: form.description?.trim() || undefined,
        voiceNotes: form.voiceNotes?.trim() || undefined,
        lineCount: Number(form.lineCount) || 0,
        completedCount: Number(form.completedCount) || 0,
        gender: (form.gender || undefined) as CharacterGender | undefined,
        priority: (form.priority || 'normal') as CharacterPriority,
      });
      onClose(); onSuccess?.();
    } catch { setApiError('Karakter güncellenirken bir hata oluştu.'); }
    finally { setIsSubmitting(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, projectId, character.id, updateCharacter]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Karakter Düzenle" subtitle={`"${character.name}" bilgilerini güncelle`} size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>İptal</Button>
          <Button leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={handleSubmit} isLoading={isSubmitting}>Kaydet</Button>
        </div>
      }>
      <div className="space-y-5">
        {apiError && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{apiError}</span>
          </div>
        )}
        <Input label="Karakter Adı" required value={form.name} onChange={(e) => setField('name', e.target.value)} error={errors.name} maxLength={80} />
        <Textarea label="Kısa Açıklama" value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={2} maxLength={300} />
        <Textarea label="Ses Notları" value={form.voiceNotes ?? ''} onChange={(e) => setField('voiceNotes', e.target.value)} rows={2} maxLength={300} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Cinsiyet" options={GENDER_OPTIONS as { value: string; label: string }[]} value={form.gender ?? ''} onChange={(e) => setField('gender', e.target.value as CharacterGender)} />
          <Select label="Öncelik" options={PRIORITY_OPTIONS} value={form.priority ?? 'normal'} onChange={(e) => setField('priority', e.target.value as CharacterPriority)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Toplam Replik" type="number" min={0} value={String(form.lineCount ?? 0)} onChange={(e) => setField('lineCount', Number(e.target.value))} error={errors.lineCount} />
          <Input label="Tamamlanan Replik" type="number" min={0} value={String(form.completedCount ?? 0)} onChange={(e) => setField('completedCount', Number(e.target.value))} error={errors.completedCount} />
        </div>
        <Select label="Seslendirme Sanatçısı" options={ARTIST_OPTIONS} value={form.assignedArtistId ?? ''} onChange={(e) => handleArtistChange(e.target.value)} />
      </div>
    </Modal>
  );
}
