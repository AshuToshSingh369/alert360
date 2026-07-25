"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createIncident,
  subscribeToIncidents,
  updateIncidentStatus,
  type IncidentRecord,
  type IncidentStatus,
} from "@/lib/incidentService";
import { getAccessState, summarizeIncidentStats } from "@/lib/adminHelpers";
import { createAlert, subscribeToAlerts, type AlertRecord } from "@/lib/alertService";
import { signOutUser, subscribeToAuthSession, type AuthSession } from "@/lib/authService";

const baseMetrics = [
  {
    title: "Total Incidents",
    detail: "Live Firestore count",
    tone: "text-[#1a1c1e]",
    icon: "assessment",
    accent: "bg-[#1a1c1e]",
  },
  {
    title: "Active Alerts",
    detail: "Open and acknowledged alerts",
    tone: "text-[#b51a1e]",
    icon: "cell_tower",
    accent: "bg-[#b51a1e]",
  },
  {
    title: "Incidents In Progress",
    detail: "Currently active cases",
    tone: "text-[#44474a]",
    icon: "timer",
    accent: "bg-[#75777a]",
  },
  {
    title: "Resolved Cases",
    detail: "Completed incidents",
    tone: "text-[#1a1c1e]",
    icon: "local_police",
    accent: "bg-[#1a1c1e]",
  },
];

const incidents = [
  {
    title: "Structure Fire - Commercial",
    time: "14:28",
    description: "402 W 8th St. Multiple units responding.",
    badge: "Critical",
    badgeClass: "bg-[#b51a1e] text-white",
    icon: "local_fire_department",
    iconClass: "bg-[#ffdad6] text-[#b51a1e]",
  },
  {
    title: "Vehicle Collision",
    time: "14:15",
    description: "I-95 Northbound, Mile 42. No injuries reported.",
    badge: "Elevated",
    badgeClass: "bg-[#d86100] text-white",
    icon: "car_crash",
    iconClass: "bg-[#ffdbca] text-[#d86100]",
  },
  {
    title: "Noise Complaint",
    time: "13:50",
    description: "1200 Block of Elm St.",
    badge: "Standard",
    badgeClass: "border border-[#75777a] text-[#44474a]",
    icon: "noise_aware",
    iconClass: "bg-[#e4e2df] text-[#44474a]",
  },
];

