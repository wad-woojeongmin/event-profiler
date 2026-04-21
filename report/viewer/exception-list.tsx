// 예외 이벤트(선택한 스펙에 없지만 수집된 이벤트) 카드. 토글 버튼으로 접기/펼치기.
//
// 접근성: `<button>`에 `aria-expanded` + `aria-controls`로 토글 상태를 노출한다.
// 상세 리스트는 `role="region"` + `aria-labelledby`로 토글과 묶는다.

import { useId, useState } from "react";

import type { CapturedEvent } from "@/types/event.ts";

import { formatClock } from "./format.ts";
import * as styles from "./exception-list.css.ts";

interface Props {
  events: CapturedEvent[];
  /** 초기 펼침 여부. 디자인 원본은 열림. */
  defaultOpen?: boolean;
}

export function ExceptionList({ events, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const titleId = useId();
  const regionId = useId();

  return (
    <section className={styles.wrap} aria-labelledby={titleId}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronIcon
          className={`${styles.chevron} ${open ? styles.chevronOpen : styles.chevronClosed}`}
        />
        <span className={styles.title} id={titleId}>
          예외 이벤트
        </span>
        <span className={styles.count}>{events.length}건</span>
        <span className={styles.spacer} />
        <span className={styles.hint}>선택 스펙에 없지만 수집된 이벤트</span>
      </button>
      {open && (
        <div
          id={regionId}
          role="region"
          aria-labelledby={titleId}
          className={styles.body}
        >
          {events.map((c) => (
            <div key={c.id} className={styles.item}>
              <span className={styles.itemTime}>{formatClock(c.timestamp)}</span>
              <span className={styles.itemName} title={c.eventName}>
                {c.eventName}
              </span>
              <span className={styles.itemPage}>{hostOf(c.pageUrl)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

function ChevronIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
