# RE:CORD 배포 최종 가이드
## GitHub Pages + Firebase

---

## 📋 체크리스트

- [ ] GitHub 계정
- [ ] Git 설치
- [ ] Firebase 프로젝트
- [ ] firebase-config.js 생성
- [ ] Firestore Rules 배포
- [ ] GitHub에 푸시
- [ ] GitHub Pages 활성화

---

## 🔧 Step 1: Firebase 프로젝트 생성

### 1-1. Firebase Console 접속
```
https://console.firebase.google.com
```

### 1-2. 프로젝트 생성
- "프로젝트 추가" 클릭
- 프로젝트명: `RE:CORD` (또는 선택)
- Google Analytics: 선택 사항
- 만들기 클릭

### 1-3. 웹 앱 등록
1. 프로젝트 개요 > 앱 추가
2. 웹 아이콘 (</>) 클릭
3. 앱 이름: `RE:CORD Web`
4. "Firebase SDK 추가" 섹션 표시됨

### 1-4. 설정값 복사
```javascript
// Firebase Console에서 보이는 설정값
const firebaseConfig = {
  apiKey: "...",           // 여기서 복사
  authDomain: "...",       // 여기서 복사
  projectId: "...",        // 여기서 복사
  storageBucket: "...",    // 여기서 복사
  messagingSenderId: "...",// 여기서 복사
  appId: "..."             // 여기서 복사
};
```

---

## 📝 Step 2: firebase-config.js 생성

### 2-1. 파일 생성
프로젝트 폴더에 `firebase-config.js` 파일 생성

### 2-2. 내용 입력
```javascript
// firebase-config.js
export const firebaseConfig = {
  apiKey: "여기에 apiKey 붙여넣기",
  authDomain: "여기에 authDomain 붙여넣기",
  projectId: "여기에 projectId 붙여넣기",
  storageBucket: "여기에 storageBucket 붙여넣기",
  messagingSenderId: "여기에 messagingSenderId 붙여넣기",
  appId: "여기에 appId 붙여넣기"
};
```

### 2-3. 파일 저장
- 파일명: `firebase-config.js` (정확히!)
- 위치: 프로젝트 루트 폴더
- **중요**: 이 파일은 GitHub에 업로드되지 않습니다 (.gitignore에 설정됨)

---

## 🔐 Step 3: Firebase 서비스 활성화

### 3-1. Authentication 활성화
1. Firebase Console > Authentication
2. "Sign-in method" 탭
3. "Email/Password" 활성화
4. "저장" 클릭

### 3-2. Firestore 생성
1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. "프로덕션 모드로 시작" 선택
4. 위치: Asia-southeast1 (싱가포르) 또는 가장 가까운 지역
5. "만들기" 클릭

### 3-3. Security Rules 배포
1. Firestore > Rules 탭
2. 에디터 열기
3. 다음 코드를 복사:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      
      match /semesters/{semesterId} {
        allow read, write: if request.auth.uid == uid;
        match /courses/{courseId} {
          allow read, write: if request.auth.uid == uid;
        }
      }
      
      match /exams/{examId} {
        allow read, write: if request.auth.uid == uid;
      }
      
      match /graduation/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
      
      match /settings/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. "게시" 클릭

---

## 🌐 Step 4: GitHub Pages 배포

### 4-1. GitHub 저장소 생성
1. [GitHub](https://github.com) 로그인
2. "+" > "New repository"
3. Repository name: `record`
4. Public 선택
5. "Create repository" 클릭

### 4-2. 로컬 Git 설정

프로젝트 폴더에서:

```bash
# Git 초기화
git init

# 사용자 정보 설정 (처음 한 번만)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/record.git

# 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: RE:CORD v3.0.0"

# GitHub에 푸시
git branch -M main
git push -u origin main
```

### 4-3. GitHub Pages 활성화

1. GitHub 저장소 페이지 열기
2. Settings > Pages (왼쪽 메뉴)
3. Source: "Deploy from a branch" 선택
4. Branch: "main" / folder: "/" 선택
5. "Save" 클릭

### 4-4. 배포 확인

**1-2분 후** 다음 주소에서 확인:
```
https://YOUR_USERNAME.github.io/record
```

(YOUR_USERNAME을 자신의 GitHub 사용자명으로 변경)

---

## ✅ Step 5: 배포 후 테스트

### 5-1. 회원가입 테스트
1. 앱 열기
2. "회원가입" 클릭
3. 이메일/비밀번호 입력
4. 회원가입 완료

### 5-2. Firestore 확인
1. Firebase Console > Firestore
2. Collections 확인
3. users/{uid} 데이터 확인

### 5-3. 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 학기 추가
- [ ] 과목 등록
- [ ] GPA 계산
- [ ] 시험 일정 등록
- [ ] 졸업 요건 설정

---

## 🔄 업데이트 배포

파일 수정 후:

```bash
git add .
git commit -m "Update: 기능 설명"
git push origin main
```

GitHub Pages는 자동으로 업데이트됩니다 (1-2분 소요).

---

## ⚠️ 주의사항

### ❌ 하면 안 되는 것
- ❌ firebase-config.js를 GitHub에 푸시하기
- ❌ 실수로 푸시했다면 Firebase API Key 재설정 필수
- ❌ Security Rules를 "모두 허용"으로 설정하기

### ✅ 꼭 해야 할 것
- ✅ .gitignore에 firebase-config.js가 있는지 확인
- ✅ Firestore Security Rules 배포 확인
- ✅ Authentication 활성화 확인

---

## 🆘 문제 해결

### 앱이 로드되지 않음
```
1. Settings > Pages에서 배포 상태 확인
2. 1-2분 대기 후 새로고침
3. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
```

### 로그인이 작동하지 않음
```
1. Firebase Console > Authentication 활성화 확인
2. firebase-config.js 값이 정확한지 확인
3. 브라우저 콘솔에서 오류 메시지 확인 (F12)
```

### Firestore 쓰기 권한 거부
```
1. Firestore > Rules가 게시되었는지 확인
2. 로그인 상태 확인
3. Security Rules 코드 다시 복사-붙여넣기 및 게시
```

### 데이터가 보이지 않음
```
1. Firestore > Data에서 컬렉션 확인
2. 사용자 UID가 일치하는지 확인
3. 새 데이터 추가 후 Firestore에 저장 확인
```

---

## 📱 모바일 테스트

배포 후 모바일에서 접속:
```
https://YOUR_USERNAME.github.io/record
```

기능 테스트:
- [ ] 로그인
- [ ] 학기 추가
- [ ] 과목 입력
- [ ] 캘린더 보기
- [ ] 터치 반응성

---

## 🎉 완료!

축하합니다! RE:CORD가 성공적으로 배포되었습니다.

다음 단계:
1. 친구들에게 공유
2. 학점 데이터 입력
3. 시험 일정 추가
4. 졸업 요건 설정

---

## 📞 지원

문제 발생 시:
1. [SETUP.md](./SETUP.md) 참고
2. [GITHUB-PAGES-DEPLOY.md](./GITHUB-PAGES-DEPLOY.md) 참고
3. Firebase Console에서 오류 로그 확인
4. GitHub Issues 제출

---

**버전:** 3.0.0  
**마지막 업데이트:** 2024-11-09  
**상태:** ✅ 배포 준비 완료
