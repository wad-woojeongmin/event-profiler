import { useMemo, useState } from "react";
import type { EventSpec } from "@/types/spec.ts";

interface Props {
  specs: EventSpec[];
  selected: Set<string>;
  disabled: boolean;
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/** 스펙 체크리스트. 검색 필터와 전체 선택/해제 포함. */
export function EventChecklist({
  specs,
  selected,
  disabled,
  onToggle,
  onSelectAll,
  onClear,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return specs;
    const q = query.toLowerCase();
    return specs.filter(
      (s) =>
        s.amplitudeEventName.toLowerCase().includes(q) ||
        s.humanEventName.toLowerCase().includes(q) ||
        s.pageName.toLowerCase().includes(q),
    );
  }, [specs, query]);

  return (
    <section className="popup-section">
      <div className="row space-between">
        <h2>검증 대상</h2>
        <span className="selection-counter">
          {selected.size} / {specs.length} 선택
        </span>
      </div>

      <input
        className="event-search"
        type="text"
        placeholder="이벤트명 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled || specs.length === 0}
      />

      <div className="event-list">
        {filtered.length === 0 ? (
          <div className="event-empty">
            {specs.length === 0 ? "스펙을 먼저 불러오세요" : "검색 결과 없음"}
          </div>
        ) : (
          filtered.map((s) => {
            const checked = selected.has(s.amplitudeEventName);
            return (
              <label key={s.amplitudeEventName} className="event-row">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(s.amplitudeEventName)}
                />
                <span className="event-row-content">
                  <span className="event-row-name">{s.amplitudeEventName}</span>
                  <span className="event-row-meta">
                    {s.pageName}
                    {s.sectionName ? ` · ${s.sectionName}` : ""}
                    {s.actionName ? ` · ${s.actionName}` : ""}
                    {" · "}
                    {s.eventType}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      <div className="row" style={{ gap: 6 }}>
        <button
          className="ghost"
          type="button"
          onClick={onSelectAll}
          disabled={disabled || specs.length === 0}
        >
          전체 선택
        </button>
        <button
          className="ghost"
          type="button"
          onClick={onClear}
          disabled={disabled || selected.size === 0}
        >
          전체 해제
        </button>
      </div>
    </section>
  );
}
