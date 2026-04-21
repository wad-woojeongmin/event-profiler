// 뷰어 공용 포매터.
//
// 리포트 화면 여러 섹션에서 같은 포맷을 쓰므로 한 곳에 모은다.
// demo 레이아웃에서 쓰던 로직을 그대로 옮겨 UX 일관성을 유지한다.

import type { ValidationResult } from "@/types/validation.ts";

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}분 ${ss}초`;
}

export function statusLabel(status: ValidationResult["status"]): string {
  switch (status) {
    case "pass":
      return "✓ Pass";
    case "fail":
      return "✗ Fail";
    case "not_collected":
      return "○ 미수집";
    case "suspect_duplicate":
      return "⚠ 중복 의심";
  }
}
