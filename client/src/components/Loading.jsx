function Loading({ label = "Loading" }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" />
      <p>{label}...</p>
    </div>
  );
}

export default Loading;