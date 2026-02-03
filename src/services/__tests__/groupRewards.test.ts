import { describe, it, expect } from 'vitest';
import { canGroupRedeemReward, splitGroupRewardCost } from '../groupRewards';
import type { Reward, Student } from '@/shared/types';

describe('groupRewards', () => {
  it('splits reward cost evenly and distributes remainder', () => {
    expect(splitGroupRewardCost(10, 3)).toEqual([4, 3, 3]);
    expect(splitGroupRewardCost(5, 2)).toEqual([3, 2]);
  });

  it('checks if group can redeem reward', () => {
    const reward: Reward = { id: 'r1', name: 'R', nameEn: 'R', cost: 5 };
    const students: Student[] = [
      { id: 's1', classId: 'c1', groupId: 'g1', name: 'A', score: 2, createdAt: 1 },
      { id: 's2', classId: 'c1', groupId: 'g1', name: 'B', score: 3, createdAt: 1 },
    ];
    expect(canGroupRedeemReward(reward, students)).toBe(true);
    expect(canGroupRedeemReward({ ...reward, cost: 6 }, students)).toBe(false);
  });
});
