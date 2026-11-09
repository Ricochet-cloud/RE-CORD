export class GraduationCalculator {
  // 졸업 기준 키 → 이수구분 값 (creditsMap의 키)
  static CATEGORY_MAP = {
    majorRequired: 'major-required',
    majorElective: 'major-elective',
    engineeringBasic: 'engineering-basic',
    generalEd: 'general-ed',
    professionalEd: 'professional-ed',
    freeElective: 'free-elective'
  };

  static buildProgress(required, acquired) {
    return {
      required,
      acquired,
      remaining: Math.max(0, required - acquired),
      progress: Math.min(100, Math.round((acquired / required) * 100))
    };
  }

  static calculateProgress(requirements, creditsMap) {
    const result = {
      total: null,
      majorRequired: null,
      majorElective: null,
      engineeringBasic: null,
      generalEd: null,
      professionalEd: null,
      freeElective: null,
      customRequirements: []
    };

    if (requirements.totalCredits > 0) {
      result.total = this.buildProgress(requirements.totalCredits, creditsMap['total'] || 0);
    }

    for (const [key, category] of Object.entries(this.CATEGORY_MAP)) {
      if (requirements[key] > 0) {
        result[key] = this.buildProgress(requirements[key], creditsMap[category] || 0);
      }
    }

    if (requirements.customRequirements && requirements.customRequirements.length > 0) {
      result.customRequirements = requirements.customRequirements.map(req => ({
        ...req,
        completed: req.completed === true
      }));
    }

    return result;
  }

  static getProgressLabel(progress) {
    if (progress === null) return '미설정';
    if (progress >= 100) return '완료';
    if (progress >= 75) return '거의 완료';
    if (progress >= 50) return '절반 이상';
    if (progress >= 25) return '시작';
    return '미진행';
  }

  static isFullyCredited(progress) {
    return progress !== null && progress >= 100;
  }
}
