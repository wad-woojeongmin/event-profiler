# 05 — 이벤트 스펙 시트 구조

> M5(Sheets 연동) / M6(Spec Parser) 담당자가 참고. 다른 모듈은 `EventSpec` 타입([02-contracts](./02-contracts.md))만 알면 충분.

## 필수 컬럼 (헤더 행 2, 인덱스 1)

| 컬럼                                                | 용도                                                 |
| --------------------------------------------------- | ---------------------------------------------------- |
| `status`                                            | `applied` / `draft` / `broken` 등. **필터하지 않음** |
| `pageName(to-be)` + `pageName(as-is)`               | 페이지명 (to-be 우선)                                |
| `objectContainer(to-be)` + `objectContainer(as-is)` | sectionName 역할                                     |
| `objectType(to-be)` + `objectType(as-is)`           | actionName 역할                                      |
| `eventType(to-be)` + `eventType(as-is)`             | view/click/impr/scroll/swipe/done/capture            |
| `logType`                                           | event/screen/popup/bottomsheet                       |
| `eventName` (1번째)                                 | 사람이 읽는 이름 (`click__banner`)                   |
| `eventName` (마지막)                                | **Amplitude 실제 전송 이름** (매칭 키)               |
| `object (string)`                                   | 주 파라미터 (보통 1개)                               |
| `extension`                                         | 추가 파라미터 리스트, 쉼표/줄바꿈 구분               |

## 파라미터 셀 규칙 (M6가 이미 구현)

- 토큰: `$key` (prefix 제거 후 저장)
- 설명 주석: `$key: description` (`:` 이후 제거)
- dotted path 보존: `$restaurantItem.shopRef`
- 공통 Extension 참조: `[검색 관련 동작 공통 Extension]` 또는 `지도 관련 동작 공통 Extension` → `referencedExtensions`로 분리
- 중복 `$key`는 dedup

## 알려진 시트 이슈

- 일부 신규 행에 Amplitude 이벤트명 컬럼이 비어있음 (예: 메인 시트 row 60 `impr__realReviewPick`)
- 공백/trailing-space가 섞인 값 있음 (예: 서치리스트 row 5 `noResult `)
- marketingPromotion은 `sectionName`이 사용자 입력(동적) — 현재 스코프에서는 단순 매칭 실패로 surface

## 시트 보강 요청 (DA와 별도 협의)

- `required` 컬럼 (Y/N)
- `paramType` 컬럼 (string/number/boolean/enum)
- 공통 Extension 정의 시트 분리
