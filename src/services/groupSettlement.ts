import type { Group, Student } from '@/shared/types';

export function sortGroupsByScore(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function groupStudentsByGroupId(students: Student[], groupId: string): Student[] {
  return students.filter(s => s.groupId === groupId);
}

export function computeSettlementBonuses(
  groups: Group[],
  bonuses: number[]
): { groupId: string; bonusPerStudent: number }[] {
  return groups.map((group, index) => ({
    groupId: group.id,
    bonusPerStudent: bonuses[index] ?? bonuses[bonuses.length - 1] ?? 5,
  }));
}
