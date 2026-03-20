// ============================================================
// PLACEHOLDER PAGE
// Henüz implement edilmemiş sayfalar için geçici bileşen.
// Her phase tamamlandıkça bu component silinir, gerçek sayfa gelir.
// ============================================================

import { Construction } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col h-full">
      <TopBar title={title} subtitle={subtitle} />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700
                          items-center justify-center">
            <Construction className="w-6 h-6 text-slate-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-slate-200 font-semibold text-lg">{title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Bu sayfa henüz geliştirme aşamasında. Sonraki phase'lerde tamamlanacak.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-indigo-500/10 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-400 text-xs font-medium">Yakında</span>
          </div>
        </div>
      </div>
    </div>
  );
}
