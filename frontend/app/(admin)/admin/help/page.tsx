'use client';

import React from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid3x3, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Share2, 
  HelpCircle,
  Activity, 
  Layout, 
  Compass,
  FileSpreadsheet,
  AlertCircle,
  FileImage,
  Info
} from 'lucide-react';

export default function AdminHelpPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase">
                Admin Console Guide
              </h1>
              <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase">User Instructions & Interactive Controls</p>
            </div>
          </div>
          <button 
            onClick={() => window.close()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:border-indigo-500 active:scale-95 shadow-md"
          >
            <ArrowLeft className="h-4 w-4 text-indigo-400" /> Close Guide
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-[#090d16]/90 border border-slate-800/80 rounded-2xl p-5 space-y-2 backdrop-blur-md shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">Quick Navigation</h3>
            <button 
              onClick={() => scrollToSection('intro')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Info className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Overview
            </button>
            <button 
              onClick={() => scrollToSection('navigation')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Compass className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Canvas Navigation
            </button>
            <button 
              onClick={() => scrollToSection('toolbar')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Layout className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Toolbar Controls
            </button>
            <button 
              onClick={() => scrollToSection('commenting')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <MessageSquare className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Review & Comments
            </button>
            <button 
              onClick={() => scrollToSection('workflow')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Activity className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Layout Status States
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-16">
          
          {/* Section: Overview */}
          <section id="intro" className="scroll-mt-24 space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-5 pointer-events-none">
                <BookOpen className="h-96 w-96 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-3">Admin Editor Overview</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                The **Admin Blueprint Reviewer** is a specialized workspace designed for factory layout auditors. Unlike the Developer Portal (which allows direct layout changes, editing line paths, and dragging shapes), the Admin Portal locks layout topologies and shifts the focus to **inspection, verification, and contextual reviewer feedback**.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Verify workstation constraints</span>
                </div>
                <div className="px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Sync parameters from SQL Server</span>
                </div>
                <div className="px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Leave element-level reviews</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Canvas Navigation */}
          <section id="navigation" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Compass className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Canvas Navigation & Controls</h2>
            </div>
            <p className="text-sm text-slate-400">
              The blueprint is rendered in real-time on a 2D viewport. Use the following commands to navigate the factory layout:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Pan Card */}
              <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-950/20 group-hover:border-indigo-500/20 transition-all">
                  <Move className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Panning the View</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hold down the **Spacebar** on your keyboard, then **click and drag** with your mouse to slide across the factory blueprint floor.
                </p>
              </div>

              {/* Zoom Card */}
              <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-950/20 group-hover:border-indigo-500/20 transition-all">
                  <ZoomIn className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Cursor-Focal Zooming</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use your **mouse scroll wheel** to zoom in and out. The canvas automatically centers zoom calculations around your mouse pointer.
                </p>
              </div>

              {/* Selection Card */}
              <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-950/20 group-hover:border-indigo-500/20 transition-all">
                  <Layout className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Select Elements</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  **Left-click** on any Workstation box or Area boundary line on the canvas to inspect its parameters and enter element-level comments.
                </p>
              </div>

            </div>
          </section>

          {/* Section: Toolbar Controls */}
          <section id="toolbar" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Layout className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Toolbar Action Reference</h2>
            </div>
            <p className="text-sm text-slate-400">
              The toolbar at the top right of the editor hosts layout configurations, exporters, and view helpers.
            </p>
            
            <div className="border border-slate-800/80 rounded-2xl bg-[#090d16] divide-y divide-slate-800/80">
              
              {/* Back */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-2">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Exit / Back Button</h4>
                    <p className="text-xs text-slate-400 mt-1">Exit review editor and return to the main Admin Console dashboard.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Dashboard Navigation</span>
              </div>

              {/* Comments */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-indigo-650 border border-indigo-500 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> Comments
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Toggle Comments Button</h4>
                    <p className="text-xs text-slate-400 mt-1">Show or hide all floating speech bubble overlays and outlines reflecting reviewers feedback.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Visual Toggle</span>
              </div>

              {/* Zoom Controls */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-900">
                    <div className="p-1 text-slate-400"><ZoomOut className="h-3.5 w-3.5" /></div>
                    <div className="px-2 text-[10px] font-bold text-slate-400 flex items-center">100%</div>
                    <div className="p-1 text-slate-400"><ZoomIn className="h-3.5 w-3.5" /></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Zoom Actions</h4>
                    <p className="text-xs text-slate-400 mt-1">Increase or decrease layout scale centered on the viewport. Displays current zoom factor.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Scale Controls</span>
              </div>

              {/* Fit Screen */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Fit to Screen</h4>
                    <p className="text-xs text-slate-400 mt-1">Calculate layout bounds and automatically pan/zoom so the entire factory plan centers in your window.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Viewport Reset</span>
              </div>

              {/* Share */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-2">
                    Share
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Share Layout URL</h4>
                    <p className="text-xs text-slate-400 mt-1">Copies a secure, read-only URL to the clipboard. Anyone with the link can view the layout without logging in.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Link Sharing</span>
              </div>

              {/* Download */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                    <Download className="h-3.5 w-3.5" /> Download Blueprint
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Export Blueprint Actions</h4>
                    <p className="text-xs text-slate-400 mt-1">Opens a dropdown list allowing layout exports to two high-resolution formats:</p>
                    <ul className="text-xs text-slate-500 list-disc pl-5 mt-1 space-y-1">
                      <li><strong className="text-slate-400">PNG Image:</strong> Exports a high-fidelity supersampled image suitable for presentations.</li>
                      <li><strong className="text-slate-400">PDF Document:</strong> Generates a high-quality blueprint PDF document.</li>
                    </ul>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Data Export</span>
              </div>

            </div>
          </section>

          {/* Section: Review & Commenting */}
          <section id="commenting" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <MessageSquare className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Review & Commenting Workflow</h2>
            </div>
            
            <div className="bg-[#090d16] border border-slate-800 p-8 rounded-2xl space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Step 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500 text-indigo-400 flex items-center justify-center text-xs font-black">1</span>
                    <h4 className="font-extrabold text-slate-200 text-sm">Overall Feedback Comments</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Type general comments or overarching layout instructions into the input box labeled **"Type your detailed architectural feedback here..."** at the bottom of the screen.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500 text-indigo-400 flex items-center justify-center text-xs font-black">2</span>
                    <h4 className="font-extrabold text-slate-200 text-sm">Element-Level Feedback</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    **Left-click** a workstation box or area outline. A secondary textbox labeled **"Element Comment"** will slide open, allowing you to leave feedback tied directly to that shape. Click **"Clear Selection"** to close.
                  </p>
                </div>

              </div>

              {/* Review Panel Box */}
              <div className="border border-slate-800 bg-[#060b14] p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Review Panel Actions</h4>
                <p className="text-xs text-slate-400">Once your comments are entered, choose one of the three review action buttons:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Push to Dev</span>
                      <Send className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal mt-2">
                      Saves review feedback and rejects the layout, sending it back to the developer with the specific workstations/areas comments flagged.
                    </p>
                  </div>

                  <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Approve</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal mt-2">
                      Officially approves this layout. The version status is updated to Approved, allowing it to be activated as the Live floor plan.
                    </p>
                  </div>

                  <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Reject</span>
                      <XCircle className="h-4 w-4 text-rose-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal mt-2">
                      Rejects the layout version without returning the layout files to developer edit workspace.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* Section: Layout Status States */}
          <section id="workflow" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Activity className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Layout Status Workflow States</h2>
            </div>
            <p className="text-sm text-slate-400">
              Each layout version goes through the following lifecycle. You can monitor these statuses directly on the Admin Dashboard console table:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              
              {/* Draft */}
              <div className="bg-[#090d16] border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col h-40">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Draft</div>
                <p className="text-[11px] text-slate-500 leading-normal flex-1">
                  Developer is uploading layout files or editing coordinates. These do not show up on the Admin Dashboard yet.
                </p>
                <div className="absolute right-3 bottom-3 text-slate-900 font-bold text-3xl">01</div>
              </div>

              {/* Pending */}
              <div className="bg-[#090d16]/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col h-40 ring-1 ring-amber-500/20">
                <div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">Pending Review</div>
                <p className="text-[11px] text-slate-500 leading-normal flex-1">
                  Developer has submitted the layout version to the Admin. It is locked for developers and awaiting your audit decision.
                </p>
                <div className="absolute right-3 bottom-3 text-amber-950/30 font-bold text-3xl">02</div>
              </div>

              {/* Approved/Rejected */}
              <div className="bg-[#090d16]/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col h-40 ring-1 ring-blue-500/20">
                <div className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Reviewed</div>
                <p className="text-[11px] text-slate-500 leading-normal flex-1">
                  Admin rejects (pushed to developer) or approves. Developers can view comments, make edits, or resubmit a new version.
                </p>
                <div className="absolute right-3 bottom-3 text-blue-950/30 font-bold text-3xl">03</div>
              </div>

              {/* Active / Live */}
              <div className="bg-[#090d16]/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col h-40 ring-1 ring-emerald-500/20">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Active / Live</div>
                <p className="text-[11px] text-slate-500 leading-normal flex-1">
                  Approved layouts can be set to "Live". This activates it as the primary baseline configuration across the systems.
                </p>
                <div className="absolute right-3 bottom-3 text-emerald-950/30 font-bold text-3xl">04</div>
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
