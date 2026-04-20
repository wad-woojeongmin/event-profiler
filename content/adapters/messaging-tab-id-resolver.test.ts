// messaging-tab-id-resolver 어댑터 테스트.
//
// `@webext-core/messaging`의 `sendMessage`는 vitest mock으로 대체해 background
// 구현을 포함하지 않고 "캐시 유무"만 검증한다. 실제 sender.tab.id 흐름은 M3
// background 통합 테스트에서 다룬다.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/messaging/extension-messaging.ts", () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from "@/messaging/extension-messaging.ts";

import {
  createMessagingTabIdResolver,
  UNKNOWN_TAB_ID,
} from "./messaging-tab-id-resolver.ts";

const sendMessageMock = sendMessage as unknown as ReturnType<typeof vi.fn>;

describe("createMessagingTabIdResolver", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
  });

  it("첫 get()이 background에 질의하고 이후는 캐시 반환", async () => {
    sendMessageMock.mockResolvedValueOnce(42);
    const resolver = createMessagingTabIdResolver();

    expect(await resolver.get()).toBe(42);
    expect(await resolver.get()).toBe(42);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith("getMyTabId", undefined);
  });

  it("동시 호출은 in-flight Promise를 공유", async () => {
    sendMessageMock.mockImplementationOnce(
      () => new Promise((r) => setTimeout(() => r(7), 0)),
    );
    const resolver = createMessagingTabIdResolver();

    const [a, b] = await Promise.all([resolver.get(), resolver.get()]);
    expect(a).toBe(7);
    expect(b).toBe(7);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  it("background 실패 시 UNKNOWN_TAB_ID 반환 + 다음 호출은 재시도", async () => {
    sendMessageMock.mockRejectedValueOnce(new Error("sw idle"));
    sendMessageMock.mockResolvedValueOnce(99);
    const resolver = createMessagingTabIdResolver();

    expect(await resolver.get()).toBe(UNKNOWN_TAB_ID);
    expect(await resolver.get()).toBe(99);
    expect(sendMessageMock).toHaveBeenCalledTimes(2);
  });
});
