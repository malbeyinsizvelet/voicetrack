// ============================================================
// UNAUTHORIZED PAGE
// Yetkisiz erişim denemesi durumunda gösterilir.
// ============================================================

import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/formatters';

export function Unauthorized() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center h-full p-8">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-red-900/30 border border-red-700/40
                        items-center justify-center">
          <ShieldOff className="w-7 h-7 text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">Erişim Reddedildi</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Bu sayfayı görüntüleme yetkiniz yok.
            {currentUser && (
              <>
                {' '}Mevcut rolünüz:{' '}
                <span className="text-slate-200 font-medium">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Action */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                     bg-slate-800 hover:bg-slate-700 border border-slate-700
                     text-slate-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
      </div>
    </div>
  );
}
