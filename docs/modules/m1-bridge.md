# M1 — Webapp Bridge (event-logger patch)

**담당 레포**: `ct-catchtable-frontend` 모노레포 > `packages/@catchtable-b2c/event-logger/`

**필독**: [02-contracts §메시지 프로토콜](../02-contracts.md#메시지-프로토콜), [01-overview §Decision Log #2](../01-overview.md#decision-log)

## 책임

`event-logger`가 Amplitude로 이벤트를 보낼 때 **같은 페이로드**를 `window.postMessage`로 익스텐션에 중계.

## 요구사항

1. 프로덕션 번들에서는 **기본 비활성**. 다음 중 하나일 때만 동작:
   - `window.__ENABLE_EVENT_VALIDATOR__ === true` (개발/스테이징에서 수동 활성)
   - URL 쿼리 `?eventValidator=1` (QA가 필요할 때 켬)
   - `localStorage.setItem('eventValidator.enabled', '1')` (persistent)
2. Amplitude 발송 직후 다음 포맷으로 `window.postMessage` 실행 (origin 제한):
   ```typescript
   window.postMessage(
     {
       source: "catchtable-event-validator",
       version: 1,
       payload: {
         provider: "amplitude",
         eventName,          // 최종 Amplitude 이벤트명
         params: eventProperties,
         timestamp: Date.now(),
       },
     },
     location.origin,
   );
   ```
3. 실패해도 원본 이벤트 전송에 영향 없어야 함 (try/catch로 감싸기)
4. 프로덕션 번들에 포함되더라도 비활성 경로에서 **zero-cost** (tree-shakable 또는 early-return)
5. 유닛 테스트: 활성/비활성 분기, params 직렬화 오류 시 skip

## 구현 유의점

- `eventName`은 **Amplitude가 실제로 받은 값** (`{pageName}_{sectionName}_{actionName}_{eventType}` 형태). 원본 `event-logger` 내부에서 최종 변환된 이름을 postMessage에 실어야 함.
- params 순서 보존(Record 순서) — 디버깅 편의.
- 파라미터에 순환 참조나 DOM 노드가 섞여 있으면 JSON 직렬화 실패 가능 → structured clone 사용 또는 실패 시 skip + warn.

## 수용 기준

- [ ] `window.__ENABLE_EVENT_VALIDATOR__ = true` 설정 후 Amplitude 이벤트 발송 시 postMessage가 정확한 페이로드로 호출됨
- [ ] 비활성 상태에서 postMessage 호출 0회
- [ ] 원본 이벤트 발송 성공률에 영향 없음 (기존 테스트 통과)
- [ ] PR 포함 항목: 활성 방법 README 섹션, 릴리즈 노트
