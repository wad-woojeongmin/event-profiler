// `@webext-core/messaging` 공용 인스턴스로 background에 전달하는 EventForwarder.
//
// 실패(SW idle, port closed 등)는 모두 console.debug로 흡수 — 재시도·큐잉
// 없이 drop(수용 기준). Content Script에서 재시도 로직을 넣으면 SW 재시작
// 타이밍과 경합해 중복 발송 위험.

import { sendMessage } from "@/messaging/extension-messaging.ts";

import type { EventForwarder } from "../ports/event-forwarder.ts";

export function createMessagingEventForwarder(): EventForwarder {
  return {
    async forward(event) {
      try {
        await sendMessage("captureEvent", event);
      } catch (error) {
        // 콘솔 오염 방지를 위해 debug 레벨로만 남긴다.
        console.debug("[event-profiler] captureEvent forward failed", error);
      }
    },
  };
}
