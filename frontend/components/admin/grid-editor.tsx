'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { ZoomIn, ZoomOut, Maximize2, Grid3x3, RotateCcw, Save, ArrowLeft, Move, X, Upload, Download, ChevronRight, ChevronDown, AlignJustify, LayoutGrid, MessageSquare, Check, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { threeAssembliesFactory } from '@/lib/three-assemblies';

interface GridEditorProps {
  onSave?: (factory: any) => void;
  initialFactory?: any;
  isAdmin?: boolean;
  readOnly?: boolean;
  layoutId?: string | null;
}

// Rounded Rectangle Utility (mirrors dashboard)
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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

// Helper: Get first and last workstations per area based on wsSequence
function getAreaBoundaryWorkcenters(factory: any) {
  if (!factory?.areas) return [];

  const areaBoundaries: { area: any; first: any; last: any }[] = [];

  factory.areas.forEach((area: any) => {
    const workCenters: any[] = [];
    area.lines?.forEach((line: any) => {
      line.workCenters?.forEach((wc: any) => {
        workCenters.push({ ...wc, areaId: area.id });
      });
    });

    if (workCenters.length === 0) return;

    // Sort by wsSequence, fallback to id if sequence not available
    workCenters.sort((a, b) => {
      if (a.wsSequence !== undefined && b.wsSequence !== undefined) {
        return a.wsSequence - b.wsSequence;
      }
      return parseInt(a.id) - parseInt(b.id);
    });

    areaBoundaries.push({
      area,
      first: workCenters[0],
      last: workCenters[workCenters.length - 1]
    });
  });

  return areaBoundaries;
}

const EXCEL_WORKSTATIONS: Record<string, {
  ws_id: string;
  process: string;
  machine: string;
  status: 'Running' | 'Idle' | 'Bottleneck' | 'Down' | 'Critical';
  cycle_time: string;
  oee: string;
  throughput: string;
  mtbf: string;
  mttr: string;
  quality: string;
  special_kpi: string;
  process_type: string;
  machine_type: string;
  key_function: string;
  critical_hover_kpis: string;
  orders: string;
}> = {
  // ── Chassis Assembly (W1–W9) ────────────────────────────────────────────────
  // Source: Factory_Workstation_Breakdown.xlsx → "Chassis Assembly" sheet
  w1: { ws_id: 'W1', process: 'Base Loading', machine: 'Conveyor', status: 'Running', cycle_time: '40 (Target 38)', oee: '92', throughput: '90', mtbf: '150', mttr: '10', quality: '99.5', special_kpi: 'Input Delay: 2s', process_type: 'Base Loading', machine_type: 'Conveyor + Fixture', key_function: 'Load chassis base', critical_hover_kpis: 'Status, Cycle Time, Throughput', orders: 'ORD-001' },
  w2: { ws_id: 'W2', process: 'Alignment', machine: 'Positioning', status: 'Running', cycle_time: '45', oee: '90', throughput: '80', mtbf: '140', mttr: '12', quality: '99.2', special_kpi: 'Alignment Error: 0.3mm', process_type: 'Alignment', machine_type: 'Positioning System', key_function: 'Align frame', critical_hover_kpis: 'Alignment Accuracy, Cycle Time', orders: 'ORD-002' },
  w3: { ws_id: 'W3', process: 'Welding 1', machine: 'Robot', status: 'Idle', cycle_time: '55', oee: '85', throughput: '70', mtbf: '120', mttr: '15', quality: '97.8', special_kpi: 'Weld Temp: 1450°C', process_type: 'Welding 1', machine_type: 'Robotic Welding', key_function: 'Initial weld joints', critical_hover_kpis: 'OEE, Weld Temp, Defects', orders: 'ORD-003' },
  w4: { ws_id: 'W4', process: 'Welding 2', machine: 'Robot', status: 'Running', cycle_time: '50', oee: '88', throughput: '75', mtbf: '130', mttr: '14', quality: '98.5', special_kpi: 'Weld Strength: OK', process_type: 'Welding 2', machine_type: 'Robotic Arm', key_function: 'Structural welding', critical_hover_kpis: 'MTBF, Weld Quality', orders: 'ORD-004' },
  w5: { ws_id: 'W5', process: 'Central Join', machine: 'Multi-axis Robot', status: 'Bottleneck', cycle_time: '60 (Target 50)', oee: '78', throughput: '60', mtbf: '110', mttr: '20', quality: '97', special_kpi: 'Bottleneck: YES', process_type: 'Central Join', machine_type: 'Multi-axis Robot', key_function: 'Main chassis join', critical_hover_kpis: 'Bottleneck Flag, Cycle Time', orders: 'ORD-005' },
  w6: { ws_id: 'W6', process: 'Welding 3', machine: 'Robot', status: 'Running', cycle_time: '52', oee: '86', throughput: '72', mtbf: '125', mttr: '15', quality: '98.2', special_kpi: 'Arc Stability: Good', process_type: 'Welding 3', machine_type: 'Robotic Welding', key_function: 'Side weld', critical_hover_kpis: 'Throughput, Defects', orders: 'ORD-006' },
  w7: { ws_id: 'W7', process: 'Inspection', machine: 'Vision System', status: 'Running', cycle_time: '30', oee: '95', throughput: '110', mtbf: '200', mttr: '8', quality: '99.8', special_kpi: 'Defect Rate: 0.5%', process_type: 'Inspection 1', machine_type: 'Vision System', key_function: 'Weld inspection', critical_hover_kpis: 'Pass/Fail, Defect Rate', orders: 'ORD-007' },
  w8: { ws_id: 'W8', process: 'Reinforcement', machine: 'Hybrid', status: 'Idle', cycle_time: '65', oee: '82', throughput: '65', mtbf: '100', mttr: '18', quality: '97.5', special_kpi: 'Operator: ID102', process_type: 'Reinforcement', machine_type: 'Manual/Robot Hybrid', key_function: 'Reinforcement fitting', critical_hover_kpis: 'Operator ID, Cycle Time', orders: 'ORD-008' },
  w9: { ws_id: 'W9', process: 'Transfer', machine: 'Conveyor', status: 'Running', cycle_time: '20', oee: '96', throughput: '120', mtbf: '220', mttr: '5', quality: '—', special_kpi: 'Queue: 3 units', process_type: 'Output Transfer', machine_type: 'Conveyor', key_function: 'Move to next line', critical_hover_kpis: 'Line Balance, Waiting Status', orders: 'ORD-009' },

  // ── Main Framing Assembly (W10–W18) ─────────────────────────────────────────
  // Source: Factory_Workstation_Breakdown.xlsx → "Main Framing" sheet
  w10: { ws_id: 'W10', process: 'Input', machine: 'Conveyor', status: 'Running', cycle_time: '25', oee: '94', throughput: '130', mtbf: '200', mttr: '6', quality: '—', special_kpi: 'Input Rate Stable', process_type: 'Frame Input', machine_type: 'Conveyor', key_function: 'Receive chassis', critical_hover_kpis: 'Status, Input Rate', orders: 'ORD-010' },
  w11: { ws_id: 'W11', process: 'Assembly 1', machine: 'Robot', status: 'Running', cycle_time: '48', oee: '89', throughput: '78', mtbf: '135', mttr: '12', quality: '98.7', special_kpi: 'Load Balance OK', process_type: 'Frame Assembly 1', machine_type: 'Robot', key_function: 'Frame build', critical_hover_kpis: 'Cycle Time, OEE', orders: 'ORD-011' },
  w12: { ws_id: 'W12', process: 'Assembly 2', machine: 'Robot', status: 'Idle', cycle_time: '52', oee: '84', throughput: '72', mtbf: '120', mttr: '15', quality: '97.9', special_kpi: 'Minor Delay', process_type: 'Frame Assembly 2', machine_type: 'Robot', key_function: 'Structural assembly', critical_hover_kpis: 'MTTR, Throughput', orders: 'ORD-012' },
  w13: { ws_id: 'W13', process: 'Fastening', machine: 'Nutrunner', status: 'Running', cycle_time: '35', oee: '91', throughput: '100', mtbf: '160', mttr: '10', quality: '99.1', special_kpi: 'Torque: 45 Nm', process_type: 'Fastening', machine_type: 'Nutrunner', key_function: 'Bolt fastening', critical_hover_kpis: 'Torque Value, Quality', orders: 'ORD-013' },
  w14: { ws_id: 'W14', process: 'Alignment', machine: 'Vision', status: 'Running', cycle_time: '28', oee: '95', throughput: '115', mtbf: '210', mttr: '7', quality: '99.6', special_kpi: 'Accuracy: 99.4%', process_type: 'Alignment Check', machine_type: 'Vision + Sensors', key_function: 'Dimensional check', critical_hover_kpis: 'Accuracy %, Rejection', orders: 'ORD-014' },
  w15: { ws_id: 'W15', process: 'Transfer', machine: 'Lift Conveyor', status: 'Down', cycle_time: '—', oee: '60', throughput: '0', mtbf: '90', mttr: '25', quality: '—', special_kpi: 'Fault: Motor', process_type: 'Vertical Transfer', machine_type: 'Lift Conveyor', key_function: 'Move down line', critical_hover_kpis: 'Delay Time', orders: 'ORD-015' },
  w16: { ws_id: 'W16', process: 'Sub Assembly', machine: 'Robot', status: 'Idle', cycle_time: '50', oee: '83', throughput: '70', mtbf: '110', mttr: '16', quality: '98', special_kpi: 'Waiting Input', process_type: 'Sub Assembly', machine_type: 'Robot', key_function: 'Add sub-parts', critical_hover_kpis: 'OEE, Cycle Time', orders: 'ORD-016' },
  w17: { ws_id: 'W17', process: 'Inspection', machine: 'Vision', status: 'Running', cycle_time: '30', oee: '96', throughput: '110', mtbf: '220', mttr: '6', quality: '99.7', special_kpi: 'Pass Rate High', process_type: 'Inspection 2', machine_type: 'Vision System', key_function: 'Check assembly', critical_hover_kpis: 'Pass Rate', orders: 'ORD-017' },
  w18: { ws_id: 'W18', process: 'Output', machine: 'Conveyor', status: 'Running', cycle_time: '22', oee: '95', throughput: '120', mtbf: '210', mttr: '5', quality: '—', special_kpi: 'Flow Smooth', process_type: 'Output Transfer', machine_type: 'Conveyor', key_function: 'Send to engine line', critical_hover_kpis: 'Flow Rate', orders: 'ORD-018' },

  // ── Engine Assembly (W19–W27) ────────────────────────────────────────────────
  // Source: Factory_Workstation_Breakdown.xlsx → "Engine Assembly" sheet
  w19: { ws_id: 'W19', process: 'Input', machine: 'Conveyor', status: 'Running', cycle_time: '20', oee: '95', throughput: '140', mtbf: '230', mttr: '5', quality: '—', special_kpi: 'Input Stable', process_type: 'Engine Input', machine_type: 'Conveyor', key_function: 'Engine arrival', critical_hover_kpis: 'Status', orders: 'ORD-019' },
  w20: { ws_id: 'W20', process: 'Mount Prep', machine: 'Fixture', status: 'Running', cycle_time: '38', oee: '90', throughput: '95', mtbf: '150', mttr: '10', quality: '99', special_kpi: 'Prep Accuracy', process_type: 'Mount Prep', machine_type: 'Fixture System', key_function: 'Prepare mount', critical_hover_kpis: 'Cycle Time', orders: 'ORD-020' },
  w21: { ws_id: 'W21', process: 'Mounting', machine: 'Robot', status: 'Running', cycle_time: '50', oee: '88', throughput: '80', mtbf: '130', mttr: '12', quality: '98.6', special_kpi: 'Alignment OK', process_type: 'Engine Mounting', machine_type: 'Robot', key_function: 'Mount engine', critical_hover_kpis: 'Accuracy, Cycle Time', orders: 'ORD-021' },
  w22: { ws_id: 'W22', process: 'Fastening', machine: 'Nutrunner', status: 'Running', cycle_time: '32', oee: '92', throughput: '110', mtbf: '170', mttr: '9', quality: '99.3', special_kpi: 'Torque: 50 Nm', process_type: 'Fastening', machine_type: 'Nutrunner', key_function: 'Tightening', critical_hover_kpis: 'Torque, Quality', orders: 'ORD-022' },
  w23: { ws_id: 'W23', process: 'Fluid Connect', machine: 'Semi-auto', status: 'Idle', cycle_time: '45', oee: '85', throughput: '75', mtbf: '120', mttr: '14', quality: '97.5', special_kpi: 'Leak Risk', process_type: 'Fluid Connect', machine_type: 'Semi-auto', key_function: 'Connect pipes', critical_hover_kpis: 'Leak Status', orders: 'ORD-023' },
  w24: { ws_id: 'W24', process: 'Electrical', machine: 'Hybrid', status: 'Running', cycle_time: '40', oee: '89', throughput: '90', mtbf: '140', mttr: '11', quality: '98.8', special_kpi: 'Error: 0.8%', process_type: 'Electrical Connect', machine_type: 'Manual/Robot', key_function: 'Wiring', critical_hover_kpis: 'Error Rate', orders: 'ORD-024' },
  w25: { ws_id: 'W25', process: 'Testing', machine: 'Diagnostic', status: 'Critical', cycle_time: '70', oee: '75', throughput: '50', mtbf: '100', mttr: '20', quality: '96.5', special_kpi: 'Error Code: E204', process_type: 'Testing', machine_type: 'Diagnostic System', key_function: 'Engine test', critical_hover_kpis: 'Pass/Fail, Error Codes', orders: 'ORD-025' },
  w26: { ws_id: 'W26', process: 'Inspection', machine: 'Vision', status: 'Running', cycle_time: '35', oee: '94', throughput: '105', mtbf: '210', mttr: '6', quality: '99.5', special_kpi: 'Yield High', process_type: 'Final Inspection', machine_type: 'Vision + Sensors', key_function: 'Final QC', critical_hover_kpis: 'Yield %', orders: 'ORD-026' },
  w27: { ws_id: 'W27', process: 'Dispatch', machine: 'Conveyor', status: 'Running', cycle_time: '18', oee: '96', throughput: '150', mtbf: '240', mttr: '4', quality: '—', special_kpi: 'Queue: 1', process_type: 'Dispatch', machine_type: 'Conveyor', key_function: 'Send to next stage', critical_hover_kpis: 'Throughput', orders: 'ORD-027' },
};

