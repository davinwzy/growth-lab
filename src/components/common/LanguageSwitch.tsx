import { useApp } from '../../contexts/AppContext';

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
      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
    >
      {state.language === 'zh-CN' ? 'EN' : '中'}
    </button>
  );
}
