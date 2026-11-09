const BASE_KEY = 'record_data_v1';

// 매번 새 객체를 만들어 계정 간 데이터가 섞이지 않도록 함
function createDefaultData() {
  return {
    version: 1,
    semesters: [],
    courses: {},
    exams: [],
    graduationRequirements: {
      totalCredits: null,
      majorRequired: null,
      majorElective: null,
      engineeringBasic: null,
      generalEd: null,
      professionalEd: null,
      freeElective: null,
      customRequirements: []
    },
    settings: {
      gpaScale: 4.5
    }
  };
}

function normalize(raw) {
  const base = createDefaultData();
  const data = { ...base, ...(raw || {}) };

  if (!Array.isArray(data.semesters)) data.semesters = [];
  if (!Array.isArray(data.exams)) data.exams = [];
  if (!data.courses || typeof data.courses !== 'object') data.courses = {};

  data.graduationRequirements = {
    ...base.graduationRequirements,
    ...(data.graduationRequirements || {})
  };
  if (!Array.isArray(data.graduationRequirements.customRequirements)) {
    data.graduationRequirements.customRequirements = [];
  }
  data.settings = { ...base.settings, ...(data.settings || {}) };
  return data;
}

// 서버에서 온 문서의 서버 시각 필드는 로컬 캐시에 필요 없음
function withoutUpdatedAt(obj) {
  const { updatedAt, ...rest } = obj || {};
  return rest;
}

export class Storage {
  // 로그인한 계정별로 저장 키를 분리 (setUser). 로그인 정보가 없으면 기존 키 사용
  static storageKey = BASE_KEY;
  static listeners = [];

  static setUser(uid) {
    this.storageKey = uid ? `${BASE_KEY}_u_${uid}` : BASE_KEY;
  }

