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

- `WXT_OAUTH_CLIENT_ID` — Google OAuth Client ID. Sheets API 읽기 전용 스코프.
- `WXT_EXTENSION_KEY` — MV3 확장 공개 키. 로드된 확장의 Extension ID를 고정하여 OAuth consent 화면에 등록한 ID와 일치시키는 용도.

### 확장 로드 (개발)

1. `pnpm dev` 실행 → `.output/chrome-mv3-dev/` 생성
2. `chrome://extensions` → 개발자 모드 → 압축 해제된 확장 로드 → 위 폴더 선택
3. Extension ID가 OAuth consent에 등록된 값과 일치하는지 확인

## 문서

- `REQUIREMENTS.md` — 최상위 인덱스
- `docs/00-index.md` — 모듈 라우팅
- `docs/modules/m1~m8.md` — 모듈별 요구사항
