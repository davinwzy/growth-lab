import { useState, useEffect } from 'react';
import { useApp } from '@/app/AppProvider';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import type { BadgeDefinition, BadgeCondition } from '@/shared/types';

interface BadgeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConditionType = BadgeCondition['type'];

const CONDITION_TYPES: { value: ConditionType; label: string; labelEn: string; hasValue: boolean; valueLabel: string; valueLabelEn: string; needsItem?: boolean }[] = [
  { value: 'first_score', label: '首次得分', labelEn: 'First Score', hasValue: false, valueLabel: '', valueLabelEn: '' },
  { value: 'total_xp', label: '累计XP达到', labelEn: 'Total XP Reached', hasValue: true, valueLabel: 'XP数量', valueLabelEn: 'XP Amount' },
  { value: 'level_reached', label: '达到等级', labelEn: 'Level Reached', hasValue: true, valueLabel: '等级(1-6)', valueLabelEn: 'Level (1-6)' },
  { value: 'streak_days', label: '连续天数', labelEn: 'Streak Days', hasValue: true, valueLabel: '天数', valueLabelEn: 'Days' },
  { value: 'score_count', label: '累计加分次数', labelEn: 'Total Score Count', hasValue: true, valueLabel: '次数', valueLabelEn: 'Count' },
  { value: 'score_item_count', label: '指定加分项次数', labelEn: 'Specific Score Item Count', hasValue: true, valueLabel: '次数', valueLabelEn: 'Count', needsItem: true },
  { value: 'reward_redeemed', label: '兑换礼物次数', labelEn: 'Rewards Redeemed', hasValue: true, valueLabel: '次数', valueLabelEn: 'Count' },
  { value: 'perfect_quiz_count', label: '满分测验次数', labelEn: 'Perfect Quiz Count', hasValue: true, valueLabel: '次数', valueLabelEn: 'Count' },
  { value: 'helping_others_count', label: '助人为乐次数', labelEn: 'Helping Others Count', hasValue: true, valueLabel: '次数', valueLabelEn: 'Count' },
  { value: 'attendance_days', label: '出勤天数', labelEn: 'Attendance Days', hasValue: true, valueLabel: '天数', valueLabelEn: 'Days' },
];

const EMOJI_OPTIONS = ['🏅', '🎖️', '🌟', '⭐', '💫', '✨', '🏆', '👑', '💪', '🔥', '🚀', '💎', '🎯', '📚', '✏️', '🎨', '🎭', '🎵', '🌈', '🦋', '🐱', '🐶', '🦊', '🐼', '🍎', '🍕', '🎂', '🎁', '❤️', '💜', '📝', '🤝', '✅'];

const CATEGORY_OPTIONS = [
  { value: 'milestone', label: '里程碑', labelEn: 'Milestone' },
  { value: 'streak', label: '连续签到', labelEn: 'Streak' },
  { value: 'academic', label: '学术', labelEn: 'Academic' },
  { value: 'score', label: '积分', labelEn: 'Score' },
  { value: 'social', label: '社交', labelEn: 'Social' },
  { value: 'attendance', label: '出勤', labelEn: 'Attendance' },
  { value: 'custom', label: '自定义', labelEn: 'Custom' },
];

