'use client';

import { Button } from '@/components/ui/button';
import {
  MonitorPlay,
  ArrowRight,
  Factory,
  Cpu,
  ShieldCheck,
  Activity,
  Layers,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 selection:bg-blue-500/30 font-sans overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-emerald-600/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-indigo-600/15 blur-[120px] mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl transition-all">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform group-hover:scale-105">
                <Factory className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">FloorViz<span className="text-blue-500">.</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Platform</Link>
              <Link href="#workflow" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Workflow</Link>
              <div className="h-4 w-px bg-white/10" />
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="rounded-full bg-white text-slate-900 hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 font-bold px-6">
                  Launch App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 text-sm font-medium text-blue-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next-Gen Digital Twin Engine v2.0
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-[5.5rem] leading-[1.1]">
            Factory Management, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Perfectly Visualized.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed font-light">
            Transform complex industrial layouts into beautifully interactive digital twins.
            Empower your developers, admins, and operators with a unified, real-time command center.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <Link href="/developer">
              <Button size="lg" className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 h-14 text-base shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(37,99,235,0.6)]">
                <Cpu className="mr-2 h-5 w-5" />
                Developer Portal
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white h-14 px-8 text-base backdrop-blur-md transition-all hover:scale-105">
                <ShieldCheck className="mr-2 h-5 w-5 text-indigo-400" />
                Admin Console
              </Button>
            </Link>
          </div>
        </div>

        {/* Video Dashboard Decorator */}
        <div className="mx-auto mt-24 max-w-5xl px-6 lg:px-8 relative z-0">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 shadow-2xl flex justify-center">
            <div className="w-full max-w-4xl rounded-xl overflow-hidden bg-slate-950 shadow-[0_0_50px_rgba(255,255,255,0.05)] flex flex-col ring-1 ring-white/10">
              {/* Fake Browser Window Header (Dark Theme) */}
              <div className="h-10 border-b border-white/10 bg-slate-900 flex items-center px-4 gap-2 shrink-0">
                <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <div className="ml-4 h-6 w-full max-w-[200px] rounded-md bg-slate-800 shadow-inner border border-white/5 flex items-center px-3">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="h-3 w-3 text-slate-500" />
                    <div className="h-1.5 w-24 bg-slate-600 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative w-full bg-slate-950 flex-1">
                <video
                  src="/hero-demo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-cover rounded-b-xl block"
                />
              </div>
            </div>
            {/* Glow under the dashboard */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-blue-600/30 blur-[100px] pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-24 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Industrial Grade <span className="font-light italic text-blue-400">Architecture</span>
            </h2>
            <p className="max-w-2xl text-slate-400 text-lg">
              Engineered for massive-scale facilities with deeply immersive grid rendering,
              live status reflection, and completely responsive administration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Layers,
                title: "Deep Layout Rendering",
                desc: "Granular nested hierarchies: Floors -> Areas -> Production Lines -> Machines. Seamless Level of Detail (LOD) optimization.",
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
              },
              {
                icon: Activity,
                title: "Live Telemetry",
                desc: "Constant health streams map onto digital twins in real-time. Spot anomalies instantly with zero-latency visual indicators.",
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]"
              },
              {
                icon: Globe,
                title: "Cloud Synchronized",
                desc: "Push new configurations from CSV instantly via the developer portal. One-click approvals update views globally.",
                color: "text-indigo-400",
                bg: "bg-indigo-400/10",
                shadow: "group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className={`group relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.04] ${feature.shadow}`}>
                  <div className={`mb-6 inline-flex rounded-2xl p-4 ${feature.bg} ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`h-8 w-8 ${feature.color}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role Workflows */}
      <section id="workflow" className="relative z-10 py-32 overflow-hidden">
        {/* Decorative lines */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M-10,10 l20,-20 M0,40 l40,-40 M30,50 l20,-20" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal)" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
          <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-8 sm:p-16 backdrop-blur-2xl shadow-2xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">A Dual Workflow Built for Control</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Two specialized roles designed for robust drafting and air-tight layout publishing.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-[4.5rem] left-[25%] right-[25%] h-px bg-gradient-to-r from-blue-500/0 via-indigo-500/50 to-indigo-500/0" />

              {/* Developer */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-blue-400 mb-6">
                  <Cpu className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">1. Developer</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-[250px]">Upload configuration CSVs to seamlessly draft new floor layout versions.</p>
                <Link href="/developer" className="mt-auto">
                  <Button variant="link" className="text-blue-400 hover:text-blue-300 group">
                    Developer Portal <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              {/* Admin */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-indigo-400 mb-6">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">2. Administrator</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-[280px]">Inspect visual layouts in the Editor and Approve drafts to deploy them globally.</p>
                <Link href="/admin" className="mt-auto">
                  <Button variant="link" className="text-indigo-400 hover:text-indigo-300 group">
                    Admin Console <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Factory className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">FloorViz<span className="text-blue-500">.</span></span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 FloorViz Engine. Built for industrial excellence.</p>
          <div className="flex gap-4 opacity-0 pointer-events-none md:opacity-100">
            {/* Symmetrical placeholder */}
            <div className="w-10 h-10"></div>
          </div>
        </div>
      </footer>
    </main>
  );
}
