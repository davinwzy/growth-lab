import { useState, useEffect } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import { LEVEL_DEFINITIONS } from '@/shared/utils/gamification';
import type { Reward } from '@/shared/types';

interface RewardManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOrder = 'default' | 'high-to-low' | 'low-to-high';

export function RewardManager({ isOpen, onClose }: RewardManagerProps) {
  const { state, dispatch, t } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [minLevel, setMinLevel] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const sortRewards = (rewards: Reward[]) => {
    if (sortOrder === 'high-to-low') return [...rewards].sort((a, b) => b.cost - a.cost);
    if (sortOrder === 'low-to-high') return [...rewards].sort((a, b) => a.cost - b.cost);
    return rewards;
  };

  const groupedRewards = LEVEL_DEFINITIONS.map(level => ({
    level,
    rewards: sortRewards(state.rewards.filter(reward => (reward.minLevel || 1) === level.level)),
  }));

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditingReward(null);
      setName('');
      setCost('');
      setDescription('');
      setMinLevel(1);
    }
  }, [isOpen]);


  const handleAdd = () => {
    setEditingReward(null);
    setName('');
    setCost('');
    setDescription('');
    setMinLevel(1);
    setIsEditing(true);
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setName(reward.name);
    setCost(String(reward.cost));
    setDescription(reward.description || '');
    setMinLevel(reward.minLevel || 1);
    setIsEditing(true);
  };

  const handleSave = () => {
    const numCost = parseInt(cost, 10);
    if (!name.trim() || isNaN(numCost) || numCost <= 0) return;

    if (editingReward) {
      dispatch({
        type: 'UPDATE_REWARD',
        payload: {
          ...editingReward,
          name: name.trim(),
          nameEn: editingReward.nameEn || name.trim(),
          cost: numCost,
          description: description.trim() || undefined,
          descriptionEn: editingReward.descriptionEn || description.trim() || undefined,
          minLevel: minLevel > 1 ? minLevel : undefined,
        },
      });
    } else {
      const newReward: Reward = {
        id: generateId(),
        name: name.trim(),
        nameEn: name.trim(),
        cost: numCost,
        description: description.trim() || undefined,
        descriptionEn: description.trim() || undefined,
        minLevel: minLevel > 1 ? minLevel : undefined,
      };
      dispatch({ type: 'ADD_REWARD', payload: newReward });
    }
    setIsEditing(false);
  };

  const handleDelete = (rewardId: string) => {
    if (confirm(t('确定要删除这个礼物吗？', 'Are you sure you want to delete this reward?'))) {
      dispatch({ type: 'DELETE_REWARD', payload: rewardId });
    }
  };

  const getLevelLabel = (level: number) => {
    const def = LEVEL_DEFINITIONS.find(l => l.level === level);
    return def ? `${def.emoji} ${t(def.name, def.nameEn)}` : '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('礼物管理', 'Reward Management')}
      size="lg"
    >
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('名称', 'Name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('例如：免作业券', 'e.g., 免作业券')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('所需分数', 'Cost (Points)')}
              </label>
              <input
                type="number"
                min="1"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder={t('例如：10', 'e.g., 10')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('最低等级要求', 'Minimum Level Required')}
              </label>
              <select
                value={minLevel}
                onChange={e => setMinLevel(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>{t('无限制', 'No restriction')}</option>
                {LEVEL_DEFINITIONS.filter(l => l.level > 1).map(l => (
                  <option key={l.level} value={l.level}>
                    {l.emoji} {t(l.name, l.nameEn)} (Lv.{l.level}+)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('描述（可选）', 'Description (Optional)')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('礼物描述...', 'Description...')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              {t('取消', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !cost || parseInt(cost, 10) <= 0}
            >
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button onClick={handleAdd}>
              + {t('添加礼物', 'Add Reward')}
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

          {state.rewards.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t('暂无礼物，请添加', 'No rewards yet, please add some')}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedRewards.map(group => (
                <div key={group.level.level}>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {group.level.level === 1
                      ? t('基础礼物（不限等级）', 'Base Rewards (No restriction)')
                      : `${getLevelLabel(group.level.level)} Lv.${group.level.level}+`}
                  </h3>
                  {group.rewards.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">
                      {t('暂无礼物', 'No rewards')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.rewards.map(reward => (
                        <div
                          key={reward.id}
                          className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <div className="text-2xl">🎁</div>
                          <div className="flex-1">
                            <div className="font-medium">{reward.name}</div>
                            {reward.description && (
                              <div className="text-xs text-gray-400 mt-1">{reward.description}</div>
                            )}
                          </div>
                          <div className="text-amber-600 font-bold text-lg">
                            {reward.cost} {t('分', 'pts')}
                          </div>
                          <button
                            onClick={() => handleEdit(reward)}
                            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(reward.id)}
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
          )}
        </div>
      )}
    </Modal>
  );
}
