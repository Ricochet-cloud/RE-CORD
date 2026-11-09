import { firebaseDb } from './firebase-db.js';
import { Storage } from './storage.js';

// 같은 id의 항목이 양쪽에 있으면 updatedAt이 더 최근인 쪽을 사용 (같으면 로컬 우선)
function mergeById(cloudList, localList) {
  const merged = new Map(cloudList.map(item => [item.id, item]));
  for (const local of localList) {
    const remote = merged.get(local.id);
    if (!remote || (local.updatedAt || '') >= (remote.updatedAt || '')) {
      merged.set(local.id, local);
    }
  }
  return [...merged.values()];
}

// 졸업 요건: 서버 값을 우선하되, 서버에 비어 있는 항목과 기타 졸업 요건은 기존 데이터로 채움
function mergeRequirements(cloudReq, legacyReq) {
  if (!cloudReq) return legacyReq;

  const merged = { ...legacyReq, ...cloudReq };
  for (const [key, value] of Object.entries(legacyReq)) {
    if (key !== 'customRequirements' && (cloudReq[key] === null || cloudReq[key] === undefined)) {
      merged[key] = value;
    }
  }

  const customs = new Map((cloudReq.customRequirements || []).map(req => [req.id, req]));
  for (const req of legacyReq.customRequirements || []) {
    if (!customs.has(req.id)) customs.set(req.id, req);
  }
  merged.customRequirements = [...customs.values()];
  return merged;
}

// 서버 데이터와 이 브라우저의 기존 데이터를 합침.
// 설정은 서버에 값이 있으면 서버 값을 유지하고, 없을 때만 기존 데이터를 사용
export function mergeSnapshots(cloud, legacy) {
  const semesters = mergeById(cloud.semesters, legacy.semesters);
  const courses = {};
  for (const semester of semesters) {
    courses[semester.id] = mergeById(
      cloud.courses[semester.id] || [],
      legacy.courses[semester.id] || []
    );
  }
  return {
    semesters,
    courses,
    exams: mergeById(cloud.exams, legacy.exams),
    graduationRequirements: mergeRequirements(cloud.graduationRequirements, legacy.graduationRequirements),
    settings: cloud.settings || legacy.settings
  };
}

// 클라우드 동기화
// - 화면은 그대로 Storage(로컬 캐시)를 읽고 쓴다.
// - Storage에서 데이터가 바뀔 때마다 Firestore에도 같은 내용을 기록한다.
// - 로그인할 때 Firestore의 데이터를 불러와 로컬 캐시를 채운다.
// - 서버에 반영하지 못한 변경이 남아 있으면(dirty) 다음 로그인 때 불러오지 않고 먼저 서버로 올린다.
class CloudSync {
  constructor() {
    this.enabled = false;
    this.localOnly = false;
    this.queue = Promise.resolve();
    this.pending = 0;
    this.failed = false;
    this.statusListeners = [];
    Storage.onChange((operation) => this.enqueue(operation));
  }

  onStatus(listener) {
    this.statusListeners.push(listener);
  }

  notify(state, message = '') {
    for (const listener of this.statusListeners) {
      try {
        listener(state, message);
      } catch (error) {
        console.error('동기화 상태 알림 오류:', error);
      }
    }
  }

  describeError(error) {
    const detail = error && (error.code || error.message);
    return `${firebaseDb.getErrorMessage(error || {})}${detail ? ` (${detail})` : ''}`;
  }

  hasPending() {
    return this.pending > 0;
  }

  // 서버에 연결하지 못한 채 이 기기의 데이터로만 쓰는 모드.
  // 서버로 보내지는 않고, 변경이 생기면 dirty로 표시해 다음 로그인 때 서버로 올린다.
  useLocalOnly() {
    this.enabled = false;
    this.localOnly = true;
  }

