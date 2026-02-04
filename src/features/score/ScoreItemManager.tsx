import { useState, useEffect } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import type { ScoreItem, ScoreCategory } from '@/shared/types';

interface ScoreItemManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOrder = 'default' | 'high-to-low' | 'low-to-high';

export function ScoreItemManager({ isOpen, onClose }: ScoreItemManagerProps) {
  const { state, dispatch, t } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<ScoreItem | null>(null);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<ScoreCategory>('custom');
  const [customCategory, setCustomCategory] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const categories: { value: ScoreCategory; label: string }[] = [
    { value: 'classroom', label: t('课堂表现', 'Classroom') },
    { value: 'academic', label: t('学习成果', 'Academic') },
    { value: 'behavior', label: t('行为习惯', 'Behavior') },
    { value: 'custom', label: t('自定义', 'Custom') },
  ];

  const sortItems = (items: ScoreItem[]) => {
    if (sortOrder === 'high-to-low') {
      return [...items].sort((a, b) => b.value - a.value);
    }
    if (sortOrder === 'low-to-high') {
      return [...items].sort((a, b) => a.value - b.value);
    }
    return items;
  };

  const baseGroups = categories
    .filter(cat => cat.value !== 'custom')
    .map(cat => ({
      ...cat,
      items: sortItems(state.scoreItems.filter(item => item.category === cat.value)),
    }));

  const customGroups = Object.values(
    state.scoreItems
      .filter(item => item.category === 'custom')
      .reduce<Record<string, { label: string; items: ScoreItem[] }>>((acc, item) => {
        const label = (item.customCategory || '').trim() || t('自定义', 'Custom');
        if (!acc[label]) {
          acc[label] = { label, items: [] };
        }
        acc[label].items.push(item);
        return acc;
      }, {})
  ).map(group => ({
    value: 'custom' as const,
    label: group.label,
    items: sortItems(group.items),
  }));

  const groupedItems = [...baseGroups, ...customGroups];

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditingItem(null);
      setName('');
      setValue('');
      setCategory('custom');
      setCustomCategory('');
    }
  }, [isOpen]);

  const handleAdd = () => {
    setEditingItem(null);
    setName('');
    setValue('');
    setCategory('custom');
    setCustomCategory('');
    setIsEditing(true);
  };

  const handleEdit = (item: ScoreItem) => {
    setEditingItem(item);
    setName(item.name);
    setValue(String(item.value));
    setCategory(item.category);
    setCustomCategory(item.customCategory || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    const numValue = parseInt(value, 10);
    if (!name.trim() || isNaN(numValue) || numValue === 0) return;
    const trimmedCustom = category === 'custom' ? customCategory.trim() : '';

    if (editingItem) {
      dispatch({
        type: 'UPDATE_SCORE_ITEM',
        payload: {
          ...editingItem,
          name: name.trim(),
          nameEn: editingItem.nameEn || name.trim(),
          value: numValue,
          category,
          customCategory: trimmedCustom || undefined,
        },
      });
    } else {
      const newItem: ScoreItem = {
        id: generateId(),
        name: name.trim(),
        nameEn: name.trim(),
        value: numValue,
        category,
        customCategory: trimmedCustom || undefined,
      };
      dispatch({ type: 'ADD_SCORE_ITEM', payload: newItem });
    }
    setIsEditing(false);
  };

  const handleDelete = (itemId: string) => {
    if (confirm(t('确定要删除这个项目吗？', 'Are you sure you want to delete this item?'))) {
      dispatch({ type: 'DELETE_SCORE_ITEM', payload: itemId });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('加减分项目管理', 'Score Item Management')}
      size="lg"
    >
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('名称', 'Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('例如：积极发言', 'e.g., 积极发言')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('分数', 'Points')}
              </label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={t('正数加分，负数减分', 'Positive to add, negative to subtract')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('正数 = 加分项，负数 = 减分项', 'Positive = Add, Negative = Subtract')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('类别', 'Category')}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ScoreCategory)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {category === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('自定义分类名称', 'Custom Category Name')}
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder={t('例如：课堂表现习惯', 'e.g., Classroom Habits')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              {t('取消', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !value || parseInt(value, 10) === 0}
            >
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button onClick={handleAdd}>
              + {t('添加项目', 'Add Item')}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('排序:', 'Sort:')}</span>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as SortOrder)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="default">{t('默认', 'Default')}</option>
                <option value="high-to-low">{t('分数高→低', 'High → Low')}</option>
                <option value="low-to-high">{t('分数低→高', 'Low → High')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {groupedItems.map(group => (
              <div key={`${group.value}-${group.label}`}>
                <h3 className="font-medium text-gray-900 mb-2">{group.label}</h3>
                {group.items.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">
                    {t('暂无项目', 'No items')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className={`w-12 h-8 rounded flex items-center justify-center font-bold text-white ${
                          item.value > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {item.value > 0 ? '+' : ''}{item.value}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                        </div>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
