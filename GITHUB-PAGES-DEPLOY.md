# GitHub Pages 배포 가이드

## 두 가지 배포 옵션

### 옵션 1: localStorage만 사용 (Firebase 없음) - 권장
- 가장 간단
- GitHub Pages만으로 충분
- 데이터는 각 기기에만 저장됨
- 로그인 기능 없음

### 옵션 2: Firebase + GitHub Pages
- GitHub Pages에 정적 파일 호스팅
- Firebase로 Authentication, Firestore 제공
- 로그인/회원가입 기능
- 여러 기기 간 데이터 동기화
- 추가 설정 필요

---

## 배포 과정

### 1단계: GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 새 저장소 생성
   - 저장소 이름: `record` (또는 원하는 이름)
   - Public 선택
   - Initialize with README (선택 사항)

### 2단계: 로컬 저장소 설정

```bash
cd C:\Users\Ricochet\Desktop\RECORD-html-css-js

# Git 초기화
git init

# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/record.git

# 초기 커밋
git add .
git commit -m "Initial commit: RE:CORD Phase 1, 2, 3"

# GitHub에 푸시
git branch -M main
git push -u origin main
```

### 3단계: GitHub Pages 활성화

1. GitHub 저장소 페이지 열기
2. Settings > Pages
3. Source: Deploy from a branch
4. Branch: main / folder: / (root)
5. Save 클릭

**배포 완료!** 몇 분 후 다음 주소에서 접속 가능:
```
https://YOUR_USERNAME.github.io/record
```

---

## Firebase와 함께 사용하는 경우

### 추가 설정

1. `firebase-config.js` 파일 생성 (firebase-config.example.js 참고)
2. `.gitignore`에 `firebase-config.js` 추가됨 (이미 설정됨)
3. GitHub에 푸시하면 firebase-config.js는 제외됨

### 문제 해결

만약 실수로 firebase-config.js를 GitHub에 푸시한 경우:

```bash
# 원격에서 파일 제거
git rm --cached firebase-config.js
git commit -m "Remove firebase-config.js from tracking"
git push

# Firebase API Key 재설정 권장
# Firebase Console > Project Settings > API Keys > Restrict key
```

---

## 배포 후 업데이트

파일 수정 후 배포:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

GitHub Pages는 자동으로 업데이트됩니다 (보통 1-2분 소요).

---

## localStorage 사용 (Firebase 없음)

현재 상태:
- ✅ firebase-config.js 없으면 localStorage 사용
- ✅ 모든 Phase 1, 2, 3 기능 작동
- ❌ 로그인/회원가입 불가능
- ❌ 기기 간 데이터 동기화 불가능

이 경우:
- GitHub Pages에 그냥 배포하면 됨
- 추가 설정 불필요

---

## 권장 설정

### 간단한 버전 (localStorage만)
```
GitHub Pages 배포만 하면 됨
```

### 완전한 버전 (Firebase 포함)
```
1. Firebase 프로젝트 생성
2. firebase-config.js 생성 (로컬에서만 관리)
3. GitHub에는 firebase-config.js 제외
4. GitHub Pages에 배포
5. Firebase도 별도 설정
```

---

## 기존 코드는 자동으로 호환됨

```javascript
// app.js에서 자동으로 처리
if (firebase-config.js 없음) {
  localStorage 사용
} else if (firebase-config.js 있음) {
  Firestore 사용
}
```

---

## 확인 체크리스트

- [ ] GitHub 계정 생성
- [ ] 저장소 생성
- [ ] `git init` 실행
- [ ] `git remote add origin ...` 실행
- [ ] 파일 추가 및 커밋
- [ ] `git push` 실행
- [ ] GitHub Pages 활성화
- [ ] https://YOUR_USERNAME.github.io/record 접속
- [ ] 기능 테스트

---

## 팁

1. **커밋 메시지 작성 요령**
   ```bash
   git commit -m "기능 설명"
   ```

2. **특정 파일만 커밋**
   ```bash
   git add index.html style.css
   git commit -m "UI 개선"
   git push
   ```

3. **변경 내용 확인**
   ```bash
   git status
   git diff
   ```

4. **이전 버전으로 복구**
   ```bash
   git log          # 커밋 기록 확인
   git revert <commit-hash>  # 특정 커밋으로 복구
   git push
   ```

---

## GitHub Pages vs Firebase Hosting

| 항목 | GitHub Pages | Firebase Hosting |
|------|-------------|-----------------|
| 설정 난이도 | ⭐ 매우 쉬움 | ⭐⭐⭐ 중간 |
| 비용 | 무료 | 무료 (소량) |
| 정적 파일 | ✅ 지원 | ✅ 지원 |
| 백엔드 | ❌ 불가능 | ✅ Firebase 제공 |
| 도메인 | username.github.io | Firebase 또는 커스텀 |
| 배포 속도 | 1-2분 | 30초 |

**결론: 간단하게 시작하려면 GitHub Pages, 모든 기능을 원하면 Firebase + GitHub Pages**

