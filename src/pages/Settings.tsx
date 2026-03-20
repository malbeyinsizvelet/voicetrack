import { useState, useCallback } from 'react';
import {
  Settings2, FileAudio, Shield,
  Save, RotateCcw, Check, ChevronRight,
} from 'lucide-react';
import { TopBar }      from '../components/layout/TopBar';
import { useSettings }  from '../context/SettingsContext';
import { useAuth }      from '../context/AuthContext';

type SectionKey = 'general' | 'files' | 'qc';

const SECTIONS: { key: SectionKey; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'general', label: 'Genel',          Icon: Settings2 },
  { key: 'files',   label: 'Dosya & Medya',  Icon: FileAudio },
  { key: 'qc',      label: 'QC Ayarları',    Icon: Shield     },
];

const AUDIO_FORMATS = ['wav', 'mp3', 'flac', 'aiff', 'ogg', 'm4a'];

function Section({
  title,
  Icon,
  description,
  children,
}: {
  title: string;
  Icon: React.FC<{ className?: string }>;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-base)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-base)' }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  compact,
  children,
}: {
  label: string;
  hint?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-${compact ? 'center' : 'start'} gap-3 px-5 py-4`}>
      <div className="sm:w-56 shrink-0">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </div>
        {hint && (
          <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </div>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full text-sm rounded-xl px-3 py-2.5 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'var(--bg-elevated)',
        border:     '1px solid var(--border-base)',
        color:      'var(--text-primary)',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm rounded-xl px-3 py-2.5 outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border:     '1px solid var(--border-base)',
        color:      'var(--text-primary)',
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked ? 'var(--text-primary)' : 'var(--bg-elevated)',
        border:     '1px solid var(--border-strong)',
      }}
    >
      <span
        className="inline-block w-4 h-4 rounded-full transition-transform"
        style={{
          background: checked ? 'var(--bg-base)' : 'var(--text-muted)',
          transform:  checked ? 'translate(24px, 3px)' : 'translate(3px, 3px)',
        }}
      />
    </button>
  );
}

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div
      className="px-5 py-4 flex items-center justify-between"
      style={{ borderTop: '1px solid var(--border-base)' }}
    >
      <span
        className={`flex items-center gap-1.5 text-xs transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}
        style={{ color: 'var(--text-secondary)' }}
      >
        <Check size={12} />
        Kaydedildi
      </span>
      <button
        type="button"
        onClick={onSave}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-colors"
        style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
      >
        <Save size={13} />
        Kaydet
      </button>
    </div>
  );
}

export function Settings() {
  const { settings, updateGeneralSettings, updateFileSettings, updateQCSettings, resetSettings } = useSettings();
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>('general');
  const [saved, setSaved] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const handleSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Ayarlar" subtitle="Uygulama tercihlerini yönet" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <div
          className="w-52 shrink-0 border-r p-3 space-y-0.5 overflow-y-auto"
          style={{ borderColor: 'var(--border-base)' }}
        >
          {SECTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors"
              style={{
                background: activeSection === key ? 'var(--bg-elevated)' : 'transparent',
                color: activeSection === key ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <span className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
              {activeSection === key && <ChevronRight size={12} />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {activeSection === 'general' && (
            <Section title="Genel" Icon={Settings2} description="Temel uygulama ayarları">
              <Row label="Dil" hint="Arayüz dili" compact>
                <SelectField
                  value={settings.general.defaultLanguage}
                  onChange={(v) => updateGeneralSettings({ defaultLanguage: v as any })}
                  options={[
                    { value: 'tr', label: 'Türkçe' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Row>
              <Row label="Tema" hint="Renk teması" compact>
                <SelectField
                  value={settings.general.defaultTheme}
                  onChange={(v) => updateGeneralSettings({ defaultTheme: v as any })}
                  options={[
                    { value: 'dark',   label: 'Koyu' },
                    { value: 'light',  label: 'Açık' },
                    { value: 'system', label: 'Sistem' },
                  ]}
                />
              </Row>
              <Row label="Varsayılan Sayfa" hint="Giriş sonrası açılacak sayfa" compact>
                <SelectField
                  value={settings.general.defaultLandingPage}
                  onChange={(v) => updateGeneralSettings({ defaultLandingPage: v as any })}
                  options={[
                    { value: 'dashboard', label: 'Dashboard' },
                    { value: 'projects',  label: 'Projeler' },
                    { value: 'my-tasks',  label: 'Görevlerim' },
                  ]}
                />
              </Row>
              <SaveBar onSave={() => { handleSaved(); }} saved={saved} />
            </Section>
          )}

          {activeSection === 'files' && (
            <Section title="Dosya & Medya" Icon={FileAudio} description="Ses dosyası formatları ve depolama">
              <Row label="İzin Verilen Formatlar" hint="Yükleme için kabul edilen ses formatları">
                <div className="flex flex-wrap gap-2">
                  {AUDIO_FORMATS.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => {
                        const curr = settings.files.allowedFormats;
                        const next = curr.includes(fmt)
                          ? curr.filter((f) => f !== fmt)
                          : [...curr, fmt];
                        updateFileSettings({ allowedFormats: next });
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg transition-colors font-medium"
                      style={{
                        background: settings.files.allowedFormats.includes(fmt)
                          ? 'var(--text-primary)'
                          : 'var(--bg-elevated)',
                        color: settings.files.allowedFormats.includes(fmt)
                          ? 'var(--bg-base)'
                          : 'var(--text-secondary)',
                        border: '1px solid var(--border-base)',
                      }}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Maks Dosya Boyutu (MB)" hint="Maksimum yükleme boyutu" compact>
                <InputField
                  type="number"
                  value={settings.files.maxFileSizeMB}
                  onChange={(v) => updateFileSettings({ maxFileSizeMB: Number(v) })}
                  placeholder="500"
                />
              </Row>
              <Row label="Dosya Adından Otomatik İsim" hint="Yüklenen dosyadan otomatik isim oluştur" compact>
                <Toggle
                  checked={settings.files.autoNameFromFileName}
                  onChange={(v) => updateFileSettings({ autoNameFromFileName: v })}
                />
              </Row>
              <SaveBar onSave={() => { handleSaved(); }} saved={saved} />
            </Section>
          )}

          {activeSection === 'qc' && (
            <Section title="QC Ayarları" Icon={Shield} description="Kalite kontrol parametreleri">
              <Row label="QC Zorunlu" hint="Tüm kayıtlar için QC incelemesi gereksin" compact>
                <Toggle
                  checked={settings.qc.qcRequired}
                  onChange={(v) => updateQCSettings({ qcRequired: v })}
                  disabled={!isAdmin}
                />
              </Row>
              <Row label="Revize Notu Zorunlu" hint="Reddetme sırasında not zorunlu olsun" compact>
                <Toggle
                  checked={settings.qc.revisionNoteRequired}
                  onChange={(v) => updateQCSettings({ revisionNoteRequired: v })}
                  disabled={!isAdmin}
                />
              </Row>
              <Row label="QC Notlarını Sanatçıya Göster" hint="QC kararları sanatçı tarafından görülebilsin" compact>
                <Toggle
                  checked={settings.qc.showQCNotesToArtist}
                  onChange={(v) => updateQCSettings({ showQCNotesToArtist: v })}
                  disabled={!isAdmin}
                />
              </Row>
              <SaveBar onSave={() => { handleSaved(); }} saved={saved} />
            </Section>
          )}

          {/* Reset */}
          <div className="pt-2">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-base)' }}
            >
              <RotateCcw size={13} />
              Varsayılanlara Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
