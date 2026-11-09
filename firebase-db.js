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
  serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { authManager } from './firebase-auth.js';

// Firestore는 undefined 값을 저장하지 못하므로 JSON 변환으로 제거
function clean(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

// Firestore Timestamp를 ISO 문자열로 바꿔 로컬 저장 형식과 맞춤
function plain(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, plain(val)]));
  }
  return value;
}

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
      ...clean(requirements),
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
      ...clean(settings),
      updatedAt: serverTimestamp()
    });
  }

  // ===== 동기화용 함수: 로컬에서 만든 id를 그대로 사용 =====
  requireUid() {
    const uid = authManager.getUserId();
    if (!uid) throw new Error('인증되지 않은 사용자');
    return uid;
  }

  async setSemester(semester) {
    const uid = this.requireUid();
    await setDoc(doc(this.db, 'users', uid, 'semesters', semester.id), clean(semester));
  }

  async setCourse(semesterId, course) {
    const uid = this.requireUid();
    await setDoc(
      doc(this.db, 'users', uid, 'semesters', semesterId, 'courses', course.id),
      clean(course)
    );
  }

  async setExam(exam) {
    const uid = this.requireUid();
    await setDoc(doc(this.db, 'users', uid, 'exams', exam.id), clean(exam));
  }

  // 로그인 시 서버의 모든 데이터를 한 번에 불러옴 (오류는 삼키지 않고 던짐)
  async loadAll() {
    const uid = this.requireUid();

    const semesterSnap = await getDocs(collection(this.db, 'users', uid, 'semesters'));
    const semesters = semesterSnap.docs.map(d => plain({ id: d.id, ...d.data() }));

    const courses = {};
    await Promise.all(semesters.map(async (semester) => {
      const snap = await getDocs(
        collection(this.db, 'users', uid, 'semesters', semester.id, 'courses')
      );
      courses[semester.id] = snap.docs.map(d => plain({ id: d.id, ...d.data() }));
    }));

    const examSnap = await getDocs(collection(this.db, 'users', uid, 'exams'));
    const exams = examSnap.docs.map(d => plain({ id: d.id, ...d.data() }));

    const reqSnap = await getDoc(doc(this.db, 'users', uid, 'graduation', 'requirements'));
    const settingsSnap = await getDoc(doc(this.db, 'users', uid, 'settings', 'preferences'));
    const graduationRequirements = reqSnap.exists() ? plain(reqSnap.data()) : null;
    const settings = settingsSnap.exists() ? plain(settingsSnap.data()) : null;

    return {
      semesters,
      courses,
      exams,
      graduationRequirements,
      settings,
      isEmpty: semesters.length === 0 && exams.length === 0 &&
        !graduationRequirements && !settings
    };
  }

  // 로컬 데이터 전체를 서버에 올림 (기존 데이터 이전, 동기화 실패 복구용)
  async saveAll(data) {
    const uid = this.requireUid();
    const writes = [];

    for (const semester of data.semesters || []) {
      writes.push([doc(this.db, 'users', uid, 'semesters', semester.id), clean(semester)]);
      for (const course of (data.courses || {})[semester.id] || []) {
        writes.push([
          doc(this.db, 'users', uid, 'semesters', semester.id, 'courses', course.id),
          clean(course)
        ]);
      }
    }
    for (const exam of data.exams || []) {
      writes.push([doc(this.db, 'users', uid, 'exams', exam.id), clean(exam)]);
    }
    // 기본값 그대로인 졸업 요건·설정은 올리지 않음 (서버에 있는 실제 값을 기본값으로 덮어쓰지 않기 위해)
    const requirements = clean(data.graduationRequirements);
    const hasRequirements = Object.entries(requirements).some(([key, value]) =>
      key === 'customRequirements' ? value.length > 0 : value !== null && value !== undefined);
    if (hasRequirements) {
      writes.push([
        doc(this.db, 'users', uid, 'graduation', 'requirements'),
        { ...requirements, updatedAt: serverTimestamp() }
      ]);
    }
    const settings = clean(data.settings);
    if (JSON.stringify(settings) !== JSON.stringify({ gpaScale: 4.5 })) {
      writes.push([
        doc(this.db, 'users', uid, 'settings', 'preferences'),
        { ...settings, updatedAt: serverTimestamp() }
      ]);
    }

    // 배치 1회 최대 500건 제한 → 400건씩 나눠 전송
    for (let i = 0; i < writes.length; i += 400) {
      const batch = writeBatch(this.db);
      writes.slice(i, i + 400).forEach(([ref, value]) => batch.set(ref, value));
      await batch.commit();
    }
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
