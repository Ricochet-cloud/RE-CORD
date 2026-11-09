import { Storage } from './storage.js';
import { GradeCalculator } from './grade-calculator.js';
import { ExamCalculator } from './exam-calculator.js';
import { GraduationCalculator } from './graduation-calculator.js';
import { authManager } from './firebase-auth.js';
import { firebaseDb } from './firebase-db.js';

class RecordApp {
  constructor() {
    this.currentSemesterId = null;
    this.currentEditingCourseId = null;
    this.currentEditingExamId = null;
    this.currentEditingCustomReqId = null;
    this.currentCalendarMonth = new Date().getMonth() + 1;
    this.currentCalendarYear = new Date().getFullYear();
    this.currentSelectedCalendarDate = null;
    this.confirmCallback = null;
    this.useFirebase = false;
    this.isInitializing = true;
    this.initializeApp();
  }

  async initializeApp() {
    // Firebase 초기화 시도
    const firebaseInitialized = await authManager.initialize();
    const firebaseDbInitialized = await firebaseDb.initialize();

    this.useFirebase = firebaseInitialized && firebaseDbInitialized;

    if (this.useFirebase) {
      // Firebase 인증 상태 모니터링
      authManager.onAuthStateChange((user) => {
        if (user) {
          this.showAppUI();
          this.loadUserData();
        } else {
          this.showAuthUI();
        }
      });
    } else {
      // Firebase 연결 실패 시 localStorage 사용
      console.warn('Firebase를 사용할 수 없습니다. localStorage를 사용합니다.');
      this.showAppUI();
      this.init();
    }
  }

