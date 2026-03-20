// ============================================================
// COLOR PICKER — Proje rengi seçimi için preset paletli bileşen
// ============================================================

import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

export const PRESET_COLORS = [
  { value: '#6366f1', label: 'İndigo' },
  { value: '#8b5cf6', label: 'Mor' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#ef4444', label: 'Kırmızı' },
  { value: '#f97316', label: 'Turuncu' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Yeşil' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#64748b', label: 'Gri' },
  { value: '#a16207', label: 'Kahve' },
];

interface ColorPickerProps {
  label?: string;
  value?: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-slate-300">{label}</span>
      )}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.label}
            onClick={() => onChange(color.value)}
            className={cn(
              'w-7 h-7 rounded-full transition-transform duration-150 focus:outline-none',
              'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
              value === color.value ? 'scale-110 ring-2 ring-white/40' : 'hover:scale-110'
            )}
            style={{ backgroundColor: color.value }}
          >
            {value === color.value && (
              <Check className="w-3.5 h-3.5 text-white mx-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