  // 로그인 직후 호출: 로컬 캐시를 해당 계정 것으로 바꾸고 서버와 맞춘다.
  // 반환: { ok: true, mode } 또는 { ok: false, error }
  async start({ uid, confirmAdopt }) {
    this.enabled = false;
    this.localOnly = false;
    this.failed = false;
    await this.flush();
    Storage.setUser(uid);

    try {
      if (Storage.getFlag('dirty')) {
        // 지난번에 서버에 반영하지 못한 변경이 있음 → 로컬 데이터를 서버로 올린 뒤,
        // 서버에만 있던 데이터까지 합쳐서 다시 받아온다
        await firebaseDb.saveAll(Storage.loadData());
        Storage.replaceAll(await firebaseDb.loadAll());
        Storage.setFlag('dirty', false);
        this.enabled = true;
        return { ok: true, mode: 'pushed' };
      }

      const cloud = await firebaseDb.loadAll();

      // 이 브라우저에 계정 도입 전부터 쌓인 데이터가 있으면, 물어본 뒤 서버 데이터와 합쳐서 올림
      const legacy = Storage.legacySummary();
      if (legacy && !Storage.legacyClaimed() && await confirmAdopt(legacy, !cloud.isEmpty)) {
        Storage.replaceAll(mergeSnapshots(cloud, Storage.readLegacy()));
        await firebaseDb.saveAll(Storage.loadData());
        Storage.claimLegacy(uid);
        Storage.setFlag('dirty', false);
        this.enabled = true;
        return { ok: true, mode: 'adopted' };
      }

      Storage.replaceAll(cloud);
      Storage.setFlag('dirty', false);
      this.enabled = true;
      return { ok: true, mode: 'pulled' };
    } catch (error) {
      console.error('클라우드 동기화 시작 실패:', error);
      return { ok: false, error: this.describeError(error) };
    }
  }

  // 로그아웃 전에 아직 전송 중인 변경을 마무리 (오래 걸리면 포기하고 dirty로 남김)
  async flush(timeoutMs = 5000) {
    await Promise.race([
      this.queue,
      new Promise(resolve => setTimeout(resolve, timeoutMs))
    ]);
  }

  // 로컬 동기화 사용을 끝낸다. 계정 전환 시 이전 계정 데이터에 쓰지 않도록 함
  stop() {
    this.enabled = false;
    this.localOnly = false;
    this.failed = false;
  }

  enqueue(operation) {
    if (!this.enabled) {
      if (this.localOnly) Storage.setFlag('dirty', true);
      return;
    }

    // 서버에 반영될 때까지 dirty 표시 → 중간에 창을 닫아도 다음 로그인에서 복구
    Storage.setFlag('dirty', true);
    this.pending++;

    this.queue = this.queue
      .then(() => this.apply(operation))
      .catch((error) => {
        console.error('클라우드 저장 실패:', operation.type, error);
        this.failed = true;
        this.notify('error', this.describeError(error));
      })
      .then(() => {
        this.pending--;
        if (this.pending === 0 && !this.failed) {
          Storage.setFlag('dirty', false);
          this.notify('ok');
        }
      });
  }

  async apply(operation) {
    switch (operation.type) {
      case 'semester.set':
        return firebaseDb.setSemester(operation.semester);
      case 'semester.delete':
        return firebaseDb.deleteSemester(operation.id);
      case 'course.set':
        return firebaseDb.setCourse(operation.semesterId, operation.course);
      case 'course.delete':
        return firebaseDb.deleteCourse(operation.semesterId, operation.id);
      case 'exam.set':
        return firebaseDb.setExam(operation.exam);
      case 'exam.delete':
        return firebaseDb.deleteExam(operation.id);
      case 'graduation.set':
        return firebaseDb.setGraduationRequirements(operation.requirements);
      case 'settings.set':
        return firebaseDb.setSettings(operation.settings);
      default:
        console.warn('알 수 없는 동기화 작업:', operation.type);
    }
  }
}

export const cloudSync = new CloudSync();
