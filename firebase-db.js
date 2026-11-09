import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { authManager } from './firebase-auth.js';

class FirebaseDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const app = initializeApp(firebaseConfig);
      this.db = getFirestore(app);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Firestore 초기화 실패:', error);
      return false;
    }
  }

  getUserRef() {
    const uid = authManager.getUserId();
    if (!uid) throw new Error('인증되지 않은 사용자');
    return doc(this.db, 'users', uid);
  }

  // 학기 관련
  async addSemester(semester) {
    const uid = authManager.getUserId();
    const semesterRef = doc(this.db, 'users', uid, 'semesters', semester.id);

    await setDoc(semesterRef, semester);
    return semester;
  }

  async getSemesters() {
    const uid = authManager.getUserId();
    const semesters = [];
    const q = collection(this.db, 'users', uid, 'semesters');
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      semesters.push(doc.data());
    });

    return semesters;
  }

  async updateSemester(semesterId, updates) {
    const uid = authManager.getUserId();
    const semesterRef = doc(this.db, 'users', uid, 'semesters', semesterId);

    await updateDoc(semesterRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteSemester(semesterId) {
    const uid = authManager.getUserId();
    const semesterRef = doc(this.db, 'users', uid, 'semesters', semesterId);

    // 하위 과목 모두 삭제
    const coursesRef = collection(this.db, 'users', uid, 'semesters', semesterId, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);
    for (const courseDoc of coursesSnapshot.docs) {
      await deleteDoc(courseDoc.ref);
    }

    await deleteDoc(semesterRef);
  }

  // 과목 관련
  async addCourse(semesterId, course) {
    const uid = authManager.getUserId();
    const courseRef = doc(this.db, 'users', uid, 'semesters', semesterId, 'courses', course.id);

    await setDoc(courseRef, course);
    return course;
  }

  async getCourses(semesterId) {
    const uid = authManager.getUserId();
    const courses = [];
    const q = collection(this.db, 'users', uid, 'semesters', semesterId, 'courses');
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      courses.push(doc.data());
    });

    return courses;
  }

  async updateCourse(semesterId, courseId, updates) {
    const uid = authManager.getUserId();
    const courseRef = doc(this.db, 'users', uid, 'semesters', semesterId, 'courses', courseId);

    await updateDoc(courseRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteCourse(semesterId, courseId) {
    const uid = authManager.getUserId();
    const courseRef = doc(this.db, 'users', uid, 'semesters', semesterId, 'courses', courseId);

    await deleteDoc(courseRef);
  }

  // 시험 관련
  async addExam(exam) {
    const uid = authManager.getUserId();
    const examRef = doc(this.db, 'users', uid, 'exams', exam.id);

    await setDoc(examRef, exam);
    return exam;
  }

  async getExams() {
    const uid = authManager.getUserId();
    const exams = [];
    const q = collection(this.db, 'users', uid, 'exams');
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      exams.push(doc.data());
    });

    return exams;
  }

  async updateExam(examId, updates) {
    const uid = authManager.getUserId();
    const examRef = doc(this.db, 'users', uid, 'exams', examId);

    await updateDoc(examRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteExam(examId) {
    const uid = authManager.getUserId();
    const examRef = doc(this.db, 'users', uid, 'exams', examId);

    await deleteDoc(examRef);
  }

  // 졸업 요건 관련
  async setGraduationRequirements(requirements) {
    const uid = authManager.getUserId();
    const reqRef = doc(this.db, 'users', uid, 'graduation', 'requirements');

    await setDoc(reqRef, {
      ...requirements,
      updatedAt: serverTimestamp()
    });
  }

  async getGraduationRequirements() {
    const uid = authManager.getUserId();
    const reqRef = doc(this.db, 'users', uid, 'graduation', 'requirements');

    try {
      const snapshot = await getDoc(reqRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return {
        totalCredits: null,
        majorRequired: null,
        majorElective: null,
        generalEd: null,
        freeElective: null,
        customRequirements: []
      };
    } catch (error) {
      console.error('졸업 요건 조회 오류:', error);
      return {
        totalCredits: null,
        majorRequired: null,
        majorElective: null,
        generalEd: null,
        freeElective: null,
        customRequirements: []
      };
    }
  }

  // 설정 관련
  async setSettings(settings) {
    const uid = authManager.getUserId();
    const settingsRef = doc(this.db, 'users', uid, 'settings', 'preferences');

    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  }

  async getSettings() {
    const uid = authManager.getUserId();
    const settingsRef = doc(this.db, 'users', uid, 'settings', 'preferences');

    try {
      const snapshot = await getDoc(settingsRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return { gpaScale: 4.5 };
    } catch (error) {
      return { gpaScale: 4.5 };
    }
  }

  // 에러 핸들링
  getErrorMessage(error) {
    const messages = {
      'permission-denied': '접근 권한이 없습니다.',
      'not-found': '데이터를 찾을 수 없습니다.',
      'already-exists': '이미 존재하는 데이터입니다.',
      'failed-precondition': '작업을 완료할 수 없습니다.',
      'aborted': '작업이 중단되었습니다.',
      'out-of-range': '범위를 벗어났습니다.',
      'unauthenticated': '인증이 필요합니다.',
      'invalid-argument': '유효하지 않은 인자입니다.',
      'deadline-exceeded': '요청 시간 초과.'
    };
    return messages[error.code] || '오류가 발생했습니다.';
  }
}

export const firebaseDb = new FirebaseDatabase();
