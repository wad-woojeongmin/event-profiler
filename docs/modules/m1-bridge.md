# M1 — Webapp Bridge (Amplitude enrichment plugin)

**설치 대상 레포**: `ct-catchtable-frontend` 모노레포 > `apps/catchtable.co.kr/`
(event-logger 라이브러리는 별도 레포 `frontend-library/packages/event-logger/`로 이관되었으므로 본 모듈은 라이브러리를 수정하지 않고 웹앱 측에서 SDK 플러그인으로 구현)

**필독**: [02-contracts §메시지 프로토콜](../02-contracts.md#메시지-프로토콜), [01-overview §Decision Log #2](../01-overview.md#decision-log)

## 책임

웹앱이 Amplitude SDK로 이벤트를 보낼 때 **같은 페이로드**를 `window.postMessage`로 익스텐션 Content Script에 중계.

## 구현 방식

`@amplitude/analytics-browser` v2의 **Enrichment Plugin** (`amplitudeInstance.add(plugin)`)으로 구현한다. `execute(event)` 훅은 SDK 파이프라인 내부에서 호출되며, `event.event_type`은 Amplitude가 실제로 전송할 최종 이벤트명이다. 기존 `logService.ts`가 이미 같은 방식으로 `sessionReplayTracking`을 등록하고 있어 패턴 일관성도 확보된다.

## 요구사항

1. **활성화 조건**: `__PHASE__ !== 'real'` 단일 조건. Vite `define`의 빌드타임 치환으로 프로덕션 번들에서는 `amplitudeInstance.add(...)` 호출 자체가 DCE로 제거되어 zero-cost.
   - 수동 토글(query/localStorage/전역 플래그)은 의도적으로 두지 않는다. 프로덕션에서 우회 활성화 위험 제거.
2. Amplitude 발송 직후 다음 포맷으로 `window.postMessage` 실행 (origin 제한):
   ```typescript
   window.postMessage(
     {
       source: "catchtable-event-profiler",
       version: 1,
       payload: {
         provider: "amplitude",
         eventName,          // event.event_type (Amplitude 최종 이벤트명)
         params,              // event.event_properties 사본
         timestamp: Date.now(),
       },
     },
     location.origin,
   );
   ```
3. 실패해도 원본 이벤트 전송에 영향 없어야 함 (try/catch로 감싸고, plugin은 항상 event 반환).
4. 유닛 테스트(Vitest): 페이로드 shape, eventName/params 통과, params 사본성(structuredClone), 빈 properties, 직렬화 실패 시 no-op, origin.

## 구현 유의점

- `eventName`은 **Amplitude가 실제로 받은 값**(`event.event_type`). event-logger의 `buildEventName`이 조립한 `view__{pageName}` 또는 `{eventType}__{actionName}` 포맷이 그대로 들어온다. gtag 포맷(`{page}_{section}_{action}_{type}`)이 아니다.
- params는 `structuredClone(event.event_properties ?? {})`로 사본화. 호출자 mutate 영향 차단 + 순환 참조/DOM 노드 감지.
- plugin `execute`는 **반드시 event를 반환**하여 SDK 파이프라인을 막지 않음.

## 수용 기준

- [ ] 비프로덕션 phase에서 Amplitude 이벤트 발송 시 postMessage가 계약 shape으로 호출됨
- [ ] `__PHASE__ === 'real'` 빌드 산출물에서 plugin 등록 코드가 제거됨(grep로 확인)
- [ ] 원본 이벤트 발송 성공률에 영향 없음 (기존 웹앱 테스트 통과)
- [ ] PR 포함 항목: 활성 조건 설명, 릴리즈 노트
