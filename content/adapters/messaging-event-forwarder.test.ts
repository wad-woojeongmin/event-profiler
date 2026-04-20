// messaging-event-forwarder 어댑터 테스트.
//
// 수용 기준: sendMessage 실패 시 재시도 없이 drop(상위로 throw 금지).
// 실제 protocol 통합은 M3 background 테스트와 수동 QA에서 담당.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/messaging/extension-messaging.ts", () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from "@/messaging/extension-messaging.ts";

import { createMessagingEventForwarder } from "./messaging-event-forwarder.ts";

const sendMessageMock = sendMessage as unknown as ReturnType<typeof vi.fn>;

function payload() {
  return {
    provider: "amplitude" as const,
    eventName: "click__banner",
    params: { a: 1 },
    timestamp: 1_700_000_000_000,
    pageUrl: "https://example.catchtable.co.kr/home",
    pageTitle: "catchtable",
    tabId: 7,
  };
}

describe("createMessagingEventForwarder", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
  });

  it("sendMessage로 captureEvent를 원형 그대로 전달", async () => {
    sendMessageMock.mockResolvedValueOnce(undefined);
    const forwarder = createMessagingEventForwarder();

    await forwarder.forward(payload());
    expect(sendMessageMock).toHaveBeenCalledWith("captureEvent", payload());
  });

  it("sendMessage 실패는 조용히 삼킨다(재시도 없음)", async () => {
    sendMessageMock.mockRejectedValueOnce(new Error("sw idle"));
    const forwarder = createMessagingEventForwarder();

    await expect(forwarder.forward(payload())).resolves.toBeUndefined();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });
});
