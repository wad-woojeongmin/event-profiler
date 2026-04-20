// 스펙 목록 필터링 상태.
//
// 필터는 순수 파생 아톰으로 구성해 테스트 시 `specsAtom`+`filterQueryAtom`만
// 세팅하면 기대 결과가 결정된다.

import { atom } from "jotai";

import { specsAtom } from "./specs-atoms.ts";

export const filterQueryAtom = atom<string>("");

/**
 * 대소문자 무시 부분 일치. Amplitude 이벤트명·사람 이벤트명·페이지명 세 필드를
 * 합쳐 검색한다. 사용자는 일반적으로 한쪽만 기억하므로 필드별 옵션을 두지 않는다.
 */
export const filteredSpecsAtom = atom((get) => {
  const query = get(filterQueryAtom).trim().toLowerCase();
  const specs = get(specsAtom);
  if (!query) return specs;
  return specs.filter((spec) => {
    const haystack = [
      spec.amplitudeEventName,
      spec.humanEventName,
      spec.pageName,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
});
