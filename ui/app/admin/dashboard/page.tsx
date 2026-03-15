"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSystemStats, getEmailStats, type SystemStats, type EmailStats } from "@/app/actions/admin";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Clock,
  Server,
  RefreshCw,
  Mail,
  CalendarDays,
  CalendarRange,
  Database,
  Globe,
  Users,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-3 rounded-full bg-bg-hover overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function getBarColor(usage: number): string {
  if (usage >= 90) return "bg-red-500";
  if (usage >= 70) return "bg-yellow-500";
  return "bg-accent";
}

function StatCard({
  icon: Icon,
  title,
  value,
  sub,
  usage,
  children,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  sub?: string;
  usage?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-accent-subtle">
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div>
        <span className="text-2xl font-bold">{value}</span>
        {sub && <span className="text-xs text-fg-muted ml-2">{sub}</span>}
      </div>
      {usage !== undefined && <ProgressBar value={usage} color={getBarColor(usage)} />}
      {children}
    </div>
  );
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barW = 100 / data.length;

  return (
    <div className="rounded-xl border border-border bg-bg-subtle p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-accent-subtle">
          <CalendarRange className="w-4 h-4 text-accent" />
        </div>
        <span className="text-sm font-medium">Emails (30 days)</span>
      </div>
      <div className="relative w-full h-40">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
          {data.map((d, i) => {
            const h = (d.count / max) * 45;
            return (
              <g key={d.date}>
                <rect
                  x={i * barW + barW * 0.15}
                  y={50 - h}
                  width={barW * 0.7}
                  height={h}
                  rx={0.5}
                  className="fill-accent/70 hover:fill-accent transition-colors"
                />
              </g>
            );
          })}
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-border" strokeWidth="0.2" />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-fg-muted">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const prevNetwork = useRef<{ rx: number; tx: number; ts: number } | null>(null);
  const [netSpeed, setNetSpeed] = useState({ rx: 0, tx: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [s, e] = await Promise.allSettled([getSystemStats(), getEmailStats()]);
      if (s.status === "fulfilled") {
        const sVal = s.value;
        const now = Date.now();
        if (prevNetwork.current) {
          const dt = (now - prevNetwork.current.ts) / 1000;
          if (dt > 0) {
            setNetSpeed({
              rx: Math.max(0, (sVal.network.rx - prevNetwork.current.rx) / dt),
              tx: Math.max(0, (sVal.network.tx - prevNetwork.current.tx) / dt),
            });
          }
        }
        prevNetwork.current = { rx: sVal.network.rx, tx: sVal.network.tx, ts: now };
        setStats(sVal);
      }
      if (e.status === "fulfilled") {
        setEmailStats(e.value);
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchStats, 3000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStats]);

  if (loading) {
    return <div className="p-6 text-sm text-fg-muted">Loading...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-sm text-red-500">Failed to load system stats.</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              autoRefresh
                ? "bg-accent-subtle text-accent"
                : "bg-bg-hover text-fg-muted"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
            {autoRefresh ? "Auto" : "Paused"}
          </button>
        </div>
      </div>

      {/* Server info bar */}
      <div className="flex flex-wrap gap-4 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5" /> {stats.hostname}
        </span>
        <span>{stats.platform}</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Uptime: {formatUptime(stats.uptime)}
        </span>
        <span>{stats.cpu.model}</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Cpu}
          title="CPU"
          value={`${stats.cpu.usage}%`}
          sub={`${stats.cpu.cores} cores`}
          usage={stats.cpu.usage}
        />

        <StatCard
          icon={MemoryStick}
          title="Memory"
          value={`${stats.memory.usage}%`}
          sub={`${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`}
          usage={stats.memory.usage}
        />

        <StatCard
          icon={HardDrive}
          title="Disk"
          value={`${stats.disk.usage}%`}
          sub={`${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}`}
          usage={stats.disk.usage}
        />

        <StatCard icon={Network} title="Network" value={`↓ ${formatBytes(netSpeed.rx)}/s`} sub={`↑ ${formatBytes(netSpeed.tx)}/s`}>
          <div className="text-xs text-fg-muted space-y-0.5">
            <div>Total RX: {formatBytes(stats.network.rx)}</div>
            <div>Total TX: {formatBytes(stats.network.tx)}</div>
          </div>
        </StatCard>
      </div>

      {/* Email stats */}
      {emailStats && (
        <>
          <h2 className="text-sm font-semibold text-fg-muted pt-2">Email Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Mail} title="Today" value={emailStats.today.toLocaleString()} />
            <StatCard icon={CalendarDays} title="This Week" value={emailStats.week.toLocaleString()} />
            <StatCard icon={CalendarRange} title="This Month" value={emailStats.month.toLocaleString()} />
            <StatCard icon={Database} title="All Time" value={emailStats.total.toLocaleString()} />
            <StatCard icon={Users} title="Addresses" value={emailStats.uniqueAddresses.toLocaleString()} />
            <StatCard icon={Globe} title="Domains" value={emailStats.activeDomains.toLocaleString()} />
          </div>
          <BarChart data={emailStats.dailyCounts} />
        </>
      )}
    </div>
  );
}
