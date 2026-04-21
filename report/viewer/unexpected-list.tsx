// 타겟 스펙에 없지만 녹화 중 수집된 이벤트 목록. 스펙 누락 또는 불필요 이벤트
// 점검용. 상세 params 표시까지는 필요 없다고 보고 이름·시각·URL만 노출.

import type { CapturedEvent } from "@/types/event.ts";

import { formatClock } from "./format.ts";
import * as styles from "./unexpected-list.css.ts";

interface Props {
  events: CapturedEvent[];
}

export function UnexpectedList({ events }: Props) {
  return (
    <>
      <p className={styles.note}>
        선택한 스펙 목록에 없지만 녹화 중 수집된 이벤트입니다. 스펙 누락이거나
        불필요한 이벤트일 수 있습니다.
      </p>
      <ul className={styles.list}>
        {events.map((c) => (
          <li key={c.id} className={styles.item}>
            <code className={styles.name}>{c.eventName}</code>
            <span className={styles.time}>@ {formatClock(c.timestamp)}</span>
            <span className={styles.url}>{c.pageUrl}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