  // 데이터 변경 알림 (클라우드 동기화에서 구독)
  static onChange(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static emit(operation) {
    for (const listener of this.listeners) {
      try {
        listener(operation);
      } catch (error) {
        console.error('Storage 변경 알림 오류:', error);
      }
    }
  }

  static loadData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.error('Failed to load data:', error);
      return normalize(null);
    }
  }

  static saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // 서버 데이터로 로컬 캐시를 통째로 교체 (변경 알림을 보내지 않음)
  static replaceAll(snapshot) {
    const courses = {};
    for (const semester of snapshot.semesters || []) {
      courses[semester.id] = (snapshot.courses || {})[semester.id] || [];
    }
    this.saveData(normalize({
      semesters: snapshot.semesters || [],
      courses,
      exams: snapshot.exams || [],
      graduationRequirements: withoutUpdatedAt(snapshot.graduationRequirements),
      settings: withoutUpdatedAt(snapshot.settings)
    }));
  }

  // 동기화 상태 표시 (예: dirty = 서버에 반영되지 않은 변경이 있음)
  static getFlag(name) {
    try {
      return localStorage.getItem(`${this.storageKey}__${name}`) === '1';
    } catch (error) {
      return false;
    }
  }

  static setFlag(name, value) {
    try {
      const key = `${this.storageKey}__${name}`;
      if (value) {
        localStorage.setItem(key, '1');
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to save flag:', error);
    }
  }

  // 계정별 저장을 도입하기 전에 이 브라우저에 쌓인 기존 데이터
  static legacySummary() {
    try {
      const raw = localStorage.getItem(BASE_KEY);
      if (!raw) return null;
      const data = normalize(JSON.parse(raw));
      const requirements = data.graduationRequirements;
      const summary = {
        semesters: data.semesters.length,
        courses: Object.values(data.courses).reduce((sum, list) => sum + list.length, 0),
        exams: data.exams.length,
        hasGraduation: ['totalCredits', 'majorRequired', 'majorElective', 'engineeringBasic',
          'generalEd', 'professionalEd', 'freeElective'].some(key => requirements[key]) ||
          requirements.customRequirements.length > 0
      };
      const isEmpty = !summary.semesters && !summary.courses && !summary.exams &&
        !summary.hasGraduation;
      return isEmpty ? null : summary;
    } catch (error) {
      return null;
    }
  }

  static legacyClaimed() {
    return !!localStorage.getItem(`${BASE_KEY}_claimed`);
  }

  // 기존 데이터 내용 (원본은 지우지 않고 그대로 남김)
  static readLegacy() {
    const raw = localStorage.getItem(BASE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  }

  // 기존 데이터를 이 계정으로 옮겼다고 표시 (다른 계정에는 다시 묻지 않음)
  static claimLegacy(uid) {
    localStorage.setItem(`${BASE_KEY}_claimed`, uid);
  }

  static getSemesters() {
    const data = this.loadData();
    return data.semesters || [];
  }

  static addSemester(semester) {
    const data = this.loadData();
    const id = Date.now().toString();
    const newSemester = {
      id,
      ...semester,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.semesters.push(newSemester);
    data.courses[id] = [];
    this.saveData(data);
    this.emit({ type: 'semester.set', semester: newSemester });
    return newSemester;
  }

  static updateSemester(id, updates) {
    const data = this.loadData();
    const index = data.semesters.findIndex(s => s.id === id);
    if (index !== -1) {
      data.semesters[index] = {
        ...data.semesters[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveData(data);
      this.emit({ type: 'semester.set', semester: data.semesters[index] });
    }
  }

  static deleteSemester(id) {
    const data = this.loadData();
    data.semesters = data.semesters.filter(s => s.id !== id);
    delete data.courses[id];
    this.saveData(data);
    this.emit({ type: 'semester.delete', id });
  }

  static getCourses(semesterId) {
    const data = this.loadData();
    return data.courses[semesterId] || [];
  }

  static addCourse(semesterId, course) {
    const data = this.loadData();
    if (!data.courses[semesterId]) {
      data.courses[semesterId] = [];
    }
    const id = Date.now().toString();
    const newCourse = {
      id,
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.courses[semesterId].push(newCourse);
    this.saveData(data);
    this.emit({ type: 'course.set', semesterId, course: newCourse });
    return newCourse;
  }

  static updateCourse(semesterId, courseId, updates) {
    const data = this.loadData();
    if (data.courses[semesterId]) {
      const index = data.courses[semesterId].findIndex(c => c.id === courseId);
      if (index !== -1) {
        data.courses[semesterId][index] = {
          ...data.courses[semesterId][index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.saveData(data);
        this.emit({ type: 'course.set', semesterId, course: data.courses[semesterId][index] });
      }
    }
  }

  static deleteCourse(semesterId, courseId) {
    const data = this.loadData();
    if (data.courses[semesterId]) {
      data.courses[semesterId] = data.courses[semesterId].filter(c => c.id !== courseId);
      this.saveData(data);
      this.emit({ type: 'course.delete', semesterId, id: courseId });
    }
  }

  static getSettings() {
    const data = this.loadData();
    return data.settings || { gpaScale: 4.5 };
  }

  static updateSettings(settings) {
    const data = this.loadData();
    data.settings = { ...data.settings, ...settings };
    this.saveData(data);
    this.emit({ type: 'settings.set', settings: data.settings });
  }

  static getExams() {
    const data = this.loadData();
    return data.exams || [];
  }

  static addExam(exam) {
    const data = this.loadData();
    const id = Date.now().toString();
    const newExam = {
      id,
      ...exam,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.exams.push(newExam);
    this.saveData(data);
    this.emit({ type: 'exam.set', exam: newExam });
    return newExam;
  }

  static updateExam(id, updates) {
    const data = this.loadData();
    const index = data.exams.findIndex(e => e.id === id);
    if (index !== -1) {
      data.exams[index] = {
        ...data.exams[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveData(data);
      this.emit({ type: 'exam.set', exam: data.exams[index] });
    }
  }

  static deleteExam(id) {
    const data = this.loadData();
    data.exams = data.exams.filter(e => e.id !== id);
    this.saveData(data);
    this.emit({ type: 'exam.delete', id });
  }

  static getGraduationRequirements() {
    const data = this.loadData();
    return data.graduationRequirements;
  }

  static updateGraduationRequirements(requirements) {
    const data = this.loadData();
    data.graduationRequirements = {
      ...data.graduationRequirements,
      ...requirements
    };
    this.saveData(data);
    this.emit({ type: 'graduation.set', requirements: data.graduationRequirements });
  }

  static addCustomRequirement(requirement) {
    const data = this.loadData();
    const id = Date.now().toString();
    const newRequirement = {
      id,
      ...requirement
    };
    data.graduationRequirements.customRequirements.push(newRequirement);
    this.saveData(data);
    this.emit({ type: 'graduation.set', requirements: data.graduationRequirements });
    return newRequirement;
  }

  static updateCustomRequirement(id, updates) {
    const data = this.loadData();
    const index = data.graduationRequirements.customRequirements.findIndex(r => r.id === id);
    if (index !== -1) {
      data.graduationRequirements.customRequirements[index] = {
        ...data.graduationRequirements.customRequirements[index],
        ...updates
      };
      this.saveData(data);
      this.emit({ type: 'graduation.set', requirements: data.graduationRequirements });
    }
  }

  static deleteCustomRequirement(id) {
    const data = this.loadData();
    data.graduationRequirements.customRequirements =
      data.graduationRequirements.customRequirements.filter(r => r.id !== id);
    this.saveData(data);
    this.emit({ type: 'graduation.set', requirements: data.graduationRequirements });
  }
}
