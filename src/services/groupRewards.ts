import type { Reward, Student } from '@/shared/types';

export function splitGroupRewardCost(cost: number, studentCount: number): number[] {
  if (studentCount <= 0) return [];
  const perStudent = Math.floor(cost / studentCount);
  const remainder = cost % studentCount;
  return Array.from({ length: studentCount }, (_, index) => perStudent + (index < remainder ? 1 : 0));
}

export function canGroupRedeemReward(reward: Reward, students: Student[]): boolean {
  const total = students.reduce((sum, s) => sum + s.score, 0);
  return total >= reward.cost;
}
