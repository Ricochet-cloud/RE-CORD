import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

class FirebaseAuthManager {
  constructor() {
    this.app = null;
    this.auth = null;
    this.currentUser = null;
    this.authStateChangeCallbacks = [];
    this.initialized = false;
  }

  async initialize() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);

      // 로그인 상태 유지
      await setPersistence(this.auth, browserLocalPersistence);

      // 인증 상태 모니터링
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.notifyAuthStateChange(user);
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
      return false;
    }
  }

  onAuthStateChange(callback) {
    this.authStateChangeCallbacks.push(callback);
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
  }

  notifyAuthStateChange(user) {
    this.authStateChangeCallbacks.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth state change callback 오류:', error);
      }
    });
  }

  async signUp(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async signIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async signOutUser() {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  getUserEmail() {
    return this.currentUser ? this.currentUser.email : null;
  }

  getErrorMessage(code) {
    const messages = {
      'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
      'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
      'auth/operation-not-allowed': '이 작업은 사용 불가능합니다.',
      'auth/weak-password': '비밀번호가 너무 약합니다. (최소 6자)',
      'auth/user-disabled': '비활성화된 사용자 계정입니다.',
      'auth/user-not-found': '해당 이메일의 사용자가 없습니다.',
      'auth/wrong-password': '비밀번호가 일치하지 않습니다.',
      'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'auth/too-many-requests': '너무 많은 시도가 있었습니다. 나중에 다시 시도하세요.',
      'auth/network-request-failed': '네트워크 연결 오류입니다.'
    };
    return messages[code] || '오류가 발생했습니다.';
  }
}

export const authManager = new FirebaseAuthManager();
