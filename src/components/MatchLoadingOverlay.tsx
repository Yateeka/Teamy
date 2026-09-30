export default function MatchLoadingOverlay() {
  return (
    <div className="loading-veil" role="status" aria-live="polite" aria-label="Loading match tracking data">
      <div className="loading-card">
        <div className="loader-orbit"><span className="loader-ball"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12"/><path d="m16 9 5 3.6-1.9 5.8h-6.2L11 12.6z"/><path d="m16 9-.2-5M11 12.6 6.2 11m6.7 7.8-3.2 4.9m9.4-4.9 3.2 4.9m-1.3-11.1 4.8-2"/></svg></span><i/></div>
        <span className="loading-kicker">MATCHFLOW · MATCH DATA</span>
        <strong>Getting the pitch ready</strong>
        <span className="loading-caption">Loading player and ball movement</span>
        <div className="loading-track"><i/></div>
      </div>
    </div>
  );
}
