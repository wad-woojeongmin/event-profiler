import { describe, expect, it } from "vitest";

import { CATCHTABLE_MATCH_PATTERN, isSupportedUrl } from "./host-match.ts";

describe("CATCHTABLE_MATCH_PATTERN", () => {
  it("is the Chrome MV3 match pattern literal", () => {
    // manifest 직접 참조 값이므로 변경 시 popup·content 양쪽 영향 재검토 필요.
    expect(CATCHTABLE_MATCH_PATTERN).toBe("https://*.catchtable.co.kr/*");
  });
});

describe("isSupportedUrl", () => {
  it("accepts the apex domain over https", () => {
    expect(isSupportedUrl("https://catchtable.co.kr/")).toBe(true);
    expect(isSupportedUrl("https://catchtable.co.kr/foo/bar")).toBe(true);
  });

  it("accepts single and nested subdomains", () => {
    expect(isSupportedUrl("https://app.catchtable.co.kr/")).toBe(true);
    expect(isSupportedUrl("https://a.b.catchtable.co.kr/")).toBe(true);
  });

  it("accepts ports for local dev hosts", () => {
    expect(isSupportedUrl("https://local.catchtable.co.kr:3001/")).toBe(true);
    expect(isSupportedUrl("https://local.catchtable.co.kr:3001/orders")).toBe(
      true,
    );
  });

  it("rejects non-https schemes", () => {
    expect(isSupportedUrl("http://catchtable.co.kr/")).toBe(false);
    expect(isSupportedUrl("chrome://newtab/")).toBe(false);
    expect(isSupportedUrl("about:blank")).toBe(false);
  });

  it("rejects suffix-injection spoofs", () => {
    // `catchtable.co.kr`이 **호스트의 끝**이 아니어야 한다.
    expect(isSupportedUrl("https://catchtable.co.kr.evil.com/")).toBe(false);
    expect(isSupportedUrl("https://evil.com/catchtable.co.kr/")).toBe(false);
  });

  it("rejects unrelated hosts", () => {
    expect(isSupportedUrl("https://example.com/")).toBe(false);
    expect(isSupportedUrl("https://catchtable.com/")).toBe(false);
  });

  it("treats undefined url as unsupported", () => {
    // Chrome은 호스트 권한이 없는 탭의 `tab.url`을 undefined로 준다.
    expect(isSupportedUrl(undefined)).toBe(false);
  });

  it("is case-insensitive on host", () => {
    expect(isSupportedUrl("https://Catchtable.CO.KR/")).toBe(true);
  });
});
