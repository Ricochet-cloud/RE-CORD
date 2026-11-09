# RE:CORD - 대학생 학업 관리 시스템

![RE:CORD](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

대학생을 위한 개인 학업 관리 웹 애플리케이션. 성적, 시험 일정, 졸업 요건을 한곳에서 관리하세요.

## 🌟 주요 기능

### 📊 성적 관리
- 학기별 과목 등록
- GPA 계산 (4.5, 4.3, 4.0 기준)
- 누적 학점 관리
- 이수 영역별 학점 계산

### 📅 시험 일정
- 자격증 시험 등록
- D-day 자동 계산
- 월간 캘린더
- 접수 기간 추적

### 🎓 졸업 요건
- 졸업 기준 설정
- 영역별 진행률 계산
- 기타 졸업 요건 관리
- 실시간 진행률 시각화

### 🔐 사용자 계정
- 이메일 회원가입
- 안전한 로그인
- 개인 데이터 보호
- 다중 기기 동기화

### 📱 반응형 디자인
- 데스크톱 최적화
- 태블릿 지원
- 모바일 완벽 대응

## 🚀 빠른 시작

### 로컬 테스트

```bash
# 저장소 복제
git clone https://github.com/YOUR_USERNAME/record.git
cd record

# 로컬 서버 실행 (Python)
python -m http.server 8000

# 또는 Node.js
npx http-server

# 브라우저 열기
# http://localhost:8000
```

### Firebase 연동 (선택)

1. [SETUP.md](./SETUP.md) 참고하여 Firebase 설정
2. `firebase-config.js` 파일 생성
3. Firestore Security Rules 배포
4. 앱 새로고침

## 📖 사용 방법

### 1단계: 회원가입
```
1. "회원가입" 클릭
2. 이메일과 비밀번호 입력
3. 가입 완료
```

### 2단계: 학기 추가
```
성적 관리 > 학기 추가
- 연도 선택
- 학기 선택 (1/2/3/4학기)
- 학기명 입력 (선택)
```

### 3단계: 과목 등록
```
성적 관리 > 학기 선택 > 과목 추가
- 과목명 입력
- 학점 입력
- 성적 선택
- 이수 구분 선택
```

### 4단계: GPA 확인
```
대시보드에서 실시간 GPA 확인
- 누적 GPA
- 최근 학기 GPA
- 학기별 요약
```

### 5단계: 시험 일정 등록
```
시험 일정 > 시험 등록
- 자격증 이름
- 시험 날짜
- 접수 기간
- D-day 자동 계산
```

### 6단계: 졸업 요건 설정
```
졸업 요건 > 기준 수정
- 총 졸업 학점
- 영역별 필요 학점
- 진행률 자동 계산
```

## 🔧 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **인증**: Firebase Authentication
- **데이터**: Cloud Firestore
- **호스팅**: GitHub Pages (정적) + Firebase (백엔드)
- **브라우저**: Chrome, Firefox, Safari, Edge

## 📁 프로젝트 구조

```
record/
├── index.html              # 메인 HTML
├── style.css               # 스타일시트
├── app.js                  # 메인 애플리케이션
├── storage.js              # localStorage 관리
├── firebase-auth.js        # Firebase 인증
├── firebase-db.js          # Firestore 데이터
├── grade-calculator.js     # GPA 계산
├── exam-calculator.js      # D-day 계산
├── graduation-calculator.js # 졸업률 계산
├── firebase-config.example.js  # Firebase 설정 예제
├── firestore.rules         # Firestore 보안 규칙
├── firebase.json           # Firebase 배포 설정
├── README.md              # 이 파일
├── SETUP.md               # Firebase 설정 가이드
├── GITHUB-PAGES-DEPLOY.md # GitHub Pages 배포 가이드
└── .gitignore             # Git 무시 설정
```

## 🌐 배포

### GitHub Pages 배포 (Firebase 없음)

```bash
# 1. 저장소 초기화
git init
git remote add origin https://github.com/YOUR_USERNAME/record.git

# 2. 파일 추가 및 커밋
git add .
git commit -m "Initial commit: RE:CORD"

# 3. GitHub에 푸시
git push -u origin main

# 4. GitHub Pages 활성화
# Settings > Pages > Deploy from a branch > main > Save

# 5. 접속
# https://YOUR_USERNAME.github.io/record
```

### Firebase + GitHub Pages (권장)

[SETUP.md](./SETUP.md) 참고하여:
1. Firebase 프로젝트 생성
2. firebase-config.js 생성
3. Firestore Security Rules 배포
4. GitHub Pages에 배포

상세 가이드: [SETUP.md](./SETUP.md)

## 💾 데이터 저장

### localStorage 모드 (Firebase 없음)
- 로컬 브라우저에만 저장
- 로그인 기능 없음
- 기기별 독립적 관리

### Firestore 모드 (Firebase 있음)
- 클라우드 저장소
- 로그인 필수
- 여러 기기 동기화
- 데이터 백업

## 🔒 보안

- 사용자별 데이터 분리 (UID 기반)
- Firestore Security Rules로 접근 제어
- 비인증 사용자 접근 차단
- firebase-config.js 버전 관리 제외

## ⚙️ 시스템 요구사항

- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- JavaScript 활성화
- 인터넷 연결 (Firebase 사용 시)

## 🐛 알려진 문제

없음

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🤝 기여

버그 리포트나 기능 제안은 Issues에서 확인 가능합니다.

## 📮 문의

질문이나 피드백은 GitHub Issues를 통해 주세요.

---

## 버전 히스토리

### v3.0.0 (2024-11-09)
- ✨ Firebase Authentication 추가
- ✨ Firestore 데이터베이스 연동
- ✨ 사용자 계정 시스템
- 🔒 Firestore Security Rules 추가
- 📱 모바일 인증 화면 최적화

### v2.0.0 (2024-11-09)
- ✨ 시험 일정 관리
- ✨ D-day 계산
- ✨ 월간 캘린더
- ✨ 졸업 요건 관리
- 📊 진행률 시각화

### v1.0.0 (2024-11-09)
- ✨ 성적 관리
- ✨ GPA 계산
- ✨ 대시보드
- 💾 localStorage 저장

---

**RE:CORD**로 효율적인 학업 관리를 시작하세요! 🎓

Made with ❤️ for Students
