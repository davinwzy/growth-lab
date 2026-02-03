import type { AttendanceRecord, Student } from '@/shared/types';

export function getAttendanceForDate(records: AttendanceRecord[], date: string): AttendanceRecord[] {
  return records.filter(r => r.date === date);
}

export function getPresentStudentIds(records: AttendanceRecord[]): Set<string> {
  const present = new Set<string>();
  for (const r of records) {
    if (r.status === 'present') present.add(r.studentId);
  }
  return present;
}

export function getUnmarkedStudentIds(
  students: Student[],
  presentIds: Set<string>
): string[] {
  return students.filter(s => !presentIds.has(s.id)).map(s => s.id);
}

export function getAttendanceRecordForStudent(
  records: AttendanceRecord[],
  studentId: string,
  date: string
): AttendanceRecord | undefined {
  return records.find(r => r.studentId === studentId && r.date === date && r.status === 'present');
}

export function getWeekendDatesForMonth(year: number, monthIndex: number): string[] {
  const dates: string[] = [];
  const lastDay = new Date(year, monthIndex + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, monthIndex, d);
    const day = date.getDay();
    if (day === 0 || day === 6) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dates.push(key);
    }
  }
  return dates;
}
