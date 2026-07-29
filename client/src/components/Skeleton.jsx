import "./Skeleton.css";

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`skeleton-wrapper ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{ width: index === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-header">
        <div className="skeleton-avatar" />
        <div className="skeleton-wrapper" style={{ flex: 1 }}>
          <div className="skeleton-line" style={{ width: "40%", height: "16px" }} />
          <div className="skeleton-line" style={{ width: "70%", height: "12px" }} />
        </div>
      </div>
      <div className="skeleton-line" style={{ width: "90%", height: "14px", marginTop: "1rem" }} />
      <div className="skeleton-line" style={{ width: "80%", height: "14px" }} />
      <div className="skeleton-footer">
        <div className="skeleton-pill" />
        <div className="skeleton-button" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={`skeleton-table-wrap ${className}`}>
      <table className="responsive-table skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="skeleton-line" style={{ width: "70%", height: "14px" }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: columns }).map((_, cIdx) => (
                <td key={cIdx}>
                  <div
                    className="skeleton-line"
                    style={{ width: cIdx === 0 ? "40%" : "80%", height: "14px" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat-card">
      <div className="skeleton-avatar" style={{ width: "36px", height: "36px" }} />
      <div className="skeleton-line" style={{ width: "50%", height: "12px", marginTop: "0.75rem" }} />
      <div className="skeleton-line" style={{ width: "70%", height: "24px" }} />
    </div>
  );
}

export default SkeletonCard;
