const GRADE_POINTS = {
  'A+': 4.5,
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0,
  'P': null,
  'NP': 0.0
};

export class GradeCalculator {
  static getGradePoint(grade, scale) {
    const basePoint = GRADE_POINTS[grade];
    if (basePoint === null) return null;

    // Adjust points based on GPA scale
    if (scale === 4.3) {
      if (basePoint === 4.5) return 4.3;
      if (basePoint === 4.0) return 4.0;
      if (basePoint === 3.5) return 3.3;
      if (basePoint === 3.0) return 3.0;
      if (basePoint === 2.5) return 2.3;
      if (basePoint === 2.0) return 2.0;
      if (basePoint === 1.5) return 1.3;
      if (basePoint === 1.0) return 1.0;
    } else if (scale === 4.0) {
      if (basePoint === 4.5) return 4.0;
      if (basePoint === 4.0) return 4.0;
      if (basePoint === 3.5) return 3.5;
      if (basePoint === 3.0) return 3.0;
      if (basePoint === 2.5) return 2.5;
      if (basePoint === 2.0) return 2.0;
      if (basePoint === 1.5) return 1.5;
      if (basePoint === 1.0) return 1.0;
    }

    return basePoint;
  }

  static calculateSemesterGPA(courses, scale = 4.5) {
    if (!courses || courses.length === 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of courses) {
      const point = this.getGradePoint(course.grade, scale);

      if (point !== null && course.grade !== 'P' && course.grade !== 'NP') {
        totalPoints += point * course.credits;
        totalCredits += course.credits;
      }
    }

    if (totalCredits === 0) return null;
    return (totalPoints / totalCredits).toFixed(2);
  }

  static calculateCumulativeGPA(allCourses, scale = 4.5) {
    if (!allCourses || allCourses.length === 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of allCourses) {
      const point = this.getGradePoint(course.grade, scale);

      if (point !== null && course.grade !== 'P' && course.grade !== 'NP') {
        totalPoints += point * course.credits;
        totalCredits += course.credits;
      }
    }

    if (totalCredits === 0) return null;
    return (totalPoints / totalCredits).toFixed(2);
  }

  static calculateCredits(courses) {
    if (!courses || courses.length === 0) return 0;

    let total = 0;
    for (const course of courses) {
      if (course.grade !== 'F' && course.grade !== 'NP') {
        total += course.credits;
      }
    }
    return total;
  }

  static calculateCreditsByCategory(courses) {
    const categories = {
      'major-required': 0,
      'major-elective': 0,
      'engineering-basic': 0,
      'general-ed': 0,
      'professional-ed': 0,
      'free-elective': 0,
      'other': 0
    };

    if (!courses) return categories;

    for (const course of courses) {
      if (course.grade !== 'F' && course.grade !== 'NP') {
        categories[course.category] = (categories[course.category] || 0) + course.credits;
      }
    }

    return categories;
  }

  static isPassFail(grade) {
    return grade === 'P' || grade === 'NP';
  }

  static isFailing(grade) {
    return grade === 'F';
  }
}
