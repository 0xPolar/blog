import { useState, useEffect, useRef } from "react";

/**
 * FanOutComparison
 *
 * Side-by-side comparison of fan-out-on-read vs fan-out-on-write.
 * User clicks "Post tweet" — left side shows the read-time query work,
 * right side shows the write-time fan-out work.
 *
 * Drop into MDX:
 *   import FanOutComparison from "../components/FanOutComparison";
 *   <FanOutComparison client:visible />
 */

type Phase = "idle" | "posting" | "fanout" | "reading" | "done";

const FOLLOWERS = 6;

export default function FanOutComparison() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [readQueryActive, setReadQueryActive] = useState(false);
  const [writeFanoutActive, setWriteFanoutActive] = useState<number[]>([]);
  const [readVisible, setReadVisible] = useState(false);
  const [writeVisible, setWriteVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const reset = () => {
    clearTimers();
    setPhase("idle");
    setReadQueryActive(false);
    setWriteFanoutActive([]);
    setReadVisible(false);
    setWriteVisible(false);
  };

  const run = () => {
    reset();
    setPhase("posting");

    // Write side: fan out to each follower, staggered
    timersRef.current.push(
      setTimeout(() => {
        setPhase("fanout");
        for (let i = 0; i < FOLLOWERS; i++) {
          timersRef.current.push(
            setTimeout(() => {
              setWriteFanoutActive((prev) => [...prev, i]);
            }, i * 180),
          );
        }
        timersRef.current.push(
          setTimeout(
            () => {
              setWriteVisible(true);
            },
            FOLLOWERS * 180 + 200,
          ),
        );
      }, 400),
    );

    // Read side: tweet sits in the table; query fires when a follower opens the app
    timersRef.current.push(
      setTimeout(() => {
        setPhase("reading");
        setReadQueryActive(true);
        timersRef.current.push(
          setTimeout(() => {
            setReadVisible(true);
            setPhase("done");
          }, 900),
        );
      }, 1800),
    );
  };

  return (
    <div className="fanout-comparison">
      <div className="fanout-controls">
        <button
          onClick={run}
          disabled={phase !== "idle" && phase !== "done"}
          className="fanout-button"
        >
          {phase === "idle" ? "Post a tweet" : phase === "done" ? "Run again" : "Running…"}
        </button>
        {phase !== "idle" && (
          <button onClick={reset} className="fanout-button fanout-button--ghost">
            Reset
          </button>
        )}
      </div>

      <div className="fanout-grid">
        {/* LEFT: fan-out-on-read */}
        <section className="fanout-panel">
          <header className="fanout-panel-header">
            <h3>Fanout on read</h3>
            <p>Cheap writes, expensive reads</p>
          </header>

          <div className="fanout-stage">
            <Node
              label="Author"
              sublabel="posts tweet"
              active={phase !== "idle"}
              x={20}
              y={20}
            />
            <Arrow from={{ x: 80, y: 50 }} to={{ x: 130, y: 90 }} active={phase !== "idle"} />
            <Box
              label="tweets table"
              sublabel="single insert"
              x={100}
              y={80}
              w={140}
              filled={phase !== "idle"}
            />

            {/* Read side */}
            <Node
              label="Follower"
              sublabel="opens feed"
              active={phase === "reading" || phase === "done"}
              x={20}
              y={170}
            />
            <Arrow
              from={{ x: 80, y: 200 }}
              to={{ x: 130, y: 200 }}
              active={readQueryActive}
              long
            />
            <QueryBlock active={readQueryActive} x={130} y={170} />

            {readVisible && <ResultBadge x={250} y={185} text="1 tweet, 1 expensive query" />}
          </div>

          <ul className="fanout-notes">
            <li>One row written, period.</li>
            <li>
              Every read scans <code>follows</code> + <code>tweets</code> for that user.
            </li>
            <li>Cost grows with follow count.</li>
          </ul>
        </section>

        {/* RIGHT: fan-out-on-write */}
        <section className="fanout-panel">
          <header className="fanout-panel-header">
            <h3>Fanout on write</h3>
            <p>Expensive writes, cheap reads</p>
          </header>

          <div className="fanout-stage">
            <Node
              label="Author"
              sublabel="posts tweet"
              active={phase !== "idle"}
              x={20}
              y={20}
            />
            <Arrow from={{ x: 80, y: 50 }} to={{ x: 130, y: 70 }} active={phase !== "idle"} />
            <Box
              label="Worker"
              sublabel="reads followers"
              x={100}
              y={60}
              w={120}
              filled={phase === "fanout" || phase === "reading" || phase === "done"}
            />

            {/* Followers stack */}
            <div className="fanout-followers">
              {Array.from({ length: FOLLOWERS }).map((_, i) => (
                <Follower
                  key={i}
                  index={i}
                  active={writeFanoutActive.includes(i)}
                />
              ))}
            </div>

            {writeVisible && (
              <ResultBadge
                x={20}
                y={260}
                text={`${FOLLOWERS} writes, then every read is a Redis lookup`}
              />
            )}
          </div>

          <ul className="fanout-notes">
            <li>One write per follower, up front.</li>
            <li>
              Reads are pre-computed — Redis lookup, no <code>JOIN</code>.
            </li>
            <li>Cost grows with follower count, paid once.</li>
          </ul>
        </section>
      </div>

      <style>{`
        .fanout-comparison {
          font-family: var(--font-sans);
          color: var(--primary);
          margin: 2rem 0;
          --fanout-node-on: var(--primary);
          --fanout-node-off: var(--tertiary);
          --fanout-box-bg: var(--theme);
          --fanout-box-on-bg: rgba(217, 119, 6, 0.15);
          --fanout-query-on-bg: rgba(220, 38, 38, 0.12);
          --fanout-query-on-text: #b91c1c;
          --fanout-follower-on-bg: rgba(217, 119, 6, 0.15);
          --fanout-follower-on-border: rgba(217, 119, 6, 0.45);
          --fanout-badge-bg: rgba(22, 163, 74, 0.15);
          --fanout-badge-border: rgba(22, 163, 74, 0.45);
          --fanout-badge-text: var(--primary);
        }
        :root[data-theme="dark"] .fanout-comparison {
          --fanout-box-on-bg: rgba(251, 191, 36, 0.18);
          --fanout-query-on-bg: rgba(248, 113, 113, 0.15);
          --fanout-query-on-text: #fca5a5;
          --fanout-follower-on-bg: rgba(251, 191, 36, 0.18);
          --fanout-follower-on-border: rgba(251, 191, 36, 0.45);
          --fanout-badge-bg: rgba(74, 222, 128, 0.15);
          --fanout-badge-border: rgba(74, 222, 128, 0.45);
        }
        .fanout-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .fanout-button {
          font-family: inherit;
          font-size: 0.875rem;
          padding: 0.5rem 0.875rem;
          border: 1px solid var(--border);
          background: var(--entry);
          color: var(--primary);
          border-radius: var(--radius);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .fanout-button:hover:not(:disabled) {
          border-color: var(--secondary);
        }
        .fanout-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .fanout-button--ghost {
          background: transparent;
        }
        .fanout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        .fanout-panel {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          background: var(--entry);
        }
        .fanout-panel-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 0.125rem;
          color: var(--primary);
        }
        .fanout-panel-header p {
          font-size: 0.8rem;
          color: var(--secondary);
          margin: 0 0 0.875rem;
        }
        .fanout-stage {
          position: relative;
          height: 320px;
          margin-bottom: 0.75rem;
        }
        .fanout-followers {
          position: absolute;
          right: 8px;
          top: 50px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fanout-notes {
          font-size: 0.8rem;
          color: var(--secondary);
          margin: 0;
          padding-left: 1.1rem;
          line-height: 1.6;
        }
        .fanout-notes code {
          font-size: 0.78rem;
          background: var(--code-bg);
          color: var(--primary);
          padding: 1px 4px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

/* --- subcomponents --- */

function Node({
  label,
  sublabel,
  active,
  x,
  y,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  x: number;
  y: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 70,
        textAlign: "center",
        fontSize: 11,
        opacity: active ? 1 : 0.4,
        transition: "opacity 0.3s",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: active ? "var(--fanout-node-on)" : "var(--fanout-node-off)",
          margin: "0 auto 4px",
          transition: "background 0.3s",
        }}
      />
      <div style={{ fontWeight: 500, color: "var(--primary)" }}>{label}</div>
      <div style={{ color: "var(--secondary)", fontSize: 10 }}>{sublabel}</div>
    </div>
  );
}

function Box({
  label,
  sublabel,
  x,
  y,
  w,
  filled,
}: {
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  filled: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: "8px 10px",
        border: "1px solid var(--border)",
        borderRadius: 4,
        background: filled ? "var(--fanout-box-on-bg)" : "transparent",
        color: "var(--primary)",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        transition: "background 0.4s",
      }}
    >
      <div style={{ fontWeight: 500 }}>{label}</div>
      {sublabel && (
        <div style={{ color: "var(--secondary)", fontSize: 10, marginTop: 2 }}>{sublabel}</div>
      )}
    </div>
  );
}

function Arrow({
  from,
  to,
  active,
  long,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
  long?: boolean;
}) {
  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={active ? "var(--fanout-node-on)" : "var(--fanout-node-off)"}
        strokeWidth={active && long ? 2 : 1}
        strokeDasharray={active && long ? "0" : "3 3"}
        markerEnd="url(#fanout-arrow-end)"
        style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
      />
      <defs>
        <marker
          id="fanout-arrow-end"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M2 1 L8 5 L2 9"
            fill="none"
            stroke={active ? "var(--fanout-node-on)" : "var(--fanout-node-off)"}
          />
        </marker>
      </defs>
    </svg>
  );
}

function QueryBlock({ active, x, y }: { active: boolean; x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 200,
        padding: 8,
        border: "1px solid var(--border)",
        borderRadius: 4,
        background: active ? "var(--fanout-query-on-bg)" : "transparent",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        lineHeight: 1.4,
        transition: "background 0.4s",
      }}
    >
      <div style={{ color: active ? "var(--fanout-query-on-text)" : "var(--secondary)" }}>SELECT * FROM tweets</div>
      <div style={{ color: active ? "var(--fanout-query-on-text)" : "var(--secondary)" }}>WHERE author_id IN (...)</div>
      <div style={{ color: active ? "var(--fanout-query-on-text)" : "var(--secondary)" }}>ORDER BY created_at DESC</div>
    </div>
  );
}

function Follower({ index, active }: { index: number; active: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        opacity: active ? 1 : 0.4,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: active ? "var(--fanout-node-on)" : "var(--fanout-node-off)",
          transition: "background 0.2s",
        }}
      />
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: active ? "var(--primary)" : "var(--secondary)",
          padding: "2px 6px",
          background: active ? "var(--fanout-follower-on-bg)" : "transparent",
          border: "1px solid",
          borderColor: active ? "var(--fanout-follower-on-border)" : "var(--border)",
          borderRadius: 3,
          transition: "all 0.2s",
        }}
      >
        feed:{index}
      </div>
    </div>
  );
}

function ResultBadge({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: 11,
        color: "var(--fanout-badge-text)",
        background: "var(--fanout-badge-bg)",
        border: "1px solid var(--fanout-badge-border)",
        padding: "4px 8px",
        borderRadius: 4,
        animation: "fanout-fade-in 0.3s ease",
      }}
    >
      {text}
      <style>{`
        @keyframes fanout-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
