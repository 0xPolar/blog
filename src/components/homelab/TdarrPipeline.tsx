import { useEffect, useRef, useState } from "react";

type StageId = "media" | "scan" | "queue" | "gpu" | "storage" | "library";

type Stage = {
  id: StageId;
  label: string;
  detail: string;
  failure: string;
  lesson: string;
};

const stages: Stage[] = [
  {
    id: "media",
    label: "Media folder",
    detail: "A new file lands on shared storage.",
    failure: "The path exists, but the container user cannot read the file.",
    lesson: "Storage is part of the application contract.",
  },
  {
    id: "scan",
    label: "Tdarr scan",
    detail: "Tdarr detects the file and decides whether it needs work.",
    failure: "The scanner sees stale metadata or misses a mounted directory.",
    lesson: "Background systems need reliable discovery, not just a cron job.",
  },
  {
    id: "queue",
    label: "Job queue",
    detail: "A transcode job is created for an available worker.",
    failure: "Jobs pile up while the worker looks healthy from the outside.",
    lesson: "A running process is not the same as a healthy pipeline.",
  },
  {
    id: "gpu",
    label: "GPU worker",
    detail: "The worker uses hardware encoding to transcode the file.",
    failure: "The GPU works on the host but is not visible inside the worker.",
    lesson: "Debug capabilities from inside the runtime that actually does the work.",
  },
  {
    id: "storage",
    label: "Output storage",
    detail: "The transcoded file is written back to the media volume.",
    failure: "The output write fails because ownership or permissions drifted.",
    lesson: "Successful reads do not prove writes are configured correctly.",
  },
  {
    id: "library",
    label: "Library update",
    detail: "The media app sees the new version and serves it to clients.",
    failure: "The job succeeded, but the library still points at old state.",
    lesson: "Work is not done until downstream consumers see the result.",
  },
];

export default function TdarrPipeline() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedId, setSelectedId] = useState<StageId>("gpu");
  const [isRunning, setIsRunning] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedStage = stages.find((stage) => stage.id === selectedId) ?? stages[0];

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const reset = () => {
    clearTimers();
    setActiveIndex(-1);
    setIsRunning(false);
  };

  const run = () => {
    reset();
    setIsRunning(true);

    stages.forEach((stage, index) => {
      timersRef.current.push(
        setTimeout(() => {
          setActiveIndex(index);
          setSelectedId(stage.id);
        }, index * 520),
      );
    });

    timersRef.current.push(
      setTimeout(() => {
        setIsRunning(false);
      }, stages.length * 520 + 150),
    );
  };

  useEffect(() => () => clearTimers(), []);

  return (
    <section className="tdarr-pipeline" aria-label="Tdarr background worker pipeline">
      <div className="tdarr-toolbar">
        <div>
          <h3>Background worker pipeline</h3>
          <p>Click a stage to see where the job can fail.</p>
        </div>
        <div className="tdarr-actions">
          <button onClick={run} disabled={isRunning} type="button">
            {activeIndex === -1 ? "Run transcode job" : isRunning ? "Running..." : "Run again"}
          </button>
          {activeIndex !== -1 && (
            <button className="tdarr-ghost" onClick={reset} type="button">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="tdarr-track" aria-hidden="true">
        <div
          className="tdarr-track-fill"
          style={{
            width:
              activeIndex < 0
                ? "0%"
                : `${Math.min(100, (activeIndex / (stages.length - 1)) * 100)}%`,
          }}
        />
      </div>

      <div className="tdarr-stages">
        {stages.map((stage, index) => {
          const isActive = index <= activeIndex;
          const isSelected = stage.id === selectedId;

          return (
            <button
              key={stage.id}
              className={[
                "tdarr-stage",
                isActive ? "tdarr-stage--active" : "",
                isSelected ? "tdarr-stage--selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedId(stage.id)}
              type="button"
            >
              <span className="tdarr-stage-index">{index + 1}</span>
              <span className="tdarr-stage-label">{stage.label}</span>
              <span className="tdarr-stage-detail">{stage.detail}</span>
            </button>
          );
        })}
      </div>

      <div className="tdarr-inspector">
        <div>
          <span className="tdarr-kicker">Failure mode</span>
          <p>{selectedStage.failure}</p>
        </div>
        <div>
          <span className="tdarr-kicker">Backend lesson</span>
          <p>{selectedStage.lesson}</p>
        </div>
      </div>

      <style>{`
        .tdarr-pipeline {
          font-family: var(--font-sans);
          color: var(--primary);
          margin: 2rem 0;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--entry);
        }

        .tdarr-toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .tdarr-toolbar h3 {
          margin: 0 0 4px;
          font-size: 18px;
          line-height: 1.3;
        }

        .tdarr-toolbar p {
          margin: 0;
          color: var(--secondary);
          font-size: 14px;
          line-height: 1.4;
        }

        .tdarr-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .tdarr-actions button {
          border: 1px solid var(--primary);
          border-radius: 6px;
          background: var(--primary);
          color: var(--theme);
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          line-height: 1;
          min-height: 36px;
          padding: 0 12px;
          white-space: nowrap;
        }

        .tdarr-actions button:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .tdarr-actions .tdarr-ghost {
          background: transparent;
          color: var(--primary);
        }

        .tdarr-track {
          position: relative;
          height: 4px;
          margin: 0 8px 14px;
          border-radius: 999px;
          background: var(--tertiary);
          overflow: hidden;
        }

        .tdarr-track-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--primary);
          transition: width 260ms ease;
        }

        .tdarr-stages {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .tdarr-stage {
          min-height: 128px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--theme);
          color: var(--primary);
          cursor: pointer;
          font: inherit;
          padding: 12px;
          text-align: left;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .tdarr-stage:hover,
        .tdarr-stage--selected {
          border-color: var(--primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .tdarr-stage--active {
          background: color-mix(in srgb, var(--primary) 8%, var(--theme));
        }

        .tdarr-stage-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          margin-bottom: 10px;
          border-radius: 999px;
          background: var(--code-bg);
          color: var(--secondary);
          font-size: 13px;
          font-weight: 700;
        }

        .tdarr-stage--active .tdarr-stage-index,
        .tdarr-stage--selected .tdarr-stage-index {
          background: var(--primary);
          color: var(--theme);
        }

        .tdarr-stage-label,
        .tdarr-stage-detail {
          display: block;
        }

        .tdarr-stage-label {
          margin-bottom: 6px;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.25;
        }

        .tdarr-stage-detail {
          color: var(--secondary);
          font-size: 13px;
          line-height: 1.35;
        }

        .tdarr-inspector {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }

        .tdarr-inspector p {
          margin: 4px 0 0;
          color: var(--content);
          font-size: 14px;
          line-height: 1.5;
        }

        .tdarr-kicker {
          display: block;
          color: var(--secondary);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        @media (max-width: 720px) {
          .tdarr-pipeline {
            padding: 14px;
          }

          .tdarr-toolbar {
            display: block;
          }

          .tdarr-actions {
            justify-content: flex-start;
            margin-top: 12px;
          }

          .tdarr-stages,
          .tdarr-inspector {
            grid-template-columns: 1fr;
          }

          .tdarr-stage {
            min-height: 112px;
          }
        }
      `}</style>
    </section>
  );
}
