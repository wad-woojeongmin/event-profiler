import { SPEC_SHEET_URL } from "@/sheets/constants.ts";

interface Props {
  specsLoaded: number;
  loading: boolean;
  onLoad: () => void;
}

/** 고정 시트에서 스펙을 불러오는 버튼. URL 입력은 받지 않는다. */
export function SpecLoader({ specsLoaded, loading, onLoad }: Props) {
  return (
    <section className="popup-section">
      <h2>스펙 시트</h2>
      <div className="sheet-link">
        <a href={SPEC_SHEET_URL} target="_blank" rel="noreferrer">
          Event Spec 시트 열기 ↗
        </a>
      </div>
      <div className="row space-between">
        <div className="helper">
          {specsLoaded > 0
            ? `${specsLoaded}개 스펙 로드됨`
            : "버튼을 눌러 최신 스펙을 불러옵니다"}
        </div>
        <button
          className="primary"
          type="button"
          onClick={onLoad}
          disabled={loading}
        >
          {loading ? "불러오는 중…" : "스펙 불러오기"}
        </button>
      </div>
    </section>
  );
}
