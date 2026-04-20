# M6 — Spec Parser ✅ 구현 완료

**파일**: `sheets/spec-parser.ts`, `types/spec.ts`

**필독**: [05-sheet-spec](../05-sheet-spec.md), [02-contracts §EventSpec](../02-contracts.md#typesspects--구현-완료)

## 공개 API

```typescript
export function parseSpecCsv(csv: string, options?: ParseOptions): ParseResult;
// ParseResult = { specs: EventSpec[]; warnings: ParseWarning[] }
```

## 동작 요약 (변경 금지 — 다른 모듈 의존)

- 헤더를 **이름 기준**으로 매핑 (시트별 컬럼 순서/개수 다름 대응)
- `to-be` 우선, 비었으면 `as-is` fallback
- **status 필터 없음** (draft/broken 행도 포함 — 개발 중 검증용)
- Amplitude 이벤트명: `eventName` 컬럼 중 `__` 없고 trailing `_` 없는 값
- 파라미터: `$key` 추출, `:` 뒤 설명 제거, 중복 제거, dotted path 유지
- `공통 Extension` 참조는 `referencedExtensions`로 별도 수집
- 섹션 앵커/빈 행은 경고로 surface

## 이미 발견된 시트 데이터 이슈 (시트 오너에게 피드백 필요)

- Amplitude 이벤트명 컬럼이 빈 행 (예: 메인 시트 row 60 `impr__realReviewPick`)
- `objectContainer`에 trailing space (예: 서치리스트 row 5 `noResult `)
