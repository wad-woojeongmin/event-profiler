// @vitest-environment jsdom

// window-bridge-receiver 어댑터 테스트.
//
// `MessageEvent` 생성자는 origin을 setter로 지정할 수 없어, 어댑터를 초기화할 때
// expectedOrigin을 주입 가능하게 설계했다. 테스트는 jsdom의 기본 origin을
// expected로 맞춰 "일치" 경로를 검증하고, 불일치 시엔 expected를 바꿔 drop을 확인.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BridgeMessage } from "@/types/messages.ts";

import type { ContentScriptContext } from "wxt/utils/content-script-context";

import { createWindowBridgeReceiver } from "./window-bridge-receiver.ts";

function createFakeCtx(): {
  ctx: ContentScriptContext;
  teardown: () => void;
  isValid: boolean;
} {
  // 테스트에서는 실제 ContentScriptContext를 만들 필요 없이 addEventListener
  // 포워딩만 검증하면 충분하다. `ctx.addEventListener`는 target.addEventListener로
  // 위임하기만 한다(WXT 런타임은 여기에 무효화 정리 로직을 추가).
  const removers: Array<() => void> = [];
  const ctx = {
    isValid: true,
    addEventListener(target: EventTarget, type: string, handler: EventListener) {
      target.addEventListener(type, handler);
      removers.push(() => target.removeEventListener(type, handler));
    },
  } as unknown as ContentScriptContext;
  return {
    ctx,
    teardown: () => removers.forEach((fn) => fn()),
    get isValid() {
      return removers.length > 0;
    },
  };
}

function validData(): BridgeMessage {
  return {
    source: "catchtable-event-profiler",
    version: 1,
    payload: {
      provider: "amplitude",
      eventName: "click__hero",
      params: { a: 1 },
      timestamp: 1_700_000_000_000,
    },
  };
}

describe("createWindowBridgeReceiver", () => {
  const ORIGIN = "http://localhost:3000";
  let fake: ReturnType<typeof createFakeCtx>;

  beforeEach(() => {
    fake = createFakeCtx();
  });

  afterEach(() => {
    fake.teardown();
  });

  it("origin과 source가 맞는 메시지만 handler로 전달", () => {
    const handler = vi.fn<(m: BridgeMessage) => void>();
    const receiver = createWindowBridgeReceiver(() => ORIGIN);
    receiver.subscribe(fake.ctx, handler);

    // jsdom의 MessageEvent origin은 기본 ''이므로 명시적으로 주입.
    window.dispatchEvent(
      new MessageEvent("message", { data: validData(), origin: ORIGIN }),
    );
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0]!.payload.eventName).toBe("click__hero");
  });

  it("origin 불일치 메시지는 무시", () => {
    const handler = vi.fn<(m: BridgeMessage) => void>();
    const receiver = createWindowBridgeReceiver(() => ORIGIN);
    receiver.subscribe(fake.ctx, handler);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: validData(),
        origin: "https://evil.example.com",
      }),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("source 필드가 다른 메시지는 무시", () => {
    const handler = vi.fn<(m: BridgeMessage) => void>();
    const receiver = createWindowBridgeReceiver(() => ORIGIN);
    receiver.subscribe(fake.ctx, handler);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { ...validData(), source: "other-library" },
        origin: ORIGIN,
      }),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("수동 unsubscribe 시 이후 메시지 미전달", () => {
    const handler = vi.fn<(m: BridgeMessage) => void>();
    const receiver = createWindowBridgeReceiver(() => ORIGIN);
    const unsubscribe = receiver.subscribe(fake.ctx, handler);

    unsubscribe();
    window.dispatchEvent(
      new MessageEvent("message", { data: validData(), origin: ORIGIN }),
    );
    expect(handler).not.toHaveBeenCalled();
  });
});
