// WXT 설정 — manifest 정적 값과 Vite 플러그인 조립을 담당한다.
//
// 동적 요소(background / action.default_popup / content_scripts)는 WXT가
// `entrypoints/` 스캔으로 주입하므로 이 파일에서 재선언하지 않는다(04-wxt-rules.md).
//
// ⚠️ OAuth `client_id`와 `key`(공개 키)는 배포 환경별 자격증명이다. 로컬·CI
// 개별 환경에서는 `WXT_OAUTH_CLIENT_ID`·`WXT_EXTENSION_PUBLIC_KEY` 환경변수로 주입한다.
//
// manifest는 반드시 함수 형태로 선언한다. WXT는 config 파일이 로드된 *이후에*
// `.env`를 주입하므로, object 리터럴로 두면 env 값이 `undefined`가 된다.
// 참고: wxt-docs/guide/essentials/config/environment-variables.md:62-82

import { defineConfig } from "wxt";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: () => {
    const OAUTH_CLIENT_ID = import.meta.env.WXT_OAUTH_CLIENT_ID;
    const EXTENSION_PUBLIC_KEY = import.meta.env.WXT_EXTENSION_PUBLIC_KEY;

    return {
      name: "Event Validator",
      version: "0.1.0",
      description:
        "Catch Table 이벤트 스펙과 실제 수집 로그를 비교해 누락·오수집을 검출합니다.",
      permissions: ["activeTab", "tabs", "storage", "identity", "scripting"],
      host_permissions: ["https://*.catchtable.co.kr/*"],
      ...(EXTENSION_PUBLIC_KEY ? { key: EXTENSION_PUBLIC_KEY } : {}),
      ...(OAUTH_CLIENT_ID
        ? {
            oauth2: {
              client_id: OAUTH_CLIENT_ID,
              scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
            },
          }
        : {}),
    };
  },
  vite: () => ({
    plugins: [vanillaExtractPlugin()],
  }),
});
