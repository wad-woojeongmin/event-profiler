# M7 — Validator

**파일**: `validator/validator.ts`, `validator/ports/validation-rule.ts`, `validator/rules/*.ts`

**필독**: [02-contracts §`types/validation.ts`](../02-contracts.md#typesvalidationts-m7-담당), [03-conventions §철칙 5 OCP](../03-conventions.md#solid-철칙-poc-제약)

## 포트 정의 — 규칙 플러그인

```typescript
// ports/validation-rule.ts
export interface ValidationContext {
  spec: EventSpec;
  captured: CapturedEvent[];
  allCaptured: CapturedEvent[];             // 타 스펙 이벤트까지 포함한 전체 (교차 분석용)
  targetEventNames: ReadonlySet<string>;
}

export interface ValidationRule {
  readonly code: IssueType;
  evaluate(ctx: ValidationContext): ValidationIssue[];
}
```

규칙 추가는 **새 파일 1개** 추가로 완료 (OCP). 기존 코드 수정 없음.

## 책임

녹화 종료 후 `EventSpec[]` × `CapturedEvent[]`를 비교하여 `ValidationReport` 생성.
**순수 함수로 유지** — `browser.*`, I/O 호출 금지.

## 요구사항

### 매칭

- `CapturedEvent.eventName === EventSpec.amplitudeEventName` 완전 일치
- 같은 이벤트가 여러 번 발생하면 모두 `ValidationResult.captured`에 누적

### 규칙

| 규칙                | 조건                                                    | status                   | severity  | issue type           |
| ------------------- | ------------------------------------------------------- | ------------------------ | --------- | -------------------- |
| R1. 미수집          | 선택된 스펙이지만 녹화 기간 중 0건                      | `not_collected`          | `info`    | `not_collected`      |
| R2. 파라미터 누락   | 스펙 `params`에 있지만 수집 이벤트 `params`에 key 없음  | `fail`                   | `warning` | `missing_param`      |
| R3. 빈 값           | 수집 이벤트에 key는 있지만 값이 `undefined`/`null`/`''` | `fail`                   | `warning` | `empty_param`        |
| R4. 과수집 의심     | 동일 eventName이 500ms 이내 2회 이상                    | `suspect_duplicate`      | `warning` | `suspect_duplicate`  |
| R5. 예외 이벤트     | 선택 안 된 eventName이 수집됨                           | (별도 `unexpected` 배열) | `info`    | `unexpected_event`   |
| R6. 미선언 파라미터 | 수집 param 중 스펙에 없는 key                           | -                        | `info`    | `param_unreferenced` |

- 시트에 enum/타입이 없으므로 **값 타입 검증 없음** (Phase 2)
- `referencedExtensions`는 현재 resolve 안 됨 → R2에서 해당 이벤트는 `params`만으로 판정. 공통 Extension 정의가 추가되면 확장.

### 상태 결정 우선순위

1. 수집 0건 → `not_collected`
2. `suspect_duplicate` 존재 → `suspect_duplicate` (이슈와 함께 pass/fail 판정도 같이)
3. `error` severity 이슈 존재 → `fail`
4. 그 외 → `pass`

### 공개 API

```typescript
export function validate(
  specs: EventSpec[],
  captured: CapturedEvent[],
  targetEventNames: string[],
  session: RecordingSession,
  rules: ValidationRule[], // 주입: 기본 규칙 세트는 validator/rules/index.ts에서 export
): ValidationReport;
```

## 수용 기준

- [ ] 6가지 규칙 각각 유닛 테스트
- [ ] 실제 4개 CSV 스펙 + 가짜 CapturedEvent fixture로 end-to-end 테스트
- [ ] 1000건 규모 이벤트에서 500ms 이하 처리
