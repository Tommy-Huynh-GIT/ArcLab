export type SavedMetric = {
  id: string;
  name: string;
  label?: string | null;
  score: number;
  value: number;
  feedback: string;
  drill: string;
};

export type SavedKeyFrame = {
  id: string;
  label: string;
  timestampMs: number;
};

export type SavedSessionReport = {
  id: string;
  title: string;
  createdAt?: string | Date;
  report: {
    id: string;
    overallScore: number;
    rank: string;
    summary: string;
    metrics: SavedMetric[];
    keyFrames: SavedKeyFrame[];
  } | null;
};

type Props = {
  session: SavedSessionReport;
};

function formatTimestamp(timestampMs: number) {
  return `${Number((timestampMs / 1000).toFixed(2))}s`;
}

export function ReportSummary({ session }: Props) {
  const report = session.report;

  if (!report) {
    return null;
  }

  return (
    <section className="panel report-summary" aria-labelledby="report-heading">
      <div className="report-hero">
        <div>
          <p className="eyebrow">Saved report</p>
          <h2 id="report-heading">{session.title}</h2>
          <p className="report-summary-copy">{report.summary}</p>
        </div>

        <div className="report-score-card" aria-label="Overall score">
          <span>Rank</span>
          <strong>{report.rank}</strong>
          <small>{report.overallScore}</small>
        </div>
      </div>

      <div className="metric-grid" aria-label="Coaching metrics">
        {report.metrics.map((metric) => (
          <article className="metric-card" key={metric.id}>
            <div className="metric-card-heading">
              <h3>{metric.label || metric.name}</h3>
              <strong>{metric.score}</strong>
            </div>
            <p>{metric.feedback}</p>
            <div className="metric-drill">
              <span>Drill</span>
              <p>{metric.drill}</p>
            </div>
          </article>
        ))}
      </div>

      {report.keyFrames.length > 0 ? (
        <div className="keyframe-list" aria-label="Keyframe timestamps">
          {report.keyFrames.map((keyFrame) => (
            <span key={keyFrame.id}>
              {keyFrame.label} at {formatTimestamp(keyFrame.timestampMs)}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
