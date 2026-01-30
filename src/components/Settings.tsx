import { useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Modal, Button } from './common';
import { downloadData, importData } from '../utils/storage';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { state, dispatch, t } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadData(state, `class-data-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const data = importData(content);

      if (data) {
        if (confirm(t(
          '导入数据将覆盖当前所有数据，确定要继续吗？',
          'Importing will overwrite all current data. Are you sure you want to continue?'
        ))) {
          dispatch({ type: 'LOAD_STATE', payload: data });
          alert(t('导入成功！', 'Import successful!'));
        }
      } else {
        alert(t('导入失败：无效的数据格式', 'Import failed: Invalid data format'));
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('设置', 'Settings')}
      size="md"
    >
      <div className="space-y-6">
        {/* Language */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            {t('语言 / Language', 'Language / 语言')}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'zh-CN' })}
              className={`px-4 py-2 rounded-lg transition-colors ${
                state.language === 'zh-CN'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'en' })}
              className={`px-4 py-2 rounded-lg transition-colors ${
                state.language === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            {t('数据管理', 'Data Management')}
          </h3>
          <div className="space-y-2">
            <Button variant="secondary" onClick={handleExport} className="w-full justify-center">
              {t('导出数据', 'Export Data')}
            </Button>
            <Button variant="secondary" onClick={handleImportClick} className="w-full justify-center">
              {t('导入数据', 'Import Data')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              {t(
                '导出的 JSON 文件可以在其他设备上导入，实现数据同步。',
                'Exported JSON files can be imported on other devices for data sync.'
              )}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            {t('数据统计', 'Statistics')}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-500">{t('班级数', 'Classes')}</div>
              <div className="text-xl font-bold">{state.classes.length}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-500">{t('组别数', 'Groups')}</div>
              <div className="text-xl font-bold">{state.groups.length}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-500">{t('学生数', 'Students')}</div>
              <div className="text-xl font-bold">{state.students.length}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-500">{t('历史记录', 'Records')}</div>
              <div className="text-xl font-bold">{state.history.length}</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="pt-4 border-t text-center text-sm text-gray-500">
          <p>{t('班级管理系统', 'Class Management System')} v1.0</p>
          <p>{t('数据存储在浏览器本地', 'Data stored in browser locally')}</p>
        </div>
      </div>
    </Modal>
  );
}