export function GridEditor({ onSave, initialFactory, isAdmin = false, readOnly = false, layoutId = null }: GridEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  const [factory, setFactory] = useState(initialFactory || threeAssembliesFactory);
  const [showGrid, setShowGrid] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);

  // Smooth view state (same lerp system as dashboard)
  const [viewState, setViewState] = useState({
    zoom: 0.35, panX: 60, panY: 60, time: 0,
    targetZoom: 0.35, targetPanX: 60, targetPanY: 60,
  });

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<{ type: 'area' | 'machine'; id: string } | null>(null);
  const [tooltipState, setTooltipState] = useState<{ x: number, y: number, wc?: any, text?: string } | null>(null);
  const [draggingMachine, setDraggingMachine] = useState<{ id: string, areaId: string, lineId: string } | null>(null);
  const [areaLayoutTypes, setAreaLayoutTypes] = useState<Record<string, string>>({});
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingWidth, setEditingWidth] = useState<string | null>(null);
  const [editingHeight, setEditingHeight] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [allFilters, setAllFilters] = useState<any[]>([
    { id: 'ws_id', label: 'Workstation ID', default: true, category: 'Identification', description: 'Unique identifier', icon: 'Fingerprint' },
    { id: 'oee', label: 'OEE', default: true, category: 'Performance', description: 'Overall Equipment Effectiveness', icon: 'Zap' },
    { id: 'orders', label: 'Orders', default: true, category: 'Performance', description: 'Current active orders', icon: 'List' }
  ]);
  const [activeFilterIds, setActiveFilterIds] = useState<Record<string, boolean>>({
    ws_id: true,
    oee: true,
    orders: true
  });
  const [dynamicWorkstationData, setDynamicWorkstationData] = useState<any>({});

  // Initialize Display Parameters (Dynamic from Backend XML)
  useEffect(() => {
    const fetchAll = async () => {
      // Use full URL to avoid port confusion (3000 vs 3001)
      const baseUrl = 'http://localhost:4000/api';
      
      // 1. Fetch Dynamic Parameters (XML via API)
      try {
        const res = await fetch(`${baseUrl}/parameters`);
        if (res.ok) {
          const xmlText = await res.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const paramNodes = xmlDoc.getElementsByTagName('parameter');
          
          const dynamicFilters = Array.from(paramNodes).map(node => ({
            id: node.getElementsByTagName('id')[0]?.textContent || '',
            label: node.getElementsByTagName('label')[0]?.textContent || '',
            category: 'Performance',
            description: `Field: ${node.getElementsByTagName('id')[0]?.textContent}`,
            icon: 'Activity',
            default: true
          }));
          
          const baseFilters = [
            { id: 'ws_id', label: 'Workstation ID', default: true, category: 'Identification', description: 'Unique identifier', icon: 'Fingerprint' },
            { id: 'oee', label: 'OEE', default: true, category: 'Performance', description: 'Overall Equipment Effectiveness', icon: 'Zap' },
            { id: 'orders', label: 'Orders', default: true, category: 'Performance', description: 'Current active orders', icon: 'List' }
          ];
          
          // Merge dynamic filters, avoiding duplicates
          const seenIds = new Set(baseFilters.map(f => f.id));
          const filteredDynamic = dynamicFilters.filter(f => !seenIds.has(f.id));
          
          const finalFilters = [...baseFilters, ...filteredDynamic];
          setAllFilters(finalFilters);
          
          // Update active filters only for new items
          setActiveFilterIds(prev => {
            const next = { ...prev };
            filteredDynamic.forEach(f => {
              if (next[f.id] === undefined) next[f.id] = true;
            });
            return next;
          });
        }
      } catch (err) {
        console.warn('Backend connection failed. Using defaults.');
      }

      // 2. Fetch Workstation Data
      try {
        const dataRes = await fetch(`${baseUrl}/parameters/data`);
        if (dataRes.ok) {
          const data = await dataRes.json();
          setDynamicWorkstationData(data);
        }
      } catch (err) {
        // Fallback silently
      }
    };
    
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pan state
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const timeRef = useRef(0);

  // Animation loop — frame-rate-independent lerp
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      setViewState(prev => {
        const speed = 10;
        const t = 1 - Math.exp(-speed * delta);
        timeRef.current += delta;
        return {
          ...prev,
          time: timeRef.current,
          zoom: prev.zoom + (prev.targetZoom - prev.zoom) * t,
          panX: prev.panX + (prev.targetPanX - prev.panX) * t,
          panY: prev.panY + (prev.targetPanY - prev.panY) * t,
        };
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current!);
  }, []);

  // Handle ResizeObserver to prevent canvas stretching
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

  // Rendering — mirrors dashboard drawing style exactly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { zoom, panX, panY } = viewState;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    const drawGridLines = (step: number, color: string, w: number) => {
      ctx.beginPath();
      const gridStep = step * zoom;
      const offsetX = ((panX % gridStep) + gridStep) % gridStep;
      const offsetY = ((panY % gridStep) + gridStep) % gridStep;
      for (let x = offsetX; x < canvas.width; x += gridStep) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = offsetY; y < canvas.height; y += gridStep) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.stroke();
    };

    if (showGrid) {
      drawGridLines(10, 'rgba(30, 41, 59, 0.5)', 0.5); // fine subtle
      drawGridLines(50, 'rgba(30, 41, 59, 0.9)', 1);   // major
    }

    const drawGridClipped = (radius: number, cx: number, cy: number, cw: number, ch: number, color: string) => {
      if (!showGrid) return;
      ctx.save();
      roundRect(ctx, cx, cy, cw, ch, radius);
      ctx.clip();
      drawGridLines(10, 'rgba(30, 41, 59, 0.5)', 0.5);
      drawGridLines(50, color, 1);
      ctx.restore();
    };

    if (!factory?.areas) return;

    factory.areas.forEach((area: any) => {
      const x = area.x * zoom + panX;
      const y = area.y * zoom + panY;
      const w = area.width * zoom;
      const h = area.height * zoom;

      // Frustum cull
      if (x > canvas.width || x + w < 0 || y > canvas.height || y + h < 0) return;

      const isHovered = hoveredEntity?.type === 'area' && hoveredEntity.id === area.id;
      const isSelected = selectedAreaId === area.id;

      // Area shadow + fill
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
      roundRect(ctx, x, y, w, h, 12 * zoom);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      drawGridClipped(12 * zoom, x, y, w, h, 'rgba(30, 41, 59, 0.9)');

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Border
      ctx.lineWidth = isHovered || isSelected ? 2 : 1;
      ctx.strokeStyle = isSelected ? '#3f83f8' : isHovered ? '#60a5fa' : '#334155';
      roundRect(ctx, x, y, w, h, 12 * zoom);
      ctx.stroke();

      // Header band
      const headerH = 45 * zoom;
      const r = 12 * zoom;
      ctx.fillStyle = isSelected ? 'rgba(63, 131, 248, 0.15)' : isHovered ? 'rgba(96, 165, 250, 0.15)' : 'rgba(30, 41, 59, 0.8)';
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + headerH);
      ctx.lineTo(x, y + headerH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();

      // Area header separator line
      ctx.lineWidth = 1;
      ctx.strokeStyle = isSelected ? '#3f83f8' : '#334155';
      ctx.beginPath();
      ctx.moveTo(x, y + headerH);
      ctx.lineTo(x + w, y + headerH);
      ctx.stroke();

      // Area title
      ctx.fillStyle = isSelected ? '#bfdbfe' : '#94a3b8';
      ctx.font = `bold ${Math.max(10, 14 * zoom)}px Inter, sans-serif`;
      ctx.fillText(area.areaName, x + 14 * zoom, y + 29 * zoom);

      // Draw Flows (Escalators/Conveyors)
      if (factory?.flows) {
        factory.flows.forEach((flow: any) => {
          let fromWC: any = null; let toWC: any = null;
          factory.areas.forEach((a: any) => a.lines?.forEach((l: any) => l.workCenters?.forEach((w: any) => {
            if (w.id === flow.fromWsId || w.workCenterId === flow.fromWsId) fromWC = w;
            // Handle precision differences in CSV mapping e.g., "2" vs "2.0"
            if (w.id === flow.toWsId || w.workCenterId === flow.toWsId || parseFloat(w.id || '0') === parseFloat(flow.toWsId || '-1')) toWC = w;
          })));

          if (fromWC && toWC) {
            const fx = (fromWC.x + fromWC.width / 2) * zoom + panX;
            const fy = (fromWC.y + fromWC.height / 2) * zoom + panY;
            const tx = (toWC.x + toWC.width / 2) * zoom + panX;
            const ty = (toWC.y + toWC.height / 2) * zoom + panY;

            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = '#f59e0b'; // Amber conveyor
            ctx.lineWidth = 3.5 * zoom;
            ctx.setLineDash([12 * zoom, 8 * zoom]);
            ctx.lineDashOffset = -viewState.time * 25 * zoom;
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow Head
            const angle = Math.atan2(ty - fy, tx - fx);
            const ptRadius = Math.max(toWC.width / 2, toWC.height / 2) * zoom + (5 * zoom);
            const arrowX = tx - Math.cos(angle) * ptRadius;
            const arrowY = ty - Math.sin(angle) * ptRadius;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 42 * zoom * Math.cos(angle - Math.PI / 6), arrowY - 42 * zoom * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - 42 * zoom * Math.cos(angle + Math.PI / 6), arrowY - 42 * zoom * Math.sin(angle + Math.PI / 6));
            ctx.fillStyle = '#f59e0b';
            ctx.fill();

            // Flow label
            if (zoom > 0.8 && flow.label) {
              ctx.fillStyle = '#b45309';
              ctx.font = `600 ${Math.max(8, 10 * zoom)}px Inter, sans-serif`;
              ctx.fillText(flow.label, (fx + tx) / 2, (fy + ty) / 2 - (10 * zoom));
            }
          }
        });
      }

      // Draw Inter-Area Flows (Red arrows connecting last workstation of area N to first of area N+1)
      const areaBoundaries = getAreaBoundaryWorkcenters(factory);
      if (areaBoundaries.length > 1) {
        for (let i = 0; i < areaBoundaries.length - 1; i++) {
          const currentArea = areaBoundaries[i];
          const nextArea = areaBoundaries[i + 1];

          if (currentArea.last && nextArea.first) {
            const fromWC = currentArea.last;
            const toWC = nextArea.first;

            const fromCX = (fromWC.x + fromWC.width / 2) * zoom + panX;
            const fromCY = (fromWC.y + fromWC.height / 2) * zoom + panY;
            const toCX = (toWC.x + toWC.width / 2) * zoom + panX;
            const toCY = (toWC.y + toWC.height / 2) * zoom + panY;

            let fx, fy, tx, ty;
            let p1x, p1y, p2x, p2y;
            let angle;

            // Use horizontal routing only if it's primarily horizontal AND they are on the same vertical "row"
            if (Math.abs(toCY - fromCY) < Math.abs(toCX - fromCX) && Math.abs(toCY - fromCY) < 400 * zoom) {
              // Horizontal dominant routing (e.g. W9 -> W10)
              if (toCX > fromCX) {
                fx = (fromWC.x + fromWC.width) * zoom + panX; // Right
                fy = fromCY;
                tx = toWC.x * zoom + panX; // Left
                ty = toCY;
                angle = 0;
              } else {
                fx = fromWC.x * zoom + panX; // Left
                fy = fromCY;
                tx = (toWC.x + toWC.width) * zoom + panX; // Right
                ty = toCY;
                angle = Math.PI;
              }
              const cx = fx + (tx - fx) / 2;
              p1x = cx; p1y = fy;
              p2x = cx; p2y = ty;
            } else {
              // Vertical dominant routing (e.g. W18 -> W19)
              const currentAreaBox = currentArea.area;
              const areaBottomY = (currentAreaBox.y + currentAreaBox.height) * zoom + panY;

              if (toCY > fromCY) {
                fx = fromCX;
                fy = (fromWC.y + fromWC.height) * zoom + panY; // Bottom
                tx = toCX;
                ty = toWC.y * zoom + panY; // Top
                angle = Math.PI / 2;

                // Route outside the box neatly
                // Place the horizontal line halfway between the bottom of the area box and the target WC
                const paddingBelowBox = 40 * zoom;
                const minCy = areaBottomY + paddingBelowBox;
                const defaultCy = fy + (ty - fy) / 2;
                const cy = Math.max(defaultCy, minCy);

                p1x = fx; p1y = cy;
                p2x = tx; p2y = cy;
              } else {
                fx = fromCX;
                fy = fromWC.y * zoom + panY; // Top
                tx = toCX;
                ty = (toWC.y + toWC.height) * zoom + panY; // Bottom
                angle = -Math.PI / 2;

                const cy = fy + (ty - fy) / 2;
                p1x = fx; p1y = cy;
                p2x = tx; p2y = cy;
              }
            }

            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = '#ef4444'; // Red for inter-area connections
            ctx.lineWidth = 3.5 * zoom;
            ctx.setLineDash([12 * zoom, 8 * zoom]);
            ctx.lineDashOffset = -viewState.time * 25 * zoom;
            ctx.stroke();
            ctx.setLineDash([]);

            // Red Arrow Head
            const arrowX = tx;
            const arrowY = ty; // Sharp connection

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 52 * zoom * Math.cos(angle - Math.PI / 6), arrowY - 52 * zoom * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - 52 * zoom * Math.cos(angle + Math.PI / 6), arrowY - 52 * zoom * Math.sin(angle + Math.PI / 6));
            ctx.fillStyle = '#ef4444';
            ctx.fill();
          }
        }
      }

      // Level of Detail — show details when zoomed in
      const showDetails = true; // zoom > 0.5 || isSelected;

      if (showDetails) {
        area.lines?.forEach((line: any) => {
          const lx = line.x * zoom + panX;
          const ly = line.y * zoom + panY;
          const lw = line.width * zoom;
          const lh = line.height * zoom;

          // Line container
          ctx.fillStyle = 'rgba(30, 41, 59, 0)';
          ctx.strokeStyle = 'transparent';
          ctx.lineWidth = 0;
          roundRect(ctx, lx, ly, lw, lh, 8 * zoom);
          ctx.fill();

          // Line name
          if (zoom > 0.65) {
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.max(8, 10 * zoom)}px Inter, sans-serif`;
            ctx.fillText(line.lineName, lx + 8 * zoom, ly + 16 * zoom);
          }

          // Machines
          line.workCenters?.forEach((wc: any) => {
            const wx = wc.x * zoom + panX;
            const wy = wc.y * zoom + panY;
            const ww = wc.width * zoom;
            const wh = wc.height * zoom;

            const isMachineHovered = hoveredEntity?.type === 'machine' && hoveredEntity.id === wc.id;

            const _rawId = (wc.id || wc.workCenterId || wc.ws_id || '').toLowerCase();
            const wcIdKey = EXCEL_WORKSTATIONS[_rawId] ? _rawId : ('w' + _rawId.replace(/^w/, ''));
            const excelData = EXCEL_WORKSTATIONS[wcIdKey];
            const statusVal = (excelData?.status || wc.status || 'Running').toLowerCase();

            let statusColor = '#10b981'; // Default Running
            if (statusVal === 'idle') statusColor = '#f59e0b';
            else if (statusVal === 'bottleneck') statusColor = '#f97316';
            else if (statusVal === 'down') statusColor = '#f43f5e'; // Down
            else if (statusVal === 'critical') statusColor = '#ef4444'; // Critical

            // Machine box
            ctx.fillStyle = isMachineHovered ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.8)';
            ctx.strokeStyle = isMachineHovered ? '#38bdf8' : statusColor;
            ctx.lineWidth = isMachineHovered ? 2 : 1.5;
            roundRect(ctx, wx, wy, ww, wh, 6 * zoom);
            ctx.fill();

            roundRect(ctx, wx, wy, ww, wh, 6 * zoom);
            ctx.stroke();

            // Status dot
            ctx.fillStyle = statusColor;
            ctx.beginPath();
            ctx.arc(wx + 10 * zoom, wy + 10 * zoom, 3.5 * zoom, 0, Math.PI * 2);
            ctx.fill();

            // Center graphic text (W1, W2...)
            if (wc.name && activeFilterIds['ws_id']) {
              const text = wc.name.toUpperCase();
              ctx.fillStyle = '#f8fafc'; // solid white text
              const fontSize = Math.max(8, 32 * zoom);
              ctx.font = `bold ${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, wx + ww / 2, wy + wh / 2 - (20 * zoom));
              ctx.textAlign = 'left';
              ctx.textBaseline = 'alphabetic';
            }

            // Render Dynamic Parameters inside the box
            if (zoom > 0.1) {
              const _rawId = (wc.name || wc.id || wc.workCenterId || wc.ws_id || '').toLowerCase();
              const wcIdKey = dynamicWorkstationData[_rawId] ? _rawId : (EXCEL_WORKSTATIONS[_rawId] ? _rawId : ('w' + _rawId.replace(/^w/, '')));
              const excelData = dynamicWorkstationData[_rawId] || EXCEL_WORKSTATIONS[wcIdKey];

              ctx.textAlign = 'center';
              let offset = 15;

              allFilters.forEach(filter => {
                if (filter.id === 'ws_id') return; // Handled above

                if (activeFilterIds[filter.id] && excelData?.[filter.id]) {
                  const val = excelData[filter.id];
                  ctx.fillStyle = filter.id === 'oee' ? '#10b981' : '#38bdf8';
                  ctx.font = `600 ${Math.max(8, (filter.id === 'oee' ? 14 : 12) * zoom)}px Inter, sans-serif`;
                  ctx.fillText(`${filter.label}: ${val}${filter.id === 'oee' ? '%' : ''}`, wx + ww / 2, wy + wh / 2 + (offset * zoom));
                  offset += 20;
                }
              });
              ctx.textAlign = 'left';
            }
          });
        });
      } else {
        // Zoomed out summary
        const totalMachines = area.lines?.reduce((s: number, l: any) => s + l.workCenters.length, 0) ?? 0;
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.max(8, 12 * zoom)}px Inter, sans-serif`;
        ctx.fillText(`${area.lines?.length ?? 0} Production Lines`, x + 14 * zoom, y + 68 * zoom);
        ctx.fillText(`${totalMachines} Machines`, x + 14 * zoom, y + 88 * zoom);
      }
    });
  }, [factory, viewState, hoveredEntity, selectedAreaId, showGrid, activeFilterIds, dynamicWorkstationData, allFilters]);

  const resetView = useCallback(() => {
    setSelectedAreaId(null);
    setViewState(prev => ({ ...prev, targetZoom: 0.35, targetPanX: 60, targetPanY: 60 }));
  }, []);

  const handleFitToScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !factory) return;
    const padding = 60;
    const scaleX = (canvas.width - padding * 2) / factory.width;
    const scaleY = (canvas.height - padding * 2) / factory.height;
    const targetZoom = Math.max(0.35, Math.min(scaleX, scaleY, 2.0));

    const contentWidth = factory.width * targetZoom;
    const contentHeight = factory.height * targetZoom;

    setViewState(prev => ({
      ...prev,
      targetZoom,
      targetPanX: (canvas.width - contentWidth) / 2,
      targetPanY: (canvas.height - contentHeight) / 2,
    }));
  }, [factory]);

  // Fit to screen on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 100);
    return () => clearTimeout(timer);
  }, [factory, handleFitToScreen]);

  // Canvas interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { zoom, panX, panY } = viewState;
    const mx = ((e.clientX - rect.left) * scaleX - panX) / zoom;
    const my = ((e.clientY - rect.top) * scaleY - panY) / zoom;

    let foundMachine: { id: string, areaId: string, lineId: string } | null = null;
    factory?.areas?.forEach((area: any) => {
      area.lines?.forEach((line: any) => {
        line.workCenters?.forEach((wc: any) => {
          if (mx >= wc.x && mx <= wc.x + wc.width && my >= wc.y && my <= wc.y + wc.height) {
            foundMachine = { id: wc.id, areaId: area.id, lineId: line.id };
          }
        });
      });
    });

    if (foundMachine && !isAdmin && !readOnly) {
      setDraggingMachine(foundMachine);
      e.preventDefault();
      return;
    }

    isPanningRef.current = true;
    hasDraggedRef.current = false;
    panStartRef.current = {
      x: e.clientX, y: e.clientY,
      panX: viewState.targetPanX, panY: viewState.targetPanY,
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pan
    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      const startPanX = panStartRef.current.panX;
      const startPanY = panStartRef.current.panY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;
      if (hasDraggedRef.current) {
        setViewState(prev => ({
          ...prev,
          targetPanX: startPanX + dx,
          targetPanY: startPanY + dy,
        }));
      }
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { zoom, panX, panY } = viewState;
    const mx = ((e.clientX - rect.left) * scaleX - panX) / zoom;
    const my = ((e.clientY - rect.top) * scaleY - panY) / zoom;

    // Handle Dragging
    if (draggingMachine) {
      setFactory((prev: any) => {
        const newFactory = { ...prev };
        const area = newFactory.areas?.find((a: any) => a.id === draggingMachine.areaId);
        if (!area) return prev;
        const line = area.lines?.find((l: any) => l.id === draggingMachine.lineId);
        if (!line) return prev;
        const wc = line.workCenters?.find((w: any) => w.id === draggingMachine.id);
        if (!wc) return prev;

        const headerH = 45; // Area header
        let newX = mx - wc.width / 2;
        let newY = my - wc.height / 2;

        // Clamp to area bounds
        if (newX < area.x + 5) newX = area.x + 5;
        if (newY < area.y + headerH) newY = area.y + headerH;
        if (newX + wc.width > area.x + area.width - 5) newX = area.x + area.width - wc.width - 5;
        if (newY + wc.height > area.y + area.height - 5) newY = area.y + area.height - wc.height - 5;

        // Check collision with other workstations and push them
        const oldX = wc.x;
        const oldY = wc.y;
        line.workCenters?.forEach((otherWc: any) => {
          if (otherWc.id === wc.id) return;

          // Check if rectangles overlap
          const overlapX = newX < otherWc.x + otherWc.width && newX + wc.width > otherWc.x;
          const overlapY = newY < otherWc.y + otherWc.height && newY + wc.height > otherWc.y;

          if (overlapX && overlapY) {
            // Determine push direction based on movement
            const dx = newX - oldX;
            const dy = newY - oldY;

            if (Math.abs(dx) > Math.abs(dy)) {
              // Horizontal push
              if (dx > 0) {
                // Moving right, push other right
                otherWc.x = newX + wc.width + 5;
              } else {
                // Moving left, push other left
                otherWc.x = newX - otherWc.width - 5;
              }
            } else {
              // Vertical push
              if (dy > 0) {
                // Moving down, push other down
                otherWc.y = newY + wc.height + 5;
              } else {
                // Moving up, push other up
                otherWc.y = newY - otherWc.height - 5;
              }
            }

            // Clamp the pushed workstation to area bounds
            if (otherWc.x < area.x + 5) otherWc.x = area.x + 5;
            if (otherWc.y < area.y + headerH) otherWc.y = area.y + headerH;
            if (otherWc.x + otherWc.width > area.x + area.width - 5) {
              otherWc.x = area.x + area.width - otherWc.width - 5;
            }
            if (otherWc.y + otherWc.height > area.y + area.height - 5) {
              otherWc.y = area.y + area.height - otherWc.height - 5;
            }
          }
        });

        wc.x = newX;
        wc.y = newY;
        return newFactory;
      });
      return; // Skip hover updates while dragging
    }

    // Hover detection
    let found: { type: 'area' | 'machine'; id: string } | null = null;
    let newTooltip = null;

    factory?.areas?.forEach((area: any) => {
      if (mx >= area.x && mx <= area.x + area.width && my >= area.y && my <= area.y + area.height) {
        found = { type: 'area', id: area.id };
        // Hover detection for workstations works at ANY zoom level —
        // mx/my are already in world-space so the hit test is zoom-independent.
        area.lines?.forEach((line: any) => {
          line.workCenters?.forEach((wc: any) => {
            if (mx >= wc.x && mx <= wc.x + wc.width && my >= wc.y && my <= wc.y + wc.height) {
              found = { type: 'machine', id: wc.id };
              // Keep tooltip inside viewport: prefer right of cursor, flip left if near right edge
              const tipX = e.clientX + 18;
              const tipY = Math.max(10, e.clientY - 50);
              newTooltip = { x: tipX, y: tipY, wc: wc, text: wc.detail };
            }
          });
        });
      }
    });

    // Explicit clear if no machine hovered
    if (!found || (found as any).type !== 'machine') {
      newTooltip = null;
    }

    setHoveredEntity(null); // Disable hover state highlight
    setTooltipState(null); // Disable tooltip
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasDraggedRef.current) {
      // It was a click — hit test
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const { zoom, panX, panY } = viewState;
        const mx = ((e.clientX - rect.left) * scaleX - panX) / zoom;
        const my = ((e.clientY - rect.top) * scaleY - panY) / zoom;

        let hitArea: any = null;
        factory?.areas?.forEach((area: any) => {
          if (mx >= area.x && mx <= area.x + area.width && my >= area.y && my <= area.y + area.height) {
            hitArea = area;
          }
        });

        if (!isAdmin && !readOnly) {
          if (hitArea) {
            setSelectedAreaId(hitArea.id === selectedAreaId ? null : hitArea.id);
          } else {
            setSelectedAreaId(null);
          }
        }
      }
    }
    isPanningRef.current = false;
    hasDraggedRef.current = false;
    panStartRef.current = null;
    setDraggingMachine(null);
  };

  const handleMouseLeave = () => {
    isPanningRef.current = false;
    hasDraggedRef.current = false;
    panStartRef.current = null;
    setHoveredEntity(null);
    setTooltipState(null);
    setDraggingMachine(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const oldZoom = viewState.targetZoom;
    const minZoom = 0.35; // Allow zooming out to see full layout
    const newZoom = Math.max(minZoom, Math.min(3.0, oldZoom + delta));

    // Zoom toward mouse position
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

    const factoryX = (cx - viewState.targetPanX) / oldZoom;
    const factoryY = (cy - viewState.targetPanY) / oldZoom;

    const newPanX = cx - factoryX * newZoom;
    const newPanY = cy - factoryY * newZoom;

    setViewState(prev => ({
      ...prev,
      targetZoom: newZoom,
      targetPanX: newPanX,
      targetPanY: newPanY
    }));
  };

  const handleSave = () => {
    localStorage.setItem('currentFactory', JSON.stringify(factory));
    if (onSave) onSave(factory);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;

      const wsDetails: any[] = [];
      const flows: any[] = [];

      let factoryId = '101', factoryName = 'Automotive Plant';
      const areasMap = new Map<string, any>();

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 30) continue;

        factoryId = parts[0] || factoryId;
        factoryName = parts[1] || factoryName;
        const areaId = parts[9] || '11';
        const areaName = parts[10] || 'Assembly Area';
        const lineId = parts[15] || '201';
        const lineName = parts[16] || 'Assembly Line';

        const wId = parts[22];
        const wName = parts[23];
        const wSeq = parseInt(parts[24]) || 0;
        const wX = parseFloat(parts[25]);
        const wY = parseFloat(parts[26]);
        const wW = parseFloat(parts[27]);
        const wH = parseFloat(parts[28]);
        const mName = parts[30];

        const fId = parts[35];
        const fFrom = parts[36];
        const fTo = parts[37];
        const fType = parts[38];
        const fLabel = parts[39];
        const detail = parts.slice(40).join(',');

        if (!areasMap.has(areaId)) {
          areasMap.set(areaId, {
            id: areaId, areaId: areaId, areaName: areaName,
            x: 50, y: 50, width: 800, height: 600,
            lines: [{ id: lineId, lineId: lineId, lineName: lineName, x: 50, y: 50, width: 800, height: 600, workCenters: [] }],
            buffers: [], storage: []
          });
        }

        const area = areasMap.get(areaId);

        area.lines[0].workCenters.push({
          id: wId,
          workCenterId: wId,
          machineName: wName || mName,
          name: wName,
          ws_id: wId,
          ws_name: wName,
          ws_sequence: wSeq,
          machine_id: parts[29] || '',
          machine_name: mName || '',
          wsSequence: wSeq,
          x: wX * 2.5,
          y: wY * 2.5,
          width: Math.max(wW * 6, 90),
          height: Math.max(wH * 6, 90),
          icon: 'tool',
          status: 'operational',
          detail: detail.replace(/"/g, '').trim()
        });

        if (fId && fFrom && fTo) {
          flows.push({ id: fId, fromWsId: fFrom, toWsId: parseFloat(fTo).toString(), arrowType: fType, label: fLabel });
        }
      }

      const areas = Array.from(areasMap.values());
      let globalMaxX = -Infinity, globalMaxY = -Infinity;

      areas.forEach((area: any) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        area.lines[0].workCenters.forEach((w: any) => {
          if (w.x < minX) minX = w.x;
          if (w.y < minY) minY = w.y;
          if (w.x + w.width > maxX) maxX = w.x + w.width;
          if (w.y + w.height > maxY) maxY = w.y + w.height;
        });

        if (minX === Infinity) { minX = 100; maxX = 900; minY = 100; maxY = 700; }

        area.x = minX - 100;
        area.y = minY - 100;
        area.width = (maxX - minX) + 200;
        area.height = (maxY - minY) + 150;
        area.lines[0].x = area.x;
        area.lines[0].y = area.y;
        area.lines[0].width = area.width;
        area.lines[0].height = area.height;

        if (area.x + area.width > globalMaxX) globalMaxX = area.x + area.width;
        if (area.y + area.height > globalMaxY) globalMaxY = area.y + area.height;
      });

      for (let i = 0; i < areas.length; i++) {
        for (let j = 0; j < i; j++) {
          const area = areas[i];
          const other = areas[j];
          const overlaps = (
            area.x < other.x + other.width + 50 &&
            area.x + area.width + 50 > other.x &&
            area.y < other.y + other.height + 50 &&
            area.y + area.height + 50 > other.y
          );
          if (overlaps) {
            const dx = (other.x + other.width + 50) - area.x;
            area.x += dx;
            area.lines[0].x += dx;
            area.lines[0].workCenters.forEach((w: any) => { w.x += dx; });
          }
        }
      }

      if (areas.length > 0) {
        globalMaxX = Math.max(...areas.map((a: any) => a.x + a.width));
        globalMaxY = Math.max(...areas.map((a: any) => a.y + a.height));
      }

      const newLayout = {
        id: factoryId, name: factoryName, width: Math.max(2000, globalMaxX + 500), height: Math.max(1500, globalMaxY + 500), gridUnit: 50,
        flows,
        areas: areas
      };

      setFactory(newLayout);
      if (areas.length > 0) {
        setViewState(prev => ({ ...prev, targetZoom: 0.6, targetPanX: -areas[0].x + 250, targetPanY: -areas[0].y + 150 }));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    let csvData = "factory_id,factory_name,layout_id,layout_name,canvas_width,canvas_length,scale_ratio,layout_version_id,version_number,area_id,area_name,area_pos_x,area_pos_y,area_width,area_length,line_id,line_name,line_pos_x,line_pos_y,line_width,line_length,line_type,ws_id,ws_name,ws_sequence,ws_pos_x,ws_pos_y,ws_width,ws_length,machine_id,machine_name,machine_pos_x,machine_pos_y,machine_width,machine_length,flow_id,from_ws_id,to_ws_id,arrow_type,flow_label,detail\n";

    if (!factory?.areas) return;

    factory.areas.forEach((area: any) => {
      const line = area.lines?.[0];
      if (!line) return;

      line.workCenters?.forEach((wc: any, i: number) => {
        const flow = factory.flows?.find((f: any) => f.fromWsId === wc.id);
        const fId = flow ? flow.id : '';
        const fTo = flow ? flow.toWsId : '';
        const fType = flow ? flow.arrowType : '';
        const fLabel = flow ? flow.label : '';

        // scale coordinates down inversely by 2.5
        const row = [
          factory.id, factory.name, '202', 'Layout', '160', '100', '1', '1', '1',
          area.id, area.areaName, area.x, area.y, area.width, area.height,
          line.id, line.lineName, line.x, line.y, line.width, line.height, '',
          wc.id, wc.name, i + 1,
          wc.x / 2.5, wc.y / 2.5, wc.width / 6, wc.height / 6,
          wc.workCenterId, wc.machineName, '', '', '', '',
          fId, flow ? wc.id : '', fTo, fType, fLabel, wc.detail || ''
        ];
        csvData += row.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',') + '\n';
      });
    });

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exported_layout.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyAutoLayout = (areaId: string, type: string, manualWidth?: number, manualHeight?: number, clampToFit: boolean = false) => {
    setAreaLayoutTypes(prev => ({ ...prev, [areaId]: type }));
    setFactory((prev: any) => {
      const nf = { ...prev };
      const area = nf.areas?.find((a: any) => a.id === areaId);
      if (!area || !area.lines?.[0]) return prev;
      const wcs = area.lines[0].workCenters;
      if (!wcs || wcs.length === 0) return prev;

      const N = wcs.length;
      let maxX = 0; let maxY = 0;

      if (type === 'Straight') {
        wcs.forEach((wc: any, i: number) => {
          wc._cx = i; wc._cy = 0;
          if (i > maxX) maxX = i;
        });
      } else if (type === 'L-Shape') {
        const half = Math.ceil(N / 2);
        wcs.forEach((wc: any, i: number) => {
          if (i < half) { wc._cx = i; wc._cy = 0; }
          else { wc._cx = half - 1; wc._cy = i - half + 1; }
          if (wc._cx > maxX) maxX = wc._cx;
          if (wc._cy > maxY) maxY = wc._cy;
        });
      } else if (type === 'U-Shape') {
        const side = Math.max(1, Math.ceil(N / 3));
        wcs.forEach((wc: any, i: number) => {
          let cx = 0, cy = 0;
          if (i < side) { cx = i; cy = 0; }
          else if (i < side * 2) { cx = side - 1; cy = i - side + 1; }
          else { cx = side - 2 - (i - side * 2); cy = side; }
          wc._cx = cx; wc._cy = cy;
        });
        let minCx = 0;
        wcs.forEach((wc: any) => { if (wc._cx < minCx) minCx = wc._cx; });
        wcs.forEach((wc: any) => {
          wc._cx -= minCx;
          if (wc._cx > maxX) maxX = wc._cx;
          if (wc._cy > maxY) maxY = wc._cy;
        });
      } else if (type === 'Inverted U-Shape') {
        const side = Math.max(1, Math.ceil(N / 3));
        wcs.forEach((wc: any, i: number) => {
          let cx = 0, cy = 0;
          if (i < side) { cx = 0; cy = side - 1 - i; }
          else if (i < side * 2) { cx = i - side + 1; cy = 0; }
          else { cx = side; cy = i - side * 2 + 1; }
          wc._cx = cx; wc._cy = cy;
          if (cx > maxX) maxX = cx;
          if (cy > maxY) maxY = cy;
        });
      }

      const targetWidth = manualWidth !== undefined ? manualWidth : area.width;
      const targetHeight = manualHeight !== undefined ? manualHeight : area.height;

      let minW = 0, minH = 0;
      wcs.forEach((wc: any) => {
        if (wc.width > minW) minW = wc.width;
        if (wc.height > minH) minH = wc.height;
      });

      const startX = area.x + 80;
      const startY = area.y + 120;
      const usableWidth = Math.max(0, targetWidth - 160 - minW);
      const usableHeight = Math.max(0, targetHeight - 160 - minH);

      let spacingX = maxX > 0 ? usableWidth / maxX : 190;
      let spacingY = maxY > 0 ? usableHeight / maxY : 190;

      const minSpacingX = minW + 20;
      const minSpacingY = minH + 20;

      if (spacingX < minSpacingX) spacingX = minSpacingX;
      if (spacingY < minSpacingY) spacingY = minSpacingY;

      wcs.forEach((wc: any) => {
        wc.x = startX + (wc._cx * spacingX);
        wc.y = startY + (wc._cy * spacingY);
        delete wc._cx; delete wc._cy;
      });

      if (clampToFit) {
        if (spacingX === minSpacingX) {
          area.width = Math.max(targetWidth, (maxX * spacingX) + 160 + minW);
        } else {
          area.width = targetWidth;
        }

        if (spacingY === minSpacingY) {
          area.height = Math.max(targetHeight, (maxY * spacingY) + 160 + minH);
        } else {
          area.height = targetHeight;
        }
      } else {
        area.width = targetWidth;
        area.height = targetHeight;
      }

      return nf;
    });
  };

  const handleApprove = async () => {
    if (!factory.id) return;
    try {
      await fetch(`/api/layouts/${factory.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: 'Admin' }),
      });
      window.location.href = '/admin';
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!factory.id) return;
    try {
      await fetch(`/api/layouts/${factory.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: 'Admin' }),
      });
      if (factory?.adminComments) {
        await fetch(`/api/layouts/${factory.id}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminComments: factory.adminComments, reviewedBy: 'Admin' }),
        });
      }
      window.location.href = '/admin';
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareLayout = () => {
    const activeIds = Object.entries(activeFilterIds)
      .filter(([_, active]) => active)
      .map(([id]) => id)
      .join(',');

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?id=${layoutId || factory.id || 'default-v1'}&filters=${activeIds}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareMsg(true);
      setTimeout(() => setShareMsg(false), 2500);
    });
  };

  const selectedArea = factory?.areas?.find((a: any) => a.id === selectedAreaId);

  const renderTooltipNode = () => {
    if (!tooltipState) return null;
    const wc = tooltipState.wc || {};
    const _rawTooltipId = (wc.id || wc.workCenterId || wc.ws_id || '').toLowerCase();
    const wcIdKey = EXCEL_WORKSTATIONS[_rawTooltipId] ? _rawTooltipId : ('w' + _rawTooltipId.replace(/^w/, ''));
    const excelData = EXCEL_WORKSTATIONS[wcIdKey];
    const statusVal = (excelData?.status || wc.status || 'Running').toLowerCase();

    let dotColor = 'bg-emerald-500 animate-pulse';
    if (statusVal === 'idle') dotColor = 'bg-amber-500';
    else if (statusVal === 'bottleneck') dotColor = 'bg-orange-500';
    else if (statusVal === 'down') dotColor = 'bg-rose-500';
    else if (statusVal === 'critical') dotColor = 'bg-red-600 animate-ping';

    const TIP_W = 270;
    const TIP_H = 420;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const tipLeft = tooltipState.x + TIP_W > vw - 10 ? tooltipState.x - TIP_W - 18 : tooltipState.x;
    const tipTop = Math.min(tooltipState.y, vh - TIP_H - 10);

    return (
      <div className="fixed z-50 pointer-events-none p-4 text-xs text-slate-200 bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl max-w-xs transition-opacity duration-150 flex flex-col gap-2.5 min-w-[240px]" style={{ left: tipLeft, top: Math.max(10, tipTop) }}>
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <span className="font-bold text-white tracking-wide uppercase text-[10px]">Workstation Telemetry</span>
        </div>
        <div className="space-y-2.5">
          {allFilters.map(filter => {
            if (!activeFilterIds[filter.id]) return null;
            let val = '';
            if (filter.id === 'ws_id') val = excelData?.ws_id || wc.ws_id || wc.id || wc.workCenterId;
            else if (filter.id === 'oee') val = excelData?.oee ? `${excelData.oee}%` : (wc.oee || '');
            else if (filter.id === 'orders') val = excelData?.orders || wc.orders || '';

            if (!val) return null;

            return (
              <div key={`tooltip-item-${filter.id}`} className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{filter.label}</span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 whitespace-pre-wrap">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  if (isAdmin || readOnly) {
    return (
      <div className="flex flex-1 flex-col relative bg-[#0b1120] overflow-hidden w-full h-full font-sans">
        {/* Canvas Container */}
        <div ref={containerRef} className="flex-1 overflow-hidden z-10 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="block cursor-grab active:cursor-grabbing w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={e => e.preventDefault()}
          />
        </div>

        {/* Display Parameters Panel (Admin/View Overlay) */}
        {allFilters.length > 0 && (
          <div className="absolute top-[80px] left-4 z-20 w-[280px] bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-xl shadow-2xl p-4">
            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2.5 flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" /> Display Parameters
            </h3>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Toggle parameters below to customize the workstation display.</p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
              {allFilters.map(filter => (
                <label key={`admin-filter-${filter.id}`} className="flex items-start gap-2.5 p-1.5 hover:bg-[#1e293b]/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[#334155]">
                  <input
                    type="checkbox"
                    checked={activeFilterIds[filter.id] ?? false}
                    onChange={() => {
                      setActiveFilterIds(prev => ({ ...prev, [filter.id]: !prev[filter.id] }));
                    }}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-[#334155] bg-[#0f172a] text-indigo-500 focus:ring-indigo-500/50 accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-200 leading-none">{filter.label}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal">{filter.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Buttons overlay */}

        {/* Download Image Button Top Right */}
        <div className="absolute top-4 right-4 z-20 flex gap-3">
          <Button onClick={handleShareLayout} className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] shadow-lg rounded-xl h-10 px-4 transition-all">
            <Upload className="mr-2 h-4 w-4 rotate-45" /> {shareMsg ? 'Link Copied ✓' : 'Share Layout URL'}
          </Button>
          <Button onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `factory_layout_blueprint.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }} className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] shadow-lg rounded-xl h-10 px-4">
            <Download className="mr-2 h-4 w-4" /> Download Blueprint
          </Button>
        </div>

        {/* Top Left Controls & Info */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-6">
          {!readOnly && (
            <Button onClick={() => window.location.href = '/admin'} className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] shadow-lg rounded-xl h-10 px-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Console
            </Button>
          )}
          {!readOnly && <div className="h-6 w-px bg-[#334155]"></div>}
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">{factory?.name || 'Layout Blueprint'}</h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{readOnly ? 'View Only' : 'Admin Review Mode'}</p>
          </div>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
          <Button
            onClick={() => {
              const oldZoom = viewState.targetZoom;
              const newZoom = Math.min(3.0, oldZoom + 0.3);
              setViewState(prev => ({ ...prev, targetZoom: newZoom }));
            }}
            className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] shadow-lg rounded-xl h-10 w-10 p-0"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => {
              const oldZoom = viewState.targetZoom;
              const newZoom = Math.max(0.35, oldZoom - 0.3);
              setViewState(prev => ({ ...prev, targetZoom: newZoom }));
            }}
            className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] shadow-lg rounded-xl h-10 w-10 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleFitToScreen}
            className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] shadow-lg rounded-xl h-10 w-10 p-0"
            title="Reset View"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-8 bg-[#0f172a] border border-[#1e293b] px-8 py-4 rounded-xl shadow-2xl">
          <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
            <div className="w-5 h-3 border border-[#10b981] rounded-sm"></div> Workstation
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
            <div className="w-6 border-t border-dashed border-[#f59e0b] relative">
              <div className="absolute -right-1 -top-[3px] w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-[#f59e0b]"></div>
            </div>
            Internal Escalator
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
            <div className="w-6 border-t border-dashed border-[#ef4444] relative">
              <div className="absolute -right-1 -top-[3px] w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-[#ef4444]"></div>
            </div>
            Outer Escalator
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
            <div className="w-6 h-3 border border-dashed border-slate-500 rounded-sm"></div> Area
          </div>
        </div>

        {/* Comment Panel - Hidden for readOnly */}
        {!readOnly && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl z-20 flex flex-col gap-3 bg-[#0f172a] border border-[#1e293b] px-6 py-5 rounded-2xl shadow-2xl">
            <h3 className="text-white text-sm font-bold tracking-wide">Add Comments</h3>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={factory?.adminComments || ''}
                onChange={e => setFactory((prev: any) => ({ ...prev, adminComments: e.target.value }))}
                className="flex-1 bg-[#0b1120] border border-[#334155] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-[#64748b] shadow-inner transition-colors"
                placeholder="Write your comments here..."
              />
              <Button onClick={handleApprove} className="bg-[#10b981] hover:bg-[#059669] text-white px-6 h-11 rounded-xl font-medium shadow-lg">
                <Check className="mr-2 h-5 w-5" /> Approve
              </Button>
              <Button onClick={handleReject} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 h-11 rounded-xl font-medium shadow-lg">
                <X className="mr-2 h-5 w-5" /> Disapprove
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      {/* Toolbar — matches dashboard toolbar style */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2 shadow-sm z-30 flex-wrap">
        <div className="flex items-center gap-2">
          {selectedArea ? (
            <Button variant="outline" size="sm" onClick={resetView} className="gap-2 text-slate-700 border-slate-200">
              <ArrowLeft className="h-4 w-4" /> Back to Overview
            </Button>
          ) : (
            <span className="text-sm font-semibold text-slate-700 px-1">Factory Layout Editor</span>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleCSVUpload} />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="border-slate-200 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100" title="Upload Layout CSV">
          <Upload className="h-4 w-4 mr-1.5" /> Upload CSV
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <Button
          onClick={() => setViewState(prev => ({ ...prev, targetZoom: Math.min(3, prev.targetZoom * 1.2) }))}
          variant="outline" size="sm" className="border-slate-200" title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <span className="text-xs text-slate-500 font-mono w-10 text-center">
          {Math.round(viewState.zoom * 100)}%
        </span>

        <Button
          onClick={() => setViewState(prev => ({ ...prev, targetZoom: Math.max(0.1, prev.targetZoom / 1.2) }))}
          variant="outline" size="sm" className="border-slate-200" title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <Button onClick={handleFitToScreen} variant="outline" size="sm" className="border-slate-200" title="Fit to screen">
          <Maximize2 className="h-4 w-4" />
        </Button>

        <Button onClick={resetView} variant="outline" size="sm" className="border-slate-200" title="Reset view">
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <Button
          onClick={() => setShowGrid(!showGrid)}
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          className={showGrid ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-slate-200'}
          title="Toggle grid"
        >
          <Grid3x3 className="h-4 w-4 mr-1" /> Grid
        </Button>

        <div className="ml-auto" />

        <Button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {savedMsg ? 'Saved ✓' : 'Save Layout'}
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left Side Panel - Structure Inspector & Filters */}
        <div className="w-[340px] h-full bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_15px_rgba(0,0,0,0.02)] relative">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
            <h2 className="text-slate-900 text-[15px] font-bold tracking-tight flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-indigo-500" /> Structure Inspector
            </h2>
            {!isAdmin && <span className="text-[9px] font-bold tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Editor</span>}
          </div>

          {/* Display Parameters Section */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/30">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Display Options</h3>
            <div className="space-y-1.5">
              {allFilters.map(filter => (
                <div
                  key={filter.id}
                  onClick={() => setActiveFilterIds(prev => ({ ...prev, [filter.id]: !prev[filter.id] }))}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${activeFilterIds[filter.id]
                    ? 'bg-white border-indigo-100 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeFilterIds[filter.id] ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                      {filter.id === 'ws_id' && <LayoutGrid className="h-3.5 w-3.5" />}
                      {filter.id === 'oee' && <Check className="h-3.5 w-3.5" />}
                      {filter.id === 'orders' && <MessageSquare className="h-3.5 w-3.5" />}
                      {!['ws_id', 'oee', 'orders'].includes(filter.id) && <Activity className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div className={`text-[11px] font-bold ${activeFilterIds[filter.id] ? 'text-slate-900' : 'text-slate-500'}`}>{filter.label}</div>
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${activeFilterIds[filter.id] ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-200'
                    }`}>
                    {activeFilterIds[filter.id] && <Check className="h-2 w-2 text-white stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative group">
              <AlignJustify className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search areas or units..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Areas & Workstations List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {factory?.areas?.filter((a: any) =>
              a.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.lines?.some((l: any) => l.workCenters?.some((wc: any) =>
                (wc.name || '').toLowerCase().includes(searchQuery.toLowerCase())
              ))
            ).map((area: any) => (
              <div key={area.id} className="space-y-1">
                <div
                  onClick={() => setCollapsedAreas(prev => ({ ...prev, [area.id]: !prev[area.id] }))}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${selectedAreaId === area.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700">{area.areaName}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${!collapsedAreas[area.id] ? 'rotate-90' : ''}`} />
                </div>

                {!collapsedAreas[area.id] && (
                  <div className="pl-9 pr-1 py-1 space-y-1 border-l border-slate-100 ml-4">
                    {area.lines?.map((line: any) =>
                      line.workCenters?.filter((wc: any) =>
                        (wc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        area.areaName.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((wc: any, i: number) => (
                        <div key={wc.id} className="group">
                          <div
                            onClick={() => setExpandedId(expandedId === wc.id ? null : wc.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${expandedId === wc.id ? 'bg-slate-100 shadow-sm' : 'hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-400 text-[10px] font-bold font-mono border border-slate-100">{i + 1}</div>
                              <span className="text-xs font-medium text-slate-600 truncate max-w-[140px]">
                                {wc.name || 'Workstation'}
                              </span>
                            </div>
                            {expandedId === wc.id ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>

                          {expandedId === wc.id && (
                            <div className="p-3 mt-1.5 mb-1.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">X Position</label>
                                  <input type="number" value={Math.round(wc.x)} readOnly className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white outline-none text-slate-600" />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">Y Position</label>
                                  <input type="number" value={Math.round(wc.y)} readOnly className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white outline-none text-slate-600" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isAdmin && !readOnly && (
            <div className="p-4 border-t border-slate-100 bg-white">
              <Button onClick={handleExportCSV} className="w-full gap-2 bg-slate-900 hover:bg-black text-white shadow-md rounded-xl h-10 text-xs font-bold uppercase tracking-wider">
                <Download className="h-3.5 w-3.5" /> Export Layout
              </Button>
            </div>
          )}
        </div>

        {/* Canvas Container */}
        <div ref={containerRef} className="flex-1 overflow-hidden z-10 bg-[#0f172a] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={e => e.preventDefault()}
          />
          {/* Hover Tooltip (Removed from Developer side) */}
        </div>

        {/* Bottom instructions bar */}
        <div className="border-t border-slate-200 bg-white px-5 py-2.5 text-xs text-slate-400 flex items-center justify-between absolute bottom-0 left-0 right-0 z-20">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Move className="h-3.5 w-3.5" /> Pan: Click (empty space) &amp; Drag</span>
            <span className="flex items-center gap-1"><ZoomIn className="h-3.5 w-3.5" /> Zoom: Scroll</span>
            <span className="flex items-center gap-1 text-slate-500 font-medium"><Move className="h-3.5 w-3.5" /> Move Machine: Click &amp; Drag</span>
          </div>
        </div>
      </div>
    </div>
  );
}
