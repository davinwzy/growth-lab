import { useState, useMemo } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { formatDateKey, startOfLocalDay } from '@/shared/utils/date';
import { toCsvRow } from '@/shared/utils/csv';
import type { HistoryRecord } from '@/shared/types';

interface HistoryListProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'score' | 'reward' | 'system';
type FilterTarget = 'all' | 'student' | 'group' | 'class';

export function HistoryList({ isOpen, onClose }: HistoryListProps) {
  const { state, dispatch, t } = useApp();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterTarget, setFilterTarget] = useState<FilterTarget>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const currentClassHistory = useMemo(() => {
    if (!state.currentClassId) return [];
    return state.history.filter(h => h.classId === state.currentClassId);
  }, [state.history, state.currentClassId]);

  const filteredHistory = useMemo(() => {
    let result = currentClassHistory;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(h => h.type === filterType);
    }

    // Filter by target
    if (filterTarget !== 'all') {
      result = result.filter(h => h.targetType === filterTarget);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h =>
        h.targetName.toLowerCase().includes(query) ||
        h.itemName.toLowerCase().includes(query) ||
        (h.note && h.note.toLowerCase().includes(query))
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = startOfLocalDay(now);
          break;
        case 'week':
          startDate = startOfLocalDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          startDate = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), 1));
          break;
        default:
          startDate = new Date(0);
      }

      result = result.filter(h => h.timestamp >= startDate.getTime());
    }

    return result;
  }, [currentClassHistory, filterType, filterTarget, searchQuery, dateRange]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString(state.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString(state.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecordIcon = (record: HistoryRecord) => {
    if (record.undone) return '↩️';
    if (record.type === 'reward') return '🎁';
    if (record.type === 'system') return '⚙️';
    if (record.value > 0) return '➕';
    return '➖';
  };

  const getRecordColor = (record: HistoryRecord) => {
    if (record.undone) return 'text-gray-400 bg-gray-50';
    if (record.type === 'reward') return 'text-amber-600 bg-amber-50';
    if (record.type === 'system') return 'text-slate-600 bg-slate-50';
    if (record.value > 0) return 'text-green-600 bg-green-50';
    return 'text-red-600 bg-red-50';
  };

  const handleUndo = (recordId: string) => {
    const record = state.history.find(h => h.id === recordId);
    if (!record) return;
    if (record.type === 'system') return;

    if (!confirm(t(
      `确定要撤销此操作吗？\n${record.targetName}: ${record.value > 0 ? '+' : ''}${record.value}\n\n撤销将恢复分数和经验值。`,
      `Undo this action?\n${record.targetName}: ${record.value > 0 ? '+' : ''}${record.value}\n\nThis will restore score and XP.`
    ))) {
      return;
    }

    dispatch({ type: 'UNDO_HISTORY', payload: recordId });
  };

  const handleClearHistory = () => {
    if (!confirm(t(
      '确定要清空当前班级的所有历史记录吗？此操作不可撤销。',
      'Are you sure you want to clear all history for this class? This cannot be undone.'
    ))) {
      return;
    }
    dispatch({ type: 'CLEAR_HISTORY', payload: state.currentClassId || undefined });
  };

  const handleExport = () => {
    const csv = [
      toCsvRow(['时间', '类型', '目标', '对象', '项目', '分数', '备注', '已撤销']),
      ...filteredHistory.map(h => toCsvRow([
        new Date(h.timestamp).toLocaleString(),
        h.type === 'score' ? '加减分' : h.type === 'reward' ? '兑换' : '系统',
        h.targetType === 'student' ? '学生' : h.targetType === 'group' ? '组别' : '班级',
        h.targetName,
        h.itemName,
        h.value,
        h.note || '',
        h.undone ? '是' : '否',
      ])),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${formatDateKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('历史记录', 'History')}
      size="xl"
    >
      {!state.currentClassId ? (
        <div className="text-center text-gray-500 py-8">
          {t('请先选择一个班级', 'Please select a class first')}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('搜索...', 'Search...')}
              className="px-3 py-1.5 border rounded-lg text-sm flex-1 min-w-[150px]"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as FilterType)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="all">{t('全部类型', 'All Types')}</option>
              <option value="score">{t('加减分', 'Score Changes')}</option>
              <option value="reward">{t('兑换', 'Redemptions')}</option>
              <option value="system">{t('系统', 'System')}</option>
            </select>
            <select
              value={filterTarget}
              onChange={e => setFilterTarget(e.target.value as FilterTarget)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="all">{t('全部对象', 'All Targets')}</option>
              <option value="student">{t('学生', 'Students')}</option>
              <option value="group">{t('组别', 'Groups')}</option>
              <option value="class">{t('班级', 'Class')}</option>
            </select>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="all">{t('全部时间', 'All Time')}</option>
              <option value="today">{t('今天', 'Today')}</option>
              <option value="week">{t('本周', 'This Week')}</option>
              <option value="month">{t('本月', 'This Month')}</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredHistory.length} {t('条记录', 'records')}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleExport}>
                {t('导出', 'Export')}
              </Button>
              {currentClassHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                  {t('清空', 'Clear')}
                </Button>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="max-h-96 overflow-auto space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t('暂无记录', 'No records')}
              </div>
            ) : (
              filteredHistory.map(record => (
                <div
                  key={record.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${getRecordColor(record)} ${
                    record.undone ? 'line-through opacity-60' : ''
                  }`}
                >
                  <div className="text-xl">{getRecordIcon(record)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{record.targetName}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                        {record.targetType === 'student'
                          ? t('学生', 'Student')
                          : record.targetType === 'group'
                          ? t('组别', 'Group')
                          : t('班级', 'Class')}
                      </span>
                      {record.undone && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                          {t('已撤销', 'Undone')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm opacity-75 truncate">
                      {record.itemName}
                      {record.note && ` - ${record.note}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold">
                      {record.value > 0 ? '+' : ''}{record.value}
                    </div>
                    <div className="text-xs opacity-75">
                      {formatDate(record.timestamp)}
                    </div>
                  </div>
                  {!record.undone && record.type !== 'system' && (
                    <button
                      onClick={() => handleUndo(record.id)}
                      className="p-1.5 hover:bg-white/50 rounded-lg transition-colors shrink-0"
                      title={t('撤销', 'Undo')}
                    >
                      <svg className="w-4 h-4 opacity-50 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
