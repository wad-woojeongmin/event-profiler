# M9 — Auth (예정 · Phase 2)

> **상태**: 예정 (TODO). 현재는 M5(Google Sheets) 어댑터와 M4(Popup) 아톰에 OAuth 로직이 섞여 있다. 계정 전환·토큰 만료 처리·사이드카 권한 확장 등 Phase 2 요구가 생기는 시점에 본 모듈로 분리한다.

**예상 파일**: `auth/ports/auth.ts`, `auth/adapters/chrome-identity-auth.ts`, `auth/index.ts`

**필독**: [01-overview](../01-overview.md), [02-contracts](../02-contracts.md), [m5-sheets](./m5-sheets.md)

## 분리 동기

- `sheets/adapters/google-sheets-source.ts`에 silent→interactive fallback, 401/403 재인증, `hasCachedToken` 조회가 모두 들어가 있어 "시트 IO"와 "인증"이 한 어댑터에 묶여 있다.
- 팝업은 `specs-atoms.ts`에서 인증 상태를 관리하는데, 실제 토큰 라이프사이클은 SW(M3)·Sheets 어댑터(M5)에 분산되어 있다. 상태 진실 공급원이 불명확.
- 향후 요구(계정 전환, 토큰 만료 UI, 추가 스코프 요청)는 각 어댑터마다 중복 구현을 낳게 된다.

## 책임 경계 (초안)

- Google OAuth 토큰 라이프사이클 단일 관리: silent 조회, interactive 획득, 캐시 무효화
- 401/403 재인증 정책 제공 (Sheets 어댑터는 이 정책을 주입받아 사용)
- 팝업 UI용 인증 상태 스냅샷/구독 제공

## 포트 스케치

```typescript
// auth/ports/auth.ts
export interface AuthPort {
  /** 현재 토큰이 캐시에 있는지 silent로 조회 (UI 라벨 복구용). */
  hasCachedToken(): Promise<boolean>;
  /** 액세스 토큰 획득. interactive=false면 silent, 실패 시 호출자가 승급 결정. */
  getToken(interactive: boolean): Promise<string>;
  /** 401/403 후 재인증 — 캐시 무효화 + interactive 재발급. */
  reauthenticate(): Promise<string>;
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
}
```

## 마이그레이션 시 고려사항

- M5 `SheetsSource`는 내부에서 `AuthPort`를 주입받는 형태로 변경. 공개 API(`sheets/index.ts`)는 변화 없음.
- `BackgroundClient.hasCachedToken`/`authenticate`/`signOut`는 그대로 유지하되 구현이 `AuthPort`에 위임되도록만 변경 (팝업 코드 영향 최소화).
- [02-contracts](../02-contracts.md)의 메시지/스토리지 키는 변경하지 않는다. 순수 내부 리팩터링으로 유지.

## 착수 트리거

다음 중 하나라도 필요해지면 본 모듈로 작업 착수:

- 계정 전환(여러 Google 계정 사용 지원)
- 토큰 만료 시점의 사용자 알림 UI
- Sheets 외 서비스(예: Drive, 다른 스코프) 인증 추가