export function BadgeManager({ isOpen, onClose }: BadgeManagerProps) {
  const { state, dispatch, t } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏅');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('custom');
  const [conditionType, setConditionType] = useState<ConditionType>('total_xp');
  const [conditionValue, setConditionValue] = useState('');
  const [conditionItemId, setConditionItemId] = useState('');
  const [bonusPoints, setBonusPoints] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const positiveScoreItems = state.scoreItems.filter(item => item.value > 0);

  // All badges are now editable (stored in customBadges)
  const allBadges = state.customBadges || [];

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditingBadge(null);
      setName('');
      setEmoji('🏅');
      setDescription('');
      setCategory('custom');
      setConditionType('total_xp');
      setConditionValue('');
      setConditionItemId(positiveScoreItems[0]?.id || '');
      setBonusPoints('');
      setShowEmojiPicker(false);
    }
  }, [isOpen, positiveScoreItems]);

  const handleAdd = () => {
    setEditingBadge(null);
    setName('');
    setEmoji('🏅');
    setDescription('');
    setCategory('custom');
    setConditionType('total_xp');
    setConditionValue('');
    setConditionItemId(positiveScoreItems[0]?.id || '');
    setBonusPoints('10');
    setIsEditing(true);
  };

  const handleEdit = (badge: BadgeDefinition) => {
    setEditingBadge(badge);
    setName(badge.name);
    setEmoji(badge.emoji);
    setDescription(badge.description);
    setCategory(badge.category);
    setConditionType(badge.condition.type);

    // Extract condition value based on type
    const c = badge.condition;
    if ('xp' in c) setConditionValue(String(c.xp));
    else if ('level' in c) setConditionValue(String(c.level));
    else if ('days' in c) setConditionValue(String(c.days));
    else if ('count' in c) setConditionValue(String(c.count));
    else setConditionValue('');
    if ('itemId' in c) {
      setConditionItemId(c.itemId);
    } else {
      setConditionItemId(positiveScoreItems[0]?.id || '');
    }

    setBonusPoints(String(badge.bonusPoints || 0));
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const condTypeInfo = CONDITION_TYPES.find(ct => ct.value === conditionType);
    if (condTypeInfo?.hasValue && (!conditionValue || parseInt(conditionValue, 10) <= 0)) return;

    // Build condition object
    let condition: BadgeCondition;
    const numValue = parseInt(conditionValue, 10);
    switch (conditionType) {
      case 'first_score':
        condition = { type: 'first_score' };
        break;
      case 'total_xp':
        condition = { type: 'total_xp', xp: numValue };
        break;
      case 'level_reached':
        condition = { type: 'level_reached', level: Math.min(6, Math.max(1, numValue)) };
        break;
      case 'streak_days':
        condition = { type: 'streak_days', days: numValue };
        break;
      case 'score_count':
        condition = { type: 'score_count', count: numValue };
        break;
      case 'score_item_count':
        condition = { type: 'score_item_count', itemId: conditionItemId, count: numValue };
        break;
      case 'reward_redeemed':
        condition = { type: 'reward_redeemed', count: numValue };
        break;
      case 'perfect_quiz_count':
        condition = { type: 'perfect_quiz_count', count: numValue };
        break;
      case 'helping_others_count':
        condition = { type: 'helping_others_count', count: numValue };
        break;
      case 'attendance_days':
        condition = { type: 'attendance_days', days: numValue };
        break;
      default:
        condition = { type: 'first_score' };
    }

    const badgeData: BadgeDefinition = {
      id: editingBadge?.id || generateId(),
      name: name.trim(),
      nameEn: editingBadge?.nameEn || name.trim(),
      emoji,
      category: category as BadgeDefinition['category'],
      description: description.trim(),
      descriptionEn: editingBadge?.descriptionEn || description.trim(),
      condition,
      bonusPoints: parseInt(bonusPoints, 10) || 0,
    };

    if (editingBadge) {
      dispatch({ type: 'UPDATE_CUSTOM_BADGE', payload: badgeData });
    } else {
      dispatch({ type: 'ADD_CUSTOM_BADGE', payload: badgeData });
    }
    setIsEditing(false);
  };

  const handleDelete = (badgeId: string) => {
    if (confirm(t('确定要删除这个成就吗？', 'Are you sure you want to delete this achievement?'))) {
      dispatch({ type: 'DELETE_CUSTOM_BADGE', payload: badgeId });
    }
  };

  const getConditionDisplay = (badge: BadgeDefinition) => {
    const c = badge.condition;
    const condType = CONDITION_TYPES.find(ct => ct.value === c.type);
    if (!condType) return '';

    let value = '';
    if ('xp' in c) value = `${c.xp} XP`;
    else if ('level' in c) value = `Lv.${c.level}`;
    else if ('days' in c) value = `${c.days} ${t('天', 'days')}`;
    else if ('count' in c) value = `${c.count} ${t('次', 'times')}`;

    if ('itemId' in c) {
      const item = state.scoreItems.find(i => i.id === c.itemId);
      const itemLabel = item?.name || t('已删除项目', 'Deleted item');
      return `${t(condType.label, condType.labelEn)}: ${itemLabel} × ${c.count}`;
    }

    return value ? `${t(condType.label, condType.labelEn)}: ${value}` : t(condType.label, condType.labelEn);
  };

  const selectedCondType = CONDITION_TYPES.find(ct => ct.value === conditionType);

  // Group badges by category for display
  const badgesByCategory = CATEGORY_OPTIONS.map(cat => ({
    ...cat,
    badges: allBadges.filter(b => b.category === cat.value),
  })).filter(cat => cat.badges.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('成就管理', 'Achievement Management')}
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
              placeholder={t('例如：阅读达人', 'e.g., 阅读达人')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('图标', 'Icon')}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full px-3 py-2 border rounded-lg text-left flex items-center gap-2 hover:bg-gray-50"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-gray-500 text-sm">{t('选择', 'Select')}</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10 grid grid-cols-6 gap-1 w-64">
                    {EMOJI_OPTIONS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                        className={`text-2xl p-1 rounded hover:bg-gray-100 ${emoji === e ? 'bg-blue-100' : ''}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('类别', 'Category')}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {t(cat.label, cat.labelEn)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('奖励分数', 'Bonus Points')}
              </label>
              <input
                type="number"
                min="0"
                value={bonusPoints}
                onChange={e => setBonusPoints(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('达成条件类型', 'Condition Type')}
              </label>
              <select
                value={conditionType}
                onChange={e => setConditionType(e.target.value as ConditionType)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CONDITION_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>
                    {t(ct.label, ct.labelEn)}
                  </option>
                ))}
              </select>
            </div>
            {selectedCondType?.hasValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t(selectedCondType.valueLabel, selectedCondType.valueLabelEn)}
                </label>
                <input
                  type="number"
                  min="1"
                  value={conditionValue}
                  onChange={e => setConditionValue(e.target.value)}
                  placeholder={t('输入数值', 'Enter value')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          {selectedCondType?.needsItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('关联加分项', 'Related Score Item')}
              </label>
              <select
                value={conditionItemId}
                onChange={e => setConditionItemId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {positiveScoreItems.length === 0 ? (
                  <option value="">{t('暂无加分项', 'No score items')}</option>
                ) : (
                  positiveScoreItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('描述', 'Description')}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('成就描述...', 'Description...')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-16 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              {t('取消', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()
                || (selectedCondType?.hasValue && (!conditionValue || parseInt(conditionValue, 10) <= 0))
                || (selectedCondType?.needsItem && !conditionItemId)}
            >
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button onClick={handleAdd}>
              + {t('添加成就', 'Add Achievement')}
            </Button>
            <div className="text-xs text-gray-500">
              {t('按类别查看与管理', 'Browse by category')}
            </div>
          </div>

          {/* Badges by Category */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {badgesByCategory.map(cat => (
              <div key={cat.value}>
                <h3 className="font-medium text-gray-900 mb-2">
                  {t(cat.label, cat.labelEn)} <span className="text-xs text-gray-400">({cat.badges.length})</span>
                </h3>
                <div className="space-y-2">
                  {cat.badges.map(badge => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-2xl">{badge.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{badge.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {getConditionDisplay(badge)}
                          {badge.bonusPoints ? ` | +${badge.bonusPoints} ${t('分', 'pts')}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(badge)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title={t('编辑', 'Edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(badge.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        title={t('删除', 'Delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {allBadges.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {t('没有成就，点击上方按钮添加', 'No achievements yet. Click the button above to add one.')}
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 pt-2 border-t">
            {t(`共 ${allBadges.length} 个成就`, `${allBadges.length} achievements total`)}
          </div>
        </div>
      )}
    </Modal>
  );
}
