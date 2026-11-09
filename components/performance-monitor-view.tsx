"use client";

import { useState } from "react";
import Link from "next/link";

interface Performer {
  rank: number;
  name: string;
  role: string;
  score: number;
  delta: string;
  deltaColor?: string;
  avatarUrl: string;
  badge?: string;
}

export default function PerformanceMonitorView() {
  const [activeNav, setActiveNav] = useState("home");
  const [activeZoneTab, setActiveZoneTab] = useState("all");

  const kpis = [
    {
      label: "TOTAL ACTIONS",
      value: "4,210,895",
      subtext: "• Innoiantive change (days)",
      hasDot: true,
      icon: "ⓘ",
      className: "from-teal-50/70 to-white border-teal-100"
    },
    {
      label: "EFFICIENCY INDEX",
      value: "94.2%",
      isProgress: true,
      progress: 94.2,
      icon: "⚡",
      className: "from-rose-50/70 to-white border-rose-100"
    },
    {
      label: "ACTIVE SESSIONS",
      value: "12,840",
      subtext: "Prosesxed chamge (Dape)",
      icon: "ⓘ",
      className: "from-blue-50/70 to-white border-blue-100"
    },
    {
      label: "SYNC RATE",
      value: "98.7%",
      subtext: "Yoss sant calage (D5%)",
      icon: "🔄",
      className: "from-emerald-50/70 to-white border-emerald-100"
    },
    {
      label: "SERVER NODES",
      value: "1,024",
      subtext: "• Excrpttive (Hpids)",
      hasDot: true,
      icon: "🖥️",
      className: "from-slate-50/70 to-white border-slate-200"
    },
    {
      label: "BANDWIDTH",
      value: "8.4 GB/s",
      subtext: "Desa frecttive (xxpo)",
      icon: "ⓘ",
      className: "from-amber-50/70 to-white border-amber-100"
    }
  ];

  const throughput = [
    {
      name: "Inverted",
      percentage: "1.51%",
      secondary: "29ers",
      barWidth: "40%",
      gradient: "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)"
    },
    {
      name: "Querited",
      percentage: "96%",
      secondary: "96%",
      barWidth: "96%",
      gradient: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)"
    },
    {
      name: "Venoo mcactipection",
      percentage: "110%",
      secondary: "88%",
      barWidth: "88%",
      gradient: "linear-gradient(90deg, #f97316 0%, #06b6d4 100%)"
    },
    {
      name: "Oonrative",
      percentage: "443%",
      secondary: "44%",
      barWidth: "44%",
      gradient: "linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)"
    },
    {
      name: "Charge roode",
      percentage: "1.21%",
      secondary: "22%",
      barWidth: "22%",
      gradient: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)"
    },
    {
      name: "Apni sode",
      percentage: "-10%",
      secondary: "-10%",
      barWidth: "10%",
      gradient: "linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)"
    }
  ];

  const performersZoneA: Performer[] = [
    {
      rank: 1,
      badge: "🥇",
      name: "Alex Morgan",
      role: "Piec &Abrgin",
      score: 1283,
      delta: "+210.198% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 2,
      badge: "2",
      name: "Elena Rostova",
      role: "Dlena Rostoo",
      score: 1000,
      delta: "+2,876.127% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 3,
      badge: "3",
      name: "Eatom Maroca",
      role: "Takas Mamika",
      score: 189,
      delta: "+232.833% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 4,
      badge: "4",
      name: "Aalia Malik",
      role: "Farso Rora",
      score: 1171,
      delta: "+2.8.473% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
    }
  ];

  const performersZoneB: Performer[] = [
    {
      rank: 1,
      badge: "🥈",
      name: "Elena Rostova",
      role: "Elena Rostova",
      score: 2583,
      delta: "-1213 1.08% ↑",
      deltaColor: "text-sky-600",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 2,
      badge: "2",
      name: "Liora Choo",
      role: "Zheo Choo",
      score: 1264,
      delta: "+2.11 198% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 3,
      badge: "3",
      name: "Zofia Al-Mansour",
      role: "Boraa Chouua",
      score: 481,
      delta: "+2.3.332% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 4,
      badge: "4",
      name: "Yaliti Tanaka",
      role: "Banla Caniaka",
      score: 2325,
      delta: "+2.63.32% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80"
    }
  ];

  const performersZoneC: Performer[] = [
    {
      rank: 1,
      badge: "1",
      name: "Alex Morgan",
      role: "Mush Exborga",
      score: 1872,
      delta: "+2.130.181% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 2,
      badge: "2",
      name: "Elena Rostova",
      role: "Liant Sirun",
      score: 1111,
      delta: "+27/6.8.67% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 3,
      badge: "3",
      name: "Zofia Al-Mansour",
      role: "Valina Sllna",
      score: 637,
      delta: "+2.31.337% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      rank: 4,
      badge: "4",
      name: "Molee Sllnn",
      role: "Motvo Sllnn",
      score: 972,
      delta: "+35.122% ↑",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80"
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#f1f4f9] text-slate-800 font-sans antialiased">
      {/* Side Navigation Bar */}
      <aside className="w-[72px] bg-white border-r border-slate-200/80 flex flex-col items-center py-6 gap-5 sticky top-0 h-screen z-30 shrink-0">
        <button
          onClick={() => setActiveNav("loc")}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            activeNav === "loc" ? "text-sky-600 bg-sky-50 shadow-inner" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
          title="Localização"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-5.373-8-12a8 8 0 1116 0c0 6.627-3.582 12-8 12z" />
            <circle cx="12" cy="9" r="3" />
          </svg>
        </button>

        <button
          onClick={() => setActiveNav("home")}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            activeNav === "home" ? "text-sky-600 bg-sky-50 ring-1 ring-sky-200" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
          title="Home / Monitor"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </button>

        <button
          onClick={() => setActiveNav("doc")}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          title="Documentos"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button
          onClick={() => setActiveNav("list")}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          title="Tarefas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          onClick={() => setActiveNav("radar")}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          title="Radar Analítico"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9l6 3" />
          </svg>
        </button>

        <button
          onClick={() => setActiveNav("folder")}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          title="Projetos"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>

        <div className="flex-1" />

        <Link
          href="/"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          title="Voltar ao Portfólio Principal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 pb-12">
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-indigo-500/25 tracking-tight">
              N
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide text-slate-900 leading-tight">
                PERFORMANCE MONITOR
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Google Apps Script • HtmlService Engine • 100% Mock Safe</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://script.google.com/macros/s/AKfycbw1fhV5-rLf041oVNMSZOllk_Zx3gP6bGaftLhMLlfhrtCpvLi3DOwrSx8ZHuUBeL8sFA/exec"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm hover:from-sky-600 hover:to-blue-700 transition-all flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Abrir Web App no Google Apps Script ↗
            </a>

            <Link
              href="/projeto-apps-script"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 transition-all"
            >
              Ver Projeto Leftover
            </Link>

            <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>

            <button className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                  alt="Bert"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left leading-tight pr-1">
                <div className="text-xs font-bold text-slate-800">Bert Performe...</div>
                <div className="text-[10px] text-slate-400">Donavig, 14</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="px-8 flex flex-col gap-5">
          {/* 6 Top KPI Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((k, i) => (
              <article
                key={i}
                className={`bg-gradient-to-b ${k.className} border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
                    {k.label}
                  </span>
                  <span className="text-xs text-slate-400">{k.icon}</span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
                    {k.value}
                  </div>
                  {k.isProgress ? (
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${k.progress}%` }}
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      {k.hasDot && <span className="text-emerald-500 text-sm leading-none">•</span>}
                      {k.subtext}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>

          {/* Middle Row: Hourly Traffic Peak & Zone Throughput */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Chart (8 cols) */}
            <article className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Hourly Traffic Peak</h2>
                  <p className="text-xs text-slate-400">Hortess • CHS / ouses per rdsyer Todjetts</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" /> Derociless
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full border-2 border-sky-400" /> Gest 4 abe stotices
                    </span>
                  </div>

                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 text-xs font-semibold">
                    <span>Vee All</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Graphic Representation */}
              <div className="relative w-full h-[230px] pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 210" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="barGradientNext" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  {[30, 70, 110, 150, 190].map((y, idx) => (
                    <line key={idx} x1="25" y1={y} x2="585" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}

                  {/* Y Axis Numbers */}
                  <g fill="#94a3b8" fontSize="10" textAnchor="end">
                    <text x="20" y="34">100</text>
                    <text x="20" y="74">80</text>
                    <text x="20" y="114">60</text>
                    <text x="20" y="154">40</text>
                    <text x="20" y="194">0</text>
                  </g>

                  {/* Vertical Bars */}
                  {[
                    { x: 50, h: 70, label: "Nov 11" },
                    { x: 105, h: 120, label: "02h", peak: "471.6K" },
                    { x: 160, h: 85, label: "Jan" },
                    { x: 215, h: 105, label: "06h" },
                    { x: 270, h: 160, label: "Mar", peak: "172.48K" },
                    { x: 325, h: 95, label: "10h" },
                    { x: 380, h: 65, label: "Jun" },
                    { x: 435, h: 155, label: "14h", peak: "62.82K" },
                    { x: 490, h: 60, label: "Apr" },
                    { x: 545, h: 135, label: "18h" }
                  ].map((bar, idx) => {
                    const barY = 190 - bar.h;
                    return (
                      <g key={idx}>
                        <rect
                          x={bar.x - 12}
                          y={barY}
                          width="24"
                          height={bar.h}
                          rx="6"
                          ry="6"
                          fill="url(#barGradientNext)"
                          className="transition-all hover:opacity-80"
                        />
                        <text x={bar.x} y="206" textAnchor="middle" fill="#94a3b8" fontSize="10">
                          {bar.label}
                        </text>
                        {bar.peak && (
                          <g>
                            <line
                              x1={bar.x}
                              y1={barY}
                              x2={bar.x}
                              y2={barY - 20}
                              stroke="#cbd5e1"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={bar.x}
                              y={barY - 24}
                              textAnchor="middle"
                              fill="#0f172a"
                              fontWeight="700"
                              fontSize="11"
                            >
                              {bar.peak}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Bezier Line Overlay */}
                  <path
                    d="M 50 120 C 75 110, 85 100, 105 105 C 135 115, 140 60, 160 55 C 190 50, 200 90, 215 85 C 245 75, 255 40, 270 45 C 295 50, 310 110, 325 115 C 355 120, 365 140, 380 135 C 410 125, 420 50, 435 55 C 465 60, 475 145, 490 140 C 520 130, 530 65, 545 70"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />

                  {/* Data Points on Line */}
                  {[
                    { x: 50, y: 120 },
                    { x: 105, y: 105 },
                    { x: 160, y: 55 },
                    { x: 215, y: 85 },
                    { x: 270, y: 45 },
                    { x: 325, y: 115 },
                    { x: 380, y: 135 },
                    { x: 435, y: 55 },
                    { x: 490, y: 140 },
                    { x: 545, y: 70 }
                  ].map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#06b6d4" strokeWidth="2" />
                  ))}
                </svg>
              </div>
            </article>

            {/* Right: Zone Throughput (4 cols) */}
            <article className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Zone Throughput</h2>
                    <p className="text-xs text-slate-400">Fix Brodge pay troued in Bhrorughyed RoV</p>
                  </div>
                  <div className="flex gap-1.5 text-slate-400 text-sm">
                    <button className="hover:text-slate-700">‹</button>
                    <button className="hover:text-slate-700">›</button>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  {throughput.map((tp, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{tp.name}</span>
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <span className="text-emerald-600">{tp.percentage}</span>
                          <span className="text-slate-400">{tp.secondary}</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: tp.barWidth, background: tp.gradient }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          {/* Bottom Row: 3 Top Performers Zone Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Zone A-1 */}
            <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top Performers Zone A-1</h3>
                  <p className="text-[11px] text-slate-400">Imottted</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
              </div>
              <div className="flex flex-col gap-2">
                {performersZoneA.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-bold text-slate-500">{p.badge}</span>
                      <img src={p.avatarUrl} alt={p.name} className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.role}</div>
                      </div>
                    </div>
                    <div className="text-right leading-tight">
                      <div className="text-xs font-extrabold text-slate-900 font-mono">{p.score.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-emerald-600">{p.delta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Zone B-2 */}
            <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top Performers Zone B-2</h3>
                  <p className="text-[11px] text-slate-400">Reneted</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
              </div>
              <div className="flex flex-col gap-2">
                {performersZoneB.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-bold text-slate-500">{p.badge}</span>
                      <img src={p.avatarUrl} alt={p.name} className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.role}</div>
                      </div>
                    </div>
                    <div className="text-right leading-tight">
                      <div className="text-xs font-extrabold text-slate-900 font-mono">{p.score.toLocaleString()}</div>
                      <div className={`text-[10px] font-bold ${p.deltaColor || "text-emerald-600"}`}>{p.delta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Zone C-3 */}
            <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top Performers Zone C-3</h3>
                  <p className="text-[11px] text-slate-400">Reosted</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
              </div>
              <div className="flex flex-col gap-2">
                {performersZoneC.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-bold text-slate-500">{p.badge}</span>
                      <img src={p.avatarUrl} alt={p.name} className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                      <div className="leading-tight">
                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.role}</div>
                      </div>
                    </div>
                    <div className="text-right leading-tight">
                      <div className="text-xs font-extrabold text-slate-900 font-mono">{p.score.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-emerald-600">{p.delta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Quick Info & Code Download Box */}
          <section className="bg-slate-900 text-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold">
                GAS
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Projeto Google Apps Script Disponível</h4>
                <p className="text-xs text-slate-400">
                  Arquivos prontos em <code>apps-script/performance-monitor/</code>: Código.js, Index.html e appsscript.json.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://script.google.com/macros/s/AKfycbw1fhV5-rLf041oVNMSZOllk_Zx3gP6bGaftLhMLlfhrtCpvLi3DOwrSx8ZHuUBeL8sFA/exec"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-400 transition-all flex items-center gap-1.5 shadow-sm"
              >
                Acessar Execução Google (Live) ↗
              </a>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                100% Mock Safe
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

