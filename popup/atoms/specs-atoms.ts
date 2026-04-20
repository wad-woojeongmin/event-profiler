// 스펙 로드/표시 상태를 담는 아톰 그룹.
//
// - `specsAtom`: 검증 대상 후보로 렌더링되는 EventSpec 목록
// - `specsLoadStateAtom`: 로딩 단계(UI 버튼/스피너 분기)
// - `loadSpecsAtom`: write-only 액션. 에러는 상태 아톰에 기록하고 throw하지 않는다
//   (팝업이 unhandled promise로 깨지지 않도록).

import { atom } from "jotai";

import type { EventSpec } from "@/types/spec.ts";

import { backgroundClientAtom, requireBackgroundClient } from "./client-atom.ts";

export type SpecsLoadState = "idle" | "loading" | "loaded" | "error";

export const specsAtom = atom<EventSpec[]>([]);
export const specsLoadStateAtom = atom<SpecsLoadState>("idle");
export const specsErrorAtom = atom<string | undefined>(undefined);

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
    } catch (err) {
      set(specsLoadStateAtom, "error");
      set(specsErrorAtom, toErrorMessage(err));
    }
  },
);

/** OAuth 로그인 트리거. 성공 후 호출자가 `loadSpecs`를 재시도한다. */
export const authenticateAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  set(specsErrorAtom, undefined);
  try {
    await client.authenticate();
  } catch (err) {
    set(specsErrorAtom, toErrorMessage(err));
  }
});

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
