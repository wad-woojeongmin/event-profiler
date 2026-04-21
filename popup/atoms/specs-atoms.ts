// 스펙 로드/표시 상태를 담는 아톰 그룹.
//
// - `specsAtom`: 검증 대상 후보로 렌더링되는 EventSpec 목록
// - `specsLoadStateAtom`: 로딩 단계(UI 버튼/스피너 분기)
// - `authStatusAtom`: OAuth 인증 단계. 성공 시 로그인 버튼 라벨이 피드백으로 전환된다
//   (클릭해도 반응이 없어 성공 여부를 확인하기 어려웠던 UX 이슈 대응).
// - `loadSpecsAtom`: write-only 액션. 에러는 상태 아톰에 기록하고 throw하지 않는다
//   (팝업이 unhandled promise로 깨지지 않도록).

import { atom } from "jotai";

import type { EventSpec } from "@/types/spec.ts";

import { backgroundClientAtom, requireBackgroundClient } from "./client-atom.ts";

export type SpecsLoadState = "idle" | "loading" | "loaded" | "error";
export type AuthStatus = "idle" | "authenticating" | "authenticated" | "failed";

export const specsAtom = atom<EventSpec[]>([]);
export const specsLoadStateAtom = atom<SpecsLoadState>("idle");
export const specsErrorAtom = atom<string | undefined>(undefined);
export const authStatusAtom = atom<AuthStatus>("idle");

/**
 * 스펙 로드 액션. 인증 토큰 없이 시작할 경우 어댑터가 silent 토큰 조회를 먼저
 * 시도하므로 사용자는 "스펙 불러오기" 버튼 한 번으로 인증+로드가 해결된다.
 * interactive 인증이 필요한 경우에는 어댑터 계층에서 OAuth 팝업이 떠서 사용자가
 * 승인하도록 유도한다.
 */
export const loadSpecsAtom = atom(
  null,
  async (get, set, input?: { sheetTitle?: string }) => {
    const client = requireBackgroundClient(get(backgroundClientAtom));
    set(specsLoadStateAtom, "loading");
    set(specsErrorAtom, undefined);
    try {
      const specs = await client.loadSpecs(input?.sheetTitle);
      set(specsAtom, specs);
      set(specsLoadStateAtom, "loaded");
      // 어댑터의 silent→interactive fallback으로 여기까지 왔다면 토큰 보유가 확정이다.
      set(authStatusAtom, "authenticated");
      // 팝업 재오픈 시 체크박스 복원과 M8 리포트 어셈블러의 스펙 소스 양쪽을 위해
      // 스펙 스냅샷을 캐시에 기록한다. 캐시 실패는 로드 흐름을 깨지 않도록 silent.
      try {
        await client.setCachedSpecs(specs);
      } catch {
        // noop
      }
    } catch (err) {
      set(specsLoadStateAtom, "error");
      set(specsErrorAtom, toErrorMessage(err));
    }
  },
);

/**
 * 팝업 마운트 시 마지막으로 로드된 스펙 스냅샷을 캐시에서 읽어 UI를 복구한다.
 * 시트 재요청 없이 체크박스가 즉시 렌더되며, 사용자는 최신화가 필요할 때만
 * "스펙 불러오기"를 다시 누르면 된다. 캐시가 비어있거나 조회 실패면 no-op.
 */
export const hydrateSpecsFromCacheAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  try {
    const cached = await client.getCachedSpecs();
    if (cached && cached.length > 0) {
      set(specsAtom, cached);
      set(specsLoadStateAtom, "loaded");
    }
  } catch {
    // silent 실패 — 사용자가 "스펙 불러오기"로 복구.
  }
});

/**
 * 팝업 마운트 시 로그인 상태를 복구한다. Chrome 팝업은 OAuth 창이 열리는 순간
 * 포커스를 잃고 닫히므로, 재오픈 시 UI가 `idle`로 초기화돼 사용자는 이미
 * 로그인된 상태에서도 "Google 로그인" 라벨만 보게 된다. 캐시 토큰 유무를
 * silent로 조회해 `authenticated`/`idle`로 맞춘다. 실패는 조용히 무시한다.
 */
export const hydrateAuthStatusAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  try {
    const hasToken = await client.hasCachedToken();
    if (hasToken) set(authStatusAtom, "authenticated");
  } catch {
    // silent 조회 실패는 무시 — 사용자가 로그인 버튼을 눌러 복구하면 된다.
  }
});

/** OAuth 로그인 트리거. 성공 후 호출자가 `loadSpecs`를 재시도한다. */
export const authenticateAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  set(specsErrorAtom, undefined);
  set(authStatusAtom, "authenticating");
  try {
    await client.authenticate();
    set(authStatusAtom, "authenticated");
  } catch (err) {
    set(authStatusAtom, "failed");
    set(specsErrorAtom, toErrorMessage(err));
  }
});

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
