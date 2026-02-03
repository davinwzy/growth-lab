import type { Group, Student, StudentGamification } from '@/shared/types';
import { useApp } from '@/app/AppProvider';
import { StudentCard } from '@/features/students/StudentCard';

interface GroupCardProps {
  group: Group;
  students: Student[];
  onStudentClick: (student: Student) => void;
  onGroupClick: (group: Group) => void;
  selectedStudents: Set<string>;
  onStudentSelect: (studentId: string) => void;
  selectionMode: boolean;
  gamificationMap: Map<string, StudentGamification>;
}

export function GroupCard({
  group,
  students,
  onStudentClick,
  onGroupClick,
  selectedStudents,
  onStudentSelect,
  selectionMode,
  gamificationMap,
}: GroupCardProps) {
  const { t } = useApp();

  const groupScore = group.score || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className="px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ backgroundColor: group.color }}
        onClick={() => onGroupClick(group)}
      >
        <div className="flex items-center justify-between text-white">
          <h3 className="font-bold text-lg">{group.name}</h3>
          <div className="text-right">
            <div className="text-sm opacity-90">{t('组别分数', 'Group Score')}</div>
            <div className="text-2xl font-bold">{groupScore}</div>
          </div>
        </div>
      </div>
      <div className="p-2 space-y-2">
        {students.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">
            {t('暂无学生', 'No students')}
          </div>
        ) : (
          students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              groupColor={group.color}
              onClick={() => onStudentClick(student)}
              isSelected={selectedStudents.has(student.id)}
              onSelect={() => onStudentSelect(student.id)}
              selectionMode={selectionMode}
              gamification={gamificationMap.get(student.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
