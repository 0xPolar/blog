import { useState, useEffect, useRef } from "react";

/**
 * ArchitectureFlow
 *
 * Animated diagram of the tweet fan-out architecture.
 * User clicks "Send tweet" — a packet animates through the system
 * (Tweet Service → RabbitMQ → Worker → User Service via gRPC →
 *  per-follower queues → Feed Service → Redis).
 *
 * Drop into MDX:
 *   import ArchitectureFlow from "../components/ArchitectureFlow";
 *   <ArchitectureFlow client:visible />
 */

type Stage =
  | "idle"
  | "tweet-service"
  | "rabbitmq-1"
  | "worker"
  | "grpc"
  | "user-service"
  | "rabbitmq-2"
  | "feed-service"
  | "redis"
  | "done";

const STAGE_DURATIONS: Record<Stage, number> = {
  idle: 0,
  "tweet-service": 600,
  "rabbitmq-1": 600,
  worker: 600,
  grpc: 700,
  "user-service": 600,
  "rabbitmq-2": 700,
  "feed-service": 600,
  redis: 700,
  done: 0,
};

const SEQUENCE: Stage[] = [
  "tweet-service",
  "rabbitmq-1",
  "worker",
  "grpc",
  "user-service",
  "rabbitmq-2",
  "feed-service",
  "redis",
  "done",
];

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  idle: "Click \"Send tweet\" to trace a request through the system.",
  "tweet-service": "Tweet Service receives POST, persists tweet to Postgres.",
  "rabbitmq-1": "Publishes tweet.created event to RabbitMQ.",
  worker: "Tweet Worker (Go) consumes the event.",
  grpc: "Worker calls User Service over gRPC for follower list.",
  "user-service": "User Service returns follower IDs.",
  "rabbitmq-2": "Worker pushes tweet ID into each follower's feed queue.",
  "feed-service": "Feed Service consumes per-follower events.",
  redis: "Tweet ID written to follower's feed list in Redis.",
  done: "Done. Followers can now read their feed in a single Redis lookup.",
};

