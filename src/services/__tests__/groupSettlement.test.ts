import { describe, it, expect } from 'vitest';
import { computeSettlementBonuses, sortGroupsByScore } from '../groupSettlement';
import type { Group } from '@/shared/types';

describe('groupSettlement', () => {
  it('sorts groups by score descending', () => {
    const groups: Group[] = [
      { id: 'g1', classId: 'c1', name: 'A', color: '#000', order: 1, score: 5 },
      { id: 'g2', classId: 'c1', name: 'B', color: '#000', order: 2, score: 8 },
      { id: 'g3', classId: 'c1', name: 'C', color: '#000', order: 3, score: 1 },
    ];
    const sorted = sortGroupsByScore(groups);
    expect(sorted.map(g => g.id)).toEqual(['g2', 'g1', 'g3']);
  });

  it('computes per-group bonuses with fallback', () => {
    const groups: Group[] = [
      { id: 'g1', classId: 'c1', name: 'A', color: '#000', order: 1, score: 5 },
      { id: 'g2', classId: 'c1', name: 'B', color: '#000', order: 2, score: 8 },
      { id: 'g3', classId: 'c1', name: 'C', color: '#000', order: 3, score: 1 },
    ];
    const bonuses = computeSettlementBonuses(groups, [10, 5]);
    expect(bonuses).toEqual([
      { groupId: 'g1', bonusPerStudent: 10 },
      { groupId: 'g2', bonusPerStudent: 5 },
      { groupId: 'g3', bonusPerStudent: 5 },
    ]);
  });
});
