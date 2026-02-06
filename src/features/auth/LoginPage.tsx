import { useAuth } from './AuthProvider';
import { useLanguage } from '@/shared/hooks/useLanguage';

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen lab-surface flex items-center justify-center p-4">
      {/* Language Switch - Top Right */}
      <div className="fixed top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-xs rounded-xl bg-white/80 border border-slate-200 shadow-sm hover:bg-white transition-colors font-medium text-slate-700"
        >
          {language === 'zh-CN' ? 'EN' : '中文'}
        </button>
      </div>

      <div className="clay-card p-8 md:p-12 max-w-md w-full space-y-8 lab-animate">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center text-4xl mx-auto">
            🧪
          </div>
          <h1 className="text-3xl font-display text-slate-900">
            {t('成长实验室', 'Growth Lab')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('一起成长，一步一脚印。', 'Growing together, one step at a time.')}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <span className="text-lg">☁️</span>
            <span>{t('数据云端同步，任何设备都能用', 'Cloud sync - access from any device')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <span className="text-lg">🎮</span>
            <span>{t('游戏化课堂管理，激励学生成长', 'Gamified classroom management')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <span className="text-lg">📊</span>
            <span>{t('出勤、加分、成就，一站式管理', 'Attendance, scoring, badges - all in one')}</span>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('使用 Google 登录', 'Sign in with Google')}
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          {t('登录即表示你同意使用此系统。数据安全存储在云端。', 'By signing in, you agree to use this system. Data is securely stored in the cloud.')}
        </p>
      </div>
    </div>
  );
}
