# Event Profiler

수집된 이벤트를 분석해 로그가 스펙에 맞게 구현되었는지 평가, 리포트를 생성하는 Chrome 익스텐션

## 설치하기

### 1. zip 받기

저장소의 [Releases](https://github.com/wad-woojeongmin/event-profiler/releases) 페이지 최신 버전에서 `event-profiler-<버전>-chrome.zip`을 내려받습니다.

### 2. 크롬에 익스텐션 설치

1. zip을 압축 해제합니다.
2. **catchtable 사내 계정(`@catchtable.co.kr`)이 주 계정인 크롬 프로필을 사용합니다.** 우측 상단 프로필 아이콘 → **"추가"**로 사내 계정 프로필을 만들어 사용하세요.
3. 주소창에 `chrome://extensions` 입력
4. 우측 상단 **"개발자 모드"** 토글 ON
5. 좌측 상단 **"압축 해제된 확장 프로그램 로드"** 클릭 → 1번에서 푼 폴더 선택
6. 툴바의 퍼즐 아이콘에서 Event Profiler를 고정

> ⚠️ 폴더를 삭제·이동하면 확장이 깨집니다. 크롬 재시작 시 "개발자 모드 확장" 경고 배너가 뜨면 **"유지"**를 선택하세요.

### 3. 로그인

확장 아이콘 클릭 → 사이드패널의 **"Google 로그인"** 버튼 → 시트 접근 권한 동의.

## 개발

### 요구 사항

- pnpm

### 스크립트

```bash
pnpm install
pnpm dev       # 개발 모드 (MV3 build + 자동 리로드) → .output/chrome-mv3-dev/
pnpm build     # 프로덕션 빌드 → .output/chrome-mv3/
pnpm zip       # 배포용 zip → .output/event-profiler-<버전>-chrome.zip
pnpm vitest    # 단위 테스트
pnpm compile   # 타입 체크
```

### 환경변수

OAuth2·확장 키는 배포 환경별 자격증명이라 `wxt.config.ts`에 인라인하지 않고 아래 변수로 주입합니다. **미설정 시 빌드는 성공하지만 Google 로그인이 실패**합니다.

```bash
cp .env.example .env   # 실제 값을 채운다
```

- `WXT_OAUTH_CLIENT_ID` — Google OAuth Client ID. Sheets API 읽기 전용 스코프.
- `WXT_EXTENSION_PUBLIC_KEY` — MV3 확장 공개 키. Extension ID를 고정해 OAuth consent 등록값과 일치시키는 용도.

`.env`·`.pem` 개인 키는 리포 외부 안전한 위치에 보관하고 **절대 커밋하지 않습니다**. 개인 키 분실 시 Extension ID를 새로 생성하고 OAuth도 재등록해야 합니다.

### 개발 모드 로드

1. `pnpm dev` 실행 → `.output/chrome-mv3-dev/` 생성
2. `chrome://extensions` → 개발자 모드 → 압축 해제된 확장 로드 → 위 폴더 선택
3. Extension ID가 OAuth consent 등록값과 일치하는지 확인 (`WXT_EXTENSION_PUBLIC_KEY`로부터 결정론적으로 파생)

### 배포용 zip 만들기

1. `.env`의 `WXT_EXTENSION_PUBLIC_KEY`가 배포용 값인지 확인
2. 해당 Extension ID가 Google Cloud Console의 `WXT_OAUTH_CLIENT_ID` 클라이언트에 등록되어 있는지 확인
3. `pnpm zip` → `.output/event-profiler-<버전>-chrome.zip` 생성
4. 배포 채널(Slack·Drive·GitHub Releases 등)에 zip + 위 §설치하기 링크 공유

## 문서

- `REQUIREMENTS.md` — 최상위 인덱스
- `docs/00-index.md` — 모듈 라우팅
- `docs/modules/m1~m8.md` — 모듈별 요구사항