  showAuthUI() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
  }

  showAppUI() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    if (this.isInitializing) {
      this.isInitializing = false;
      this.init();
    }
  }

  async loadUserData() {
    try {
      if (!this.useFirebase) {
        this.updateDashboard();
        return;
      }

      // Firestore에서 데이터 로드
      const semesters = await firebaseDb.getSemesters();
      const exams = await firebaseDb.getExams();
      const requirements = await firebaseDb.getGraduationRequirements();
      const settings = await firebaseDb.getSettings();

      // 화면 업데이트
      this.updateDashboard();
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
      this.updateDashboard();
    }
  }

  init() {
    this.setupEventListeners();
    this.updateDashboard();
    this.updateSemesterSelector();
  }

  setupEventListeners() {
    // Auth Forms
    document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupForm')?.addEventListener('submit', (e) => this.handleSignup(e));
    document.getElementById('resetForm')?.addEventListener('submit', (e) => this.handleReset(e));
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => this.navigateTo(e.target.closest('.nav-item').dataset.page));
    });

    // Semester Management
    document.getElementById('addSemesterBtn').addEventListener('click', () => this.openModal('addSemesterModal'));
    document.getElementById('addSemesterForm').addEventListener('submit', (e) => this.handleAddSemester(e));
    document.getElementById('semesterSelector').addEventListener('change', (e) => this.selectSemester(e.target.value));
    document.getElementById('editSemesterBtn').addEventListener('click', () => this.openEditSemesterModal());
    document.getElementById('editSemesterForm').addEventListener('submit', (e) => this.handleEditSemester(e));
    document.getElementById('deleteSemesterBtn').addEventListener('click', () => this.deleteCurrentSemester());

    // Course Management
    document.getElementById('addCourseBtn').addEventListener('click', () => this.openModal('addCourseModal'));
    document.getElementById('addCourseForm').addEventListener('submit', (e) => this.handleAddCourse(e));
    document.getElementById('editCourseForm').addEventListener('submit', (e) => this.handleEditCourse(e));

    // Modal Controls
    document.querySelectorAll('.modal-close, [data-modal]').forEach(el => {
      if (el.classList.contains('modal-close')) {
        el.addEventListener('click', () => this.closeModal(el.dataset.modal));
      } else if (el.tagName !== 'FORM') {
        el.addEventListener('click', () => this.closeModal(el.dataset.modal));
      }
    });

    // Confirm Modal
    document.getElementById('confirmBtn').addEventListener('click', () => {
      if (this.confirmCallback) {
        this.confirmCallback();
        this.confirmCallback = null;
      }
      this.closeModal('confirmModal');
    });

    // Exam Management
    document.getElementById('addExamBtn').addEventListener('click', () => this.openModal('addExamModal'));
    document.getElementById('addExamForm').addEventListener('submit', (e) => this.handleAddExam(e));
    document.getElementById('editExamForm').addEventListener('submit', (e) => this.handleEditExam(e));

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
    });

    // Calendar navigation
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.prevCalendarMonth());
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.nextCalendarMonth());

    // Graduation Management
    document.getElementById('editGraduationBtn').addEventListener('click', () => this.openEditGraduationModal());
    document.getElementById('editGraduationForm').addEventListener('submit', (e) => this.handleEditGraduation(e));
    document.getElementById('addCustomRequirementBtn').addEventListener('click', () =>
      this.openModal('addCustomRequirementModal'));
    document.getElementById('addCustomRequirementForm').addEventListener('submit', (e) =>
      this.handleAddCustomRequirement(e));
    document.getElementById('editCustomRequirementForm').addEventListener('submit', (e) =>
      this.handleEditCustomRequirement(e));
  }

  navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(page).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      const form = modal.querySelector('form');
      if (form) form.reset();
    }
  }

  handleAddSemester(e) {
    e.preventDefault();
    const year = parseInt(document.getElementById('semesterYear').value);
    const term = document.getElementById('semesterTerm').value;
    const name = document.getElementById('semesterName').value;

    const semesters = Storage.getSemesters();
    const isDuplicate = semesters.some(s => s.year === year && s.term === term);
    if (isDuplicate) {
      alert('같은 학기가 이미 존재합니다.');
      return;
    }

    Storage.addSemester({
      year,
      term,
      name: name || `${year}-${term}`
    });

    this.updateDashboard();
    this.updateSemesterSelector();
    this.closeModal('addSemesterModal');
  }

  handleEditSemester(e) {
    e.preventDefault();
    if (!this.currentSemesterId) return;

    const year = parseInt(document.getElementById('editSemesterYear').value);
    const term = document.getElementById('editSemesterTerm').value;
    const name = document.getElementById('editSemesterName').value;

    Storage.updateSemester(this.currentSemesterId, {
      year,
      term,
      name: name || `${year}-${term}`
    });

    this.updateDashboard();
    this.updateSemesterSelector();
    this.selectSemester(this.currentSemesterId);
    this.closeModal('editSemesterModal');
  }

  openEditSemesterModal() {
    if (!this.currentSemesterId) return;

    const semesters = Storage.getSemesters();
    const semester = semesters.find(s => s.id === this.currentSemesterId);
    if (!semester) return;

    document.getElementById('editSemesterYear').value = semester.year;
    document.getElementById('editSemesterTerm').value = semester.term;
    document.getElementById('editSemesterName').value = semester.name;

    this.openModal('editSemesterModal');
  }

  deleteCurrentSemester() {
    if (!this.currentSemesterId) return;

    const semesters = Storage.getSemesters();
    const semester = semesters.find(s => s.id === this.currentSemesterId);
    if (!semester) return;

    this.confirmCallback = () => {
      Storage.deleteSemester(this.currentSemesterId);
      this.currentSemesterId = null;
      this.updateDashboard();
      this.updateSemesterSelector();
      document.getElementById('semesterDetailsCard').style.display = 'none';
      document.getElementById('noSemesterMessage').style.display = 'block';
    };

    document.getElementById('confirmTitle').textContent = '학기 삭제';
    document.getElementById('confirmMessage').textContent = `${semester.name}를 삭제하시겠습니까? 포함된 모든 과목도 삭제됩니다.`;
    this.openModal('confirmModal');
  }

  updateSemesterSelector() {
    const selector = document.getElementById('semesterSelector');
    const semesters = Storage.getSemesters().sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return parseInt(b.term) - parseInt(a.term);
    });

    const currentValue = selector.value;
    selector.innerHTML = '<option value="">학기 선택</option>';
    semesters.forEach(sem => {
      const option = document.createElement('option');
      option.value = sem.id;
      option.textContent = sem.name;
      selector.appendChild(option);
    });

    if (currentValue && semesters.some(s => s.id === currentValue)) {
      selector.value = currentValue;
    } else if (semesters.length > 0) {
      this.selectSemester(semesters[0].id);
    }
  }

  selectSemester(semesterId) {
    this.currentSemesterId = semesterId;

    if (!semesterId) {
      document.getElementById('semesterDetailsCard').style.display = 'none';
      document.getElementById('noSemesterMessage').style.display = 'block';
      return;
    }

    const semesters = Storage.getSemesters();
    const semester = semesters.find(s => s.id === semesterId);
    if (!semester) return;

    document.getElementById('semesterDetailsCard').style.display = 'block';
    document.getElementById('noSemesterMessage').style.display = 'none';
    document.getElementById('currentSemesterName').textContent = semester.name;

    this.updateSemesterDetails();
    this.updateCoursesList();
  }

  updateSemesterDetails() {
    const courses = Storage.getCourses(this.currentSemesterId);
    const settings = Storage.getSettings();

    const gpa = GradeCalculator.calculateSemesterGPA(courses, settings.gpaScale);
    const credits = GradeCalculator.calculateCredits(courses);

    document.getElementById('semesterGPA').textContent = gpa || '-';
    document.getElementById('semesterCredits').textContent = credits;
  }

  handleAddCourse(e) {
    e.preventDefault();
    if (!this.currentSemesterId) return;

    const name = document.getElementById('courseName').value;
    const credits = parseFloat(document.getElementById('courseCredits').value);
    const grade = document.getElementById('courseGrade').value;
    const category = document.getElementById('courseCategory').value;

    Storage.addCourse(this.currentSemesterId, {
      name,
      credits,
      grade,
      category
    });

    this.updateDashboard();
    this.updateSemesterDetails();
    this.updateCoursesList();
    this.closeModal('addCourseModal');
  }

  openEditCourseModal(courseId) {
    const courses = Storage.getCourses(this.currentSemesterId);
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    this.currentEditingCourseId = courseId;
    document.getElementById('editCourseName').value = course.name;
    document.getElementById('editCourseCredits').value = course.credits;
    document.getElementById('editCourseGrade').value = course.grade;
    document.getElementById('editCourseCategory').value = course.category;

    this.openModal('editCourseModal');
  }

  handleEditCourse(e) {
    e.preventDefault();
    if (!this.currentSemesterId || !this.currentEditingCourseId) return;

    const name = document.getElementById('editCourseName').value;
    const credits = parseFloat(document.getElementById('editCourseCredits').value);
    const grade = document.getElementById('editCourseGrade').value;
    const category = document.getElementById('editCourseCategory').value;

    Storage.updateCourse(this.currentSemesterId, this.currentEditingCourseId, {
      name,
      credits,
      grade,
      category
    });

    this.updateDashboard();
    this.updateSemesterDetails();
    this.updateCoursesList();
    this.currentEditingCourseId = null;
    this.closeModal('editCourseModal');
  }

  deleteCourse(courseId) {
    const courses = Storage.getCourses(this.currentSemesterId);
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    this.confirmCallback = () => {
      Storage.deleteCourse(this.currentSemesterId, courseId);
      this.updateDashboard();
      this.updateSemesterDetails();
      this.updateCoursesList();
    };

    document.getElementById('confirmTitle').textContent = '과목 삭제';
    document.getElementById('confirmMessage').textContent = `${course.name}을(를) 삭제하시겠습니까?`;
    this.openModal('confirmModal');
  }

  updateCoursesList() {
    const courses = Storage.getCourses(this.currentSemesterId);
    const container = document.getElementById('coursesList');

    if (courses.length === 0) {
      container.innerHTML = '<p class="empty-state">등록된 과목이 없습니다.</p>';
      return;
    }

    container.innerHTML = courses.map(course => `
      <div class="course-item">
        <div class="course-info">
          <div class="course-name">${course.name}</div>
          <div class="course-details">
            <div class="course-detail">
              <span class="label">학점:</span>
              <span class="value">${course.credits}</span>
            </div>
            <div class="course-detail">
              <span class="label">성적:</span>
              <span class="value">${course.grade}</span>
            </div>
            <div class="course-detail">
              <span class="label">구분:</span>
              <span class="value">${this.getCategoryLabel(course.category)}</span>
            </div>
          </div>
        </div>
        <div class="course-actions">
          <button class="btn btn-small btn-ghost" onclick="app.openEditCourseModal('${course.id}')">수정</button>
          <button class="btn btn-small btn-danger-ghost" onclick="app.deleteCourse('${course.id}')">삭제</button>
        </div>
      </div>
    `).join('');
  }

  getCategoryLabel(category) {
    const labels = {
      'major-required': '전공 필수',
      'major-elective': '전공 선택',
      'general-ed': '교양',
      'free-elective': '일반 선택',
      'other': '기타'
    };
    return labels[category] || category;
  }

  updateDashboard() {
    const semesters = Storage.getSemesters();
    const exams = Storage.getExams();
    const settings = Storage.getSettings();

    // Collect all courses
    const allCourses = [];
    semesters.forEach(sem => {
      const courses = Storage.getCourses(sem.id);
      allCourses.push(...courses.map(c => ({ ...c, semesterId: sem.id })));
    });

    // Update stat cards
    const totalGPA = GradeCalculator.calculateCumulativeGPA(allCourses, settings.gpaScale);
    const totalCredits = allCourses.reduce((sum, c) => {
      if (c.grade !== 'F' && c.grade !== 'NP') {
        return sum + c.credits;
      }
      return sum;
    }, 0);

    document.getElementById('totalGPA').textContent = totalGPA || '-';
    document.getElementById('totalCredits').textContent = totalCredits;
    document.getElementById('semesterCount').textContent = semesters.length;

    // Latest semester GPA
    if (semesters.length > 0) {
      const sortedSems = [...semesters].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return parseInt(b.term) - parseInt(a.term);
      });
      const latestCourses = Storage.getCourses(sortedSems[0].id);
      const latestGPA = GradeCalculator.calculateSemesterGPA(latestCourses, settings.gpaScale);
      document.getElementById('latestGPA').textContent = latestGPA || '-';
    }

    // Semester summary
    this.updateSemesterSummary(semesters, settings.gpaScale);

    // Update exam-related info in dashboard (if we add it later)
    this.updateExamsList();
    this.updateGraduationProgress();
  }

  updateSemesterSummary(semesters, gpaScale) {
    const container = document.getElementById('semesterSummary');

    if (semesters.length === 0) {
      container.innerHTML = '<p class="empty-state">등록된 학기가 없습니다. 성적 관리에서 학기를 생성해주세요.</p>';
      return;
    }

    const sortedSems = [...semesters].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return parseInt(b.term) - parseInt(a.term);
    });

    container.innerHTML = sortedSems.map(sem => {
      const courses = Storage.getCourses(sem.id);
      const gpa = GradeCalculator.calculateSemesterGPA(courses, gpaScale);
      const credits = GradeCalculator.calculateCredits(courses);
      return `
        <div class="semester-summary-item">
          <div class="semester-summary-title">${sem.name}</div>
          <div class="semester-summary-stats">
            <div class="semester-summary-stat">
              <span class="label">GPA:</span>
              <span class="value">${gpa || '-'}</span>
            </div>
            <div class="semester-summary-stat">
              <span class="label">학점:</span>
              <span class="value">${credits}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'exam-calendar') {
      this.updateCalendar();
    }
  }

  handleAddExam(e) {
    e.preventDefault();
    const name = document.getElementById('examName').value;
    const type = document.getElementById('examType').value;
    const examDate = document.getElementById('examDate').value;
    const regStartDate = document.getElementById('regStartDate').value;
    const regEndDate = document.getElementById('regEndDate').value;
    const location = document.getElementById('examLocation').value;
    const memo = document.getElementById('examMemo').value;

    const errors = ExamCalculator.validateExamDates(regStartDate, regEndDate, examDate);
    if (errors.length > 0) {
      document.getElementById('examDateError').textContent = errors.join('\n');
      document.getElementById('examDateError').style.display = 'block';
      return;
    }

    Storage.addExam({
      certificationName: name,
      examType: type,
      examDate,
      registrationStartDate: regStartDate || null,
      registrationEndDate: regEndDate || null,
      location,
      memo
    });

    this.updateDashboard();
    this.updateExamsList();
    this.closeModal('addExamModal');
  }

  openEditExamModal(examId) {
    const exams = Storage.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    this.currentEditingExamId = examId;
    document.getElementById('editExamName').value = exam.certificationName;
    document.getElementById('editExamType').value = exam.examType;
    document.getElementById('editExamDate').value = exam.examDate;
    document.getElementById('editRegStartDate').value = exam.registrationStartDate || '';
    document.getElementById('editRegEndDate').value = exam.registrationEndDate || '';
    document.getElementById('editExamLocation').value = exam.location || '';
    document.getElementById('editExamMemo').value = exam.memo || '';

    this.openModal('editExamModal');
  }

  handleEditExam(e) {
    e.preventDefault();
    if (!this.currentEditingExamId) return;

    const name = document.getElementById('editExamName').value;
    const type = document.getElementById('editExamType').value;
    const examDate = document.getElementById('editExamDate').value;
    const regStartDate = document.getElementById('editRegStartDate').value;
    const regEndDate = document.getElementById('editRegEndDate').value;
    const location = document.getElementById('editExamLocation').value;
    const memo = document.getElementById('editExamMemo').value;

    const errors = ExamCalculator.validateExamDates(regStartDate, regEndDate, examDate);
    if (errors.length > 0) {
      document.getElementById('editExamDateError').textContent = errors.join('\n');
      document.getElementById('editExamDateError').style.display = 'block';
      return;
    }

    Storage.updateExam(this.currentEditingExamId, {
      certificationName: name,
      examType: type,
      examDate,
      registrationStartDate: regStartDate || null,
      registrationEndDate: regEndDate || null,
      location,
      memo
    });

    this.updateDashboard();
    this.updateExamsList();
    this.updateCalendar();
    this.currentEditingExamId = null;
    this.closeModal('editExamModal');
  }

  deleteExam(examId) {
    const exams = Storage.getExams();
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    this.confirmCallback = () => {
      Storage.deleteExam(examId);
      this.updateDashboard();
      this.updateExamsList();
      this.updateCalendar();
    };

    document.getElementById('confirmTitle').textContent = '시험 삭제';
    document.getElementById('confirmMessage').textContent =
      `${exam.certificationName} (${exam.examType})을(를) 삭제하시겠습니까?`;
    this.openModal('confirmModal');
  }

  updateExamsList() {
    const exams = Storage.getExams();
    const container = document.getElementById('examsList');

    if (exams.length === 0) {
      container.innerHTML = '<p class="empty-state">등록된 시험이 없습니다.</p>';
      return;
    }

    const sortedExams = [...exams].sort((a, b) =>
      new Date(a.examDate) - new Date(b.examDate)
    );

    container.innerHTML = sortedExams.map(exam => {
      const dday = ExamCalculator.calculateDday(exam.examDate);
      const ddayText = ExamCalculator.formatDday(dday);
      const isPast = dday < 0;
      const examTypeLabel = this.getExamTypeLabel(exam.examType);

      return `
        <div class="exam-item">
          <div class="exam-header">
            <div>
              <div class="exam-title">${exam.certificationName}</div>
              <div style="font-size: var(--font-size-sm); color: var(--color-gray-500);">${examTypeLabel}</div>
            </div>
            <div class="exam-dday ${isPast ? 'past' : ''}">${ddayText}</div>
          </div>
          <div class="exam-details">
            <div class="exam-detail">
              <span class="exam-detail-label">시험 날짜</span>
              <span class="exam-detail-value">${new Date(exam.examDate).toLocaleDateString('ko-KR')}</span>
            </div>
            ${exam.registrationStartDate ? `
              <div class="exam-detail">
                <span class="exam-detail-label">접수 시작</span>
                <span class="exam-detail-value">${new Date(exam.registrationStartDate).toLocaleDateString('ko-KR')}</span>
              </div>
            ` : ''}
            ${exam.registrationEndDate ? `
              <div class="exam-detail">
                <span class="exam-detail-label">접수 마감</span>
                <span class="exam-detail-value">${new Date(exam.registrationEndDate).toLocaleDateString('ko-KR')}</span>
              </div>
            ` : ''}
            ${exam.location ? `
              <div class="exam-detail">
                <span class="exam-detail-label">시험 장소</span>
                <span class="exam-detail-value">${exam.location}</span>
              </div>
            ` : ''}
          </div>
          ${exam.memo ? `<div style="font-size: var(--font-size-sm); color: var(--color-gray-600); margin-bottom: var(--spacing-md);">📝 ${exam.memo}</div>` : ''}
          <div class="exam-actions">
            <button class="btn btn-small btn-ghost" onclick="app.openEditExamModal('${exam.id}')">수정</button>
            <button class="btn btn-small btn-danger-ghost" onclick="app.deleteExam('${exam.id}')">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  }

  getExamTypeLabel(type) {
    const labels = { 'written': '필기', 'practical': '실기', 'other': '기타' };
    return labels[type] || type;
  }

  updateCalendar() {
    const exams = Storage.getExams();
    const month = this.currentCalendarMonth;
    const year = this.currentCalendarYear;

    document.getElementById('calendarMonth').textContent =
      `${year}년 ${month}월`;

    const days = ExamCalculator.getMonthCalendarDays(year, month);
    const container = document.getElementById('calendarDays');

    container.innerHTML = days.map((dayObj, index) => {
      if (!dayObj.currentMonth) {
        return '<div class="calendar-day other-month"></div>';
      }

      const fullDate = new Date(year, month - 1, dayObj.day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fullDate.setHours(0, 0, 0, 0);

      const isToday = fullDate.getTime() === today.getTime();
      const dateStr = fullDate.toISOString().split('T')[0];
      const dayExams = ExamCalculator.getExamsOnDate(exams, dateStr);
      const dayEvents = ExamCalculator.getRegistrationEventsOnDate(exams, dateStr);

      let eventHTML = '';
      dayExams.forEach(exam => {
        eventHTML += `<div class="day-event exam">${exam.certificationName}</div>`;
      });
      dayEvents.forEach(event => {
        const label = event.type === 'registration-start' ? '접수시작' : '접수마감';
        eventHTML += `<div class="day-event ${event.type}">${label}</div>`;
      });

      return `
        <div class="calendar-day ${isToday ? 'today' : ''} ${this.currentSelectedCalendarDate === dateStr ? 'selected' : ''}"
             onclick="app.selectCalendarDate('${dateStr}')">
          <div class="day-number">${dayObj.day}</div>
          <div class="day-events">${eventHTML}</div>
        </div>
      `;
    }).join('');

    if (this.currentSelectedCalendarDate) {
      this.updateCalendarEventsList(this.currentSelectedCalendarDate);
    }
  }

  selectCalendarDate(dateStr) {
    this.currentSelectedCalendarDate = dateStr;
    this.updateCalendar();
  }

  updateCalendarEventsList(dateStr) {
    const exams = Storage.getExams();
    const dayExams = ExamCalculator.getExamsOnDate(exams, dateStr);
    const dayEvents = ExamCalculator.getRegistrationEventsOnDate(exams, dateStr);
    const container = document.getElementById('calendarEventsList');

    if (dayExams.length === 0 && dayEvents.length === 0) {
      container.innerHTML = '<p class="empty-state">이 날짜에 등록된 일정이 없습니다.</p>';
      return;
    }

    let html = '';

    dayExams.forEach(exam => {
      html += `
        <div class="calendar-event-item exam">
          <div class="calendar-event-type">📝 시험</div>
          <div class="calendar-event-name">${exam.certificationName}</div>
          <div style="font-size: var(--font-size-sm); color: var(--color-gray-600); margin-top: var(--spacing-sm);">
            ${this.getExamTypeLabel(exam.examType)}${exam.location ? ` · ${exam.location}` : ''}
          </div>
          <div style="margin-top: var(--spacing-md); display: flex; gap: var(--spacing-md);">
            <button class="btn btn-small btn-ghost" onclick="app.openEditExamModal('${exam.id}')">수정</button>
            <button class="btn btn-small btn-danger-ghost" onclick="app.deleteExam('${exam.id}')">삭제</button>
          </div>
        </div>
      `;
    });

    dayEvents.forEach(event => {
      const typeLabel = event.type === 'registration-start' ? '접수 시작' : '접수 마감';
      const typeClass = event.type === 'registration-start' ? 'registration-start' : 'registration-end';
      html += `
        <div class="calendar-event-item ${typeClass}">
          <div class="calendar-event-type">📅 ${typeLabel}</div>
          <div class="calendar-event-name">${event.exam.certificationName}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  prevCalendarMonth() {
    if (this.currentCalendarMonth === 1) {
      this.currentCalendarMonth = 12;
      this.currentCalendarYear--;
    } else {
      this.currentCalendarMonth--;
    }
    this.currentSelectedCalendarDate = null;
    this.updateCalendar();
  }

  nextCalendarMonth() {
    if (this.currentCalendarMonth === 12) {
      this.currentCalendarMonth = 1;
      this.currentCalendarYear++;
    } else {
      this.currentCalendarMonth++;
    }
    this.currentSelectedCalendarDate = null;
    this.updateCalendar();
  }

  openEditGraduationModal() {
    const requirements = Storage.getGraduationRequirements();
    document.getElementById('totalCredits').value = requirements.totalCredits || '';
    document.getElementById('majorRequiredCredits').value = requirements.majorRequired || '';
    document.getElementById('majorElectiveCredits').value = requirements.majorElective || '';
    document.getElementById('generalEdCredits').value = requirements.generalEd || '';
    document.getElementById('freeElectiveCredits').value = requirements.freeElective || '';
    this.openModal('editGraduationModal');
  }

  handleEditGraduation(e) {
    e.preventDefault();
    const totalCredits = document.getElementById('totalCredits').value ?
      parseInt(document.getElementById('totalCredits').value) : null;
    const majorRequired = document.getElementById('majorRequiredCredits').value ?
      parseInt(document.getElementById('majorRequiredCredits').value) : null;
    const majorElective = document.getElementById('majorElectiveCredits').value ?
      parseInt(document.getElementById('majorElectiveCredits').value) : null;
    const generalEd = document.getElementById('generalEdCredits').value ?
      parseInt(document.getElementById('generalEdCredits').value) : null;
    const freeElective = document.getElementById('freeElectiveCredits').value ?
      parseInt(document.getElementById('freeElectiveCredits').value) : null;

    Storage.updateGraduationRequirements({
      totalCredits,
      majorRequired,
      majorElective,
      generalEd,
      freeElective
    });

    this.updateGraduationProgress();
    this.closeModal('editGraduationModal');
  }

  handleAddCustomRequirement(e) {
    e.preventDefault();
    const name = document.getElementById('customReqName').value;
    const memo = document.getElementById('customReqMemo').value;

    Storage.addCustomRequirement({
      name,
      memo,
      completed: false
    });

    this.updateGraduationProgress();
    this.closeModal('addCustomRequirementModal');
  }

  openEditCustomRequirementModal(reqId) {
    const requirements = Storage.getGraduationRequirements();
    const req = requirements.customRequirements.find(r => r.id === reqId);
    if (!req) return;

    this.currentEditingCustomReqId = reqId;
    document.getElementById('editCustomReqName').value = req.name;
    document.getElementById('editCustomReqMemo').value = req.memo || '';
    document.getElementById('editCustomReqCompleted').checked = req.completed || false;

    this.openModal('editCustomRequirementModal');
  }

  handleEditCustomRequirement(e) {
    e.preventDefault();
    if (!this.currentEditingCustomReqId) return;

    const name = document.getElementById('editCustomReqName').value;
    const memo = document.getElementById('editCustomReqMemo').value;
    const completed = document.getElementById('editCustomReqCompleted').checked;

    Storage.updateCustomRequirement(this.currentEditingCustomReqId, {
      name,
      memo,
      completed
    });

    this.updateGraduationProgress();
    this.currentEditingCustomReqId = null;
    this.closeModal('editCustomRequirementModal');
  }

  deleteCustomRequirement(reqId) {
    const requirements = Storage.getGraduationRequirements();
    const req = requirements.customRequirements.find(r => r.id === reqId);
    if (!req) return;

    this.confirmCallback = () => {
      Storage.deleteCustomRequirement(reqId);
      this.updateGraduationProgress();
    };

    document.getElementById('confirmTitle').textContent = '요건 삭제';
    document.getElementById('confirmMessage').textContent = `${req.name}을(를) 삭제하시겠습니까?`;
    this.openModal('confirmModal');
  }

  updateGraduationProgress() {
    const requirements = Storage.getGraduationRequirements();
    const semesters = Storage.getSemesters();

    let creditsMap = {};
    creditsMap['total'] = 0;

    const categories = ['major-required', 'major-elective', 'general-ed', 'free-elective', 'other'];
    categories.forEach(cat => creditsMap[cat] = 0);

    semesters.forEach(sem => {
      const courses = Storage.getCourses(sem.id);
      courses.forEach(course => {
        if (course.grade !== 'F' && course.grade !== 'NP') {
          creditsMap['total'] += course.credits;
          creditsMap[course.category] = (creditsMap[course.category] || 0) + course.credits;
        }
      });
    });

    const progress = GraduationCalculator.calculateProgress(requirements, creditsMap);
    this.renderGraduationProgress(progress);
  }

  renderGraduationProgress(progress) {
    const container = document.getElementById('graduationProgressContainer');
    let html = '';

    if (!progress.total && !progress.majorRequired && !progress.majorElective &&
        !progress.generalEd && !progress.freeElective) {
      container.innerHTML = '<p class="empty-state">졸업 기준을 설정하세요.</p>';
      return;
    }

    if (progress.total) {
      html += this.renderProgressItem('총 졸업 학점', progress.total);
    }
    if (progress.majorRequired) {
      html += this.renderProgressItem('전공 필수', progress.majorRequired);
    }
    if (progress.majorElective) {
      html += this.renderProgressItem('전공 선택', progress.majorElective);
    }
    if (progress.generalEd) {
      html += this.renderProgressItem('교양', progress.generalEd);
    }
    if (progress.freeElective) {
      html += this.renderProgressItem('일반 선택', progress.freeElective);
    }

    container.innerHTML = html;

    // Custom requirements
    this.updateCustomRequirementsList(progress.customRequirements);
  }

  renderProgressItem(label, data) {
    const percentage = data.progress || 0;
    const isCompleted = percentage >= 100;
    return `
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-title">${label}</span>
          <span class="progress-percentage">${data.acquired}/${data.required}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar ${isCompleted ? 'completed' : ''}"
               style="width: ${Math.min(percentage, 100)}%">
            ${percentage > 5 ? `${percentage}%` : ''}
          </div>
        </div>
        <div class="progress-stats">
          <div class="progress-stat">
            <span class="progress-stat-label">남은 학점</span>
            <span class="progress-stat-value">${data.remaining}</span>
          </div>
          <div class="progress-stat">
            <span class="progress-stat-label">진행률</span>
            <span class="progress-stat-value">${GraduationCalculator.getProgressLabel(data.progress)}</span>
          </div>
        </div>
      </div>
    `;
  }

  updateCustomRequirementsList(customRequirements) {
    const container = document.getElementById('customRequirementsList');

    if (!customRequirements || customRequirements.length === 0) {
      container.innerHTML = '<p class="empty-state">기타 요건이 없습니다.</p>';
      return;
    }

    container.innerHTML = customRequirements.map(req => `
      <div class="custom-requirement-item">
        <input type="checkbox" class="custom-requirement-checkbox"
               ${req.completed ? 'checked' : ''}
               onchange="app.toggleCustomRequirement('${req.id}', this.checked)">
        <div class="custom-requirement-info">
          <div class="custom-requirement-name ${req.completed ? 'completed' : ''}">${req.name}</div>
          ${req.memo ? `<div class="custom-requirement-memo">${req.memo}</div>` : ''}
        </div>
        <div class="custom-requirement-actions">
          <button class="btn btn-small btn-ghost" onclick="app.openEditCustomRequirementModal('${req.id}')">수정</button>
          <button class="btn btn-small btn-danger-ghost" onclick="app.deleteCustomRequirement('${req.id}')">삭제</button>
        </div>
      </div>
    `).join('');
  }

  toggleCustomRequirement(reqId, completed) {
    Storage.updateCustomRequirement(reqId, { completed });
    this.updateGraduationProgress();
  }

  // Authentication Methods
  switchAuthForm(formName) {
    document.querySelectorAll('.auth-form-container').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(formName + 'FormContainer').classList.add('active');
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';

    const result = await authManager.signIn(email, password);
    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      return;
    }

    document.getElementById('loginForm').reset();
    // authManager의 authStateChange 콜백이 UI 전환을 처리합니다
  }

  async handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const errorEl = document.getElementById('signupError');

    errorEl.style.display = 'none';

    if (password !== passwordConfirm) {
      errorEl.textContent = '비밀번호가 일치하지 않습니다.';
      errorEl.style.display = 'block';
      return;
    }

    const result = await authManager.signUp(email, password);
    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      return;
    }

    document.getElementById('signupForm').reset();
    alert('회원가입에 성공했습니다. 로그인해주세요.');
    this.switchAuthForm('login');
  }

  async handleReset(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const messageEl = document.getElementById('resetMessage');
    const errorEl = document.getElementById('resetError');

    messageEl.style.display = 'none';
    errorEl.style.display = 'none';

    const result = await authManager.resetPassword(email);
    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      return;
    }

    messageEl.textContent = '비밀번호 재설정 링크가 이메일로 전송되었습니다.';
    messageEl.style.display = 'block';
    document.getElementById('resetForm').reset();
  }

  async handleLogout() {
    if (!confirm('로그아웃하시겠습니까?')) return;

    const result = await authManager.signOutUser();
    if (result.success) {
      // Storage 초기화
      Storage.loadData();
      this.currentSemesterId = null;
      document.getElementById('semesterDetailsCard').style.display = 'none';
      document.getElementById('noSemesterMessage').style.display = 'block';
      // authManager의 authStateChange 콜백이 UI 전환을 처리합니다
    } else {
      alert('로그아웃 중 오류가 발생했습니다: ' + result.error);
    }
  }
}

window.app = new RecordApp();
