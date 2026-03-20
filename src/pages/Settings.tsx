import { useState, useCallback } from 'react';
import {
  Settings2, FileAudio, Shield,
  Save, RotateCcw, Check, ChevronRight,
} from 'lucide-react';
import { TopBar }       from '../components/layout/TopBar';
import { useSettings }  from '../context/SettingsContext';
import { useAuth }      from '../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────

type SectionKey = 'general' | 'files' | 'qc';

const SECTIONS: { key: SectionKey; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'general', label: 'Genel',          Icon: Settings2 },
  { key: 'files',   label: 'Dosya & Medya',  Icon: FileAudio },
  { key: 'qc',      label: 'QC Ayarları',    Icon: Shield    },
];

const AUDIO_FORMATS = ['wav', 'mp3', 'flac', 'aiff', 'ogg', 'm4a'];

// ─── Shared primitives ───────────────────────────────────────

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
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
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
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
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
        border:     '1px solid var(--border)',
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
        border:     '1px solid var(--border)',
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
          background: checked ? 'var(--accent-text)' : 'var(--text-muted)',
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
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <span
        className={`flex items-center gap-1.5 text-xs transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}
        style={{ color: 'var(--text-secondary)' }}
      >
        <Check className="w-3.5 h-3.5" />
        Kaydedildi
      </span>
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: 'var(--text-primary)',
          color:      'var(--accent-text)',
        }}
      >
        <Save className="w-3.5 h-3.5" />
        Kaydet
      </button>
    </div>
  );
}

function FormatToggleGrid({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (formats: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AUDIO_FORMATS.map((fmt) => {
        const active = selected.includes(fmt);
        return (
          <button
            key={fmt}
            onClick={() => {
              if (active && selected.length === 1) return;
              const next = active
                ? selected.filter((f) => f !== fmt)
                : [...selected, fmt];
              onChange(next);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors"
            style={{
              background: active ? 'var(--text-primary)' : 'var(--bg-elevated)',
              color:      active ? 'var(--accent-text)'  : 'var(--text-secondary)',
              border:     `1px solid ${active ? 'var(--text-primary)' : 'var(--border)'}`,
            }}
          >
            .{fmt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export function SettingsPage() {
  const {
    settings,
    updateGeneralSettings,
    updateFileSettings,
    updateQCSettings,
    resetSettings,
  } = useSettings();

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [activeSection, setActiveSection] = useState<SectionKey>('general');
  const [savedSection,  setSavedSection]  = useState<SectionKey | null>(null);

  const showSaved = useCallback((s: SectionKey) => {
    setSavedSection(s);
    setTimeout(() => setSavedSection(null), 2000);
  }, []);

  // QC bölümü sadece admin'e görünür
  const visibleSections = SECTIONS.filter(
    (s) => s.key !== 'qc' || isAdmin,
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Ayarlar"
        subtitle="Sistem yapılandırması"
        actions={
          isAdmin ? (
            <button
              onClick={() => { resetSettings(); showSaved(activeSection); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors vt-hover"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <RotateCcw className="w-3 h-3" />
              Varsayılana Sıfırla
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sol navigasyon ── */}
        <nav
          className="w-44 shrink-0 py-3 px-2 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          {visibleSections.map(({ key, label, Icon }) => {
            const active = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors mb-0.5"
                style={{
                  background: active ? 'var(--bg-active)' : 'transparent',
                  color:      active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </span>
                {active && (
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── İçerik ── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-4">

            {/* ══ GENEL ══ */}
            {activeSection === 'general' && (
              <Section
                title="Genel"
                Icon={Settings2}
                description="Temel kullanım tercihleri"
              >
                <Row label="Arayüz Dili" compact>
                  <SelectField
                    value={settings.general.defaultLanguage}
                    onChange={(v) =>
                      updateGeneralSettings({ defaultLanguage: v as 'tr' | 'en' })
                    }
                    options={[
                      { value: 'tr', label: 'Türkçe' },
                      { value: 'en', label: 'English' },
                    ]}
                  />
                </Row>

                <Row label="Tarih Formatı" compact>
                  <SelectField
                    value={settings.general.dateFormat}
                    onChange={(v) =>
                      updateGeneralSettings({
                        dateFormat: v as typeof settings.general.dateFormat,
                      })
                    }
                    options={[
                      { value: 'DD/MM/YYYY', label: 'GG/AA/YYYY  —  31/12/2025' },
                      { value: 'MM/DD/YYYY', label: 'AA/GG/YYYY  —  12/31/2025' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-AA-GG  —  2025-12-31' },
                    ]}
                  />
                </Row>

                <Row
                  label="Varsayılan Açılış Sayfası"
                  hint="Giriş yapıldıktan sonra yönlendirilecek sayfa."
                  compact
                >
                  <SelectField
                    value={settings.general.defaultLandingPage}
                    onChange={(v) =>
                      updateGeneralSettings({
                        defaultLandingPage: v as typeof settings.general.defaultLandingPage,
                      })
                    }
                    options={[
                      { value: 'dashboard', label: 'Dashboard' },
                      { value: 'projects',  label: 'Projeler'  },
                      { value: 'my-tasks',  label: 'Görevlerim' },
                    ]}
                  />
                </Row>

                <SaveBar
                  onSave={() => showSaved('general')}
                  saved={savedSection === 'general'}
                />
              </Section>
            )}

            {/* ══ DOSYA & MEDYA ══ */}
            {activeSection === 'files' && (
              <Section
                title="Dosya & Medya"
                Icon={FileAudio}
                description="Ses dosyası yükleme kuralları"
              >
                <Row
                  label="Desteklenen Formatlar"
                  hint="Sisteme yüklenebilecek dosya türleri."
                >
                  <FormatToggleGrid
                    selected={settings.files.allowedFormats}
                    onChange={(formats) => updateFileSettings({ allowedFormats: formats })}
                  />
                </Row>

                <Row
                  label="Maks. Dosya Boyutu"
                  hint="Tek dosya için üst sınır (MB)."
                >
                  <div className="flex items-center gap-3">
                    <div className="w-28">
                      <InputField
                        type="number"
                        value={settings.files.maxFileSizeMB}
                        onChange={(v) => {
                          const n = Math.max(1, Math.min(2048, Number(v)));
                          updateFileSettings({ maxFileSizeMB: n });
                        }}
                      />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      MB
                    </span>
                  </div>
                </Row>

                <Row
                  label="Dosya Adından Görev Adı"
                  hint="Yüklenen dosyanın adı otomatik olarak görev adına dönüştürülsün."
                  compact
                >
                  <Toggle
                    checked={settings.files.autoNameFromFileName}
                    onChange={(v) => updateFileSettings({ autoNameFromFileName: v })}
                  />
                </Row>

                <Row
                  label="Kaynak Ses Klasörü"
                  hint="Orijinal seslerin saklandığı şablon yol. {id} → proje ID."
                >
                  <InputField
                    value={settings.files.sourceFolder}
                    onChange={(v) => updateFileSettings({ sourceFolder: v })}
                    placeholder="/projects/{id}/source/"
                  />
                </Row>

                <Row
                  label="Kayıt Alınan Klasör"
                  hint="Sanatçı kayıtlarının saklandığı şablon yol."
                >
                  <InputField
                    value={settings.files.recordedFolder}
                    onChange={(v) => updateFileSettings({ recordedFolder: v })}
                    placeholder="/projects/{id}/recorded/"
                  />
                </Row>

                <SaveBar
                  onSave={() => showSaved('files')}
                  saved={savedSection === 'files'}
                />
              </Section>
            )}

            {/* ══ QC AYARLARI (sadece admin) ══ */}
            {activeSection === 'qc' && isAdmin && (
              <Section
                title="QC Ayarları"
                Icon={Shield}
                description="Kalite kontrol sürecinin kuralları"
              >
                <Row
                  label="QC Zorunlu"
                  hint="Aktifse sanatçı kaydı QC onayı olmadan final'e geçemez."
                  compact
                >
                  <Toggle
                    checked={settings.qc.qcRequired}
                    onChange={(v) => updateQCSettings({ qcRequired: v })}
                  />
                </Row>

                <Row
                  label="Revize Notu Zorunlu"
                  hint="QC revize istediğinde not alanı boş bırakılamaz."
                  compact
                >
                  <Toggle
                    checked={settings.qc.revisionNoteRequired}
                    onChange={(v) => updateQCSettings({ revisionNoteRequired: v })}
                  />
                </Row>

                <Row
                  label="Sanatçıya QC Notu Göster"
                  hint="QC notları sanatçının görev ekranında görünsün."
                  compact
                >
                  <Toggle
                    checked={settings.qc.showQCNotesToArtist}
                    onChange={(v) => updateQCSettings({ showQCNotesToArtist: v })}
                  />
                </Row>

                <Row label="Onay Sonrası Durum" compact>
                  <SelectField
                    value={settings.qc.autoStatusOnApprove}
                    onChange={(v) =>
                      updateQCSettings({
                        autoStatusOnApprove: v as typeof settings.qc.autoStatusOnApprove,
                      })
                    }
                    options={[
                      { value: 'qc_approved', label: 'QC Onaylandı' },
                      { value: 'mixed',        label: 'Mix/Master Bekliyor' },
                      { value: 'final',        label: 'Final — teslime hazır' },
                    ]}
                  />
                </Row>

                <Row label="Red Sonrası Durum" compact>
                  <SelectField
                    value={settings.qc.autoStatusOnReject}
                    onChange={(v) =>
                      updateQCSettings({
                        autoStatusOnReject: v as typeof settings.qc.autoStatusOnReject,
                      })
                    }
                    options={[
                      { value: 'qc_rejected', label: 'QC Reddedildi' },
                      { value: 'in_progress', label: 'Devam Ediyor' },
                    ]}
                  />
                </Row>

                {/* Onay/Red durum özeti */}
                {(() => {
                  const approveLabels: Record<string, string> = {
                    qc_approved: 'QC Onaylandı',
                    mixed:       'Mix/Master Bekliyor',
                    final:       'Final',
                  };
                  const rejectLabels: Record<string, string> = {
                    qc_rejected: 'QC Reddedildi',
                    in_progress: 'Devam Ediyor',
                  };
                  return (
                    <div className="px-5 pb-4">
                      <div
                        className="grid grid-cols-2 gap-3 rounded-xl p-3"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div>
                          <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                            Onay sonrası
                          </div>
                          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {approveLabels[settings.qc.autoStatusOnApprove] ?? settings.qc.autoStatusOnApprove}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                            Red sonrası
                          </div>
                          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {rejectLabels[settings.qc.autoStatusOnReject] ?? settings.qc.autoStatusOnReject}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <SaveBar
                  onSave={() => showSaved('qc')}
                  saved={savedSection === 'qc'}
                />
              </Section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
