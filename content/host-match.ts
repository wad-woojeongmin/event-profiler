// M2 content script가 주입되는 호스트의 **단일 소스 오브 트루스**.
//
// `entrypoints/content.ts`의 `matches`와 popup 쪽 "지원 페이지 판정"이 서로
// 다른 문자열 형식(Chrome match pattern vs. JS RegExp)을 쓰기 때문에 한
// 리터럴을 그대로 공유할 수 없다. 대신 둘 다 이 파일의 심볼을 참조하여
// 드리프트(manifest는 추가됐는데 popup regex는 갱신 안 되는 종류의 버그)를
// 구조적으로 차단한다.
//
// 스테이징/QA 호스트가 추가되면 `CATCHTABLE_MATCH_PATTERN`을 배열로 확장하고
// `SUPPORTED_HOST_RE`를 대응 갱신한다(두 심볼은 항상 함께 갱신).

/** Chrome MV3 매니페스트에 선언하는 match pattern. */
export const CATCHTABLE_MATCH_PATTERN = "https://*.catchtable.co.kr/*" as const;

// 위 match pattern의 JS 표현. 의도적으로 엄격하게 작성:
// - `^https:` 로 http/ftp 등 배제
// - `([^/]+\.)?` 로 루트 + 임의 깊이 서브도메인 허용 (Chrome `*.`와 동등)
// - `(:\d+)?` 로 로컬 개발 서버(`local.catchtable.co.kr:3001` 등)의 포트 허용.
//   Chrome match pattern은 포트를 명시하지 않으면 모든 포트를 매칭하므로
//   manifest 패턴과 동등하게 맞추기 위한 보정.
// - 마지막 `\/` 로 `catchtable.co.kr.evil.com` 같은 suffix-injection 차단
const SUPPORTED_HOST_RE = /^https:\/\/([^/]+\.)?catchtable\.co\.kr(:\d+)?\//i;

/**
 * 주어진 URL이 content script 주입 대상인지 판정.
 *
 * Chrome `browser.tabs`는 호스트 권한이 없는 탭의 `url`을 `undefined`로
 * 주기 때문에 "url 없음"은 보수적으로 **지원 안 됨**으로 취급한다.
 */
export function isSupportedUrl(url: string | undefined): boolean {
  return url !== undefined && SUPPORTED_HOST_RE.test(url);
}
