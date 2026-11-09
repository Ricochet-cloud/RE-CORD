export class ExamCalculator {
  static calculateDday(examDate) {
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = exam - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  static formatDday(dday) {
    if (dday === 0) return 'D-Day';
    if (dday > 0) return `D-${dday}`;
    return `D+${Math.abs(dday)}`;
  }

  static getUpcomingExams(exams, limit = 3) {
    if (!exams || exams.length === 0) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const examsWithDday = exams.map(exam => ({
      ...exam,
      dday: this.calculateDday(exam.examDate)
    }));

    // Sort by dday (upcoming first, then past)
    const sorted = examsWithDday.sort((a, b) => {
      if (a.dday >= 0 && b.dday < 0) return -1;
      if (a.dday < 0 && b.dday >= 0) return 1;
      return a.dday - b.dday;
    });

    return sorted.slice(0, limit);
  }

  static getExamsOnDate(exams, date) {
    if (!exams) return [];

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return exams.filter(exam => {
      const examDate = new Date(exam.examDate);
      examDate.setHours(0, 0, 0, 0);
      return examDate.getTime() === targetDate.getTime();
    });
  }

  static getRegistrationEventsOnDate(exams, date) {
    if (!exams) return [];

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const events = [];

    exams.forEach(exam => {
      if (exam.registrationStartDate) {
        const startDate = new Date(exam.registrationStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (startDate.getTime() === targetDate.getTime()) {
          events.push({ exam, type: 'registration-start' });
        }
      }

      if (exam.registrationEndDate) {
        const endDate = new Date(exam.registrationEndDate);
        endDate.setHours(0, 0, 0, 0);
        if (endDate.getTime() === targetDate.getTime()) {
          events.push({ exam, type: 'registration-end' });
        }
      }
    });

    return events;
  }

  static isFutureExam(examDate) {
    return this.calculateDday(examDate) > 0;
  }

  static isPastExam(examDate) {
    return this.calculateDday(examDate) < 0;
  }

  static validateExamDates(registrationStart, registrationEnd, examDate) {
    const errors = [];

    if (registrationStart && registrationEnd) {
      const start = new Date(registrationStart);
      const end = new Date(registrationEnd);
      if (start > end) {
        errors.push('접수 시작일이 마감일보다 늦을 수 없습니다.');
      }
    }

    if (registrationEnd && examDate) {
      const end = new Date(registrationEnd);
      const exam = new Date(examDate);
      if (end > exam) {
        errors.push('접수 마감일이 시험 날짜보다 늦을 수 없습니다.');
      }
    }

    return errors;
  }

  static getMonthExams(exams, year, month) {
    if (!exams) return [];

    return exams.filter(exam => {
      const examDate = new Date(exam.examDate);
      return examDate.getFullYear() === year &&
             examDate.getMonth() === month - 1;
    });
  }

  static getMonthCalendarDays(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, currentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, currentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 0; i < remainingDays; i++) {
      days.push({ day: i + 1, currentMonth: false });
    }

    return days;
  }
}
