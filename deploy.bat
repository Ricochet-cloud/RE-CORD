@echo off
REM GitHub Pages 배포 스크립트 (Windows)

setlocal enabledelayedexpansion

echo.
echo === RE:CORD GitHub Pages 배포 ===
echo.

REM 1. Git 상태 확인
echo [1/5] Git 상태 확인...
git status
echo.

REM 2. 파일 추가
echo [2/5] 파일 추가...
git add .
echo 파일이 추가되었습니다.
echo.

REM 3. 커밋
echo [3/5] 커밋 메시지 입력 (기본값: Update RE:CORD)
set /p commit_msg="커밋 메시지 입력: "
if "!commit_msg!"=="" set commit_msg=Update RE:CORD
git commit -m "!commit_msg!"
echo.

REM 4. 푸시
echo [4/5] GitHub에 푸시...
git push origin main
if errorlevel 1 (
    echo 푸시 실패! GitHub 연결을 확인하세요.
    pause
    exit /b 1
)
echo 푸시 완료!
echo.

REM 5. 배포 완료
echo [5/5] 배포 완료!
echo.
echo === 배포 성공 ===
echo 다음 주소에서 확인하세요:
echo https://YOUR_USERNAME.github.io/record
echo.
echo (YOUR_USERNAME을 자신의 GitHub 사용자명으로 변경하세요)
echo.

pause
