import { useState, useMemo } from "react";

/**
 * CelebrityScaling
 *
 * Interactive slider showing how fan-out-on-write cost explodes with
 * follower count. Drag to set followers; visualises writes triggered
 * per tweet, latency estimate, and where the hybrid threshold should sit.
 *
 * Drop into MDX:
 *   import CelebrityScaling from "../components/CelebrityScaling";
 *   <CelebrityScaling client:visible />
 */

const MIN_LOG = 0; // 10^0 = 1
const MAX_LOG = 7; // 10^7 = 10M
const HYBRID_THRESHOLD = 10_000;

export default function CelebrityScaling() {
  const [logFollowers, setLogFollowers] = useState(2.7); // ~500

  const followers = Math.round(Math.pow(10, logFollowers));
  const writes = followers; // one per follower in pure fan-out-on-write
  const latencyMs = Math.round(followers * 0.15 + 5); // rough fudge: ~0.15ms per write + base
  const isCelebrity = followers >= HYBRID_THRESHOLD;

  const tier = useMemo(() => {
    if (followers < 100)
      return { label: "Hobbyist", note: "Fanout is cheap and obvious." };
    if (followers < 1_000)
      return {
        label: "Active user",
        note: "Still fine. Writes finish in milliseconds.",
      };
    if (followers < HYBRID_THRESHOLD)
      return {
        label: "Power user",
        note: "Writes are getting noticeable. Worker fleet earns its keep.",
      };
    if (followers < 100_000)
      return {
        label: "Mini-celebrity",
        note: "Beyond the hybrid threshold — writes should use fanout on read instead.",
      };
    if (followers < 1_000_000)
      return {
        label: "Celebrity",
        note: "A single tweet would write to hundreds of thousands of feeds. Don't.",
      };
    return {
      label: "Justin Bieber",
      note: "10M+ writes from one tweet. This is the failure mode the hybrid model exists to prevent.",
    };
  }, [followers]);

  // Visual: bar that maxes out around HYBRID_THRESHOLD on a log scale
  const barFill = Math.min(100, (logFollowers / MAX_LOG) * 100);
  const thresholdPct = (Math.log10(HYBRID_THRESHOLD) / MAX_LOG) * 100;

  return (
    <div className="celeb">
      <div className="celeb-readout">
        <div className="celeb-readout-main">
          <span className="celeb-followers">{formatNumber(followers)}</span>
          <span className="celeb-followers-label">followers</span>
        </div>
        <div className={`celeb-tier ${isCelebrity ? "celeb-tier--warn" : ""}`}>
          {tier.label}
        </div>
      </div>

      <input
        type="range"
        min={MIN_LOG}
        max={MAX_LOG}
        step={0.01}
        value={logFollowers}
        onChange={(e) => setLogFollowers(parseFloat(e.target.value))}
        className="celeb-slider"
        aria-label="Follower count"
      />

      <div className="celeb-bar-container">
        <div className="celeb-bar-track">
          <div
            className={`celeb-bar-fill ${isCelebrity ? "celeb-bar-fill--warn" : ""}`}
            style={{ width: `${barFill}%` }}
          />
          <div
            className="celeb-bar-threshold"
            style={{ left: `${thresholdPct}%` }}
            title="Hybrid threshold"
          >
            <span className="celeb-bar-threshold-label">hybrid threshold</span>
          </div>
        </div>
        <div className="celeb-bar-axis">
          <span>1</span>
          <span>100</span>
          <span>10k</span>
          <span>1M</span>
          <span>10M</span>
        </div>
      </div>

      <div className="celeb-stats">
        <Stat
          label="writes per tweet"
          value={formatNumber(writes)}
          note={writes === 1 ? "one row, one insert" : "one per follower"}
          warn={isCelebrity}
        />
        <Stat
          label="estimated fanout"
          value={`${formatLatency(latencyMs)}`}
          note={
            latencyMs < 50
              ? "fast"
              : latencyMs < 1000
                ? "noticeable"
                : "user-visible delay"
          }
          warn={latencyMs >= 1000}
        />
        <Stat
          label="strategy"
          value={isCelebrity ? "fanout on read" : "fanout on write"}
          note={
            isCelebrity ? "merge in at read time" : "push to follower feeds"
          }
          warn={isCelebrity}
        />
      </div>

      <div className="celeb-note">{tier.note}</div>

      <style>{`
        .celeb {
          font-family: var(--font-sans);
          color: var(--primary);
          margin: 2rem 0;
          padding: 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--entry);
          --celeb-warn-accent: #d97706;
          --celeb-warn-text: #92400e;
          --celeb-warn-bg: rgba(217, 119, 6, 0.12);
          --celeb-warn-border: rgba(217, 119, 6, 0.45);
        }
        :root[data-theme="dark"] .celeb {
          --celeb-warn-accent: #fbbf24;
          --celeb-warn-text: #fbbf24;
          --celeb-warn-bg: rgba(251, 191, 36, 0.14);
          --celeb-warn-border: rgba(251, 191, 36, 0.45);
        }
        .celeb-readout {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.75rem;
        }
        .celeb-readout-main { display: flex; align-items: baseline; gap: 0.5rem; }
        .celeb-followers {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: var(--primary);
        }
        .celeb-followers-label {
          font-size: 0.85rem;
          color: var(--secondary);
        }
        .celeb-tier {
          font-size: 0.8rem;
          padding: 0.2rem 0.55rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--secondary);
          background: var(--theme);
        }
        .celeb-tier--warn {
          color: var(--celeb-warn-text);
          background: var(--celeb-warn-bg);
          border-color: var(--celeb-warn-border);
        }
        .celeb-slider {
          width: 100%;
          margin: 0 0 0.5rem;
          accent-color: var(--primary);
        }
        .celeb-bar-container { margin-bottom: 1rem; }
        .celeb-bar-track {
          position: relative;
          height: 8px;
          background: var(--tertiary);
          border-radius: 4px;
          overflow: visible;
        }
        .celeb-bar-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
          transition: width 0.1s, background 0.2s;
        }
        .celeb-bar-fill--warn {
          background: var(--celeb-warn-accent);
        }
        .celeb-bar-threshold {
          position: absolute;
          top: -4px;
          width: 1px;
          height: 16px;
          background: var(--secondary);
        }
        .celeb-bar-threshold-label {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--secondary);
          white-space: nowrap;
        }
        .celeb-bar-axis {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--secondary);
          margin-top: 0.4rem;
        }
        .celeb-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .celeb-stat {
          padding: 0.6rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--theme);
          transition: all 0.2s;
        }
        .celeb-stat--warn {
          border-color: var(--celeb-warn-border);
          background: var(--celeb-warn-bg);
        }
        .celeb-stat-label {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .celeb-stat-value {
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          margin-bottom: 0.15rem;
          color: var(--primary);
        }
        .celeb-stat-note {
          font-size: 0.75rem;
          color: var(--secondary);
        }
        .celeb-note {
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--content);
          padding: 0.6rem 0.75rem;
          background: var(--theme);
          border-left: 3px solid var(--tertiary);
          border-radius: 0 4px 4px 0;
        }

        @media (max-width: 520px) {
          .celeb-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  warn,
}: {
  label: string;
  value: string;
  note: string;
  warn?: boolean;
}) {
  return (
    <div className={`celeb-stat ${warn ? "celeb-stat--warn" : ""}`}>
      <div className="celeb-stat-label">{label}</div>
      <div className="celeb-stat-value">{value}</div>
      <div className="celeb-stat-note">{note}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}
