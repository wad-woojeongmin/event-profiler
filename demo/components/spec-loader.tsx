interface Props {
  sheetUrl: string;
  specsLoaded: number;
  loading: boolean;
  onChange: (url: string) => void;
  onLoad: () => void;
  onPrefill: () => void;
}

/** 시트 URL 입력과 스펙 불러오기 버튼. */
export function SpecLoader({
  sheetUrl,
  specsLoaded,
  loading,
  onChange,
  onLoad,
  onPrefill,
}: Props) {
  return (
    <section className="popup-section">
      <h2>스펙 시트</h2>
      <input
        type="url"
        placeholder="https://docs.google.com/spreadsheets/d/..."
        value={sheetUrl}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="row space-between">
        <div className="helper">
          {specsLoaded > 0
            ? `${specsLoaded}개 스펙 로드됨`
            : "시트 URL을 입력하고 불러오세요"}
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button
            className="ghost"
            type="button"
            onClick={onPrefill}
            disabled={loading}
          >
            데모 URL 채우기
          </button>
          <button
            className="primary"
            type="button"
            onClick={onLoad}
            disabled={!sheetUrl || loading}
          >
            {loading ? "불러오는 중…" : "스펙 불러오기"}
          </button>
        </div>
      </div>
    </section>
  );
}
