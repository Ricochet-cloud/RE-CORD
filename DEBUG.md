# 🔍 로그인 문제 진단 가이드

## Step 1: 브라우저 콘솔 확인

### 콘솔 열기
- **Windows/Linux:** F12 또는 Ctrl+Shift+I
- **Mac:** Cmd+Option+I

### 확인할 사항
1. **빨간색 오류 메시지** 있는지 확인
2. **노란색 경고 메시지** 확인
3. "Firebase 초기화 실패" 메시지 확인

---

## 일반적인 문제와 해결 방법

### ❌ 문제 1: "firebase-config.js를 찾을 수 없음"
```
Error: Failed to import firebase-config.js
```

**원인:** firebase-config.js 파일이 GitHub에 업로드되지 않음

**해결:**
```bash
# .gitignore 확인
cat .gitignore

# firebase-config.js가 제외되어 있으면 문제
# 해결: GitHub Pages용 별도 설정 필요
```

### ❌ 문제 2: "Cannot read property 'apiKey' of undefined"
```
TypeError: Cannot read properties of undefined
```

**원인:** firebase-config.js가 로드되지 않거나 비어있음

**해결:**
```bash
# firebase-config.js 확인
cat firebase-config.js

# 파일이 비어있거나 설정값이 없으면 추가
```

### ❌ 문제 3: "Authentication is not initialized"
```
Error: Firebase not initialized
```

**원인:** Firebase 초기화 실패

**해결:**
1. firebase-config.js 설정값 확인
2. Firebase 프로젝트에서 Authentication 활성화 확인
3. API Key 제한 확인 (restrictKey 설정)

### ❌ 문제 4: "PERMISSION_DENIED: Missing or insufficient permissions"
```
FirebaseError: Missing or insufficient permissions
```

**원인:** Firestore Security Rules가 배포되지 않음

**해결:**
1. Firebase Console > Firestore > Rules
2. firestore.rules 내용 복사
3. "게시" 클릭
4. 상태 "Rules deployed" 확인

### ❌ 문제 5: "Cannot access from localhost"
```
Error: CORS or origin mismatch
```

**원인:** GitHub Pages의 도메인이 Firebase에 등록되지 않음

**해결:**
1. Firebase Console > Authentication > Settings
2. "Authorized domains" 확인
3. `YOUR_USERNAME.github.io` 추가
4. 저장

---

## Step 2: Firebase Console 확인

### 2-1. Authentication 상태
```
Firebase Console > Authentication > Sign-in method
- Email/Password: 활성화 ✅?
```

### 2-2. Authorized Domains
```
Firebase Console > Authentication > Settings > Authorized domains
- YOUR_USERNAME.github.io 포함? ✅?
```

### 2-3. Firestore Security Rules
```
Firebase Console > Firestore > Rules
- Status: "Rules deployed" 표시? ✅?
- 빨간 "Rules error" 표시? ❌
```

### 2-4. Firestore 데이터
```
Firebase Console > Firestore > Data
- users 컬렉션 생성됨? ✅?
- 테스트 데이터 있는지 확인
```

---

## Step 3: 배포된 앱 확인

### 3-1. firebase-config.js 로드 확인
브라우저 콘솔에서 입력:
```javascript
// 콘솔에 복사-붙여넣기
console.log('Firebase Config:', firebaseConfig);
```

출력 확인:
```
✅ apiKey, authDomain 등이 모두 보이면 정상
❌ undefined 또는 오류 메시지 보이면 문제
```

### 3-2. Firebase 초기화 확인
콘솔에 입력:
```javascript
console.log('Firebase Initialized:', authManager.initialized);
```

출력 확인:
```
✅ true 보이면 정상
❌ false 또는 undefined 보이면 문제
```

### 3-3. 현재 사용자 확인
콘솔에 입력:
```javascript
console.log('Current User:', authManager.currentUser);
```

출력 확인:
```
✅ null이면 미로그인 (정상)
✅ 객체면 로그인됨
❌ undefined면 문제
```

---

## Step 4: 단계별 테스트

### 테스트 1: 회원가입
```javascript
// 콘솔에서 입력
authManager.signUp('test@example.com', 'password123')
  .then(result => console.log('Signup:', result));
```

결과 확인:
- ✅ success: true
- ❌ success: false (오류 메시지 확인)

### 테스트 2: 로그인
```javascript
authManager.signIn('test@example.com', 'password123')
  .then(result => console.log('Login:', result));
```

결과 확인:
- ✅ success: true
- ❌ success: false (오류 메시지 확인)

### 테스트 3: Firestore 접근
```javascript
firebaseDb.getSemesters()
  .then(semesters => console.log('Semesters:', semesters))
  .catch(error => console.error('Error:', error));
```

결과 확인:
- ✅ 배열 반환
- ❌ 오류 메시지 표시

---

## 가장 일반적인 문제 Top 3

### 🥇 1위: firebase-config.js 미로드
**증상:** "Cannot find module 'firebase-config.js'"
**해결:** 
1. GitHub에 firebase-config.js가 없음
2. .gitignore에서 제외했으면 수동으로 업로드 필요
3. 또는 GitHub Secrets 사용 (고급)

### 🥈 2위: Security Rules 미배포
**증상:** "Permission denied" 오류
**해결:**
1. Firebase Console > Firestore > Rules
2. firestore.rules 내용 전부 복사
3. 에디터에 붙여넣기
4. "게시" 클릭 (중요!)

### 🥉 3위: Authorized Domains 설정 안 함
**증상:** CORS 오류 또는 "Origin not allowed"
**해결:**
1. Firebase Console > Authentication > Settings
2. Authorized domains에 추가:
   - `YOUR_USERNAME.github.io`
3. 저장

---

## 최종 체크리스트

- [ ] 브라우저 콘솔에서 오류 메시지 확인함
- [ ] firebase-config.js 파일이 로드됨
- [ ] Firebase Authentication 활성화됨
- [ ] Firestore 생성됨
- [ ] Firestore Security Rules 배포됨
- [ ] Authorized domains에 GitHub Pages 도메인 추가됨
- [ ] 새로고침 (Ctrl+F5) 시도함
- [ ] 브라우저 캐시 삭제함 (F12 > Network > Disable cache 체크)

---

## 도움을 요청할 때 포함할 사항

다음을 알려주면 문제 해결이 빨라집니다:

1. **정확한 오류 메시지** (콘솔에서 복사)
2. **사이트 주소** (https://username.github.io/record)
3. **시도한 것** (Security Rules 배포, etc.)
4. **현재 상태** (로그인 버튼 클릭 후 어디서 멈추는지)

---

## 빠른 재배포

문제를 수정한 후:

```bash
git add .
git commit -m "Fix: Firebase login issue"
git push origin main
```

GitHub Pages는 1-2분 후 자동으로 업데이트됩니다.
