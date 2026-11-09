const STORAGE_KEY = 'record_data_v1';
const DEFAULT_DATA = {
  version: 1,
  semesters: [],
  courses: {},
  exams: [],
  graduationRequirements: {
    totalCredits: null,
    majorRequired: null,
    majorElective: null,
    generalEd: null,
    freeElective: null,
    customRequirements: []
  },
  settings: {
    gpaScale: 4.5
  }
};

export class Storage {
  static loadData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return { ...DEFAULT_DATA };
      }
      const parsed = JSON.parse(data);
      return { ...DEFAULT_DATA, ...parsed };
    } catch (error) {
      console.error('Failed to load data:', error);
      return { ...DEFAULT_DATA };
    }
  }

  static saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
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
    }
  }

  static deleteSemester(id) {
    const data = this.loadData();
    data.semesters = data.semesters.filter(s => s.id !== id);
    delete data.courses[id];
    this.saveData(data);
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
      }
    }
  }

  static deleteCourse(semesterId, courseId) {
    const data = this.loadData();
    if (data.courses[semesterId]) {
      data.courses[semesterId] = data.courses[semesterId].filter(c => c.id !== courseId);
      this.saveData(data);
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
    }
  }

  static deleteExam(id) {
    const data = this.loadData();
    data.exams = data.exams.filter(e => e.id !== id);
    this.saveData(data);
  }

  static getGraduationRequirements() {
    const data = this.loadData();
    return data.graduationRequirements || DEFAULT_DATA.graduationRequirements;
  }

  static updateGraduationRequirements(requirements) {
    const data = this.loadData();
    data.graduationRequirements = {
      ...data.graduationRequirements,
      ...requirements
    };
    this.saveData(data);
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
    }
  }

  static deleteCustomRequirement(id) {
    const data = this.loadData();
    data.graduationRequirements.customRequirements =
      data.graduationRequirements.customRequirements.filter(r => r.id !== id);
    this.saveData(data);
  }
}
