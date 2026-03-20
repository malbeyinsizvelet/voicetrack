import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import type { ProjectStatus } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormFields {
  title: string;
  clientName: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  coverColor: string;
}

const INITIAL: FormFields = {
  title: '',
  clientName: '',
  description: '',
  status: 'active',
  dueDate: '',
  coverColor: '#6366f1',
};

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#84cc16', '#a78bfa',
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active',    label: 'Aktif' },
  { value: 'on_hold',   label: 'Beklemede' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'archived',  label: 'Arşivlendi' },
];

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { addProject: createProject } = useProjects();
  const [fields, setFields] = useState<FormFields>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormFields, string>> = {};
    if (!fields.title.trim()) newErrors.title = 'Proje adı zorunludur.';
    if (!fields.clientName.trim()) newErrors.clientName = 'Müşteri adı zorunludur.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createProject({
        title: fields.title.trim(),
        clientName: fields.clientName.trim(),
        description: fields.description.trim() || undefined,
        status: fields.status,
        dueDate: fields.dueDate || undefined,
        coverColor: fields.coverColor,
      });
      setFields(INITIAL);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (isSubmitting) return;
    setFields(INITIAL);
    setErrors({});
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Yeni Proje Oluştur" size="md">
      <div className="space-y-5 p-1">
        {/* ── Temel Bilgiler ────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Temel Bilgiler
          </h3>
          <Input
            label="Proje Adı"
            placeholder="Örn: Anime Dizisi S2"
            value={fields.title}
            onChange={(e) => setField('title', e.target.value)}
            error={errors.title}
            maxLength={120}
          />
          <Input
            label="Müşteri Adı"
            placeholder="Örn: Acme Productions"
            value={fields.clientName}
            onChange={(e) => setField('clientName', e.target.value)}
            error={errors.clientName}
            maxLength={100}
          />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Açıklama (opsiyonel)
            </label>
            <textarea
              rows={3}
              placeholder="Proje hakkında kısa bir açıklama…"
              value={fields.description}
              onChange={(e) => setField('description', e.target.value)}
              maxLength={500}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* ── Durum & Tarih ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Durum</label>
            <select
              value={fields.status}
              onChange={(e) => setField('status', e.target.value as ProjectStatus)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Bitiş Tarihi (opsiyonel)
            </label>
            <input
              type="date"
              value={fields.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* ── Renk ─────────────────────────────────────── */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Proje Rengi</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setField('coverColor', color)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 relative"
                style={{ backgroundColor: color }}
              >
                {fields.coverColor === color && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Proje Oluştur
          </Button>
        </div>
      </div>
    </Modal>
  );
}
