// 스펙 목록 필터링 상태 — 두 칼럼(미선택/선택) 각각에 대해 독립된 쿼리를 유지한다.
//
// 필터는 순수 파생 아톰으로 구성해 테스트 시 `specsAtom` · 쿼리 · 선택 Set만
// 세팅하면 기대 결과가 결정된다.

import { atom } from "jotai";

import type { EventSpec } from "@/types/spec.ts";

import { selectedEventNamesAtom } from "./recording-atoms.ts";
import { specsAtom } from "./specs-atoms.ts";

/** 미선택 칼럼 검색어. */
export const unselectedQueryAtom = atom<string>("");
/** 선택 칼럼 검색어. */
export const selectedQueryAtom = atom<string>("");

function matchesQuery(spec: EventSpec, query: string): boolean {
  if (!query) return true;
  const haystack = [spec.amplitudeEventName, spec.humanEventName, spec.pageName]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/** 미선택 칼럼: `specsAtom` - 선택 Set, 그 뒤 쿼리 필터. */
export const unselectedFilteredSpecsAtom = atom((get) => {
  const query = get(unselectedQueryAtom).trim().toLowerCase();
  const selected = get(selectedEventNamesAtom);
  return get(specsAtom).filter(
    (spec) =>
      !selected.has(spec.amplitudeEventName) && matchesQuery(spec, query),
  );
});

/** 선택 칼럼: 선택 Set ∩ `specsAtom`, 그 뒤 쿼리 필터. */
export const selectedFilteredSpecsAtom = atom((get) => {
  const query = get(selectedQueryAtom).trim().toLowerCase();
  const selected = get(selectedEventNamesAtom);
  return get(specsAtom).filter(
    (spec) =>
      selected.has(spec.amplitudeEventName) && matchesQuery(spec, query),
  );
});
