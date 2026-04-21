// M4 Popup UI와 백엔드(배경 SW·Sheets) 경계를 이루는 포트.
//
// UI 레이어(React 컴포넌트·Jotai 아톰)는 이 인터페이스에만 의존한다. 어댑터가
// `@webext-core/messaging` 호출·Google Sheets 조회·`wxt/browser` 탭 조회 등
// 런타임 의존을 모두 삼키므로 UI는 in-memory fake로 단위 테스트 가능하다.
//
// 제약:
// - 런타임/라이브러리 타입(Browser.*, Jotai Atom, React hook)을 이 파일에 노출 금지
//   (03-conventions §SOLID 1·7).
// - `EventSpec`·`RecordingSessionState`는 공개 계약이므로 `@/types`에서 가져온다.

import type { EventSpec } from "@/types/spec.ts";
import type { RecordingSessionState } from "@/types/messages.ts";
import type { ValidationReport } from "@/types/validation.ts";

/**
 * 팝업이 필요로 하는 백엔드 연산을 단일 인터페이스로 묶는다.
 *
 * - 스펙 로드는 M5(Google Sheets)로, 세션 제어는 M3(Background SW)로 라우팅된다.
 *   라우팅 분기는 어댑터가 숨기며 호출자는 "백엔드"라는 단일 경계만 인지한다.
 * - fire-and-forget 계열 메시지는 어댑터에서 Promise로 승격시켜 UI가
 *   로딩/에러 상태를 일관되게 다룰 수 있게 한다.
 */
export interface BackgroundClient {
  /**
   * 스펙 시트에서 `EventSpec[]`를 로드한다. 팝업은 단일 고정 시트만 사용하므로
   * `sheetTitle` 생략 시 첫 탭을 기본으로 사용한다. Phase 2에서 다중 탭 UI 도입.
   *
   * @throws 인증 실패·네트워크 오류는 그대로 throw. 호출자가 사용자에게 노출.
   */
  loadSpecs(sheetTitle?: string): Promise<EventSpec[]>;

  /**
   * 대상 이벤트 집합과 활성 탭 id를 지정해 새 녹화 세션을 연다. 기존 세션은
   * 배경 SW가 먼저 clear한다(docs/modules/m3).
   */
  startRecording(targetEventNames: string[], tabId: number): Promise<void>;

  /** 현재 세션을 종료한다. 이미 종료된 세션이면 no-op. */
  stopRecording(): Promise<void>;

  /**
   * 세션·이벤트·스크린샷을 모두 지워 idle 상태로 되돌린다.
   * 녹화 종료 후 다른 이벤트를 선택해 새 세션을 열기 위해 선택 UI로 복귀할 때 사용.
   */
  clearSession(): Promise<void>;

  /** 팝업 재오픈 시 UI 복구용 세션 스냅샷. 세션이 없으면 빈 스냅샷. */
  getSessionState(): Promise<RecordingSessionState>;

  /**
   * 세션 상태 변경 구독. 녹화 중 경과 시간·수집 건수 갱신에 사용한다.
   *
   * @param onChange 최신 스냅샷을 전달받는 콜백
   * @returns 구독 해제 함수. 팝업 unmount 시 반드시 호출.
   */
  subscribeSession(
    onChange: (state: RecordingSessionState) => void,
  ): () => void;

  /** M8 리포트 HTML을 새 탭으로 띄운다. */
  generateReport(): Promise<void>;

  /**
   * 현재 세션에 대한 라이브 검증 스냅샷.
   *
   * 배경 SW가 최종 리포트와 동일한 소스(스펙 캐시 + 현재 세션 이벤트 + defaultRules)로
   * `validate()`를 호출한다. 활성 세션이 없거나 스펙 캐시가 비면 `null`.
   */
  getValidationSnapshot(): Promise<ValidationReport | null>;

  /**
   * 현재 활성 탭의 id와 url. url은 호스트 매치 판정("지원 페이지" 배너 + 녹화
   * 시작 가드)에 쓰고, id는 녹화 시작 시 배경 SW로 전송해 탭 바인딩에 쓴다.
   *
   * Chrome은 호스트 권한이 없는 탭의 `url`을 `undefined`로 돌려주므로 호출자는
   * `@/content`의 `isSupportedUrl`로 보수적 판정을 한다(undefined = 미지원).
   */
  getActiveTab(): Promise<{ id: number; url: string | undefined }>;

  /**
   * Google OAuth 토큰을 명시적으로 발급한다(interactive). 로그인 버튼에서 사용.
   * 성공 시 후속 `loadSpecs` 호출이 통과한다.
   */
  authenticate(): Promise<void>;

  /** 캐시된 Google 토큰을 모두 폐기한다. */
  signOut(): Promise<void>;

  /**
   * 캐시된 유효 토큰이 있는지 silent로 확인한다. 팝업은 OAuth 창이 뜨는 순간
   * 포커스를 잃고 닫히므로 재오픈 시 이 값으로 로그인 라벨을 복구한다.
   */
  hasCachedToken(): Promise<boolean>;

  /**
   * 마지막으로 로드한 스펙 스냅샷을 읽는다. 팝업 재오픈 시 "스펙 불러오기"를
   * 다시 누르지 않고도 체크박스를 즉시 복원하기 위함. 캐시가 비어있으면 `null`.
   */
  getCachedSpecs(): Promise<EventSpec[] | null>;

  /**
   * 스펙 스냅샷을 캐시에 덮어쓴다. `loadSpecs` 성공 직후 호출해 다음 팝업
   * 오픈에서 복원 가능하게 한다.
   */
  setCachedSpecs(specs: EventSpec[]): Promise<void>;
}
