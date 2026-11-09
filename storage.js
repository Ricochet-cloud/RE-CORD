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

let firebaseDbInstance = null;

export function setFirebaseDb(fbDb) {
  firebaseDbInstance = fbDb;
}

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

    if (firebaseDbInstance) {
      firebaseDbInstance.addSemester(newSemester).catch(err =>
        console.error('Firestore 학기 저장 실패:', err)
      );
    }

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

      if (firebaseDbInstance) {
        firebaseDbInstance.updateSemester(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        }).catch(err =>
          console.error('Firestore 학기 수정 실패:', err)
        );
      }
    }
  }

  static deleteSemester(id) {
    const data = this.loadData();
    data.semesters = data.semesters.filter(s => s.id !== id);
    delete data.courses[id];
    this.saveData(data);

    if (firebaseDbInstance) {
      firebaseDbInstance.deleteSemester(id).catch(err =>
        console.error('Firestore 학기 삭제 실패:', err)
      );
    }
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

    if (firebaseDbInstance) {
      firebaseDbInstance.addCourse(semesterId, newCourse).catch(err =>
        console.error('Firestore 과목 저장 실패:', err)
      );
    }

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

        if (firebaseDbInstance) {
          firebaseDbInstance.updateCourse(semesterId, courseId, {
            ...updates,
            updatedAt: new Date().toISOString()
          }).catch(err =>
            console.error('Firestore 과목 수정 실패:', err)
          );
        }
      }
    }
  }

  static deleteCourse(semesterId, courseId) {
    const data = this.loadData();
    if (data.courses[semesterId]) {
      data.courses[semesterId] = data.courses[semesterId].filter(c => c.id !== courseId);
      this.saveData(data);

      if (firebaseDbInstance) {
        firebaseDbInstance.deleteCourse(semesterId, courseId).catch(err =>
          console.error('Firestore 과목 삭제 실패:', err)
        );
      }
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

    if (firebaseDbInstance) {
      firebaseDbInstance.setSettings(data.settings).catch(err =>
        console.error('Firestore 설정 저장 실패:', err)
      );
    }
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

    if (firebaseDbInstance) {
      firebaseDbInstance.addExam(newExam).catch(err =>
        console.error('Firestore 시험 저장 실패:', err)
      );
    }

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

      if (firebaseDbInstance) {
        firebaseDbInstance.updateExam(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        }).catch(err =>
          console.error('Firestore 시험 수정 실패:', err)
        );
      }
    }
  }

  static deleteExam(id) {
    const data = this.loadData();
    data.exams = data.exams.filter(e => e.id !== id);
    this.saveData(data);

    if (firebaseDbInstance) {
      firebaseDbInstance.deleteExam(id).catch(err =>
        console.error('Firestore 시험 삭제 실패:', err)
      );
    }
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

    if (firebaseDbInstance) {
      firebaseDbInstance.setGraduationRequirements(data.graduationRequirements).catch(err =>
        console.error('Firestore 졸업 요건 저장 실패:', err)
      );
    }
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

    if (firebaseDbInstance) {
      firebaseDbInstance.setGraduationRequirements(data.graduationRequirements).catch(err =>
        console.error('Firestore 커스텀 요구사항 저장 실패:', err)
      );
    }

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

      if (firebaseDbInstance) {
        firebaseDbInstance.setGraduationRequirements(data.graduationRequirements).catch(err =>
          console.error('Firestore 커스텀 요구사항 수정 실패:', err)
        );
      }
    }
  }

  static deleteCustomRequirement(id) {
    const data = this.loadData();
    data.graduationRequirements.customRequirements =
      data.graduationRequirements.customRequirements.filter(r => r.id !== id);
    this.saveData(data);

    if (firebaseDbInstance) {
      firebaseDbInstance.setGraduationRequirements(data.graduationRequirements).catch(err =>
        console.error('Firestore 커스텀 요구사항 삭제 실패:', err)
      );
    }
  }
}
