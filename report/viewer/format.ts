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

/**
 * 리포트 헤더의 서브 라인용 포맷. 디자인 원본은 `YYYY.MM.DD · HH:MM:SS`로
 * mono-font tabular-nums와 잘 맞는 시각 형태라, ko-KR locale 대신 고정 포맷을 쓴다.
 */
export function formatGeneratedAt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}` +
    ` · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * 녹화 길이를 `M:SS` 형태로 표기(디자인 헤더 "4:52"). `formatDuration`은 본문용
 * "0분 0초"이므로 시각 용도에 따라 분리해서 유지한다.
 */
export function formatClockDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

/**
 * 타임라인 눈금 라벨. 0s, 30s, 1m, 1m30s 같이 자리수를 아낀 표기.
 */
export function formatTimelineTick(sec: number): string {
  if (sec === 0) return "0s";
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return r ? `${m}m${r}s` : `${m}m`;
  }
  return `${sec}s`;
}

/**
 * 녹화 중 이벤트 발생 시각 오프셋(초). 둘째 자리는 버리고 정수 초로 둔다.
 */
export function offsetSec(timestamp: number, startedAt: number): number {
  return Math.max(0, Math.round((timestamp - startedAt) / 1000));
}

/**
 * captured URL 리스트에서 host를 1개 추출. 복수 host면 가장 많이 나온 것. 실패 시 `undefined`.
 */
export function primaryHost(urls: readonly string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const u of urls) {
    try {
      const h = new URL(u).host;
      if (!h) continue;
      counts.set(h, (counts.get(h) ?? 0) + 1);
    } catch {
      // URL 파싱 실패는 조용히 무시 — 집계에서 빠진다.
    }
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [h, n] of counts) {
    if (n > bestN) {
      best = h;
      bestN = n;
    }
  }
  return best;
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
