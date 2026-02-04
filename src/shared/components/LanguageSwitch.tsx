import { useApp } from '@/app/AppProvider';

export function LanguageSwitch() {
  const { state, dispatch } = useApp();

  const toggleLanguage = () => {
    dispatch({
      type: 'SET_LANGUAGE',
      payload: state.language === 'zh-CN' ? 'en' : 'zh-CN',
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn-base btn-secondary px-3 py-1.5 text-xs"
    >
      {state.language === 'zh-CN' ? 'EN' : '中'}
    </button>
  );
}