export default function ArchitectureFlow() {
  const [stage, setStage] = useState<Stage>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const reset = () => {
    clearTimers();
    setStage("idle");
  };

  const run = () => {
    reset();
    let cumulative = 0;
    for (const next of SEQUENCE) {
      timersRef.current.push(
        setTimeout(() => setStage(next), cumulative + 200),
      );
      cumulative += STAGE_DURATIONS[next];
    }
  };

  const stageReached = (target: Stage): boolean => {
    if (stage === "idle") return false;
    return SEQUENCE.indexOf(stage) >= SEQUENCE.indexOf(target);
  };

  const stageActive = (target: Stage): boolean => stage === target;

  return (
    <div className="archflow">
      <div className="archflow-controls">
        <button
          onClick={run}
          disabled={stage !== "idle" && stage !== "done"}
          className="archflow-button"
        >
          {stage === "idle" ? "Send tweet" : stage === "done" ? "Run again" : "Running…"}
        </button>
        {stage !== "idle" && (
          <button onClick={reset} className="archflow-button archflow-button--ghost">
            Reset
          </button>
        )}
      </div>

      <div className="archflow-diagram">
        <svg viewBox="0 0 700 360" width="100%" style={{ display: "block" }}>
          <defs>
            <marker
              id="archflow-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M2 1 L8 5 L2 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </marker>
          </defs>

          {/* Connectors */}
          <Connector
            d="M 130 80 L 200 80"
            active={stageReached("rabbitmq-1")}
            label="publish"
          />
          <Connector
            d="M 320 80 L 390 80"
            active={stageReached("worker")}
            label="consume"
          />
          <Connector
            d="M 510 80 L 580 80"
            active={stageReached("grpc")}
            label="gRPC"
          />
          <Connector
            d="M 580 110 L 510 110"
            active={stageReached("user-service")}
            dashed
            label="followers[]"
            reverse
          />
          <Connector
            d="M 450 130 L 450 200"
            active={stageReached("rabbitmq-2")}
            label="fanout"
            vertical
          />
          <Connector
            d="M 390 220 L 320 220"
            active={stageReached("feed-service")}
            label="consume"
          />
          <Connector
            d="M 200 220 L 130 220"
            active={stageReached("redis")}
            label="LPUSH"
          />

          {/* Boxes */}
          <Box
            x={20}
            y={60}
            w={110}
            h={40}
            label="Tweet Service"
            sub="FastAPI"
            active={stageActive("tweet-service")}
            reached={stageReached("tweet-service")}
          />
          <Box
            x={200}
            y={60}
            w={120}
            h={40}
            label="RabbitMQ"
            sub="tweet.created"
            active={stageActive("rabbitmq-1")}
            reached={stageReached("rabbitmq-1")}
          />
          <Box
            x={390}
            y={60}
            w={120}
            h={40}
            label="Tweet Worker"
            sub="Go"
            active={stageActive("worker") || stageActive("grpc") || stageActive("rabbitmq-2")}
            reached={stageReached("worker")}
          />
          <Box
            x={580}
            y={60}
            w={100}
            h={70}
            label="User Service"
            sub="follower lookup"
            active={stageActive("user-service") || stageActive("grpc")}
            reached={stageReached("user-service")}
          />

          {/* Per-follower queues lane */}
          <Box
            x={390}
            y={200}
            w={120}
            h={40}
            label="Per-follower queues"
            sub="RabbitMQ"
            active={stageActive("rabbitmq-2")}
            reached={stageReached("rabbitmq-2")}
            small
          />
          <Box
            x={200}
            y={200}
            w={120}
            h={40}
            label="Feed Service"
            sub="FastAPI"
            active={stageActive("feed-service")}
            reached={stageReached("feed-service")}
          />
          <Box
            x={20}
            y={200}
            w={110}
            h={40}
            label="Redis"
            sub="feed:{user_id}"
            active={stageActive("redis")}
            reached={stageReached("redis")}
          />
        </svg>
      </div>

      <div className="archflow-status">
        <div className="archflow-status-step">
          {stage !== "idle" && stage !== "done"
            ? `Step ${SEQUENCE.indexOf(stage) + 1} of ${SEQUENCE.length - 1}`
            : stage === "done"
              ? "Complete"
              : "Ready"}
        </div>
        <div className="archflow-status-text">{STAGE_DESCRIPTIONS[stage]}</div>
      </div>

      <style>{`
        .archflow {
          font-family: var(--font-sans);
          color: var(--primary);
          margin: 2rem 0;
          --archflow-stroke-active: var(--primary);
          --archflow-stroke-reached: var(--secondary);
          --archflow-stroke-idle: var(--tertiary);
          --archflow-fill-active: rgba(217, 119, 6, 0.15);
          --archflow-fill-reached: var(--code-bg);
          --archflow-fill-idle: transparent;
          --archflow-text-on: var(--primary);
          --archflow-text-off: var(--secondary);
        }
        :root[data-theme="dark"] .archflow {
          --archflow-fill-active: rgba(251, 191, 36, 0.18);
        }
        .archflow-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .archflow-button {
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
        .archflow-button:hover:not(:disabled) {
          border-color: var(--secondary);
        }
        .archflow-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .archflow-button--ghost { background: transparent; }
        .archflow-diagram {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--entry);
          padding: 1rem;
          margin-bottom: 0.75rem;
        }
        .archflow-status {
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .archflow-status-step {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .archflow-status-text {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}

function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  active,
  reached,
  small,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  active: boolean;
  reached: boolean;
  small?: boolean;
}) {
  const stroke = active
    ? "var(--archflow-stroke-active)"
    : reached
      ? "var(--archflow-stroke-reached)"
      : "var(--archflow-stroke-idle)";
  const fill = active
    ? "var(--archflow-fill-active)"
    : reached
      ? "var(--archflow-fill-reached)"
      : "var(--archflow-fill-idle)";
  const textColor = reached || active
    ? "var(--archflow-text-on)"
    : "var(--archflow-text-off)";

  return (
    <g style={{ transition: "all 0.3s" }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 1.5 : 1}
        style={{ transition: "all 0.3s" }}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2 + 4}
        textAnchor="middle"
        fontSize={small ? 11 : 12}
        fontWeight={500}
        fill={textColor}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 10}
          textAnchor="middle"
          fontSize={10}
          fill={textColor}
          opacity={0.7}
          fontFamily="ui-monospace, monospace"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Connector({
  d,
  active,
  label,
  dashed,
  vertical,
  reverse,
}: {
  d: string;
  active: boolean;
  label?: string;
  dashed?: boolean;
  vertical?: boolean;
  reverse?: boolean;
}) {
  const color = active
    ? "var(--archflow-stroke-active)"
    : "var(--archflow-stroke-idle)";

  // Extract midpoint from path for label placement
  const match = d.match(/M\s+([\d.]+)\s+([\d.]+)\s+L\s+([\d.]+)\s+([\d.]+)/);
  let labelX = 0,
    labelY = 0;
  if (match) {
    const [, x1, y1, x2, y2] = match.map(Number);
    labelX = (x1 + x2) / 2;
    labelY = (y1 + y2) / 2;
  }

  return (
    <g style={{ color, transition: "color 0.3s" }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "4 3" : undefined}
        markerEnd="url(#archflow-arrow)"
        style={{ transition: "stroke 0.3s" }}
      />
      {label && (
        <text
          x={labelX}
          y={vertical ? labelY : labelY - 6}
          textAnchor="middle"
          fontSize={10}
          fill={active ? "var(--archflow-text-on)" : "var(--archflow-text-off)"}
          fontFamily="ui-monospace, monospace"
          style={{ transition: "fill 0.3s" }}
          dx={vertical ? 6 : 0}
          textRendering="geometricPrecision"
        >
          {label}
        </text>
      )}
    </g>
  );
}
