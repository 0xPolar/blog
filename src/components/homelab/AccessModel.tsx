import { useState } from "react";

type AccessId = "docker" | "lan" | "private" | "public";

type AccessLevel = {
  id: AccessId;
  label: string;
  audience: string;
  path: string[];
  example: string;
  breaks: string;
  lesson: string;
};

const levels: AccessLevel[] = [
  {
    id: "docker",
    label: "Docker-only",
    audience: "Only containers on the same internal network.",
    path: ["service", "docker network", "container"],
    example: "A database or helper service that should never be reachable from the LAN.",
    breaks: "The app is healthy, but it is attached to the wrong Docker network.",
    lesson: "Internal service names are only useful inside the network that can resolve them.",
  },
  {
    id: "lan",
    label: "LAN-only",
    audience: "Devices inside the home network.",
    path: ["laptop", "Pi-hole DNS", "reverse proxy", "service"],
    example: "A dashboard or media app that only needs to work at home.",
    breaks: "DNS resolves, but the reverse proxy points at the wrong upstream port.",
    lesson: "Local access still needs a clear request path.",
  },
  {
    id: "private",
    label: "Private remote",
    audience: "My devices connected through Tailscale.",
    path: ["phone", "Tailscale", "home network", "service"],
    example: "Admin tools I want while away from home, but not on the public internet.",
    breaks: "The VPN is connected, but the service is bound only to localhost.",
    lesson: "Private access is still network access; bind addresses and routes matter.",
  },
  {
    id: "public",
    label: "Public",
    audience: "Anyone with the public URL.",
    path: ["browser", "Cloudflare Tunnel", "reverse proxy", "service"],
    example: "A service that should be reachable without joining my private network.",
    breaks: "The tunnel is healthy while the upstream service behind it is dead.",
    lesson: "A healthy edge does not prove the origin is healthy.",
  },
];

export default function AccessModel() {
  const [selectedId, setSelectedId] = useState<AccessId>("lan");
  const selected = levels.find((level) => level.id === selectedId) ?? levels[0];

  return (
    <section className="access-model" aria-label="Homelab service access model">
      <div className="access-header">
        <h3>Service access model</h3>
        <p>Each service gets a boundary before it gets a URL.</p>
      </div>

      <div className="access-tabs" role="tablist" aria-label="Access levels">
        {levels.map((level) => (
          <button
            key={level.id}
            aria-selected={level.id === selectedId}
            className={level.id === selectedId ? "access-tab access-tab--active" : "access-tab"}
            onClick={() => setSelectedId(level.id)}
            role="tab"
            type="button"
          >
            {level.label}
          </button>
        ))}
      </div>

      <div className="access-panel">
        <div className="access-route" aria-label={`${selected.label} request path`}>
          {selected.path.map((hop, index) => (
            <div className="access-hop-group" key={`${selected.id}-${hop}`}>
              <div className="access-hop">
                <span className="access-hop-index">{index + 1}</span>
                <span>{hop}</span>
              </div>
              {index < selected.path.length - 1 && <span className="access-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>

        <div className="access-details">
          <InfoBlock label="Who can reach it" value={selected.audience} />
          <InfoBlock label="Example" value={selected.example} />
          <InfoBlock label="Common failure" value={selected.breaks} />
          <InfoBlock label="Backend lesson" value={selected.lesson} />
        </div>
      </div>

      <style>{`
        .access-model {
          font-family: var(--font-sans);
          color: var(--primary);
          margin: 2rem 0;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--entry);
        }

        .access-header {
          margin-bottom: 14px;
        }

        .access-header h3 {
          margin: 0 0 4px;
          font-size: 18px;
          line-height: 1.3;
        }

        .access-header p {
          margin: 0;
          color: var(--secondary);
          font-size: 14px;
          line-height: 1.4;
        }

        .access-tabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }

        .access-tab {
          min-height: 38px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--theme);
          color: var(--secondary);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
          padding: 0 10px;
        }

        .access-tab:hover,
        .access-tab--active {
          border-color: var(--primary);
          color: var(--primary);
        }

        .access-tab--active {
          background: color-mix(in srgb, var(--primary) 8%, var(--theme));
        }

        .access-panel {
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--theme);
          padding: 14px;
        }

        .access-route {
          display: flex;
          align-items: stretch;
          gap: 8px;
          margin-bottom: 14px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .access-hop-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: fit-content;
        }

        .access-hop {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--entry);
          padding: 0 10px;
          white-space: nowrap;
        }

        .access-hop-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: var(--primary);
          color: var(--theme);
          font-size: 12px;
          font-weight: 700;
          flex: 0 0 auto;
        }

        .access-arrow {
          color: var(--secondary);
          font-size: 18px;
          line-height: 1;
        }

        .access-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          border-top: 1px solid var(--border);
          padding-top: 14px;
        }

        .access-info {
          min-width: 0;
        }

        .access-info span {
          display: block;
          color: var(--secondary);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .access-info p {
          margin: 4px 0 0;
          color: var(--content);
          font-size: 14px;
          line-height: 1.45;
        }

        @media (max-width: 720px) {
          .access-model {
            padding: 14px;
          }

          .access-tabs,
          .access-details {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 460px) {
          .access-tabs,
          .access-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="access-info">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
