function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getMeterDeadlineInfo(dueDay) {
  const dayNumber = Number(dueDay);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
    return { dueDay: null, deadlineDate: null, daysLeft: null, isCurrentMonth: true, isOverdue: false };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonthDay = Math.min(dayNumber, getDaysInMonth(now.getFullYear(), now.getMonth()));
  const currentDeadline = new Date(now.getFullYear(), now.getMonth(), currentMonthDay);
  const isOverdue = today > currentDeadline;
  let deadline = currentDeadline;
  let isCurrentMonth = !isOverdue;

  if (isOverdue) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthDay = Math.min(dayNumber, getDaysInMonth(nextMonth.getFullYear(), nextMonth.getMonth()));
    deadline = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDay);
  }

  const diffMs = deadline.getTime() - today.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000));

  return {
    dueDay: dayNumber,
    deadlineDate: deadline,
    daysLeft,
    isCurrentMonth,
    isOverdue,
  };
}
