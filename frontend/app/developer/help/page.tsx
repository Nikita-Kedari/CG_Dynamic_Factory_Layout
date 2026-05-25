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
  Upload,
  Download,
  Undo2,
  Redo2,
  LayoutGrid, 
  Activity,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  Navigation,
  CornerDownRight,
  Search,
  Settings,
  Info
} from 'lucide-react';

export default function DeveloperHelpPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase">
                Developer Console Guide
              </h1>
              <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase">Blueprint Construction, Coordinates, & Data Sync</p>
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
              onClick={() => scrollToSection('canvas')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Compass className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Canvas Operations
            </button>
            <button 
              onClick={() => scrollToSection('toolbar')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Settings className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Toolbar & Sync
            </button>
            <button 
              onClick={() => scrollToSection('inspector')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <LayoutGrid className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Structure Inspector
            </button>
            <button 
              onClick={() => scrollToSection('routing')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <Navigation className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Flow Routing Handles
            </button>
            <button 
              onClick={() => scrollToSection('csv-schema')} 
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <FileSpreadsheet className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              CSV Structure Schema
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-16">
          
          {/* Section: Overview */}
          <section id="intro" className="scroll-mt-24 space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/40 via-violet-950/20 to-transparent p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-5 pointer-events-none">
                <BookOpen className="h-96 w-96 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-3">Developer Console Overview</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                The **Developer Layout Editor** provides full, unrestricted topology manipulation. Unlike the read-only Admin dashboard, developers hold authoring permissions to reposition machinery, configure structural boundaries, establish routing connection vectors, import factory schemas from CSV logs, and restore editor sessions from local transaction history.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Configure workstation sizes & bounds</span>
                </div>
                <div className="px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse" />
                  <span>Draw customized flow routes & paths</span>
                </div>
                <div className="px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Bidirectional CSV upload / download</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Canvas Operations */}
          <section id="canvas" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Compass className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Canvas Operations & Hotkeys</h2>
            </div>
            <p className="text-sm text-slate-400">
              The primary interactive viewport operates on a high-refresh HTML5 canvas. You can direct layout nodes via direct mouse actions and keyboard shortcuts:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Pan Card */}
              <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-950/20 group-hover:border-indigo-500/20 transition-all">
                  <Move className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Panning & Floor Navigation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hold the **Spacebar** and then **click & drag** to pan across the blueprint floor. Or use standard scroll touchpads.
                </p>
              </div>

              {/* Move Workstations Card */}
              <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-950/20 group-hover:border-indigo-500/20 transition-all">
                  <Maximize2 className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Drag-and-Drop Machines</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hover over a workstation, **click and hold**, then drag to reposition it. Note that workstations are confined within their parent Assembly Area bounds.
                </p>
              </div>

              {/* Zoom Card */}
              <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-950/20 group-hover:border-indigo-500/20 transition-all">
                  <ZoomIn className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-extrabold text-slate-200 text-sm">Target Zoom</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the **mouse wheel** to zoom in and out. The coordinate grid automatically aligns and focuses under your pointer.
                </p>
              </div>

            </div>
          </section>

          {/* Section: Toolbar & Sync */}
          <section id="toolbar" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Settings className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Toolbar Controls & Data Sync</h2>
            </div>
            <p className="text-sm text-slate-400">
              The developer secondary toolbar coordinates bulk updates, local rollback history, and exporter filters.
            </p>
            
            <div className="border border-slate-800/80 rounded-2xl bg-[#090d16] divide-y divide-slate-800/80">
              
              {/* CSV Upload */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" /> Upload CSV
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Upload CSV Layout</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload a `.csv` containing workstation coordinates, areas, and routes to instantly overwrite the editor canvas model.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Import Sync</span>
              </div>

              {/* CSV Download */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Download className="h-3.5 w-3.5" /> Download CSV
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Download CSV Schema</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Dumps all physical coordinates, sizes, routing states, and comments of the layout into a clean database-compatible CSV file.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Export Sync</span>
              </div>

              {/* Undo / Redo */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-900">
                    <div className="p-1 text-slate-400"><Undo2 className="h-3.5 w-3.5" /></div>
                    <div className="p-1 text-slate-400"><Redo2 className="h-3.5 w-3.5" /></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Undo & Redo (Transaction History)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Step backward or forward through coordinate adjustments. Standard hotkeys **Ctrl+Z** (Undo) and **Ctrl+Y** (Redo) are also fully supported.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">History Control</span>
              </div>

              {/* Grid Toggle */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Grid3x3 className="h-3.5 w-3.5" /> Grid
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Visual Blueprint Grid</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Toggles a structured background alignment grid overlay, helping you space workstations at consistent intervals.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Grid Overlay</span>
              </div>

              {/* Blueprint Export */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-indigo-650 border border-indigo-500 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                    <Download className="h-3.5 w-3.5" /> Download Blueprint
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Supersampled Exporters</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Generates static assets of the factory blueprint:
                    </p>
                    <ul className="text-xs text-slate-500 list-disc pl-5 mt-1 space-y-1">
                      <li><strong className="text-slate-400">PNG Image:</strong> Captures the canvas viewport contents as a presentation-quality high-res image.</li>
                      <li><strong className="text-slate-400">PDF Document:</strong> Packages the layout blueprint vectors into a vector-grade document.</li>
                    </ul>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Vector Printout</span>
              </div>

            </div>
          </section>

          {/* Section: Structure Inspector */}
          <section id="inspector" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <LayoutGrid className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Structure Inspector (Left Sidebar)</h2>
            </div>
            <p className="text-sm text-slate-400">
              When you select a workstation or assembly area by left-clicking it, the left sidebar transitions into a **Structure Inspector Panel** allowing detailed adjustments:
            </p>
            
            <div className="bg-[#090d16] border border-slate-800 p-8 rounded-2xl space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Workstation Fields */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" /> Workstation Sizing & Position
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Modify the precise numeric bounds of the selected machine:
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1.5 pl-4 list-disc">
                    <li><strong className="text-slate-300">X / Y Pos:</strong> Relative coordinates inside the factory boundary.</li>
                    <li><strong className="text-slate-300">Width / Height:</strong> Dimensional footprint of the workstation unit.</li>
                  </ul>
                  <p className="text-[11px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Coordinate values are checked in real-time to avoid negative scale or canvas clipping.
                  </p>
                </div>

                {/* Area Routing Fields */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500" /> Area Line Routing Type
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Selecting an assembly area allows modifying the route layout model of the line:
                  </p>
                  <div className="bg-[#060b14] border border-slate-800 p-3.5 rounded-xl space-y-2">
                    <div className="text-[11px] text-slate-300"><strong className="text-indigo-400">Straight:</strong> Direct point-to-point vectors between sequential stations.</div>
                    <div className="text-[11px] text-slate-300"><strong className="text-indigo-400">L-Type:</strong> Angular routing connecting nodes in orthogonal L paths.</div>
                    <div className="text-[11px] text-slate-300"><strong className="text-indigo-400">U-Type / Inverted-U:</strong> Encircling routing paths for closed assembly lines.</div>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* Section: Flow Routing Handles */}
          <section id="routing" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Navigation className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Manual Flow Routing Handles</h2>
            </div>
            
            <div className="bg-[#090d16] border border-slate-800 p-8 rounded-2xl space-y-6">
              <p className="text-sm text-slate-400">
                Establish Custom connection paths between machinery units when automatic routing patterns are insufficient. 
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Trigger */}
                <div className="bg-[#060b14] border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">1. Select Flow</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Left-click directly on any connecting arrow vector. The route will highlight, displaying interactive blue handles.
                  </p>
                </div>

                {/* Adjust */}
                <div className="bg-[#060b14] border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">2. Drag Handles</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click and drag any of the intermediate blue handles to route flow around obstacles. Endpoints remain locked to the workstations.
                  </p>
                </div>

                {/* Control Panel */}
                <div className="bg-[#060b14] border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">3. Overlay Commands</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use the floating toolbar in the bottom-left to:
                  </p>
                  <ul className="text-[11px] text-slate-500 pl-4 list-disc space-y-1 mt-1">
                    <li>Reset to automatic step route</li>
                    <li>Convert route to a direct straight vector</li>
                  </ul>
                </div>

              </div>

            </div>
          </section>

          {/* Section: CSV Structure Schema */}
          <section id="csv-schema" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">CSV Data Structure Schema</h2>
            </div>
            <p className="text-sm text-slate-400">
              When syncing layout schemas via Upload/Download CSV, ensure database formatting conforms to the following schema structure:
            </p>
            
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 font-extrabold border-b border-slate-800 uppercase tracking-wider">
                      <th className="p-4">Header Field</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-400">
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-4 font-bold text-slate-200">id</td>
                      <td className="p-4 text-indigo-400">Integer / UUID</td>
                      <td className="p-4">Unique identity code of the layout.</td>
                      <td className="p-4 font-mono">13</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-4 font-bold text-slate-200">name</td>
                      <td className="p-4 text-indigo-400">String</td>
                      <td className="p-4">Name identifier of the factory layout profile.</td>
                      <td className="p-4 font-mono">Automotive Body Layout</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-4 font-bold text-slate-200">type</td>
                      <td className="p-4 text-indigo-400">Enum (workcenter / line)</td>
                      <td className="p-4">Blueprint entity definition category.</td>
                      <td className="p-4 font-mono">workcenter</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-4 font-bold text-slate-200">x / y</td>
                      <td className="p-4 text-indigo-400">Float</td>
                      <td className="p-4">X/Y coordinate offsets inside layout.</td>
                      <td className="p-4 font-mono">350.5</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-4 font-bold text-slate-200">width / height</td>
                      <td className="p-4 text-indigo-400">Float</td>
                      <td className="p-4">Dimensions of the workstation footprint.</td>
                      <td className="p-4 font-mono">120.0</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-4 font-bold text-slate-200">line_routing_type</td>
                      <td className="p-4 text-indigo-400">String</td>
                      <td className="p-4">Orthogonal connection path logic for area bounds.</td>
                      <td className="p-4 font-mono">Straight</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