export default function Home() {
  const router = useRouter();
  const [clock, setClock] = useState("00:00:00 PST");
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("Connected to shared incident stream");
  const [authState, setAuthState] = useState<AuthSession>({ user: null, role: "guest", loading: true });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(`${now.toLocaleTimeString("en-US", { hour12: false })} PST`);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthSession((session) => {
      setAuthState(session);
      if (!session.user) {
        router.replace("/login");
      }
    });

    const unsubscribeIncidents = subscribeToIncidents((items) => {
      setIncidents(items);
      if (items.length) {
        setStatusMessage(`${items.length} active incident${items.length === 1 ? "" : "s"} synced`);
      }
    });

    const unsubscribeAlerts = subscribeToAlerts((items) => {
      setAlerts(items);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeIncidents();
      unsubscribeAlerts();
    };
  }, [router]);

  const summary = useMemo(() => summarizeIncidentStats(incidents), [incidents]);
  const access = useMemo(() => getAccessState(authState.role), [authState.role]);
  const metrics = useMemo(() => {
    const activeAlerts = alerts.filter((item) => item.status !== "resolved").length;
    return [
      {
        ...baseMetrics[0],
        value: incidents.length.toString(),
        detail: `${incidents.length} incidents in Firestore`,
      },
      {
        ...baseMetrics[1],
        value: activeAlerts.toString(),
        detail: `${activeAlerts} alerts currently active`,
      },
      {
        ...baseMetrics[2],
        value: summary.inProgress.toString(),
        detail: `${summary.inProgress} incidents in progress`,
      },
      {
        ...baseMetrics[3],
        value: summary.resolved.toString(),
        detail: `${summary.resolved} resolved cases`,
      },
    ];
  }, [alerts, incidents.length, summary.inProgress, summary.resolved]);

  const handleCreateDemoIncident = async () => {
    try {
      await Promise.all([
        createIncident({
          title: "Mobile report received",
          description: "A citizen submitted a new safety report from the app.",
          severity: "high",
          status: "pending",
          source: "mobile",
        }),
        createAlert({
          title: "New alert broadcast",
          description: "Dispatch has received a new incident alert from the phone app.",
          severity: "high",
          status: "open",
          source: "mobile",
        }),
      ]);
      setStatusMessage("Demo incident and alert created and synced to the backend");
    } catch (error) {
      setStatusMessage(`Failed to create incident: ${String(error)}`);
    }
  };

  const handleStatusChange = async (id: string, status: IncidentStatus) => {
    if (!access.canAccess) {
      setStatusMessage("Your account does not have admin privileges for incident changes.");
      return;
    }

    try {
      await updateIncidentStatus(id, status);
      setStatusMessage(`Incident marked as ${status}`);
    } catch (error) {
      setStatusMessage(`Status update failed: ${String(error)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setStatusMessage("Signed out successfully");
    } catch (error) {
      setStatusMessage(`Sign out failed: ${String(error)}`);
    }
  };

  if (authState.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf9f6] text-[#1a1c1e]">
        <div className="rounded border border-[#c5c6ca] bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#75777a]">Loading admin session</p>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-[#1b1c1a]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <nav className="flex w-full flex-col border-b border-[#c5c6ca] bg-[#fbf9f6] p-6 lg:w-64 lg:border-b-0 lg:border-r">
          <div className="mb-6 border-b border-[#c5c6ca] pb-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#1a1c1e] text-white">
                <span className="text-lg">🛡️</span>
              </div>
              <div>
                <h1 className="font-['Archivo_Narrow'] text-xl font-black uppercase tracking-tight text-[#1a1c1e]">
                  Civic Guard
                </h1>
                <p className="text-xs uppercase tracking-[0.2em] text-[#44474a]">
                  Admin Terminal
                </p>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded border-b-4 border-[#93000a] bg-[#b51a1e] px-4 py-3 text-sm font-semibold uppercase text-white transition-all hover:bg-[#d93633]">
              <span>🚨</span>
              New Incident
            </button>
          </div>

          <div className="flex-1 space-y-2">
            {[
              ["dashboard", "Agency Overview"],
              ["emergency", "Dispatch Center"],
              ["report_problem", "Incident Reports"],
              ["group", "User Database"],
              ["receipt_long", "System Logs"],
              ["settings_applications", "Settings"],
            ].map(([icon, label]) => (
              <a
                key={label}
                href="#"
                className={`flex items-center gap-3 rounded px-4 py-3 text-sm font-medium transition ${
                  label === "Agency Overview"
                    ? "border-l-4 border-[#b51a1e] bg-[#1a1c1e] text-white"
                    : "text-[#44474a] hover:bg-[#efeeeb]"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="mt-6 border-t border-[#c5c6ca] pt-4">
            <a href="#" className="flex items-center gap-3 rounded px-4 py-3 text-sm text-[#44474a] hover:bg-[#efeeeb]">
              <span>🆘</span>
              <span>Support</span>
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded px-4 py-3 text-left text-sm text-[#44474a] hover:bg-[#efeeeb]"
            >
              <span>↩️</span>
              <span>Log Out</span>
            </button>
          </div>
        </nav>

        <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.03),_transparent_40%)] p-4 lg:p-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#c5c6ca] pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#75777a]">Alert360 Admin</p>
              <h2 className="font-['Archivo_Narrow'] text-2xl font-bold uppercase tracking-tight text-[#1a1c1e]">
                Agency Overview
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded border border-[#c5c6ca] bg-white p-2 text-[#44474a]">🔔</button>
              <button className="rounded border border-[#c5c6ca] bg-white p-2 text-[#44474a]">👤</button>
              <button className="rounded border border-[#c5c6ca] bg-white p-2 text-[#44474a]">⚙️</button>
            </div>
          </header>

          <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded border border-[#c5c6ca] bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[#b51a1e] rec-indicator" />
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b51a1e]">
                Live Monitoring Active
              </span>
            </div>
            <div className="font-mono text-sm text-[#44474a]">SYS.TIME: {clock}</div>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded border border-[#c5c6ca] bg-white p-4 shadow-sm">
              <div className="mb-4 h-1 w-full bg-[#1a1c1e]" />
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#44474a]">Role Access</span>
                <span className="text-[#75777a]">🔐</span>
              </div>
              <div className="mb-2 font-['Archivo_Narrow'] text-3xl font-bold text-[#1a1c1e]">
                {access.canAccess ? "ADMIN" : "BLOCKED"}
              </div>
              <div className="text-sm text-[#44474a]">{access.canAccess ? `Signed in as ${authState.user.email ?? "admin user"}` : `Restricted for ${access.role}`}</div>
            </div>
            {metrics.map((metric) => (
              <div key={metric.title} className="rounded border border-[#c5c6ca] bg-white p-4 shadow-sm">
                <div className={`mb-4 h-1 w-full ${metric.accent}`} />
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#44474a]">
                    {metric.title}
                  </span>
                  <span className="text-[#75777a]">{metric.icon}</span>
                </div>
                <div className={`mb-2 font-['Archivo_Narrow'] text-3xl font-bold ${metric.tone}`}>
                  {metric.value}
                </div>
                <div className="text-sm text-[#44474a]">{metric.detail}</div>
              </div>
            ))}
          </section>

          <section className="mb-6 rounded border border-[#c5c6ca] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#75777a]">Backend status</p>
                <p className="text-sm text-[#1a1c1e]">{statusMessage}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {!access.canAccess ? (
                  <span className="rounded bg-[#ffdad6] px-3 py-1 text-sm text-[#b51a1e]">
                    Admin access required for live actions
                  </span>
                ) : (
                  <button
                    className="rounded bg-[#1a1c1e] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white"
                    onClick={handleCreateDemoIncident}
                  >
                    Send demo incident
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded bg-[#ffdad6] px-3 py-1 text-[#b51a1e]">Pending: {summary.pending}</span>
              <span className="rounded bg-[#ffdbca] px-3 py-1 text-[#d86100]">In progress: {summary.inProgress}</span>
              <span className="rounded bg-[#e4e2df] px-3 py-1 text-[#44474a]">Resolved: {summary.resolved}</span>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
            <div className="rounded border border-[#c5c6ca] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-[#c5c6ca] pb-3">
                <h3 className="font-['Archivo_Narrow'] text-xl font-bold uppercase tracking-tight text-[#1a1c1e]">
                  Recent Incidents
                </h3>
                <button className="text-sm uppercase tracking-[0.2em] text-[#44474a]">Filter</button>
              </div>
              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="rounded border border-dashed border-[#c5c6ca] p-4 text-sm text-[#44474a]">
                    No incidents yet. Send a demo incident to start the live backend flow.
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <div key={incident.id} className="rounded border border-[#e4e2df] p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-[#1a1c1e]">{incident.title}</h4>
                        <span className="text-sm text-[#75777a]">
                          {incident.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mb-3 text-sm text-[#44474a]">{incident.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-[#efeeeb] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#44474a]">
                          {incident.severity}
                        </span>
                        <span className="rounded bg-[#e4e2df] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#44474a]">
                          {incident.source}
                        </span>
                        <button
                          className="rounded border border-[#c5c6ca] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                          onClick={() => handleStatusChange(incident.id, "in-progress")}
                        >
                          Start
                        </button>
                        <button
                          className="rounded border border-[#c5c6ca] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                          onClick={() => handleStatusChange(incident.id, "resolved")}
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded border border-[#1a1c1e] bg-[#efeeeb] p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-[#1a1c1e] pb-3">
                <h3 className="font-['Archivo_Narrow'] text-xl font-bold uppercase tracking-tight text-[#1a1c1e]">
                  Tactical Unit Deployment
                </h3>
                <div className="flex gap-2">
                  <button className="rounded border border-[#c5c6ca] bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#44474a]">
                    Traffic
                  </button>
                  <button className="rounded bg-[#1a1c1e] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white">
                    Units
                  </button>
                </div>
              </div>
              <div className="hardware-grid relative min-h-[420px] overflow-hidden rounded border border-[#1a1c1e] bg-[#fbf9f6]">
                <div className="absolute inset-0 scanline" />
                <div className="absolute left-4 top-4 z-10 rounded border border-[#c5c6ca] bg-[#1a1c1e]/90 px-3 py-2 font-mono text-xs text-white">
                  GRID: 44.A7.X
                </div>
                <div className="absolute left-4 top-14 z-10 rounded border border-[#c5c6ca] bg-[#1a1c1e]/90 px-3 py-2 font-mono text-xs text-white">
                  ZOOM: 1.4x
                </div>
                <div className="absolute left-1/4 top-1/3 z-10 flex flex-col items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-white bg-[#b51a1e] rec-indicator" />
                  <div className="mt-1 rounded bg-[#1a1c1e]/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white">
                    Fire: 402 W 8th
                  </div>
                </div>
                <div className="absolute left-2/3 top-1/2 z-10 flex items-center gap-2">
                  <span className="text-2xl">🚓</span>
                  <div className="rounded bg-white/90 px-2 py-1 text-[10px] font-bold uppercase text-[#1a1c1e]">
                    U-4A
                  </div>
                </div>
                <div className="absolute bottom-1/4 right-1/4 z-10 flex items-center gap-2">
                  <span className="text-2xl">🚓</span>
                  <div className="rounded bg-white/90 px-2 py-1 text-[10px] font-bold uppercase text-[#1a1c1e]">
                    U-12B
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
