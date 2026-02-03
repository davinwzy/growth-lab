import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/app/AppProvider';
import { useGamification } from '@/features/gamification/useGamification';
import { Modal, Button } from '@/shared/components';
import { generateId } from '@/shared/utils/storage';
import { formatDateKey } from '@/shared/utils/date';
import { getAttendanceForDate, getPresentStudentIds, getUnmarkedStudentIds, getAttendanceRecordForStudent, getWeekendDatesForMonth } from '@/services/attendance';
import type { AttendanceRecord, AttendanceExemption, HistoryRecord } from '@/shared/types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'today' | 'calendar' | 'history';

export function AttendanceModal({ isOpen, onClose }: AttendanceModalProps) {
  const { state, dispatch, t } = useApp();
  const { processAttendance, processAttendanceMakeup, revokeAttendance, getGamification } = useGamification();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return formatDateKey(new Date());
  });
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [exemptionNote, setExemptionNote] = useState('');

  useEffect(() => {
    setPresentIds(new Set());
  }, [selectedDate, viewMode, state.currentClassId, isOpen]);

  // Get students for current class
  const currentStudents = useMemo(() => {
    return state.students.filter(s => s.classId === state.currentClassId);
  }, [state.students, state.currentClassId]);

  // Get groups for current class
  const currentGroups = useMemo(() => {
    return state.groups
      .filter(g => g.classId === state.currentClassId)
      .sort((a, b) => a.order - b.order);
  }, [state.groups, state.currentClassId]);

  // Get today's date string
  const today = useMemo(() => {
    return formatDateKey(new Date());
  }, []);

  // Get attendance records for current class
  const classAttendance = useMemo(() => {
    return state.attendanceRecords.filter(r => r.classId === state.currentClassId);
  }, [state.attendanceRecords, state.currentClassId]);

  const classExemptions = useMemo(() => {
    return state.attendanceExemptions.filter(e => e.classId === state.currentClassId);
  }, [state.attendanceExemptions, state.currentClassId]);

  const exemptDateSet = useMemo(() => {
    return new Set(classExemptions.map(e => e.date));
  }, [classExemptions]);

  const selectedExemption = useMemo(() => {
    return classExemptions.find(e => e.date === selectedDate) || null;
  }, [classExemptions, selectedDate]);

  useEffect(() => {
    setExemptionNote(selectedExemption?.note || '');
  }, [selectedExemption]);

  // Get attendance for selected date
  const dateAttendance = useMemo(() => {
    return getAttendanceForDate(classAttendance, selectedDate);
  }, [classAttendance, selectedDate]);

  // Check who attended on selected date
  const attendedOnDate = useMemo(() => {
    return getPresentStudentIds(dateAttendance);
  }, [dateAttendance]);

  // Students grouped by group
  const studentsByGroup = useMemo(() => {
    return currentGroups.map(group => ({
      group,
      students: currentStudents.filter(s => s.groupId === group.id),
    }));
  }, [currentGroups, currentStudents]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 = Sunday
    const days: { date: string; day: number; isCurrentMonth: boolean; attendance: number; total: number; isExempt: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = formatDateKey(d);
      const dayAttendance = classAttendance.filter(r => r.date === dateStr && r.status === 'present').length;
      days.push({
        date: dateStr,
        day: d.getDate(),
        isCurrentMonth: false,
        attendance: dayAttendance,
        total: currentStudents.length,
        isExempt: exemptDateSet.has(dateStr),
      });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = formatDateKey(new Date(year, month, d));
      const dayAttendance = classAttendance.filter(r => r.date === dateStr && r.status === 'present').length;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        attendance: dayAttendance,
        total: currentStudents.length,
        isExempt: exemptDateSet.has(dateStr),
      });
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows * 7 days
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const dateStr = formatDateKey(date);
      const dayAttendance = classAttendance.filter(r => r.date === dateStr && r.status === 'present').length;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        attendance: dayAttendance,
        total: currentStudents.length,
        isExempt: exemptDateSet.has(dateStr),
      });
    }

    return days;
  }, [calendarMonth, classAttendance, currentStudents.length, exemptDateSet]);

  const handleToggle = (studentId: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setPresentIds(newSet);
  };

  const handleSelectAll = () => {
    const notMarked = getUnmarkedStudentIds(currentStudents, attendedOnDate);
    if (presentIds.size === notMarked.length) {
      setPresentIds(new Set());
    } else {
      setPresentIds(new Set(notMarked));
    }
  };

  const handleSelectGroup = (groupId: string) => {
    const groupStudentIds = currentStudents
      .filter(s => s.groupId === groupId && !attendedOnDate.has(s.id))
      .map(s => s.id);

    const allSelected = groupStudentIds.every(id => presentIds.has(id));
    const newSet = new Set(presentIds);

    if (allSelected) {
      groupStudentIds.forEach(id => newSet.delete(id));
    } else {
      groupStudentIds.forEach(id => newSet.add(id));
    }
    setPresentIds(newSet);
  };

  const handleSubmit = async () => {
    if (presentIds.size === 0) return;

    setIsSubmitting(true);
    const isToday = selectedDate === today;

    // Process attendance for each selected student
    for (const studentId of presentIds) {
      const student = currentStudents.find(s => s.id === studentId);
      if (student) {
        // Add attendance record
        const record: AttendanceRecord = {
          id: generateId(),
          classId: state.currentClassId || '',
          studentId,
          date: selectedDate,
          status: 'present',
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_ATTENDANCE', payload: record });

        // If today, process gamification with streak bonus
        // For makeup attendance, just add score and XP without streak bonus
        if (isToday) {
          processAttendance(studentId, student.name, record);
        } else {
          processAttendanceMakeup(studentId, student.name, selectedDate, record);
        }
      }
    }

    setIsSubmitting(false);
    setPresentIds(new Set());
  };

  const handleRevokeAttendance = (studentId: string) => {
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return;

    if (!confirm(t(
      `确定要撤销 ${student.name} 在 ${selectedDate} 的出勤记录吗？将扣除1分。`,
      `Revoke ${student.name}'s attendance on ${selectedDate}? This will deduct 1 point.`
    ))) return;

    // Find and delete the attendance record
    const record = getAttendanceRecordForStudent(classAttendance, studentId, selectedDate);
    if (record) {
      dispatch({ type: 'DELETE_ATTENDANCE', payload: record.id });
    }

    // Use the revokeAttendance function which handles score deduction, XP removal, and history
    revokeAttendance(studentId, student.name, selectedDate, record || undefined);
  };

  const currentClassName = useMemo(() => {
    return state.classes.find(c => c.id === state.currentClassId)?.name || '';
  }, [state.classes, state.currentClassId]);

  const addExemptionHistory = (action: 'add' | 'remove' | 'update', date: string, note?: string) => {
    if (!state.currentClassId) return;
    const actionLabel = action === 'add'
      ? t('设置免签日', 'Set No-Class Day')
      : action === 'remove'
      ? t('取消免签日', 'Remove No-Class Day')
      : t('更新免签备注', 'Update No-Class Note');
    const record: HistoryRecord = {
      id: generateId(),
      classId: state.currentClassId,
      type: 'system',
      targetType: 'class',
      targetId: state.currentClassId,
      targetName: currentClassName || t('班级', 'Class'),
      itemId: action === 'add'
        ? 'attendance_exempt_add'
        : action === 'remove'
        ? 'attendance_exempt_remove'
        : 'attendance_exempt_update',
      itemName: actionLabel,
      value: 0,
      timestamp: Date.now(),
      note: note ? `${date} - ${note} (${t('连胜已重新计算', 'Streaks recalculated')})` : `${date} (${t('连胜已重新计算', 'Streaks recalculated')})`,
    };
    dispatch({ type: 'ADD_HISTORY', payload: record });
  };

  const handleToggleExempt = () => {
    if (!state.currentClassId) return;
    if (selectedExemption) {
      dispatch({ type: 'DELETE_ATTENDANCE_EXEMPTION', payload: selectedExemption.id });
      addExemptionHistory('remove', selectedExemption.date, selectedExemption.note);
      return;
    }
    const exemption: AttendanceExemption = {
      id: generateId(),
      classId: state.currentClassId,
      date: selectedDate,
      createdAt: Date.now(),
      note: exemptionNote.trim() || undefined,
    };
    dispatch({ type: 'ADD_ATTENDANCE_EXEMPTION', payload: exemption });
    addExemptionHistory('add', selectedDate, exemption.note);
  };

  const handleSaveExemptionNote = () => {
    if (!selectedExemption) return;
    const updated: AttendanceExemption = {
      ...selectedExemption,
      note: exemptionNote.trim() || undefined,
    };
    dispatch({ type: 'UPDATE_ATTENDANCE_EXEMPTION', payload: updated });
    addExemptionHistory('update', selectedExemption.date, updated.note ? `${t('更新备注', 'Updated note')}: ${updated.note}` : t('更新备注', 'Updated note'));
  };

  const handleMarkWeekends = () => {
    if (!state.currentClassId) return;
    const weekendDates = getWeekendDatesForMonth(calendarMonth.getFullYear(), calendarMonth.getMonth());
    const toAdd = weekendDates.filter(date => !exemptDateSet.has(date));
    if (toAdd.length === 0) return;
    toAdd.forEach(date => {
      const exemption: AttendanceExemption = {
        id: generateId(),
        classId: state.currentClassId!,
        date,
        createdAt: Date.now(),
        note: t('周末', 'Weekend'),
      };
      dispatch({ type: 'ADD_ATTENDANCE_EXEMPTION', payload: exemption });
    });
    addExemptionHistory(
      'add',
      `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`,
      t(`批量设置周末免签（${toAdd.length}天）`, `Bulk mark weekends (${toAdd.length} days)`)
    );
  };

  const handleClearWeekends = () => {
    if (!state.currentClassId) return;
    const weekendDates = new Set(getWeekendDatesForMonth(calendarMonth.getFullYear(), calendarMonth.getMonth()));
    const toRemove = classExemptions.filter(e => weekendDates.has(e.date));
    if (toRemove.length === 0) return;
    toRemove.forEach(e => {
      dispatch({ type: 'DELETE_ATTENDANCE_EXEMPTION', payload: e.id });
    });
    addExemptionHistory(
      'remove',
      `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`,
      t(`批量取消周末免签（${toRemove.length}天）`, `Bulk remove weekends (${toRemove.length} days)`)
    );
  };

  const navigateMonth = (delta: number) => {
    setCalendarMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const unmarkedCount = currentStudents.length - attendedOnDate.size;
  const selectedCount = presentIds.size;

  const weekDays = [
    t('日', 'Sun'), t('一', 'Mon'), t('二', 'Tue'), t('三', 'Wed'),
    t('四', 'Thu'), t('五', 'Fri'), t('六', 'Sat')
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('出勤管理', 'Attendance Management')}
      size="xl"
    >
      <div className="space-y-4">
        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <button
            onClick={() => { setViewMode('today'); setSelectedDate(today); }}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              viewMode === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t('今日签到', "Today's Check-in")}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t('日历视图', 'Calendar View')}
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              viewMode === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t('出勤记录', 'Attendance History')}
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-lg font-medium">
                {calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月
              </div>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}

              {/* Days */}
              {calendarDays.map((day, index) => {
                const isSelected = day.date === selectedDate;
                const isToday = day.date === today;
                const hasAttendance = day.attendance > 0;
                const attendancePercent = day.total > 0 ? Math.round((day.attendance / day.total) * 100) : 0;
                const isExempt = day.isExempt;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-2 text-center rounded-lg transition-all relative ${
                      !day.isCurrentMonth ? 'text-gray-300' :
                      isSelected ? 'bg-blue-500 text-white' :
                      isExempt ? 'bg-gray-200 text-gray-700' :
                      isToday ? 'bg-blue-100 text-blue-700 font-bold' :
                      'hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm">{day.day}</div>
                    {isExempt && day.isCurrentMonth && (
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                        {t('休', 'No Class')}
                      </div>
                    )}
                    {hasAttendance && day.isCurrentMonth && (
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-green-600'}`}>
                        {attendancePercent}%
                      </div>
                    )}
                    {hasAttendance && day.isCurrentMonth && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{selectedDate}</span>
                <span className="text-sm text-gray-500">
                  {attendedOnDate.size} / {currentStudents.length} {t('出席', 'present')}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => setViewMode('today')}
                >
                  {selectedDate === today ? t('签到', 'Check-in') : t('补签/修改', 'Makeup/Edit')}
                </Button>
                <Button
                  variant={selectedExemption ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={handleToggleExempt}
                >
                  {selectedExemption ? t('取消免签', 'Remove Exemption') : t('设为免签', 'Mark No Class')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMarkWeekends}>
                  {t('本月周末免签', 'Mark Weekends')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearWeekends}>
                  {t('清除周末免签', 'Clear Weekends')}
                </Button>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={exemptionNote}
                  onChange={e => setExemptionNote(e.target.value)}
                  placeholder={t('免签备注（可选）', 'Exemption note (optional)')}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                {selectedExemption && (
                  <Button size="sm" variant="secondary" onClick={handleSaveExemptionNote}>
                    {t('保存备注', 'Save Note')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Today/Checkin View */}
        {viewMode === 'today' && (
          <>
            {/* Date Display */}
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">{t('日期', 'Date')}</div>
                <div className="font-medium flex items-center gap-2">
                  {selectedDate}
                  {selectedDate !== today && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {t('补签模式', 'Makeup Mode')}
                    </span>
                  )}
                  {selectedExemption && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                      {t('免签', 'No Class')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{t('已选择', 'Selected')}</div>
                <div className="font-medium text-blue-600">{selectedCount} / {unmarkedCount}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                {presentIds.size === unmarkedCount ? t('取消全选', 'Deselect All') : t('全选', 'Select All')}
              </Button>
              <Button
                variant={selectedExemption ? 'secondary' : 'ghost'}
                size="sm"
                onClick={handleToggleExempt}
              >
                {selectedExemption ? t('取消免签', 'Remove Exemption') : t('设为免签', 'Mark No Class')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleMarkWeekends}>
                {t('本月周末免签', 'Mark Weekends')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearWeekends}>
                {t('清除周末免签', 'Clear Weekends')}
              </Button>
              {currentGroups.map(group => (
                <Button
                  key={group.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectGroup(group.id)}
                  style={{ borderColor: group.color, color: group.color }}
                  className="border"
                >
                  {group.name}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={exemptionNote}
                onChange={e => setExemptionNote(e.target.value)}
                placeholder={t('免签备注（可选）', 'Exemption note (optional)')}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              {selectedExemption && (
                <Button size="sm" variant="secondary" onClick={handleSaveExemptionNote}>
                  {t('保存备注', 'Save Note')}
                </Button>
              )}
            </div>

            {/* Student List */}
            <div className="max-h-64 overflow-y-auto space-y-4">
              {studentsByGroup.map(({ group, students }) => (
                <div key={group.id}>
                  <div
                    className="font-medium text-sm mb-2 px-2 py-1 rounded"
                    style={{ backgroundColor: `${group.color}20`, color: group.color }}
                  >
                    {group.name}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {students.map(student => {
                      const alreadyMarked = attendedOnDate.has(student.id);
                      const isSelected = presentIds.has(student.id);
                      const gam = getGamification(student.id);

                      return (
                        <div
                          key={student.id}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            alreadyMarked
                              ? 'bg-green-50 border-green-300'
                              : isSelected
                              ? 'bg-blue-100 border-blue-500'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <button
                            onClick={() => !alreadyMarked && handleToggle(student.id)}
                            disabled={alreadyMarked}
                            className="w-full text-left"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                alreadyMarked
                                  ? 'bg-green-500 border-green-500'
                                  : isSelected
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300'
                              }`}>
                                {(alreadyMarked || isSelected) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{student.name}</div>
                                {gam.attendanceStreak > 0 && selectedDate === today && (
                                  <div className="text-xs text-orange-500">
                                    🔥 {gam.attendanceStreak} {t('天', 'days')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                          {alreadyMarked && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-green-600">✓ {t('已签到', 'Checked in')}</span>
                              <button
                                onClick={() => handleRevokeAttendance(student.id)}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                              >
                                {t('撤销', 'Revoke')}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                {attendedOnDate.size > 0 && (
                  <span>{t(`${attendedOnDate.size} 人已签到`, `${attendedOnDate.size} already checked in`)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>
                  {t('关闭', 'Close')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedCount === 0 || isSubmitting}
                >
                  {isSubmitting
                    ? t('处理中...', 'Processing...')
                    : selectedDate === today
                    ? t(`确认签到 (${selectedCount}人 +1分)`, `Check-in (${selectedCount} +1pt)`)
                    : t(`补签 (${selectedCount}人 +1分)`, `Makeup (${selectedCount} +1pt)`)}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* History View */}
        {viewMode === 'history' && (
          <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {classAttendance.filter(r => r.status === 'present').length}
                </div>
                <div className="text-sm text-gray-600">{t('总出勤次数', 'Total Attendances')}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(classAttendance.map(r => r.date)).size}
                </div>
                <div className="text-sm text-gray-600">{t('记录天数', 'Days Recorded')}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentStudents.length > 0
                    ? Math.round((classAttendance.filter(r => r.status === 'present').length /
                        (new Set(classAttendance.map(r => r.date)).size * currentStudents.length || 1)) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">{t('平均出席率', 'Avg Attendance')}</div>
              </div>
            </div>

            {/* Student Attendance Summary */}
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">{t('学生', 'Student')}</th>
                    <th className="text-center p-2">{t('出勤天数', 'Days')}</th>
                    <th className="text-center p-2">{t('连续天数', 'Streak')}</th>
                    <th className="text-center p-2">{t('出席率', 'Rate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map(student => {
                    const studentRecords = classAttendance.filter(r => r.studentId === student.id && r.status === 'present');
                    const totalDays = new Set(classAttendance.map(r => r.date)).size;
                    const gam = getGamification(student.id);
                    const rate = totalDays > 0 ? Math.round((studentRecords.length / totalDays) * 100) : 0;

                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{student.name}</td>
                        <td className="p-2 text-center">{studentRecords.length}</td>
                        <td className="p-2 text-center">
                          {gam.attendanceStreak > 0 && (
                            <span className="text-orange-500">🔥 {gam.attendanceStreak}</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <span className={rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
