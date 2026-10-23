# 이음 실시간 베타

Node.js + Express + Socket.IO 기반의 실시간 베타 프로젝트입니다.

## Render 배포
1. GitHub 저장소에 이 프로젝트 파일 전체를 올립니다. `index.html`은 저장소 루트가 아니라 `public/index.html` 경로에 있어야 합니다.
2. Render에서 기존 Static Site만으로는 Socket.IO 서버를 실행할 수 없으므로, **New + → Web Service**를 만듭니다.
3. GitHub 저장소를 연결하고 설정합니다.
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Environment Variables에 `ADMIN_PASSWORD`를 추가하고 강력한 별도 비밀번호를 설정합니다. 배포 후 비밀번호를 바꾸려면 이 값을 수정합니다.
5. Deploy 후 `https://...onrender.com` 주소를 공유합니다.

## 중요
- 이 버전은 연결 중인 사용자 간에 상태를 실시간 동기화합니다.
- 운영 상태/답변은 서버 메모리에만 저장되므로 재배포나 서버 재시작 시 지워집니다. 무료 인스턴스는 잠들 수 있습니다.
- 관리자 인증은 서버에서 확인하지만, 단순 비밀번호 방식의 초기 베타입니다. 공개 운영 전에는 계정 기반 인증, 요청 제한, 데이터베이스, 업로드 스토리지, 보안 검토를 추가하세요.
- 파일 업로드 UI는 아직 포함되지 않았고, 사진 데이터 필드는 향후 연결용입니다.
- 실제 서비스 운영에 앞서 동시 사용자, 개인정보, 종료/삭제 정책을 테스트하세요.
