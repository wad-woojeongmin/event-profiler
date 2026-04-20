// Popup 최상위 composition.
//
// 엔트리포인트는 이 컴포넌트를 Jotai Provider로 감싸고 실구현 어댑터를 주입한다.
// 테스트는 같은 컴포넌트를 쓰되 in-memory fake 클라이언트를 주입한다.

import { Provider, useSetAtom } from "jotai";
import { useEffect } from "react";

import "./styles/reset.css.ts";

import { backgroundClientAtom } from "./atoms/client-atom.ts";
import { hydrateSessionAtom } from "./atoms/recording-atoms.ts";
import { RecordingControls } from "./components/recording-controls.tsx";
import { SettingsSection } from "./components/settings-section.tsx";
import { SpecList } from "./components/spec-list.tsx";
import type { BackgroundClient } from "./ports/background-client.ts";

export interface PopupAppProps {
  client: BackgroundClient;
}

export function PopupApp({ client }: PopupAppProps) {
  return (
    <Provider>
      <ClientInjector client={client} />
      <SessionBridge />
      <SettingsSection />
      <SpecList />
      <RecordingControls />
    </Provider>
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
 */
function SessionBridge() {
  const hydrate = useSetAtom(hydrateSessionAtom);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void hydrate().then((fn) => {
      unsubscribe = fn;
    });
    return () => {
      unsubscribe?.();
    };
  }, [hydrate]);
  return null;
}
