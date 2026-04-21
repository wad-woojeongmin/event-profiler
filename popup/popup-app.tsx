// Popup 최상위 composition.
//
// 엔트리포인트는 이 컴포넌트를 Jotai Provider로 감싸고 실구현 어댑터를 주입한다.
// 테스트는 같은 컴포넌트를 쓰되 in-memory fake 클라이언트를 주입한다.

import { Provider, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

import "./styles/reset.css.ts";

import { backgroundClientAtom } from "./atoms/client-atom.ts";
import { hydrateLiveReportAtom } from "./atoms/live-report-atoms.ts";
import {
  recordingPhaseAtom,
  hydrateSessionAtom,
} from "./atoms/recording-atoms.ts";
import {
  hydrateAuthStatusAtom,
  hydrateSpecsFromCacheAtom,
} from "./atoms/specs-atoms.ts";
import { hydrateActiveTabAtom } from "./atoms/tab-atoms.ts";
import { RecordingControls } from "./components/recording-controls.tsx";
import { RecordingDashboard } from "./components/recording-dashboard.tsx";
import { SettingsSection } from "./components/settings-section.tsx";
import { SpecSelector } from "./components/spec-selector.tsx";
import { UnsupportedTabBanner } from "./components/unsupported-tab-banner.tsx";
import type { BackgroundClient } from "./ports/background-client.ts";

export interface PopupAppProps {
  client: BackgroundClient;
}

export function PopupApp({ client }: PopupAppProps) {
  return (
    <Provider>
      <ClientInjector client={client} />
      <SessionBridge />
      <TabBridge />
      <AuthBridge />
      <SpecsBridge />
      <LiveReportBridge />
      <PhaseLayout />
    </Provider>
  );
}

/**
 * phase 기준 화면 분기.
 * - idle: 설정 + 2칼럼 선택 + 지원 탭 배너 + 녹화 시작 푸터.
 * - recording | recording_done: 대시보드 + 제어 푸터. 설정은 숨긴다.
 */
function PhaseLayout() {
  const phase = useAtomValue(recordingPhaseAtom);
  if (phase === "idle") {
    return (
      <>
        <SettingsSection />
        <SpecSelector />
        <UnsupportedTabBanner />
        <RecordingControls />
      </>
    );
  }
  return (
    <>
      <RecordingDashboard />
      <RecordingControls />
    </>
  );
}

/**
 * Provider의 첫 렌더 시 client 참조를 store에 반영한다. `useHydrateAtoms`를
 * 쓰지 않는 이유는 client 교체를 지원해야 하는 테스트 시나리오 때문이다.
 */
function ClientInjector({ client }: { client: BackgroundClient }) {
  const setClient = useSetAtom(backgroundClientAtom);
  useEffect(() => {
    setClient(client);
  }, [client, setClient]);
  return null;
}

/**
 * 팝업 마운트 시 현재 세션 스냅샷을 pull하고 변경 구독을 건다. unmount 시
 * unsubscribe를 호출해 폴링 타이머 누수를 막는다.
 *
 * 주의: `hydrate()`는 내부에서 `getSessionState` → `subscribeSession` 순으로
 * 비동기 진행하므로, 첫 tick이 resolve되기 전에 cleanup이 먼저 돌 수 있다.
 * 그 경우 `unsubscribe` 핸들이 미설정 상태로 영영 유실되므로(타이머만 계속 돎),
 * `cancelled` 플래그로 "resolve되면 즉시 해제"를 보장한다. StrictMode의
 * mount → 즉시 cleanup → mount 패턴에서 이 경로가 항상 활성화된다.
 */
function SessionBridge() {
  const hydrate = useSetAtom(hydrateSessionAtom);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void hydrate().then((fn) => {
      if (cancelled) fn();
      else unsubscribe = fn;
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [hydrate]);
  return null;
}

/**
 * 팝업 마운트 시 활성 탭 정보를 1회 pull한다. "지원 페이지" 배너와 녹화 시작
 * 가드가 모두 이 결과를 소비한다.
 */
function TabBridge() {
  const hydrate = useSetAtom(hydrateActiveTabAtom);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}

/**
 * 팝업 마운트 시 캐시된 OAuth 토큰 유무를 silent로 조회해 로그인 버튼 라벨을
 * 복구한다. Chrome 팝업은 OAuth 창이 뜰 때 닫혀 `idle`로 리셋되므로, 이
 * 복구 단계가 없으면 사용자는 이미 로그인된 상태에서도 "Google 로그인"만 본다.
 */
function AuthBridge() {
  const hydrate = useSetAtom(hydrateAuthStatusAtom);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}

/**
 * 팝업 마운트 시 `local:specsCache`에서 마지막 스펙 스냅샷을 복구한다. 시트 재요청
 * 없이 체크박스가 즉시 복원되므로 녹화 중 팝업을 껐다 켜도 대상 리스트가 유지된다.
 * 이 복원으로 `specsAtom`이 채워지는 덕분에 "리포트 생성" 가드도 `specsAtom.length > 0`
 * 하나로 결정 가능해진다(M8 어셈블러가 동일 캐시를 read-only로 읽는다).
 */
function SpecsBridge() {
  const hydrate = useSetAtom(hydrateSpecsFromCacheAtom);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}

/**
 * 녹화 중/종료 phase에서 라이브 검증 스냅샷을 500ms 주기로 pull한다. idle에서는
 * 타이머를 가동하지 않아 SW 왕복을 아낀다. phase 전환 시 effect가 재실행되며
 * 이전 타이머는 cleanup으로 해제된다.
 */
function LiveReportBridge() {
  const phase = useAtomValue(recordingPhaseAtom);
  const hydrate = useSetAtom(hydrateLiveReportAtom);
  useEffect(() => {
    if (phase === "idle") {
      // idle 진입 시 즉시 클리어. 녹화 종료 후 다시 idle로 돌아간 경우 스냅샷 잔상 제거.
      void hydrate();
      return;
    }
    void hydrate();
    const handle = setInterval(() => {
      void hydrate();
    }, 500);
    return () => clearInterval(handle);
  }, [phase, hydrate]);
  return null;
}
