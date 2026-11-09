# RE:CORD 설정 가이드

## Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. 새 프로젝트 생성
3. 프로젝트 이름: RE:CORD (또는 원하는 이름)
4. Google Analytics는 선택 사항

### 2. Firebase 앱 등록

1. 프로젝트 설정 > 앱 설정
2. 웹 앱 추가 (</> 아이콘 클릭)
3. 앱 이름: RE:CORD Web
4. "Firebase SDK 추가" 섹션에서 config 값 확인

### 3. 설정 파일 생성

1. `firebase-config.example.js`를 참고하여 `firebase-config.js` 파일 생성
2. Firebase Console에서 확인한 config 값을 대입:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 4. Firebase Authentication 설정

1. Firebase Console > Authentication > Sign-in method
2. "Email/Password" 활성화
3. Email link (passwordless sign-in) 선택 사항

### 5. Firestore 설정

1. Firebase Console > Firestore Database > Create database
2. Start in production mode 선택
3. Cloud Firestore location: 아시아-남동부(싱가포르) 또는 가장 가까운 지역

### 6. Firestore Security Rules 설정

1. Firestore > Rules 탭 열기
2. `firestore.rules` 파일의 내용을 복사하여 Rules 에디터에 붙여넣기
3. "Publish" 클릭하여 규칙 배포

### 7. Firebase Hosting 설정 (배포 시)

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy
```

## 로컬 테스트

```bash
# 로컬 서버 실행
python -m http.server 8000

# 또는 Node.js를 사용하는 경우
npx http-server
```

브라우저에서 http://localhost:8000 접속

## 사용자 계정 생성

1. 앱 로드
2. "회원가입" 클릭
3. 이메일과 비밀번호 입력
4. 회원가입 완료

## 기존 데이터 (localStorage) 마이그레이션

현재 앱은 다음과 같이 작동합니다:

- **Firebase 설정이 없는 경우**: localStorage만 사용 (기존 동작)
- **Firebase 설정이 있는 경우**: 
  1. Firebase Authentication으로 로그인
  2. Firestore에서 자동으로 사용자 데이터 로드
  3. localStorage 데이터는 별도 관리

Firebase로 마이그레이션하려면:
1. Firebase 설정 완료
2. 앱에서 새 계정 생성
3. 기존 데이터를 수동으로 입력하거나 import 기능 구현

## 환경별 설정

### 개발 환경
```javascript
// firebase-config.js에 개발용 설정값 입력
```

### 프로덕션 환경
```bash
# Firebase CLI로 배포
firebase deploy --only hosting,firestore:rules
```

## 문제 해결

### Firebase 연결 실패
- firebase-config.js 파일이 존재하는지 확인
- config 값이 정확한지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### Firestore 쓰기 권한 거부
- Security Rules가 정확히 배포되었는지 확인
- 사용자가 로그인 상태인지 확인

### 데이터가 로드되지 않음
- Firestore > Data 탭에서 데이터가 존재하는지 확인
- 사용자 UID가 정확한지 확인
- 브라우저 개발자 도구 > 콘솔에서 오류 확인

## 보안 주의사항

⚠️ `firebase-config.js` 파일을 공개 저장소에 업로드하지 마세요.

- `.gitignore`에 `firebase-config.js`가 포함되어 있는지 확인
- 배포 전에 Firestore Security Rules가 활성화되어 있는지 확인
- Firebase 프로젝트의 인증 설정을 검토하고 필요한 경우 제한

## 참고

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore Security Rules 문서](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Hosting 배포 가이드](https://firebase.google.com/docs/hosting)
