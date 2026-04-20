# Event Profiler

Catch Table 이벤트 스펙과 실제 수집 로그를 비교해 누락·오수집을 검출하는 Chrome 확장. WXT + React 19 + Jotai 기반.

## Getting Started

```bash
pnpm install
pnpm dev       # 개발 모드 (MV3 build + 자동 리로드)
pnpm build     # 프로덕션 빌드 → .output/chrome-mv3/
pnpm vitest    # 단위 테스트
pnpm compile   # 타입 체크
```

### 환경변수

OAuth2·확장 키는 배포 환경별 자격증명이라 `wxt.config.ts`에 인라인하지 않는다. 로컬·CI에서 아래 변수로 주입한다. **env 미설정 시 빌드는 성공하지만 팝업의 Google 로그인이 실패**하므로 개발 시작 전에 확인.

```bash
cp .env.example .env   # 이후 실제 값을 채운다 (아래 값 출처 참고)
```

- `WXT_OAUTH_CLIENT_ID` — Google OAuth Client ID. Sheets API 읽기 전용 스코프.
- `WXT_EXTENSION_PUBLIC_KEY` — MV3 확장 공개 키. 로드된 확장의 Extension ID를 고정하여 OAuth consent 화면에 등록한 ID와 일치시키는 용도.

> `.env`는 gitignore 처리되어 있다. 실제 값은 절대 커밋하지 않는다. 대응되는 `.pem` 개인 키도 리포에 두지 말고 리포 외부 안전한 위치에 보관한다(분실 시 Extension ID 재생성 + OAuth 재등록 필요).

### 확장 로드 (개발)

1. `pnpm dev` 실행 → `.output/chrome-mv3-dev/` 생성
2. `chrome://extensions` → 개발자 모드 → 압축 해제된 확장 로드 → 위 폴더 선택
3. Extension ID가 OAuth consent에 등록된 값(`mmcjanehndijbdfpfampiegmlklcjldm`)과 일치하는지 확인

### PoC 사내 배포 (zip + Unpacked)

웹스토어 업로드 없이 사내 비개발자에게 zip으로 배포하는 PoC 절차.

**배포자(개발자)**

1. `.env`에 PoC용 `WXT_EXTENSION_PUBLIC_KEY` 설정 → Extension ID가 `mmcjanehndijbdfpfampiegmlklcjldm`로 고정됨
2. 해당 ID가 Google Cloud Console OAuth client(`3134095607-...`)의 애플리케이션 ID 필드에 등록되어 있는지 확인
3. `pnpm zip` → `.output/event-validator-0.1.0-chrome.zip` 생성
4. 사내 공지 채널(Slack/Drive 등)에 zip + 아래 설치 가이드 공유

**설치자(비개발자)**

1. zip 파일 다운로드 → 삭제되지 않을 고정 경로에 **압축 해제** (예: `~/Tools/event-validator/`)
2. 주소창에 `chrome://extensions` 입력
3. 우측 상단 **"개발자 모드"** 토글 ON
4. 좌측 상단 **"압축 해제된 확장 프로그램 로드"** 클릭 → 1번 폴더 선택
5. 툴바 아이콘 고정 → 팝업에서 Google 계정 로그인

> ⚠️ 풀어둔 폴더를 삭제/이동하면 확장이 깨진다. Chrome 재시작 시 "개발자 모드 확장" 경고 배너가 뜨면 "유지"를 선택한다.

**업데이트**

- 새 zip 배포 시: 기존 폴더에 덮어쓰기 → `chrome://extensions`에서 해당 확장의 **새로고침 버튼** 클릭
- Extension ID가 고정되어 있으므로 OAuth 재로그인은 불필요

## 문서

- `REQUIREMENTS.md` — 최상위 인덱스
- `docs/00-index.md` — 모듈 라우팅
- `docs/modules/m1~m8.md` — 모듈별 요구사항
