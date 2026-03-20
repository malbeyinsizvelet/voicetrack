// ============================================================
// CREATE PROJECT MODAL
// Developer ve PM'in yeni proje oluşturduğu form.
// Gerçek sistemde form validasyonu için react-hook-form + zod kullanılabilir.
// ============================================================

import { useState, useCallback } from 'react';
import { FolderPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ColorPicker, PRESET_COLORS } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import type { ProjectFormData, ProjectStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'active',    label: '🟢 Aktif' },
  { value: 'on_hold',  label: '🟡 Beklemede' },
  { value: 'completed',label: '✅ Tamamlandı' },
  { value: 'archived', label: '🗃️ Arşivlendi' },
];

interface FormErrors {
  title?: string;
  clientName?: string;
}

interface LocalForm {
  title: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  coverColor: string;
}

const EMPTY_FORM: LocalForm = {
  title: '',
  clientName: '',
  description: '',
  status: 'active',
  dueDate: '',
  coverColor: PRESET_COLORS[0].value,
};

export function CreateProjectModal({ isOpen, onClose, onSuccess }: Props) {
  const { addProject } = useProjects();
  const { currentUser: user } = useAuth();

  const [form, setForm] = useState<LocalForm>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Proje adı zorunludur.';
    else if (form.title.trim().length < 3) newErrors.title = 'En az 3 karakter olmalı.';
    if (!form.clientName.trim()) newErrors.clientName = 'Müşteri/yapım adı zorunludur.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const payload: ProjectFormData = {
        title: form.title.trim(),
        clientName: form.clientName.trim(),
        description: form.description?.trim() || undefined,
        dueDate: form.dueDate || undefined,
        status: form.status as ProjectStatus,
        coverColor: form.coverColor,
        managerId: user.id,
        managerName: user.name,
      };
      const created = await addProject(payload);
      handleClose();
      onSuccess?.(created.id);
    } catch (err) {
      console.error('Proje oluşturma hatası:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, user, addProject, onSuccess]);

  const handleClose = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni Proje Oluştur"
      subtitle="Proje bilgilerini girerek seslendirme sürecini başlat"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<FolderPlus className="w-4 h-4" />}
          >
            Proje Oluştur
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Temel Bilgiler ────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Temel Bilgiler
          </h3>
          <div className="space-y-4">
            <Input
              label="Proje Adı / Yapım Adı"
              placeholder="örn. Galaksi Savaşçıları – Türkçe Dublaj"
              required
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              error={errors.title}
              maxLength={120}
            />
            <Input
              label="Müşteri / Prodüksiyon Şirketi"
              placeholder="örn. Nebula Film A.Ş."
              required
              value={form.clientName}
              onChange={(e) => setField('clientName', e.target.value)}
              error={errors.clientName}
              maxLength={100}
            />
            <Textarea
              label="Kısa Açıklama"
              placeholder="Proje hakkında kısa bir açıklama... (isteğe bağlı)"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </section>

        {/* ── Durum & Tarih ─────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Durum & Zamanlama
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Proje Durumu"
              value={form.status}
              onChange={(e) => setField('status', e.target.value as ProjectStatus)}
              options={STATUS_OPTIONS}
            />
            <Input
              label="Teslim Tarihi"
              type="date"
              value={form.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
              hint="İsteğe bağlı"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </section>

        {/* ── Renk ─────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Proje Rengi
          </h3>
          <ColorPicker
            value={form.coverColor}
            onChange={(c) => setField('coverColor', c)}
          />
          <p className="text-xs text-slate-600 mt-2">
            Proje kartı ve detay sayfasında tanımlayıcı renk olarak kullanılır.
          </p>
        </section>

        {/* ── Yönetici (otomatik) ───────────────────────── */}
        <section className="bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: '#6366f1' }}
            >
              {user?.name.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="text-slate-300 text-sm font-medium">{user?.name}</p>
              <p className="text-slate-500 text-xs">Proje Yöneticisi (sen)</p>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
