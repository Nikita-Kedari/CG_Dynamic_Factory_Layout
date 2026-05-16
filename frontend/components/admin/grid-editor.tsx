'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Undo2, Redo2, RotateCcw, Save, ArrowLeft, Move, X, Upload, Download, ChevronRight, ChevronDown, AlignJustify, LayoutGrid, MessageSquare, Check, Activity, AlertCircle, CheckSquare, CheckCircle2, XCircle, Send, Search, Checkbox, Plus, Trash2, FileImage, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { threeAssembliesFactory } from '@/lib/three-assemblies';
import { parseCSV } from '@/lib/csv-handler';

interface GridEditorProps {
  onSave?: (factory: any) => void;
  onLayoutIdChange?: (id: string, name: string) => void;
  initialFactory?: any;
  isAdmin?: boolean;
  readOnly?: boolean;
  layoutId?: string | null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

const EXCEL_WORKSTATIONS: Record<string, any> = {
  w1: { ws_id: 'W1', process: 'Base Loading', machine: 'Conveyor', status: 'Running', oee: '92', orders: 'ORD-001' },
  w2: { ws_id: 'W2', process: 'Alignment', machine: 'Positioning', status: 'Running', oee: '90', orders: 'ORD-002' },
  w3: { ws_id: 'W3', process: 'Welding 1', machine: 'Robot', status: 'Idle', oee: '85', orders: 'ORD-003' },
  w4: { ws_id: 'W4', process: 'Welding 2', machine: 'Robot', status: 'Running', oee: '88', orders: 'ORD-004' },
  w5: { ws_id: 'W5', process: 'Central Join', machine: 'Multi-axis Robot', status: 'Bottleneck', oee: '78', orders: 'ORD-005' },
  w6: { ws_id: 'W6', process: 'Welding 3', machine: 'Robot', status: 'Running', oee: '86', orders: 'ORD-006' },
  w7: { ws_id: 'W7', process: 'Inspection', machine: 'Vision System', status: 'Running', oee: '95', orders: 'ORD-007' },
  w8: { ws_id: 'W8', process: 'Reinforcement', machine: 'Hybrid', status: 'Idle', oee: '82', orders: 'ORD-008' },
  w9: { ws_id: 'W9', process: 'Transfer', machine: 'Conveyor', status: 'Running', oee: '96', orders: 'ORD-009' },
  w10: { ws_id: 'W10', process: 'Input', machine: 'Conveyor', status: 'Running', oee: '94', orders: 'ORD-010' },
  w11: { ws_id: 'W11', process: 'Assembly 1', machine: 'Robot', status: 'Running', oee: '89', orders: 'ORD-011' },
  w12: { ws_id: 'W12', process: 'Assembly 2', machine: 'Robot', status: 'Idle', oee: '84', orders: 'ORD-012' },
  w13: { ws_id: 'W13', process: 'Fastening', machine: 'Nutrunner', status: 'Running', oee: '91', orders: 'ORD-013' },
  w14: { ws_id: 'W14', process: 'Alignment', machine: 'Vision', status: 'Running', oee: '95', orders: 'ORD-014' },
  w15: { ws_id: 'W15', process: 'Transfer', machine: 'Lift Conveyor', status: 'Down', oee: '60', orders: 'ORD-015' },
  w16: { ws_id: 'W16', process: 'Sub Assembly', machine: 'Robot', status: 'Idle', oee: '83', orders: 'ORD-016' },
  w17: { ws_id: 'W17', process: 'Inspection', machine: 'Vision', status: 'Running', oee: '96', orders: 'ORD-017' },
  w18: { ws_id: 'W18', process: 'Output', machine: 'Conveyor', status: 'Running', oee: '95', orders: 'ORD-018' },
  w19: { ws_id: 'W19', process: 'Input', machine: 'Conveyor', status: 'Running', oee: '95', orders: 'ORD-019' },
  w20: { ws_id: 'W20', process: 'Mount Prep', machine: 'Fixture', status: 'Running', oee: '90', orders: 'ORD-020' },
  w21: { ws_id: 'W21', process: 'Mounting', machine: 'Robot', status: 'Running', oee: '88', orders: 'ORD-021' },
  w22: { ws_id: 'W22', process: 'Fastening', machine: 'Nutrunner', status: 'Running', oee: '92', orders: 'ORD-022' },
  w23: { ws_id: 'W23', process: 'Fluid Connect', machine: 'Semi-auto', status: 'Idle', oee: '85', orders: 'ORD-023' },
  w24: { ws_id: 'W24', process: 'Electrical', machine: 'Hybrid', status: 'Running', oee: '89', orders: 'ORD-024' },
  w25: { ws_id: 'W25', process: 'Testing', machine: 'Diagnostic', status: 'Critical', oee: '75', orders: 'ORD-025' },
  w26: { ws_id: 'W26', process: 'Inspection', machine: 'Vision', status: 'Running', oee: '94', orders: 'ORD-026' },
  w27: { ws_id: 'W27', process: 'Dispatch', machine: 'Conveyor', status: 'Running', oee: '96', orders: 'ORD-027' },
};

export function GridEditor({ onSave, initialFactory, isAdmin = false, readOnly = false, layoutId = null }: GridEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const dragRef = useRef<{ type: 'pan' | 'wc' | 'area', id: string, areaId?: string, startX: number, startY: number, itemStartX: number, itemStartY: number } | null>(null);

  const [factory, setFactory] = useState(initialFactory || threeAssembliesFactory);
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [viewState, setViewState] = useState({ zoom: 0.25, panX: 60, panY: 60, time: 0, targetZoom: 0.25, targetPanX: 60, targetPanY: 60 });
  const [selectedWcId, setSelectedWcId] = useState<string | null>(null);
  const [hoveredWcId, setHoveredWcId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  
  // Dynamic Parameters State
  const [availableParameters, setAvailableParameters] = useState<any[]>([]);
  const [activeFilterIds, setActiveFilterIds] = useState<Record<string, boolean>>({ ws_id: true });
  const [dynamicWorkstationData, setDynamicWorkstationData] = useState<any>({});
  
  const [showGrid, setShowGrid] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);
  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});
  const [isPublicView, setIsPublicView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editStartRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('shared') === 'true') setIsPublicView(true);
    }
  }, []);

  // 1. Fetch Dynamic Parameters List (Columns from SQL)
  useEffect(() => {
    const fetchParams = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/parameters/sync');
        if (res.ok) {
          const data = await res.json();
          const params = data.parameters
            .filter((p: any) => p.visible === 'true')
            .map((p: any) => ({
              id: p.id,
              label: p.label,
              description: `Type: ${p.type}`
            }));
          setAvailableParameters(params);
          // Auto-enable new parameters if they aren't in state
          setActiveFilterIds(prev => {
            const next = { ...prev };
            params.forEach((p: any) => { if (next[p.id] === undefined) next[p.id] = true; });
            return next;
          });
        }
      } catch (err) {}
    };
    fetchParams();
    const intv = setInterval(fetchParams, 30000); // Check for config changes every 30s
    return () => clearInterval(intv);
  }, []);

  // 2. Fetch Live Data (Values from SQL Rows) & Initialize if needed
  useEffect(() => {
    if (!layoutId) return;

    const fetchAll = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/parameters/data?layoutId=${layoutId}`);
        if (res.ok) {
          setDynamicWorkstationData(await res.json());
        }
      } catch (err) {}
    };

    const initializeParams = async () => {
      if (!factory?.areas) return;
      const allWcs = factory.areas.flatMap((a: any) => a.lines.flatMap((l: any) => l.workCenters));
      try {
        await fetch('http://localhost:4000/api/parameters/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layoutId, workstations: allWcs })
        });
        fetchAll(); // Refresh after init
      } catch (err) {}
    };

    initializeParams();
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [layoutId, factory]);

  const allFilters = [
    { id: 'ws_id', label: 'Workstation ID', description: 'Unique identifier' },
    ...availableParameters
  ];

  const clampFactory = (f: any) => {
    f.areas.forEach((area: any) => {
      area.lines.forEach((line: any) => {
        line.workCenters.forEach((wc: any) => {
          wc.x = Math.max(area.x, Math.min(area.x + area.width - wc.width, wc.x));
          wc.y = Math.max(area.y, Math.min(area.y + area.height - wc.height, wc.y));
        });
      });
    });
    return f;
  };

  const updateFactory = (newFactory: any, recordHistory = true) => {
    const clamped = clampFactory({ ...newFactory });
    if (recordHistory) {
      setHistory(prev => [...prev.slice(-49), JSON.parse(JSON.stringify(factory))]);
      setRedoStack([]);
    }
    setFactory(clamped);
  };

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = JSON.parse(JSON.stringify(history[history.length - 1]));
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(factory))]);
    setHistory(prev => prev.slice(0, -1));
    setFactory(previous);
    setSelectedWcId(null);
    setSelectedAreaId(null);
  }, [history, factory]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = JSON.parse(JSON.stringify(redoStack[redoStack.length - 1]));
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(factory))]);
    setRedoStack(prev => prev.slice(0, -1));
    setFactory(next);
    setSelectedWcId(null);
    setSelectedAreaId(null);
  }, [redoStack, factory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleFitToScreen = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas || !factory) return;
    const pad = 200;
    const scale = Math.min((canvas.width - pad * 2) / factory.width, (canvas.height - pad * 2) / factory.height, 1.0);
    const targetZoom = Math.max(0.05, scale);
    setViewState(prev => ({ ...prev, targetZoom, targetPanX: (canvas.width - factory.width * targetZoom) / 2, targetPanY: (canvas.height - factory.height * targetZoom) / 2 }));
  }, [factory]);

  const downloadCSV = () => {
    const headers = factory.csvHeaders || [
      'area_name', 'area_x', 'area_y', 'area_width', 'area_length',
      'line_name', 'line_type',
      'ws_code', 'ws_name', 'ws_x', 'ws_y', 'ws_width', 'ws_length'
    ];

    const rows: string[] = [headers.join(',')];

    // Build a map of workstation ID to its first outgoing flow for CSV export
    const flowMap: Record<string, any> = {};
    (factory.flows || []).forEach((f: any) => {
      if (!flowMap[f.fromWsId]) flowMap[f.fromWsId] = f;
    });

    factory.areas.forEach((area: any) => {
      area.lines.forEach((line: any) => {
        line.workCenters.forEach((wc: any) => {
          // 1. Start with the original data from parameters to preserve all columns
          const rowData = { ...(wc.parameters || {}) };
          
          // 2. Map current editor values to specific headers
          headers.forEach(header => {
            const h = header.toLowerCase();
            
            // Factory Level
            if (h === 'factory_name') rowData[header] = factory.name;
            if (h === 'canvas_width') rowData[header] = factory.width;
            if (h === 'canvas_length') rowData[header] = factory.height;
            
            // Area Level
            if (h === 'area_name') rowData[header] = area.areaName;
            if (h === 'area_x') rowData[header] = Math.round(area.x);
            if (h === 'area_y') rowData[header] = Math.round(area.y);
            if (h === 'area_width') rowData[header] = Math.round(area.width);
            if (h === 'area_length') rowData[header] = Math.round(area.height);
            if (h === 'area_code') rowData[header] = area.areaId;
            
            // Line Level
            if (h === 'line_name') rowData[header] = line.lineName;
            if (h === 'line_type') rowData[header] = line.lineType || 'Straight';
            if (h === 'line_code') rowData[header] = line.lineId;
            
            // Workstation Level
            if (h === 'ws_code') rowData[header] = wc.workCenterId;
            if (h === 'ws_name') rowData[header] = wc.machineName || wc.name;
            if (h === 'ws_x') rowData[header] = Math.round(wc.x);
            if (h === 'ws_y') rowData[header] = Math.round(wc.y);
            if (h === 'ws_width') rowData[header] = Math.round(wc.width);
            if (h === 'ws_length') rowData[header] = Math.round(wc.height);
            if (h === 'seq') rowData[header] = wc.wsSequence || 0;
            if (h === 'detail') rowData[header] = wc.detail || '';

            // Flow Columns
            if (h === 'from_ws') rowData[header] = flowMap[wc.id]?.fromWsId || '';
            if (h === 'to_ws') rowData[header] = flowMap[wc.id]?.toWsId || '';
          });

          // 3. Construct CSV row based on header order
          const values = headers.map(header => {
            const val = rowData[header];
            if (val === undefined || val === null) return '';
            const valStr = val.toString();
            // Basic CSV escape
            if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
              return `"${valStr.replace(/"/g, '""')}"`;
            }
            return valStr;
          });
          rows.push(values.join(','));
        });
      });
    });

    const csvString = rows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.setAttribute('hidden', ''); a.setAttribute('href', url); a.setAttribute('download', `${factory.name}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadBlueprint = async (format: 'png' | 'pdf') => {
    const canvas = canvasRef.current;
    if (!canvas || !factory?.areas) return;
    
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const originalViewState = { ...viewState };
    
    // 1. Boost resolution for capture (3x supersampling for readability)
    const multiplier = 3;
    canvas.width = originalWidth * multiplier;
    canvas.height = originalHeight * multiplier;
    
    setIsCapturing(true);
    
    // 2. Calculate the actual bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    factory.areas.forEach((a: any) => {
      minX = Math.min(minX, a.x);
      minY = Math.min(minY, a.y);
      maxX = Math.max(maxX, a.x + a.width);
      maxY = Math.max(maxY, a.y + a.height);
    });

    if (minX !== Infinity) {
      const layoutW = maxX - minX;
      const layoutH = maxY - minY;
      const margin = 100; // Larger margin for the high-res capture
      
      const scale = Math.min(
        (canvas.width - margin * 2) / layoutW,
        (canvas.height - margin * 2) / layoutH
      );
      
      const captureZoom = Math.max(0.1, Math.min(scale, 5.0));
      const capturePanX = (canvas.width - layoutW * captureZoom) / 2 - minX * captureZoom;
      const capturePanY = (canvas.height - layoutH * captureZoom) / 2 - minY * captureZoom;

      setViewState(prev => ({
        ...prev,
        zoom: captureZoom,
        targetZoom: captureZoom,
        panX: capturePanX,
        targetPanX: capturePanX,
        panY: capturePanY,
        targetPanY: capturePanY
      }));
    }
    
    // Wait for the render loop to settle on the high-res canvas
    setTimeout(() => {
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${factory.name || 'factory_layout'}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${factory.name || 'factory_layout'}.pdf`);
      }
      
      // Restore original resolution and state
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      setIsCapturing(false);
      setViewState(originalViewState);
    }, 1500);
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('shared', 'true');
    return url.toString();
  };

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      setViewState(prev => ({
        ...prev,
        time: prev.time + delta,
        zoom: prev.zoom + (prev.targetZoom - prev.zoom) * (1 - Math.exp(-10 * delta)),
        panX: prev.panX + (prev.targetPanX - prev.panX) * (1 - Math.exp(-10 * delta)),
        panY: prev.panY + (prev.targetPanY - prev.panY) * (1 - Math.exp(-10 * delta)),
      }));
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current!);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { zoom, panX, panY } = viewState;

    ctx.fillStyle = (isAdmin || isPublicView) ? '#0b0f19' : '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      const drawG = (step: number, color: string, w: number) => {
        ctx.beginPath();
        const gs = step * zoom;
        const ox = ((panX % gs) + gs) % gs;
        const oy = ((panY % gs) + gs) % gs;
        for (let x = ox; x < canvas.width; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
        for (let y = oy; y < canvas.height; y += gs) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
      };
      drawG(50, 'rgba(30, 41, 59, 0.9)', 1);
    }

    const drawArrowhead = (tx: number, ty: number, angle: number, color: string) => {
      const size = 32 * zoom;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size / 1.5); ctx.lineTo(-size * 0.75, 0); ctx.lineTo(-size, size / 1.5);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
    };

    const drawPathWithArrow = (points: {x: number, y: number}[], color: string, isDashed: boolean, targetSize: {w: number, h: number}) => {
      if (points.length < 2) return;
      const last = points[points.length - 1]; const prev = points[points.length - 2];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const cos = Math.abs(Math.cos(angle)); const sin = Math.abs(Math.sin(angle));
      const dist = Math.min((targetSize.w / 2) / cos, (targetSize.h / 2) / sin);
      const realLast = { x: last.x - dist * Math.cos(angle), y: last.y - dist * Math.sin(angle) };
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) { ctx.lineTo(points[i].x, points[i].y); }
      ctx.lineTo(realLast.x, realLast.y);
      ctx.strokeStyle = color; ctx.lineWidth = 4 * zoom;
      if (isDashed) { ctx.setLineDash([16 * zoom, 12 * zoom]); ctx.lineDashOffset = -viewState.time * 35 * zoom; }
      ctx.stroke(); ctx.setLineDash([]);
      drawArrowhead(realLast.x, realLast.y, angle, color);
    };

    factory.areas.forEach((area: any) => {
      const ax = area.x * zoom + panX; const ay = area.y * zoom + panY;
      const aw = area.width * zoom; const ah = area.height * zoom;
      const isSelectedArea = area.id === selectedAreaId;
      
      // --- ROBUST COLLISION RESOLUTION (Zero-Overlap Plotting) ---
      const resolvedWcs: any[] = [];
      area.lines?.forEach((line: any) => {
        line.workCenters?.forEach((wc: any) => {
          let nx = wc.x; let ny = wc.y;
          const pad = 30; // Clean architectural padding
          
          // Iterative resolution to handle complex clusters (max 10 passes)
          for (let pass = 0; pass < 10; pass++) {
            let collided = false;
            for (const other of resolvedWcs) {
              const ox = (nx < other.x + other.width + pad) && (nx + wc.width + pad > other.x);
              const oy = (ny < other.y + other.height + pad) && (ny + wc.height + pad > other.y);
              
              if (ox && oy) {
                collided = true;
                // Smart Shift Strategy
                if (nx + wc.width + pad < area.x + area.width) {
                  nx = other.x + other.width + pad; // Shift Right
                } else if (ny + wc.height + pad < area.y + area.height) {
                  ny = other.y + other.height + pad; // Shift Down
                } else {
                  nx = other.x - wc.width - pad; // Shift Left
                }
              }
            }
            if (!collided) break;
          }
          resolvedWcs.push({ ...wc, x: nx, y: ny });
        });
      });

      // Draw Area
      ctx.fillStyle = isSelectedArea ? 'rgba(148, 163, 184, 0.08)' : 'rgba(30, 41, 59, 0.4)';
      roundRect(ctx, ax, ay, aw, ah, 12 * zoom); ctx.fill();
      ctx.strokeStyle = isSelectedArea ? '#94a3b8' : '#334155'; ctx.lineWidth = (isSelectedArea ? 2 : 1.5) * zoom; 
      roundRect(ctx, ax, ay, aw, ah, 12 * zoom); ctx.stroke();
      ctx.fillStyle = isSelectedArea ? '#f1f5f9' : '#64748b'; ctx.font = `bold ${Math.max(10, 16 * zoom)}px Inter`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(area.areaName.toUpperCase(), ax + 20 * zoom, ay + 20 * zoom);

      // Draw Resolved Workstations
      resolvedWcs.forEach((wc: any) => {
          const isSelected = wc.id === selectedWcId;
          const isHovered = wc.id === hoveredWcId;
          const _id = (wc.id || '').toLowerCase();
          const excelData = dynamicWorkstationData[_id] || dynamicWorkstationData['w' + _id] || wc.parameters || EXCEL_WORKSTATIONS['w' + _id.replace(/^w/, '')];
          
          const status = (excelData?.status || 'Running').toLowerCase();
          let color = '#10b981'; if (status === 'idle') color = '#f59e0b'; else if (status === 'down' || status === 'critical') color = '#ef4444';

          const ww = wc.width * zoom; const wh = wc.height * zoom;

          // --- BOUNDARY CLAMP ---
          const minX = ax + 10 * zoom; const maxX = ax + aw - ww - 10 * zoom;
          const minY = ay + 10 * zoom; const maxY = ay + ah - wh - 10 * zoom;
          const wx = Math.max(minX, Math.min(maxX, wc.x * zoom + panX));
          const wy = Math.max(minY, Math.min(maxY, wc.y * zoom + panY));
          // ---------------------

          ctx.fillStyle = (isSelected || isHovered) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.98)';
          ctx.strokeStyle = isSelected ? '#38bdf8' : (isHovered ? '#fff' : color); ctx.lineWidth = (isSelected ? 4 : 3) * zoom;
          roundRect(ctx, wx, wy, ww, wh, 8 * zoom); ctx.fill(); ctx.stroke();

          // --- ADAPTIVE PARAMETER RENDERING ---
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const wsIdText = wc.workCenterId || wc.name || '';
          
          if (activeFilterIds['ws_id']) { 
            ctx.fillStyle = '#ffffff'; 
            // Remove Math.max floor during capture to maintain proportions
            const idFontSize = isCapturing ? (36 * zoom) : Math.max(12, 36 * zoom);
            ctx.font = `bold ${idFontSize}px Inter`; 
            if (zoom < 0.4 && !isCapturing) ctx.font = `bold ${Math.max(20, 48 * zoom)}px Inter`;
            ctx.fillText(wsIdText, wx + ww / 2, wy + wh / 2); 
          }
          
          // --- PERSISTENT SIDE-CARD RENDERING (Adaptive Positioning) ---
          const shouldShowCard = zoom > 0.8 || isHovered || isCapturing;
          
          if (shouldShowCard) {
             const cardW = 160 * zoom; 
             const cardH = 80 * zoom;
             const padding = 10 * zoom;
             
             // 1. SMART POSITIONING BASED ON FLOW DIRECTION
             // Detect outgoing flow direction for this workstation
             const outFlow = (factory.flows || []).find((f: any) => f.fromWsId === wc.id);
             let cardPos = 'right'; // Default
             
             if (outFlow) {
                const target = allWcs[outFlow.toWsId];
                if (target) {
                   const fdx = target.x - wc.x;
                   const fdy = target.y - wc.y;
                   // If flow is mostly horizontal to the right, move box ABOVE
                   if (fdx > 50 && Math.abs(fdx) > Math.abs(fdy)) {
                      cardPos = 'top';
                   } 
                   // If flow is mostly vertical downwards, keep box RIGHT
                   else if (fdy > 50 && Math.abs(fdy) > Math.abs(fdx)) {
                      cardPos = 'right';
                   }
                }
             }

             let cx, cy;
             if (cardPos === 'top') {
                cx = wx + ww / 2 - cardW / 2;
                cy = wy - cardH - 15 * zoom;
             } else {
                // Default: Right side
                cx = wx + ww + 15 * zoom;
                cy = wy + wh / 2 - cardH / 2;
             }

             // Handle canvas boundary collisions (push left if overflowing right)
             if (cx + cardW > canvas.width - 20) cx = wx - cardW - 15 * zoom;

             ctx.save();
             // Glassmorphism effect
             ctx.shadowBlur = 10 * zoom; ctx.shadowColor = 'rgba(0,0,0,0.2)';
             ctx.fillStyle = isHovered ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.75)';
             roundRect(ctx, cx, cy, cardW, cardH, 10 * zoom); ctx.fill();
             ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(255,255,255,0.1)'; 
             ctx.lineWidth = 1 * zoom; ctx.stroke();
             ctx.restore();

             // Card Content
             const headerFS = isCapturing ? (13 * zoom) : Math.max(9, 13 * zoom);
             ctx.fillStyle = '#fff'; ctx.font = `bold ${headerFS}px Inter`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
             ctx.fillText(wsIdText, cx + padding, cy + padding);
             
             ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + cardW - padding - 3*zoom, cy + padding + 5*zoom, 3 * zoom, 0, Math.PI*2); ctx.fill();
             
             let tyOff = padding + 18 * zoom;
             const visibleParams = availableParameters.filter(p => activeFilterIds[p.id]);
             
             visibleParams.slice(0, 3).forEach(p => {
               const v = excelData?.[p.id] || 'N/A';
               const displayVal = (p.id === 'oee') ? `${v}%` : v.toString();
               
               const labelFS = isCapturing ? (9 * zoom) : Math.max(7, 9 * zoom);
               ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = `600 ${labelFS}px Inter`;
               ctx.fillText(`${p.label}:`, cx + padding, cy + tyOff);
               
               ctx.fillStyle = '#fff'; ctx.font = `bold ${labelFS}px Inter`;
               const labelWidth = ctx.measureText(`${p.label}:`).width;
               ctx.fillText(displayVal, cx + padding + labelWidth + 4*zoom, cy + tyOff);
               
               tyOff += 14 * zoom;
             });
          }
        });
      });

    // ── 3. Dynamic Flows (CSV Driven) ───────────────────────────
    const allWcs: Record<string, any> = {};
    factory.areas.forEach((a: any) => a.lines.forEach((l: any) => l.workCenters.forEach((w: any) => {
      allWcs[w.id] = { ...w, area: a };
    })));

    (factory.flows || []).forEach((flow: any, fIdx: number) => {
      const from = allWcs[flow.fromWsId];
      const to = allWcs[flow.toWsId];
      if (!from || !to) return;

      const isInternal = from.area.id === to.area.id;
      const flowColor = isInternal ? '#fbbf24' : '#ef4444';
      
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      let fx, fy, tx, ty;
      // Define Entry/Exit side
      if (Math.abs(dx) > Math.abs(dy)) {
        fx = (dx > 0 ? (from.x + from.width) : from.x) * zoom + panX;
        fy = (from.y + from.height / 2) * zoom + panY;
        tx = (dx > 0 ? to.x : (to.x + to.width)) * zoom + panX;
        ty = (to.y + to.height / 2) * zoom + panY;
      } else {
        fx = (from.x + from.width / 2) * zoom + panX;
        fy = (dy > 0 ? (from.y + from.height) : from.y) * zoom + panY;
        tx = (to.x + to.width / 2) * zoom + panX;
        ty = (dy > 0 ? to.y : (to.y + to.height)) * zoom + panY;
      }

      let path: { x: number; y: number }[] = [{ x: fx, y: fy }];
      const laneSpace = (fIdx % 6 + 1) * 20 * zoom;

      // PRIORITY ROUTING based on distance and alignment
      if (isInternal || dist < 500) {
        // --- Short Distance: Straight or L-Shape ---
        if (Math.abs(fy - ty) < 20 || Math.abs(fx - tx) < 20) {
          path.push({ x: tx, y: ty }); // Straight
        } else {
          // L-Shape (Direct)
          path.push({ x: tx, y: fy });
          path.push({ x: tx, y: ty });
        }
      } else {
        // --- Long Distance: U-Shape or Inverted U-Shape (Corridor) ---
        const useTop = dy < 0; 
        const perimeterY = useTop 
          ? (from.area.y - 40) * zoom + panY - laneSpace 
          : (from.area.y + from.area.height + 40) * zoom + panY + laneSpace;
        
        path.push({ x: fx, y: perimeterY });
        path.push({ x: tx, y: perimeterY });
        path.push({ x: tx, y: ty });
      }

      drawPathWithArrow(path, flowColor, true, { w: to.width * zoom, h: to.height * zoom });
    });
  }, [factory, viewState, showGrid, activeFilterIds, dynamicWorkstationData, selectedAreaId, selectedWcId, isAdmin, isPublicView, hoveredWcId, isCapturing]);

  const selectedArea = factory.areas.find((a: any) => a.id === (selectedAreaId || ''));
  const selectedWc = factory.areas.flatMap((a: any) => a.lines.flatMap((l: any) => l.workCenters)).find((w: any) => w.id === (selectedWcId || ''));

  const syncLocalInputs = useCallback(() => {
    if (selectedWc) {
      setLocalInputs({ x: Math.round(selectedWc.x).toString(), y: Math.round(selectedWc.y).toString(), width: Math.round(selectedWc.width).toString(), height: Math.round(selectedWc.height).toString(), ws_id: selectedWc.ws_id || selectedWc.name });
    } else if (selectedArea) {
      setLocalInputs({ x: Math.round(selectedArea.x).toString(), y: Math.round(selectedArea.y).toString(), width: Math.round(selectedArea.width).toString(), height: Math.round(selectedArea.height).toString(), lineType: selectedArea.lineType || 'Straight' });
    }
  }, [selectedWc, selectedArea]);

  useEffect(() => { syncLocalInputs(); }, [selectedWcId, selectedAreaId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAdmin || readOnly || isPublicView) {
      dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY };
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const mouseX = (e.clientX - rect.left - viewState.panX) / viewState.zoom;
    const mouseY = (e.clientY - rect.top - viewState.panY) / viewState.zoom;
    
    // Capture state for history before potential drag
    const initialState = JSON.parse(JSON.stringify(factory));

    for (const area of factory.areas) {
      for (const line of area.lines || []) {
        for (const wc of line.workCenters || []) {
          if (mouseX >= wc.x && mouseX <= wc.x + wc.width && mouseY >= wc.y && mouseY <= wc.y + wc.height) {
            dragRef.current = { type: 'wc', id: wc.id, areaId: area.id, startX: e.clientX, startY: e.clientY, itemStartX: wc.x, itemStartY: wc.y, initialState } as any;
            setSelectedWcId(wc.id); setSelectedAreaId(area.id); return;
          }
        }
      }
    }
    dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY } as any;
    setSelectedWcId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !factory) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Hover Detection
    let foundHover = null;
    const { zoom, panX, panY } = viewState;
    for (const area of factory.areas) {
      for (const line of area.lines) {
        for (const wc of line.workCenters) {
          const wx = wc.x * zoom + panX;
          const wy = wc.y * zoom + panY;
          const ww = wc.width * zoom;
          const wh = wc.height * zoom;
          if (mx >= wx && mx <= wx + ww && my >= wy && my <= wy + wh) {
            foundHover = wc.id;
            break;
          }
        }
        if (foundHover) break;
      }
      if (foundHover) break;
    }
    setHoveredWcId(foundHover);

    if (!dragRef.current) return;
    const { type, itemStartX, itemStartY, areaId, id } = dragRef.current;
    const dx = (e.clientX - dragRef.current.startX) / (type === 'pan' ? 1 : viewState.zoom);
    const dy = (e.clientY - dragRef.current.startY) / (type === 'pan' ? 1 : viewState.zoom);
    if (type === 'pan') {
      setViewState(p => ({ ...p, targetPanX: itemStartX + dx, targetPanY: itemStartY + dy }));
    } else if (type === 'wc' && !isAdmin && !readOnly && !isPublicView) {
      const newFactory = { ...factory };
      const area = newFactory.areas.find((a: any) => a.id === areaId);
      const wc = area?.lines[0].workCenters.find((w: any) => w.id === id);
      if (wc && area) {
        const targetX = itemStartX + dx; const targetY = itemStartY + dy;
        let collision = false;
        area.lines[0].workCenters.forEach((other: any) => { if (other.id !== id) { const pad = 20; if (targetX < other.x + other.width + pad && targetX + wc.width > other.x - pad && targetY < other.y + other.height + pad && targetY + wc.height > other.y - pad) collision = true; } });
        if (!collision) { wc.x = Math.max(area.x, Math.min(area.x + area.width - wc.width, targetX)); wc.y = Math.max(area.y, Math.min(area.y + area.height - wc.height, targetY)); updateFactory(newFactory, false); }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => { 
    if (dragRef.current && (dragRef.current as any).type !== 'pan') { 
      const stateToRecord = (dragRef.current as any).initialState;
      const startX = dragRef.current.startX;
      const startY = dragRef.current.startY;

      // Only record history if something actually moved
      if (Math.abs(e.clientX - startX) > 2 || Math.abs(e.clientY - startY) > 2) {
        setHistory(prev => [...prev.slice(-49), stateToRecord]);
        setRedoStack([]);
      }
      syncLocalInputs(); 
    } 
    dragRef.current = null; 
  };



  const deleteArea = (id: string) => {
    updateFactory({ ...factory, areas: factory.areas.filter((a: any) => a.id !== id) });
    if (selectedAreaId === id) setSelectedAreaId(null);
  };

  const addWorkstation = (areaId: string) => {
    const newFactory = JSON.parse(JSON.stringify(factory));
    const area = newFactory.areas.find((a: any) => a.id === areaId);
    if (!area) return;
    
    const wsId = Math.random().toString(36).substr(2, 9);
    
    // Initialize parameters with all headers to ensure consistent CSV structure
    const parameters: any = { lastUpdated: new Date() };
    if (factory.csvHeaders) {
      factory.csvHeaders.forEach((h: string) => parameters[h] = '');
    }

    const newWc = {
      id: wsId,
      workCenterId: `W${area.lines[0].workCenters.length + 1}`,
      name: `WS ${area.lines[0].workCenters.length + 1}`,
      machineName: `WS ${area.lines[0].workCenters.length + 1}`,
      x: area.x + 50,
      y: area.y + 100,
      width: 100,
      height: 100,
      status: 'Running',
      parameters: parameters
    };
    
    area.lines[0].workCenters.push(newWc);
    updateFactory(newFactory);
    setSelectedWcId(wsId);
  };

  const deleteWc = (id: string) => {
    const newFactory = JSON.parse(JSON.stringify(factory));
    newFactory.areas.forEach((a: any) => {
      a.lines.forEach((l: any) => {
        l.workCenters = l.workCenters.filter((w: any) => w.id !== id);
      });
    });
    newFactory.flows = (newFactory.flows || []).filter((f: any) => f.fromWsId !== id && f.toWsId !== id);
    updateFactory(newFactory);
    if (selectedWcId === id) setSelectedWcId(null);
  };

  const autoLayoutArea = (area: any, type: string) => {
    const wcs = area.lines[0].workCenters; const startX = area.x + 80; const startY = area.y + 100; const step = 140;
    if (type === 'Straight') { wcs.forEach((wc: any, i: number) => { wc.x = startX + i * step; wc.y = startY + 120; }); }
    else if (type === 'L-Type') { const mid = Math.ceil(wcs.length / 2); wcs.forEach((wc: any, i: number) => { if (i < mid) { wc.x = startX; wc.y = startY + i * step; } else { wc.x = startX + (i - mid + 1) * step; wc.y = startY + (mid - 1) * step; } }); }
    else if (type === 'U-Type') { const seg = Math.ceil(wcs.length / 3); wcs.forEach((wc: any, i: number) => { if (i < seg) { wc.x = startX; wc.y = startY + i * step; } else if (i < 2 * seg) { wc.x = startX + (i - seg + 1) * step; wc.y = startY + (seg - 1) * step; } else { wc.x = startX + (seg) * step; wc.y = startY + (seg - 1) * step - (i - 2 * seg + 1) * step; } }); }
    else if (type === 'Inverted-U') { const seg = Math.ceil(wcs.length / 3); wcs.forEach((wc: any, i: number) => { if (i < seg) { wc.x = startX; wc.y = startY + (seg - 1) * step - i * step; } else if (i < 2 * seg) { wc.x = startX + (i - seg + 1) * step; wc.y = startY; } else { wc.x = startX + (seg) * step; wc.y = startY + (i - 2 * seg + 1) * step; } }); }
  };

  const updateSelectedItem = (key: string, rawVal: string) => {
    if (isAdmin || readOnly || isPublicView) return;
    setLocalInputs(p => ({ ...p, [key]: rawVal }));
    const val = parseInt(rawVal); if (isNaN(val) && key !== 'ws_id' && key !== 'lineType') return;
    const newFactory = { ...factory };
    if (selectedWcId) { newFactory.areas.forEach((a: any) => a.lines.forEach((l: any) => l.workCenters.forEach((wc: any) => { if (wc.id === selectedWcId) { if (key === 'x') wc.x = Math.max(a.x, Math.min(a.x + a.width - wc.width, val)); else if (key === 'y') wc.y = Math.max(a.y, Math.min(a.y + a.height - wc.height, val)); else if (key === 'width') wc.width = Math.max(40, Math.min(val, a.x + a.width - wc.x)); else if (key === 'height') wc.height = Math.max(40, Math.min(val, a.y + a.height - wc.y)); else if (key === 'ws_id') wc.ws_id = rawVal; else wc[key] = val; } }))); }
    else if (selectedAreaId) { const area = newFactory.areas.find((a: any) => a.id === selectedAreaId); if (area) { if (key === 'width' || key === 'height') { let minW = 200, minH = 200; area.lines.forEach((l: any) => l.workCenters.forEach((wc: any) => { minW = Math.max(minW, wc.x + wc.width - area.x + 20); minH = Math.max(minH, wc.y + wc.height - area.y + 20); })); if (key === 'width') area.width = Math.max(minW, val); if (key === 'height') area.height = Math.max(minH, val); } else if (key === 'x' || key === 'y') { const diff = val - (key === 'x' ? area.x : area.y); area[key] = val; area.lines.forEach((l: any) => l.workCenters.forEach((wc: any) => { if (key === 'x') wc.x += diff; else wc.y += diff; })); } else if (key === 'lineType') { area.lineType = rawVal; autoLayoutArea(area, rawVal); } else area[key] = val; } }
    updateFactory(newFactory, false); // Don't record on every keystroke
  };

  const handleInputFocus = () => {
    editStartRef.current = JSON.parse(JSON.stringify(factory));
  };

  const handleInputBlur = () => {
    if (editStartRef.current) {
      const currentStr = JSON.stringify(factory);
      const startStr = JSON.stringify(editStartRef.current);
      if (currentStr !== startStr) {
        setHistory(prev => [...prev.slice(-49), editStartRef.current]);
        setRedoStack([]);
      }
    }
    editStartRef.current = null;
    syncLocalInputs();
  };

  const handleReviewAction = async (action: 'approve' | 'reject' | 'push') => {
    if (!layoutId) return alert("No Layout ID found for this session.");
    try {
      const endpoint = action === 'push' ? 'comment' : action;
      
      // Determine if we should hit the local Next.js API or the SQL Backend
      // Local drafts use UUIDs (with dashes), SQL Backend uses Integers
      const isLocal = layoutId.toString().includes('-');
      const baseUrl = isLocal ? '/api' : 'http://localhost:4000/api';
      
      const res = await fetch(`${baseUrl}/layouts/${layoutId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          admin_comments: adminComment, 
          adminComments: adminComment, // Compatibility with local store
          status: action === 'push' ? 'pushed' : (action === 'reject' ? 'rejected' : 'approved'),
          reviewedBy: 'Admin',
          reviewed_by: 'Admin'
        })
      });

      if (res.ok) {
        let msg = "Action successful!";
        if (action === 'push') msg = "Layout pushed back to developer with feedback!";
        else if (action === 'approve') msg = "Layout officially approved!";
        else if (action === 'reject') msg = "Layout rejected.";
        
        alert(msg);
        window.location.href = '/admin';
      } else {
        alert("Server error. Could not complete the action.");
      }
    } catch (err) {
      alert("Network error. Please check your connection to the backend.");
    }
  };

  if (isAdmin || readOnly || isPublicView) {
    return (
      <div className="flex flex-1 flex-col relative bg-[#060b14] overflow-hidden w-full h-full font-sans">
        <div ref={containerRef} className="flex-1 overflow-hidden z-10 flex items-center justify-center">
          <canvas ref={canvasRef} className="block cursor-grab active:cursor-grabbing w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={e => setViewState(p => ({ ...p, targetZoom: Math.max(0.35, Math.min(3, p.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1))) }))} />
        </div>
        <div className="absolute top-[380px] left-8 z-20 w-[240px] flex flex-col gap-5 bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl p-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3 mb-1">Architectural Legend</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-4 border-2 border-[#10b981] rounded-sm group-hover:scale-110 transition-transform"></div><span>Workstation</span></div>
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-0.5 border-t-2 border-dashed border-[#f59e0b] group-hover:translate-x-1 transition-transform"></div><span className="text-[#f59e0b]">Internal Flow</span></div>
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-0.5 border-t-2 border-dashed border-[#ef4444] group-hover:translate-x-1 transition-transform"></div><span className="text-[#ef4444]">Outer Flow</span></div>
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-4 border-2 border-dashed border-slate-700 rounded-sm group-hover:scale-110 transition-transform"></div><span>Area Bound</span></div>
          </div>
        </div>
        <div className="absolute top-[110px] left-8 z-20 w-[280px] bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl p-6">
          <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-indigo-400" /> Display Parameters</h3>
          <div className="space-y-4">{allFilters.map(f => (<label key={f.id} className="flex items-start gap-4 p-2 hover:bg-[#1e293b]/50 rounded-xl cursor-pointer transition-colors group"><input type="checkbox" checked={activeFilterIds[f.id]} onChange={() => setActiveFilterIds(p => ({ ...p, [f.id]: !p[f.id] }))} className="mt-0.5 h-4.5 w-4.5 accent-indigo-500 rounded border-slate-700 bg-slate-900" /><div className="flex flex-col gap-0.5"><span className="text-[12px] font-bold text-slate-200 group-hover:text-white">{f.label}</span><span className="text-[10px] text-slate-500">{f.description}</span></div></label>))}</div>
        </div>
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-8 bg-gradient-to-b from-[#060b14] via-[#060b14]/80 to-transparent">
          <div className="flex items-center gap-8"><Button onClick={() => window.location.href = isPublicView ? '/' : '/admin'} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl h-12 px-6 font-bold shadow-xl hover:bg-[#334155] transition-all active:scale-95"><ArrowLeft className="mr-3 h-5 w-5" /> {isPublicView ? 'Exit View' : 'Back to Console'}</Button><div className="h-10 w-px bg-slate-800"></div><div><h2 className="text-white font-bold text-2xl tracking-tight mb-1">{factory?.name || 'Blueprint Reviewer'} <span className="text-slate-500 font-medium ml-2">ID-{layoutId}</span></h2><p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> {isPublicView ? 'Public Shared View' : 'Mandatory Review Mode (View Only)'}</p></div></div>
          <div className="flex gap-4">
            <Button onClick={() => navigator.clipboard.writeText(getShareUrl()).then(() => setShareMsg(true))} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl h-12 px-6 font-bold shadow-xl hover:bg-[#334155]">{shareMsg ? 'Link Copied ✓' : 'Share URL'}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-indigo-600 text-white rounded-xl h-12 px-6 font-bold shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                  <Download className="h-4 w-4" /> Download Blueprint
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0f172a] border-[#1e293b] text-white p-2 rounded-xl shadow-2xl">
                <DropdownMenuItem onClick={() => downloadBlueprint('png')} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-indigo-600 rounded-lg transition-colors">
                  <FileImage className="h-4 w-4" /> Export as PNG Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadBlueprint('pdf')} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-indigo-600 rounded-lg transition-colors">
                  <FileType className="h-4 w-4" /> Export as PDF Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {!isPublicView && isAdmin && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-5xl z-20 flex flex-col gap-5 bg-[#0f172a]/98 backdrop-blur-xl border border-[#1e293b] p-8 rounded-3xl shadow-2xl ring-1 ring-white/5">
            <div className="flex justify-between items-center px-1"><h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><MessageSquare className="h-4 w-4 text-indigo-400" /> Reviewer Feedback</h3><div className="flex gap-2 items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest"><div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div> Secure Session</div></div>
            <div className="flex gap-4 items-center"><input type="text" value={adminComment} onChange={e => setAdminComment(e.target.value)} className="flex-1 bg-[#0b1120] border border-[#1e293b] rounded-2xl px-6 py-5 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600" placeholder="Type your detailed architectural feedback here..." /><Button onClick={() => handleReviewAction('push')} className="bg-[#3f83f8] hover:bg-[#2563eb] text-white px-8 h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"><Send className="h-4 w-4" /> Push to Dev</Button><Button onClick={() => handleReviewAction('approve')} className="bg-[#10b981] hover:bg-[#059669] text-white px-8 h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Approve</Button><Button onClick={() => handleReviewAction('reject')} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-8 h-16 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all active:scale-95">Reject</Button></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#f8fafc] font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shadow-sm z-30">
        <div className="flex items-center gap-3"><LayoutGrid className="h-6 w-6 text-slate-700" /><span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Layout Editor</span></div>
        <div className="h-6 w-px bg-slate-200 mx-2"></div><span className="text-sm font-bold text-slate-500">{factory?.name}</span><div className="flex-1" /><div className="mr-4 px-4 py-1.5 bg-slate-100 rounded-lg border border-slate-200"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Layout ID-</span><span className="text-xs font-bold text-slate-600">{layoutId}</span></div><Button onClick={() => { if (onSave) onSave(factory); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); }} className="bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-slate-100"><Save className="h-4 w-4 mr-2" /> {savedMsg ? 'Layout Saved!' : 'Save Layout'}</Button>
      </div>

      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-3 z-30">
        <Button onClick={() => window.location.href = '/developer'} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview</Button>
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        <input 
          type="file" 
          id="csv-upload" 
          className="hidden" 
          accept=".csv" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name.replace('.csv', ''));

            try {
              const response = await fetch('/api/layouts', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) throw new Error('Upload failed');
              const result = await response.json();
              
              // Visualize immediately
              updateFactory(result.factory);
              
              // Notify parent of new ID and Name
              if (onLayoutIdChange) {
                onLayoutIdChange(result.id, result.name || file.name.replace('.csv', ''));
              }
              
              // If we have a router, we could update the URL, but local update is what they asked for
              setSavedMsg(true);
              setTimeout(() => setSavedMsg(false), 3000);
            } catch (err) {
              console.error('Failed to upload layout', err);
              alert('Failed to upload layout. Please check the file format.');
            }
          }} 
        />
        <Button onClick={() => document.getElementById('csv-upload')?.click()} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white"><Upload className="h-4 w-4 mr-2" /> Upload CSV</Button>
        <Button onClick={downloadCSV} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white"><Download className="h-4 w-4 mr-2" /> Download CSV</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-xl border-slate-200 text-indigo-600 font-bold hover:bg-indigo-50 flex items-center gap-2">
              <Download className="h-4 w-4" /> Download Blueprint
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border-slate-200 text-slate-700 p-2 rounded-xl shadow-2xl">
            <DropdownMenuItem onClick={() => downloadBlueprint('png')} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
              <FileImage className="h-4 w-4" /> Export as PNG Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadBlueprint('pdf')} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
              <FileType className="h-4 w-4" /> Export as PDF Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <Button onClick={() => setViewState(p => ({ ...p, targetZoom: Math.max(0.05, p.targetZoom / 1.2) }))} variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><ZoomOut className="h-4 w-4" /></Button><div className="flex items-center px-3 text-[11px] font-bold text-slate-400 min-w-[50px] justify-center">{Math.round(viewState.zoom * 100)}%</div><Button onClick={() => setViewState(p => ({ ...p, targetZoom: Math.min(3, p.targetZoom * 1.2) }))} variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><ZoomIn className="h-4 w-4" /></Button>
        </div>
        <Button onClick={handleFitToScreen} variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 shadow-sm hover:bg-white"><Maximize2 className="h-4 w-4" /></Button>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <Button onClick={undo} disabled={history.length === 0} variant="ghost" size="icon" className="h-9 w-9 text-slate-500 disabled:opacity-30"><Undo2 className="h-4 w-4" /></Button>
          <Button onClick={redo} disabled={redoStack.length === 0} variant="ghost" size="icon" className="h-9 w-9 text-slate-500 disabled:opacity-30"><Redo2 className="h-4 w-4" /></Button>
        </div>
        <Button onClick={() => setShowGrid(!showGrid)} variant={showGrid ? "default" : "outline"} className={`rounded-xl font-bold h-11 ${showGrid ? 'bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-white'}`}><Grid3x3 className="h-4 w-4 mr-2" /> Grid</Button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm overflow-y-auto">
          <div className="p-6 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4"><h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-slate-600" /> Structure Inspector</h3><span className="text-[9px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 uppercase">Editor</span></div>
              <div className="space-y-6">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search areas or units..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-slate-400 transition-all" /></div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Options</h4>
                  <div className="space-y-3">{allFilters.map(f => (<label key={f.id} className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={activeFilterIds[f.id]} onChange={() => setActiveFilterIds(p => ({ ...p, [f.id]: !p[f.id] }))} className="h-4 w-4 accent-slate-900 rounded border-slate-300" /><span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{f.label}</span></label>))}</div>
                </div>
              </div>
            </div>

            {(selectedArea || selectedWc) && (
              <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-300 border border-slate-800">
                <div className="flex items-center gap-3 mb-8"><div className="p-2.5 rounded-xl bg-white/10 text-white shadow-inner">{selectedWc ? <Activity className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}</div><div><h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedWc ? selectedWc.name : selectedArea?.areaName}</h4><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedWc ? 'Workstation' : 'Assembly Area'}</p></div></div>
                <div className="space-y-6">
                  {selectedArea && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Line Routing Type</label>
                      <select value={localInputs.lineType || 'Straight'} onChange={e => updateSelectedItem('lineType', e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-slate-500 appearance-none cursor-pointer">
                        <option value="Straight">Straight Line</option>
                        <option value="L-Type">L Type</option>
                        <option value="U-Type">U Type</option>
                        <option value="Inverted-U">Inverted U Type</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">X Pos</label><input type="text" value={localInputs.x || ''} onChange={e => updateSelectedItem('x', e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-slate-500 transition-all" /></div>
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Y Pos</label><input type="text" value={localInputs.y || ''} onChange={e => updateSelectedItem('y', e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-slate-500 transition-all" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Width</label><input type="text" value={localInputs.width || ''} onChange={e => updateSelectedItem('width', e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-slate-500 transition-all" /></div>
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Height</label><input type="text" value={localInputs.height || ''} onChange={e => updateSelectedItem('height', e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-slate-500 transition-all" /></div>
                  </div>
                  <div className="pt-4 flex">
                    <Button onClick={() => { setSelectedWcId(null); setSelectedAreaId(null); }} className="w-full rounded-2xl bg-white text-slate-900 border border-slate-200 font-black uppercase text-[10px] tracking-widest h-12 hover:bg-slate-50 shadow-sm transition-all active:scale-[0.98]">Done Editing</Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Assembly Units</h3>
              </div>
              <div className="space-y-2">
                {factory.areas.map((area: any) => (
                  <div key={area.id} className="flex flex-col gap-1">
                    <div onClick={() => { setSelectedAreaId(area.id); setSelectedWcId(null); }} className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group ${selectedAreaId === area.id ? 'bg-white border-slate-900 shadow-lg ring-1 ring-slate-100' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}><div className="flex items-center gap-3"><input type="checkbox" checked={selectedAreaId === area.id} readOnly className="h-4 w-4 accent-slate-900 rounded border-slate-300" /><span className={`text-xs font-black uppercase tracking-wide transition-colors ${selectedAreaId === area.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>{area.areaName}</span></div><ChevronRight className={`h-4 w-4 transition-all ${selectedAreaId === area.id ? 'text-slate-900 translate-x-1' : 'text-slate-300'}`} /></div>
                    {selectedAreaId === area.id && (
                      <div className="px-2 pb-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                        <div className="w-full h-1 bg-slate-50/50 rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 relative bg-[#0f172a] cursor-crosshair">
          <canvas ref={canvasRef} className="w-full h-full block" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={e => setViewState(p => ({ ...p, targetZoom: Math.max(0.05, Math.min(5, p.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1))) }))} />
          <div className="absolute bottom-6 left-6 flex items-center gap-6 px-6 py-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl z-20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><Move className="h-4 w-4 text-slate-400" /> Pan: Click Space & Drag</div><div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><Search className="h-4 w-4 text-slate-400" /> Zoom: Scroll</div><div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><Maximize2 className="h-4 w-4 text-slate-400" /> Move Machine: Drag Inside Area</div>
          </div>
        </div>
      </div>
    </div>
  );
}
