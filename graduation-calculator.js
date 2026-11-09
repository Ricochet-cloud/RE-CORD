export class GraduationCalculator {
  static calculateProgress(requirements, creditsMap) {
    const result = {
      total: null,
      majorRequired: null,
      majorElective: null,
      generalEd: null,
      freeElective: null,
      customRequirements: []
    };

    if (requirements.totalCredits !== null && requirements.totalCredits > 0) {
      const totalAcquired = creditsMap['total'] || 0;
      result.total = {
        required: requirements.totalCredits,
        acquired: totalAcquired,
        remaining: Math.max(0, requirements.totalCredits - totalAcquired),
        progress: Math.min(100, Math.round((totalAcquired / requirements.totalCredits) * 100))
      };
    }

    if (requirements.majorRequired !== null && requirements.majorRequired > 0) {
      const acquired = creditsMap['major-required'] || 0;
      result.majorRequired = {
        required: requirements.majorRequired,
        acquired,
        remaining: Math.max(0, requirements.majorRequired - acquired),
        progress: Math.min(100, Math.round((acquired / requirements.majorRequired) * 100))
      };
    }

    if (requirements.majorElective !== null && requirements.majorElective > 0) {
      const acquired = creditsMap['major-elective'] || 0;
      result.majorElective = {
        required: requirements.majorElective,
        acquired,
        remaining: Math.max(0, requirements.majorElective - acquired),
        progress: Math.min(100, Math.round((acquired / requirements.majorElective) * 100))
      };
    }

    if (requirements.generalEd !== null && requirements.generalEd > 0) {
      const acquired = creditsMap['general-ed'] || 0;
      result.generalEd = {
        required: requirements.generalEd,
        acquired,
        remaining: Math.max(0, requirements.generalEd - acquired),
        progress: Math.min(100, Math.round((acquired / requirements.generalEd) * 100))
      };
    }

    if (requirements.freeElective !== null && requirements.freeElective > 0) {
      const acquired = creditsMap['free-elective'] || 0;
      result.freeElective = {
        required: requirements.freeElective,
        acquired,
        remaining: Math.max(0, requirements.freeElective - acquired),
        progress: Math.min(100, Math.round((acquired / requirements.freeElective) * 100))
      };
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
