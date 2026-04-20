import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 데모 전용 Vite 설정. WXT와 독립적으로 실행되며, 실제 확장 동작은
// fake 상태로 시뮬레이션한다.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@": __dirname + "/..",
    },
  },
  server: {
    port: 5174,
    open: true,
  },
});
