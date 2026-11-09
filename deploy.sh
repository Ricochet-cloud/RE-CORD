#!/bin/bash

# GitHub Pages 배포 스크립트 (Mac/Linux)

echo ""
echo "=== RE:CORD GitHub Pages 배포 ==="
echo ""

# 1. Git 상태 확인
echo "[1/5] Git 상태 확인..."
git status
echo ""

# 2. 파일 추가
echo "[2/5] 파일 추가..."
git add .
echo "파일이 추가되었습니다."
echo ""

# 3. 커밋
echo "[3/5] 커밋 메시지 입력 (기본값: Update RE:CORD)"
read -p "커밋 메시지 입력: " commit_msg
commit_msg="${commit_msg:-Update RE:CORD}"
git commit -m "$commit_msg"
echo ""

# 4. 푸시
echo "[4/5] GitHub에 푸시..."
if ! git push origin main; then
    echo "푸시 실패! GitHub 연결을 확인하세요."
    exit 1
fi
echo "푸시 완료!"
echo ""

# 5. 배포 완료
echo "[5/5] 배포 완료!"
echo ""
echo "=== 배포 성공 ==="
echo "다음 주소에서 확인하세요:"
echo "https://YOUR_USERNAME.github.io/record"
echo ""
echo "(YOUR_USERNAME을 자신의 GitHub 사용자명으로 변경하세요)"
echo ""
