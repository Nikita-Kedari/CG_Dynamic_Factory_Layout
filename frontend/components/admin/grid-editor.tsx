'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Undo2, Redo2, RotateCcw, Save, ArrowLeft, ArrowRight, Minus, CornerDownRight, Navigation, Move, X, Upload, Download, ChevronRight, ChevronDown, AlignJustify, LayoutGrid, MessageSquare, Check, Activity, AlertCircle, CheckSquare, CheckCircle2, XCircle, HelpCircle, Send, Search, Plus, Trash2, FileImage, FileType } from 'lucide-react';
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

const resolveWorkstationFlowAnchors = (
  wsId: string,
  targetFlowId: string,
  flowsList: any[],
  wcsMap: Record<string, any>,
  getVisualSize: (wc: any) => { width: number; height: number }
) => {
  const wsFlows = flowsList.filter((f: any) => f.fromWsId === wsId || f.toWsId === wsId);
  if (wsFlows.length === 0) return null;

  const ws = wcsMap[wsId];
  if (!ws) return null;
  const wsSize = getVisualSize(ws);

  const groups: Record<'top' | 'bottom' | 'left' | 'right', any[]> = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  };

  wsFlows.forEach((f: any) => {
    const isOutgoing = f.fromWsId === wsId;
    const otherId = isOutgoing ? f.toWsId : f.fromWsId;
    const otherWs = wcsMap[otherId];
    if (!otherWs) return;

    const otherSize = getVisualSize(otherWs);

    const dx = (otherWs.x + otherSize.width / 2) - (ws.x + wsSize.width / 2);
    const dy = (otherWs.y + otherSize.height / 2) - (ws.y + wsSize.height / 2);

    let side: 'top' | 'bottom' | 'left' | 'right';
    if (Math.abs(dx) > Math.abs(dy)) {
      side = dx > 0 ? 'right' : 'left';
    } else {
      side = dy > 0 ? 'bottom' : 'top';
    }

    groups[side].push({ flow: f, otherWs, isOutgoing, dx, dy });
  });

  // Sort each side group so parallel lines never cross
  groups.top.sort((a, b) => (a.otherWs.x + getVisualSize(a.otherWs).width / 2) - (b.otherWs.x + getVisualSize(b.otherWs).width / 2));
  groups.bottom.sort((a, b) => (a.otherWs.x + getVisualSize(a.otherWs).width / 2) - (b.otherWs.x + getVisualSize(b.otherWs).width / 2));
  groups.left.sort((a, b) => (a.otherWs.y + getVisualSize(a.otherWs).height / 2) - (b.otherWs.y + getVisualSize(b.otherWs).height / 2));
  groups.right.sort((a, b) => (a.otherWs.y + getVisualSize(a.otherWs).height / 2) - (b.otherWs.y + getVisualSize(b.otherWs).height / 2));

  let foundSide: 'top' | 'bottom' | 'left' | 'right' | null = null;
  let foundIndex = -1;
  let totalCount = 0;

  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    const idx = groups[side].findIndex((item: any) => item.flow.id === targetFlowId);
    if (idx !== -1) {
      foundSide = side;
      foundIndex = idx;
      totalCount = groups[side].length;
      break;
    }
  }

  if (!foundSide || foundIndex === -1) return null;

  const margin = 15;
  let x = ws.x;
  let y = ws.y;

  if (foundSide === 'top' || foundSide === 'bottom') {
    y = foundSide === 'top' ? ws.y : ws.y + wsSize.height;
    if (totalCount === 1) {
      x = ws.x + wsSize.width / 2;
    } else {
      const usableWidth = wsSize.width - 2 * margin;
      const spacing = usableWidth / (totalCount - 1);
      x = ws.x + margin + foundIndex * spacing;
    }
  } else {
    x = foundSide === 'left' ? ws.x : ws.x + wsSize.width;
    if (totalCount === 1) {
      y = ws.y + wsSize.height / 2;
    } else {
      const usableHeight = wsSize.height - 2 * margin;
      const spacing = usableHeight / (totalCount - 1);
      y = ws.y + margin + foundIndex * spacing;
    }
  }

  return [x, y] as [number, number];
};

const computeAStarPath = (
  rfx: number,
  rfy: number,
  rtx: number,
  rty: number,
  xs: number[],
  ys: number[],
  from: any,
  to: any,
  obstacles: any[],
  getWcVisualSize: (wc: any) => { width: number; height: number },
  strict: boolean
): [number, number][] | null => {
  const startI = xs.indexOf(rfx);
  const startJ = ys.indexOf(rfy);
  const endI = xs.indexOf(rtx);
  const endJ = ys.indexOf(rty);

  if (startI === -1 || startJ === -1 || endI === -1 || endJ === -1) {
    return null;
  }

  const closed = new Set<string>();
  const gScore: Record<string, number> = {};
  const parent: Record<string, string> = {};
  const dirMap: Record<string, 'H' | 'V' | null> = {};

  const startKey = `${startI},${startJ}`;
  gScore[startKey] = 0;
  dirMap[startKey] = null;

  const openList: { i: number; j: number; f: number }[] = [
    { i: startI, j: startJ, f: Math.abs(rfx - rtx) + Math.abs(rfy - rty) }
  ];

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const curr = openList.shift()!;
    const currKey = `${curr.i},${curr.j}`;

    if (curr.i === endI && curr.j === endJ) {
      const path: [number, number][] = [];
      let tempKey = currKey;
      while (tempKey) {
        const [iStr, jStr] = tempKey.split(',');
        const i = parseInt(iStr);
        const j = parseInt(jStr);
        path.push([xs[i], ys[j]]);
        tempKey = parent[tempKey];
      }
      path.reverse();

      const optimized: [number, number][] = [path[0]];
      for (let k = 1; k < path.length - 1; k++) {
        const prev = optimized[optimized.length - 1];
        const next = path[k + 1];
        const p = path[k];
        if ((prev[0] === p[0] && p[0] === next[0]) || (prev[1] === p[1] && p[1] === next[1])) {
          continue;
        }
        optimized.push(p);
      }
      optimized.push(path[path.length - 1]);
      return optimized;
    }

    closed.add(currKey);

    const currX = xs[curr.i];
    const currY = ys[curr.j];
    const currG = gScore[currKey];
    const currDir = dirMap[currKey];

    const neighbors = [
      { ni: curr.i + 1, nj: curr.j, ndir: 'H' as const },
      { ni: curr.i - 1, nj: curr.j, ndir: 'H' as const },
      { ni: curr.i, nj: curr.j + 1, ndir: 'V' as const },
      { ni: curr.i, nj: curr.j - 1, ndir: 'V' as const }
    ];

    for (const { ni, nj, ndir } of neighbors) {
      if (ni < 0 || ni >= xs.length || nj < 0 || nj >= ys.length) continue;
      const neighborKey = `${ni},${nj}`;
      if (closed.has(neighborKey)) continue;

      const nx = xs[ni];
      const ny = ys[nj];

      const dist = Math.abs(nx - currX) + Math.abs(ny - currY);
      let penalty = 0;
      let hasCollision = false;

      // 12px strict clearance boundary margin
      const margin = 12;

      for (const wc of obstacles) {
        // Only allow boundary crossing if this segment connects to the start anchor of 'from'
        if (wc.id === from.id) {
          const touchesStart = (currX === rfx && currY === rfy) || (nx === rfx && ny === rfy);
          if (touchesStart) continue;
        }
        // Only allow boundary crossing if this segment connects to the end anchor of 'to'
        if (wc.id === to.id) {
          const touchesEnd = (currX === rtx && currY === rty) || (nx === rtx && ny === rty);
          if (touchesEnd) continue;
        }

        const { width: w, height: h } = getWcVisualSize(wc);
        const rx1 = wc.x - margin;
        const rx2 = wc.x + w + margin;
        const ry1 = wc.y - margin;
        const ry2 = wc.y + h + margin;

        const cx1 = currX + Math.sign(nx - currX) * 2;
        const cy1 = currY + Math.sign(ny - currY) * 2;
        const cx2 = nx - Math.sign(nx - currX) * 2;
        const cy2 = ny - Math.sign(ny - currY) * 2;

        if (ndir === 'H') {
          const minX = Math.min(cx1, cx2);
          const maxX = Math.max(cx1, cx2);
          if (cy1 >= ry1 && cy1 <= ry2 && minX < rx2 && maxX > rx1) {
            hasCollision = true;
            penalty += 1000000;
          }
        } else {
          const minY = Math.min(cy1, cy2);
          const maxY = Math.max(cy1, cy2);
          if (cx1 >= rx1 && cx1 <= rx2 && minY < ry2 && maxY > ry1) {
            hasCollision = true;
            penalty += 1000000;
          }
        }
      }

      if (strict && hasCollision) continue;

      // Add turn penalty (600) to ensure straight lines and avoid zig-zag micro-bends
      const turnPenalty = (currDir !== null && currDir !== ndir) ? 600 : 0;
      const tentG = currG + dist + penalty + turnPenalty;

      const existing = openList.find((node) => node.i === ni && node.j === nj);
      if (gScore[neighborKey] === undefined || tentG < gScore[neighborKey]) {
        gScore[neighborKey] = tentG;
        parent[neighborKey] = currKey;
        dirMap[neighborKey] = ndir;

        const h = Math.abs(nx - rtx) + Math.abs(ny - rty);
        const f = tentG + h;

        if (existing) {
          existing.f = f;
        } else {
          openList.push({ i: ni, j: nj, f });
        }
      }
    }
  }

  return null;
};

const findOrthogonalPath = (
  from: any,
  to: any,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  fIdx: number,
  allWcsList: any[],
  getWcVisualSize: (wc: any) => { width: number; height: number }
): [number, number][] => {
  const obstacles = allWcsList;
  
  const rfx = Math.round(fx);
  const rfy = Math.round(fy);
  const rtx = Math.round(tx);
  const rty = Math.round(ty);

  const allX = new Set<number>([rfx, rtx]);
  const allY = new Set<number>([rfy, rty]);

  // Compute flow-dependent parallel lanes (8px spacing offset)
  const fLane = fIdx % 4;
  const offset1 = 15 + fLane * 8; // 15px, 23px, 31px, 39px
  const offset2 = 30 + fLane * 8; // 30px, 38px, 46px, 54px

  obstacles.forEach((wc) => {
    const { width: w, height: h } = getWcVisualSize(wc);
    const rx = Math.round(wc.x);
    const ry = Math.round(wc.y);
    const rw = Math.round(w);
    const rh = Math.round(h);

    // Primary offset lanes (flow-dependent)
    allX.add(rx - offset1);
    allX.add(rx + rw + offset1);
    allY.add(ry - offset1);
    allY.add(ry + rh + offset1);

    // Outer offset lanes (flow-dependent) for flexible parallel routing around tight spots
    allX.add(rx - offset2);
    allX.add(rx + rw + offset2);
    allY.add(ry - offset2);
    allY.add(ry + rh + offset2);

    // Inner line and center points
    allX.add(rx + Math.round(rw / 2));
    allY.add(ry + Math.round(rh / 2));
  });

  const xs = Array.from(allX).sort((a, b) => a - b);
  const ys = Array.from(allY).sort((a, b) => a - b);

  // First pass: strict obstacle avoidance (hard boundaries)
  let path = computeAStarPath(rfx, rfy, rtx, rty, xs, ys, from, to, obstacles, getWcVisualSize, true);
  if (path) return path;

  // Second pass: soft obstacle avoidance (least penalty fallback)
  path = computeAStarPath(rfx, rfy, rtx, rty, xs, ys, from, to, obstacles, getWcVisualSize, false);
  if (path) return path;

  // Fallback direct path
  return [[rfx, rfy], [rtx, rfy], [rtx, rty]];
};

export function GridEditor({ onSave, onLayoutIdChange, initialFactory, isAdmin = false, readOnly = false, layoutId = null }: GridEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const dragRef = useRef<{
    type: 'pan' | 'wc' | 'area' | 'waypoint' | 'segment',
    id: string,
    areaId?: string,
    startX: number,
    startY: number,
    itemStartX: number,
    itemStartY: number,
    flowId?: string,
    wpIndex?: number,
    segIndex?: number,
    initialState?: any
  } | null>(null);

  const [factory, setFactory] = useState(initialFactory || threeAssembliesFactory);
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [viewState, setViewState] = useState({ zoom: 0.25, panX: 60, panY: 60, time: 0, targetZoom: 0.25, targetPanX: 60, targetPanY: 60 });
  const [selectedWcId, setSelectedWcId] = useState<string | null>(null);
  const [hoveredWcId, setHoveredWcId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAdminPanels, setShowAdminPanels] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const allWcs = useMemo(() => {
    const map: Record<string, any> = {};
    (factory?.areas || []).forEach((a: any) => (a.lines || []).forEach((l: any) => (l.workCenters || []).forEach((w: any) => {
      map[w.id] = { ...w, area: a };
    })));
    return map;
  }, [factory]);

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

  const getWcExcelData = useCallback((wc: any) => {
    if (!wc) return null;
    const _id = wc.ws_id || wc.name;
    return dynamicWorkstationData[_id] || dynamicWorkstationData['w' + _id] || wc.parameters || EXCEL_WORKSTATIONS['w' + _id.replace(/^w/, '')];
  }, [dynamicWorkstationData]);

  const getWcVisualSize = useCallback((wc: any) => {
    if (!wc) return { width: 120, height: 80, maxVisible: 0 };
    const visibleParams = availableParameters.filter(p => activeFilterIds[p.id]);
    const numParams = visibleParams.length;

    const wsIdText = wc.workCenterId || wc.name || '';
    const excelData = getWcExcelData(wc);
    const maxLabelValLength = visibleParams.reduce((max, p) => {
      const v = excelData?.[p.id] || 'N/A';
      const displayVal = (p.id === 'oee') ? `${v}%` : v.toString();
      const lineLen = `${p.label}: ${displayVal}`.length;
      return Math.max(max, lineLen);
    }, wsIdText.length);

    const baseW = Math.max(130, maxLabelValLength * 8.5 + 24);

    let maxVisible = numParams;
    if (!isCapturing) {
      if (viewState.zoom < 0.5) {
        maxVisible = 0;
      } else if (viewState.zoom < 0.8) {
        maxVisible = Math.min(1, numParams);
      }
    }

    const adjustedParamsCount = Math.min(maxVisible, numParams);
    const adjustedH = adjustedParamsCount === 0 ? 55 : 60 + adjustedParamsCount * 20;

    const width = Math.min(220, Math.max(120, baseW));
    const height = Math.min(180, Math.max(50, adjustedH));

    return { width, height, maxVisible };
  }, [availableParameters, activeFilterIds, getWcExcelData, viewState.zoom, isCapturing]);

  const checkCollision = useCallback((x: number, y: number, wcId: string, w: number, h: number, ignoreIds = new Set<string>()) => {
    if (!factory) return null;
    for (const area of factory.areas) {
      for (const line of area.lines || []) {
        for (const other of line.workCenters || []) {
          if (other.id === wcId || ignoreIds.has(other.id)) continue;
          const { width: otherW, height: otherH } = getWcVisualSize(other);
          const xOverlap = x < other.x + otherW + 10 && x + w + 10 > other.x;
          const yOverlap = y < other.y + otherH + 10 && y + h + 10 > other.y;
          if (xOverlap && yOverlap) {
            return other;
          }
        }
      }
    }
    return null;
  }, [factory, getWcVisualSize]);

  const getFlowPoints = useCallback((flow: any, from: any, to: any, fIdx: number) => {
    if (!from || !to) return [];

    const fromSize = getWcVisualSize(from);
    const toSize = getWcVisualSize(to);

    // Resolve dynamic multi-side distributed anchors
    let fx, fy, tx, ty;
    const flowsList = factory.flows || [];
    const fromAnchor = resolveWorkstationFlowAnchors(from.id, flow.id, flowsList, allWcs, getWcVisualSize);
    const toAnchor = resolveWorkstationFlowAnchors(to.id, flow.id, flowsList, allWcs, getWcVisualSize);

    if (fromAnchor) {
      [fx, fy] = fromAnchor;
    } else {
      const dx = to.x - from.x; const dy = to.y - from.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        fx = (dx > 0 ? (from.x + fromSize.width) : from.x); fy = (from.y + fromSize.height / 2);
      } else {
        fx = (from.x + fromSize.width / 2); fy = (dy > 0 ? (from.y + fromSize.height) : from.y);
      }
    }

    if (toAnchor) {
      [tx, ty] = toAnchor;
    } else {
      const dx = to.x - from.x; const dy = to.y - from.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        tx = (dx > 0 ? to.x : (to.x + toSize.width)); ty = (to.y + toSize.height / 2);
      } else {
        tx = (to.x + toSize.width / 2); ty = (dy > 0 ? to.y : (to.y + toSize.height));
      }
    }

    if (flow.routingPoints && flow.routingPoints.length >= 2) {
      const path: [number, number][] = [...flow.routingPoints.map((pt: any) => [pt[0], pt[1]] as [number, number])];
      path[0] = [fx, fy];
      path[path.length - 1] = [tx, ty];
      return path;
    }

    const dx = to.x - from.x; const dy = to.y - from.y;
    const isInternal = from.area?.id === to.area?.id;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const laneSpace = (fIdx % 6 + 1) * 20;

    // Try obstacle-aware orthogonal pathfinding first
    try {
      const allWcsList = Object.values(allWcs);
      return findOrthogonalPath(from, to, fx, fy, tx, ty, fIdx, allWcsList, getWcVisualSize);
    } catch (e) {
      const path: [number, number][] = [[fx, fy]];
      if (isInternal || dist < 500) {
        if (Math.abs(fy - ty) < 20 || Math.abs(fx - tx) < 20) path.push([tx, ty]);
        else { path.push([tx, fy]); path.push([tx, ty]); }
      } else {
        const useTop = dy < 0;
        const perimeterY = useTop ? (from.area.y - 40 - laneSpace) : (from.area.y + from.area.height + 40 + laneSpace);
        path.push([fx, perimeterY]); path.push([tx, perimeterY]); path.push([tx, ty]);
      }
      return path;
    }
  }, [getWcVisualSize, allWcs, factory]);

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
      } catch (err) { }
    };
    fetchParams();
    const intv = setInterval(fetchParams, 30000); // Check for config changes every 30s
    return () => clearInterval(intv);
  }, []);

  // 2. Fetch Live Data (Values from SQL Rows) & Initialize if needed
  useEffect(() => {
    if (!layoutId) return;

    // Cleanly bypass database parameter sync for local mock layouts
    const isLocal = layoutId.includes('-') || isNaN(Number(layoutId));
    if (isLocal) {
      setDynamicWorkstationData({});
      return;
    }

    const fetchAll = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/parameters/data?layoutId=${layoutId}`);
        if (res.ok) {
          const newData = await res.json();
          setDynamicWorkstationData((prev: any) => {
            if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
            return newData;
          });
        }
      } catch (err) { }
    };

    const initializeParams = async () => {
      if (!factory?.areas) return;
      const wcs = factory.areas.flatMap((a: any) => a.lines.flatMap((l: any) => l.workCenters));
      try {
        await fetch('http://localhost:4000/api/parameters/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layoutId, workstations: wcs })
        });
        fetchAll();
      } catch (err) { }
    };

    initializeParams();
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [layoutId, factory.id]); // Use factory.id instead of factory object

  // 3. Automatic Re-Center on Load
  useEffect(() => {
    if (factory?.areas?.length > 0) {
      setTimeout(handleFitToScreen, 500); // Wait for initial render
    }
  }, [factory.id]); // Trigger when layout identity changes

  const allFilters = useMemo(() => [
    { id: 'ws_id', label: 'Workstation ID', description: 'Unique identifier' },
    ...availableParameters
  ], [availableParameters]);

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

  const updateFactory = useCallback((newFactory: any, recordHistory = true) => {
    const clamped = clampFactory({ ...newFactory });
    if (recordHistory) {
      setHistory(prev => [...prev.slice(-49), JSON.parse(JSON.stringify(factory))]);
      setRedoStack([]);
    }
    setFactory(clamped);
  }, [factory]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    const handleBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setViewState(p => {
        const zoomFactor = e.deltaY > 0 ? 0.88 : 1.12;
        const minZ = (isAdmin || readOnly || isPublicView) ? 0.15 : 0.05;
        const maxZ = (isAdmin || readOnly || isPublicView) ? 3.0 : 5.0;
        const nextTargetZoom = Math.max(minZ, Math.min(maxZ, p.targetZoom * zoomFactor));

        if (nextTargetZoom === p.targetZoom) return p;

        const worldX = (mx - p.targetPanX) / p.targetZoom;
        const worldY = (my - p.targetPanY) / p.targetZoom;

        const nextTargetPanX = mx - worldX * nextTargetZoom;
        const nextTargetPanY = my - worldY * nextTargetZoom;

        return {
          ...p,
          targetZoom: nextTargetZoom,
          targetPanX: nextTargetPanX,
          targetPanY: nextTargetPanY
        };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isAdmin, readOnly, isPublicView]);

  const handleFitToScreen = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas || !factory) return;

    // 1. Calculate the true bounding box of the layout topology
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    factory.areas.forEach((a: any) => {
      minX = Math.min(minX, a.x);
      minY = Math.min(minY, a.y);
      maxX = Math.max(maxX, a.x + a.width);
      maxY = Math.max(maxY, a.y + a.height);
    });

    if (minX === Infinity) { minX = 0; minY = 0; maxX = factory.width || 2000; maxY = factory.height || 2000; }

    const layoutW = maxX - minX;
    const layoutH = maxY - minY;

    // 2. Define Sidebar/Panel Offsets (Usable Viewport)
    const isReviewMode = isAdmin || readOnly || isPublicView;
    const leftOffset = isReviewMode ? 320 : 340; // 320 is sidebar, 340 gives extra breathing
    const rightOffset = 40;
    const topOffset = 40;
    const bottomOffset = isReviewMode ? 180 : 40; // Admin feedback panel is at bottom

    const usableW = canvas.width - (isReviewMode ? 400 : leftOffset + 60);
    const usableH = canvas.height - (isReviewMode ? topOffset + bottomOffset : 120);
    const usableX = isReviewMode ? 340 : leftOffset + 20;
    const usableY = isReviewMode ? topOffset + 40 : 80;

    // 3. Calculate Scale & Center
    const padding = 100;
    const scale = Math.min(
      (usableW - padding) / layoutW,
      (usableH - padding) / layoutH,
      1.2 // Max zoom limit for auto-fit
    );
    const targetZoom = Math.max(0.15, scale);

    // Calculate pan to center the layout box within the usable viewport center
    const targetPanX = usableX + (usableW - layoutW * targetZoom) / 2 - minX * targetZoom;
    const targetPanY = usableY + (usableH - layoutH * targetZoom) / 2 - minY * targetZoom;

    setViewState(prev => ({ ...prev, targetZoom, targetPanX, targetPanY }));
  }, [factory, isAdmin, readOnly, isPublicView]);

  const handleZoomButton = useCallback((zoomIn: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    setViewState(p => {
      const zoomFactor = zoomIn ? 1.2 : (1 / 1.2);
      const minZ = (isAdmin || readOnly || isPublicView) ? 0.15 : 0.05;
      const maxZ = (isAdmin || readOnly || isPublicView) ? 3.0 : 5.0;
      const nextTargetZoom = Math.max(minZ, Math.min(maxZ, p.targetZoom * zoomFactor));

      if (nextTargetZoom === p.targetZoom) return p;

      const worldX = (cx - p.targetPanX) / p.targetZoom;
      const worldY = (cy - p.targetPanY) / p.targetZoom;

      const nextTargetPanX = cx - worldX * nextTargetZoom;
      const nextTargetPanY = cy - worldY * nextTargetZoom;

      return {
        ...p,
        targetZoom: nextTargetZoom,
        targetPanX: nextTargetPanX,
        targetPanY: nextTargetPanY
      };
    });
  }, [isAdmin, readOnly, isPublicView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
        if (e.key === '=' || e.key === '+') {
          handleZoomButton(true);
        } else if (e.key === '-') {
          handleZoomButton(false);
        } else if (e.key === '0') {
          handleFitToScreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomButton, handleFitToScreen]);

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
          headers.forEach((header: string) => {
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
          const values = headers.map((header: string) => {
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

    // 1. Calculate the actual bounding box of the layout
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
      const margin = 120; // Beautiful margin padding

      // Force a high-quality readable zoom target for export
      const captureZoom = 1.3;

      // Dynamically size canvas to perfectly fit the layout at captureZoom
      canvas.width = (layoutW * captureZoom) + margin * 2;
      canvas.height = (layoutH * captureZoom) + margin * 2;

      // Precisely center the layout at captureZoom
      const capturePanX = margin - minX * captureZoom;
      const capturePanY = margin - minY * captureZoom;

      setIsCapturing(true);

      setViewState(prev => ({
        ...prev,
        zoom: captureZoom,
        targetZoom: captureZoom,
        panX: capturePanX,
        targetPanX: capturePanX,
        panY: capturePanY,
        targetPanY: capturePanY
      }));
    } else {
      setIsCapturing(true);
    }

    // Wait 150ms for the render loop to draw on the resized high-res canvas
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
    }, 150);
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('shared', 'true');
    return url.toString();
  };

  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (delta > 0) {
        setViewState(prev => {
          if (isCapturing) {
            if (prev.zoom === prev.targetZoom && prev.panX === prev.targetPanX && prev.panY === prev.targetPanY) {
              return prev;
            }
            return {
              ...prev,
              zoom: prev.targetZoom,
              panX: prev.targetPanX,
              panY: prev.targetPanY
            };
          }
          const smoothing = 1 - Math.exp(-15 * delta);
          const nextZoom = prev.zoom + (prev.targetZoom - prev.zoom) * smoothing;
          const nextPanX = prev.panX + (prev.targetPanX - prev.panX) * smoothing;
          const nextPanY = prev.panY + (prev.targetPanY - prev.panY) * smoothing;

          // Only update if there is a meaningful change
          const zoomDiff = Math.abs(nextZoom - prev.zoom);
          const panXDiff = Math.abs(nextPanX - prev.panX);
          const panYDiff = Math.abs(nextPanY - prev.panY);

          const isMoving = zoomDiff > 0.0001 || panXDiff > 0.01 || panYDiff > 0.01;

          if (!isMoving) {
            if (prev.zoom === prev.targetZoom && prev.panX === prev.targetPanX && prev.panY === prev.targetPanY) {
              return prev;
            }
            return {
              ...prev,
              zoom: prev.targetZoom,
              panX: prev.targetPanX,
              panY: prev.targetPanY
            };
          }

          const finalZoom = Math.abs(nextZoom - prev.targetZoom) < 0.0001 ? prev.targetZoom : nextZoom;
          const finalPanX = Math.abs(nextPanX - prev.targetPanX) < 0.1 ? prev.targetPanX : nextPanX;
          const finalPanY = Math.abs(nextPanY - prev.targetPanY) < 0.1 ? prev.targetPanY : nextPanY;

          return {
            ...prev,
            zoom: finalZoom,
            panX: finalPanX,
            panY: finalPanY
          };
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current!);
  }, [isCapturing]);

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

    let animId: number;

    const render = () => {
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
      const size = 28 * zoom; // Slightly smaller for precision
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size / 1.8); ctx.lineTo(-size * 0.7, 0); ctx.lineTo(-size, size / 1.8);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
    };

    const drawPathWithArrow = (points: { x: number, y: number }[], color: string, isDashed: boolean) => {
      if (points.length < 2) return;
      const last = points[points.length - 1]; const prev = points[points.length - 2];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);

      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) { ctx.lineTo(points[i].x, points[i].y); }

      ctx.strokeStyle = color; ctx.lineWidth = 4 * zoom;
      if (isDashed) {
        ctx.setLineDash([16 * zoom, 12 * zoom]);
        const timeOffset = (performance.now() / 1000) * 35 * zoom;
        ctx.lineDashOffset = -timeOffset;
      }
      ctx.stroke(); ctx.setLineDash([]);
      drawArrowhead(last.x, last.y, angle, color);
    };



    factory.areas.forEach((area: any) => {
      const ax = area.x * zoom + panX; const ay = area.y * zoom + panY;
      const aw = area.width * zoom; const ah = area.height * zoom;
      const isSelectedArea = area.id === selectedAreaId;

      // --- DIRECT STATE RENDERING (Match Visuals to Hitboxes) ---
      const resolvedWcs: any[] = [];
      area.lines?.forEach((line: any) => {
        line.workCenters?.forEach((wc: any) => {
          // Render exactly at state coordinates so drag hitboxes align 1:1
          resolvedWcs.push({ ...wc, x: wc.x, y: wc.y });
        });
      });

      // Draw Area
      ctx.fillStyle = isSelectedArea ? 'rgba(148, 163, 184, 0.08)' : 'rgba(30, 41, 59, 0.4)';
      roundRect(ctx, ax, ay, aw, ah, 12 * zoom); ctx.fill();

      const hasComment = area.adminComment && area.adminComment.trim() !== '';
      if (showComments && hasComment) {
        ctx.strokeStyle = '#fbbf24'; // beautiful gold border
        ctx.lineWidth = 4 * zoom;
        ctx.save();
        ctx.shadowBlur = 15 * zoom;
        ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
        roundRect(ctx, ax, ay, aw, ah, 12 * zoom); ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = isSelectedArea ? '#94a3b8' : '#334155'; ctx.lineWidth = (isSelectedArea ? 2 : 1.5) * zoom;
        roundRect(ctx, ax, ay, aw, ah, 12 * zoom); ctx.stroke();
      }

      ctx.fillStyle = isSelectedArea ? '#f1f5f9' : '#64748b'; ctx.font = `bold ${Math.max(10, 16 * zoom)}px Inter`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(area.areaName.toUpperCase(), ax + 20 * zoom, ay + 20 * zoom);

      if (showComments && hasComment) {
        const bubbleX = ax + 20 * zoom;
        const bubbleY = ay + 45 * zoom;

        ctx.save();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1 * zoom;
        roundRect(ctx, bubbleX, bubbleY, Math.min(300 * zoom, aw - 40 * zoom), 45 * zoom, 6 * zoom);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = `italic 600 ${Math.max(9, 12 * zoom)}px Inter`;
        ctx.fillText(`💬 Comment: ${area.adminComment}`, bubbleX + 10 * zoom, bubbleY + 15 * zoom, Math.min(300 * zoom, aw - 40 * zoom) - 20 * zoom);
        ctx.restore();
      }

      // Draw Resolved Workstations
      resolvedWcs.forEach((wc: any) => {
        const isSelected = wc.id === selectedWcId;
        const isHovered = wc.id === hoveredWcId;
        const _id = (wc.id || '').toLowerCase();
        const excelData = dynamicWorkstationData[_id] || dynamicWorkstationData['w' + _id] || wc.parameters || EXCEL_WORKSTATIONS['w' + _id.replace(/^w/, '')];

        const status = (excelData?.status || 'Running').toLowerCase();
        let color = '#10b981'; if (status === 'idle') color = '#f59e0b'; else if (status === 'down' || status === 'critical') color = '#ef4444';

        const { width: visualW, height: visualH, maxVisible } = getWcVisualSize(wc);
        const ww = visualW * zoom;
        const wh = visualH * zoom;

        // --- BOUNDARY CLAMP ---
        const minX = ax + 10 * zoom; const maxX = ax + aw - ww - 10 * zoom;
        const minY = ay + 10 * zoom; const maxY = ay + ah - wh - 10 * zoom;
        const wx = Math.max(minX, Math.min(maxX, wc.x * zoom + panX));
        const wy = Math.max(minY, Math.min(maxY, wc.y * zoom + panY));
        // ---------------------

        const hasWcComment = wc.adminComment && wc.adminComment.trim() !== '';

        ctx.save();
        ctx.fillStyle = (isSelected || isHovered) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.98)';

        if (showComments && hasWcComment) {
          ctx.strokeStyle = '#fbbf24'; // beautiful gold border
          ctx.lineWidth = 4 * zoom;
          ctx.save();
          ctx.shadowBlur = 15 * zoom;
          ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
          roundRect(ctx, wx, wy, ww, wh, 8 * zoom); ctx.fill(); ctx.stroke();
          ctx.restore();
        } else {
          ctx.strokeStyle = isSelected ? '#38bdf8' : (isHovered ? '#fff' : color); ctx.lineWidth = (isSelected ? 4 : 3) * zoom;
          roundRect(ctx, wx, wy, ww, wh, 8 * zoom); ctx.fill(); ctx.stroke();
        }

        // --- INLINE RESPONSIVE CARD RENDERING ---
        const wsIdText = wc.workCenterId || wc.name || '';
        const idFS = Math.max(10, 13 * zoom);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${idFS}px Inter`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(wsIdText, wx + 12 * zoom, wy + 10 * zoom);

        // Status indicator dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(wx + ww - 16 * zoom, wy + 16 * zoom, 4 * zoom, 0, Math.PI * 2);
        ctx.fill();

        // Divider
        if (maxVisible > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1 * zoom;
          ctx.beginPath();
          ctx.moveTo(wx + 10 * zoom, wy + 28 * zoom);
          ctx.lineTo(wx + ww - 10 * zoom, wy + 28 * zoom);
          ctx.stroke();

          // Render Parameter Aligned Rows
          let tyOff = 36 * zoom;
          const visibleParams = availableParameters.filter(p => activeFilterIds[p.id]).slice(0, maxVisible);
          visibleParams.forEach(p => {
            const v = excelData?.[p.id] || 'N/A';
            const displayVal = (p.id === 'oee') ? `${v}%` : v.toString();

            const paramFS = Math.max(8, 10 * zoom);
            ctx.font = `600 ${paramFS}px Inter`;

            // Key Label (Muted gray)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`${p.label}:`, wx + 12 * zoom, wy + tyOff);

            // Value (Crisp white)
            ctx.fillStyle = '#ffffff';
            const labelWidth = ctx.measureText(`${p.label}:`).width;
            ctx.fillText(displayVal, wx + 12 * zoom + labelWidth + 4 * zoom, wy + tyOff);

            tyOff += 20 * zoom;
          });
        }
        ctx.restore();

        if (showComments && hasWcComment) {
          const cardW = 180 * zoom;
          const cardH = 65 * zoom;
          const padding = 10 * zoom;

          const cx = wx + ww / 2 - cardW / 2;
          const cy = wy - cardH - 12 * zoom;

          ctx.save();
          ctx.shadowBlur = 12 * zoom;
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.fillStyle = '#fef08a'; // Pastel yellow
          roundRect(ctx, cx, cy, cardW, cardH, 8 * zoom);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5 * zoom;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(wx + ww / 2 - 6 * zoom, wy - 12 * zoom);
          ctx.lineTo(wx + ww / 2, wy - 4 * zoom);
          ctx.lineTo(wx + ww / 2 + 6 * zoom, wy - 12 * zoom);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5 * zoom;
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.fillStyle = '#713f12'; // Bronze text
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.font = `bold ${Math.max(9, 11 * zoom)}px Inter`;
          ctx.fillText('💬 Reviewer Comment:', cx + padding, cy + padding);

          ctx.font = `500 ${Math.max(8, 10 * zoom)}px Inter`;
          ctx.fillText(wc.adminComment, cx + padding, cy + padding + 16 * zoom, cardW - padding * 2);
          ctx.restore();
        }
      });
    });



    (factory.flows || []).forEach((flow: any, fIdx: number) => {
      const from = allWcs[flow.fromWsId];
      const to = allWcs[flow.toWsId];
      if (!from || !to) return;

      const isInternal = from.area.id === to.area.id;
      const flowColor = flow.id === selectedFlowId ? '#38bdf8' : (isInternal ? '#fbbf24' : '#ef4444');

      const flowPoints = getFlowPoints(flow, from, to, fIdx);
      const path = flowPoints.map((pt: [number, number]) => ({ x: pt[0] * zoom + panX, y: pt[1] * zoom + panY }));

      drawPathWithArrow(path, flowColor, true);

      // Render Handles for selected flow
      if (flow.id === selectedFlowId && !isPublicView && !readOnly) {
        // Render Waypoint Handles
        path.forEach((pt: { x: number, y: number }, idx: number) => {
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2 * zoom; ctx.stroke();
        });

        // Render Mid-Segment "Move" Handles
        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i]; const p2 = path[i + 1];
          const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;

          ctx.save();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath(); ctx.arc(mx, my, 4 * zoom, 0, Math.PI * 2); ctx.fill();
          // Draw a small drag icon hint
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1 * zoom;
          ctx.beginPath(); ctx.moveTo(mx - 3 * zoom, my); ctx.lineTo(mx + 3 * zoom, my); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx, my - 3 * zoom); ctx.lineTo(mx, my + 3 * zoom); ctx.stroke();
          ctx.restore();
        }
      }
    });
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [factory, viewState, showGrid, activeFilterIds, dynamicWorkstationData, selectedAreaId, selectedWcId, isAdmin, isPublicView, hoveredWcId, isCapturing, showComments]);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY };
      setIsPanning(true);
      return;
    }

    if (isAdmin || readOnly || isPublicView) {
      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
      const { zoom, panX, panY } = viewState;
      const worldX = (e.clientX - rect.left - panX) / zoom;
      const worldY = (e.clientY - rect.top - panY) / zoom;

      // 1. Check Workstations
      for (const area of factory.areas) {
        for (const line of area.lines || []) {
          for (const wc of line.workCenters || []) {
            const { width: visualW, height: visualH } = getWcVisualSize(wc);
            if (worldX >= wc.x && worldX <= wc.x + visualW && worldY >= wc.y && worldY <= wc.y + visualH) {
              setSelectedWcId(wc.id); setSelectedAreaId(area.id); setSelectedFlowId(null);
              dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY };
              setIsPanning(true);
              return;
            }
          }
        }
      }

      // 2. Check Areas (if click inside area boundary but not workstation)
      for (const area of factory.areas) {
        if (worldX >= area.x && worldX <= area.x + area.width && worldY >= area.y && worldY <= area.y + area.height) {
          setSelectedAreaId(area.id); setSelectedWcId(null); setSelectedFlowId(null);
          dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY };
          setIsPanning(true);
          return;
        }
      }

      dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY };
      setIsPanning(true);
      setSelectedWcId(null); setSelectedAreaId(null); setSelectedFlowId(null);
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const { zoom, panX, panY } = viewState;
    const worldX = (e.clientX - rect.left - panX) / zoom;
    const worldY = (e.clientY - rect.top - panY) / zoom;

    const initialState = JSON.parse(JSON.stringify(factory));

    // 1. Check Handles (If a flow is already selected)
    if (selectedFlowId) {
      const flow = factory.flows.find((f: any) => f.id === selectedFlowId);
      if (flow && flow.routingPoints) {
        // Waypoints
        for (let i = 0; i < flow.routingPoints.length; i++) {
          const pt = flow.routingPoints[i];
          if (Math.sqrt((worldX - pt[0]) ** 2 + (worldY - pt[1]) ** 2) < 12) {
            dragRef.current = { type: 'waypoint', id: flow.id, flowId: flow.id, wpIndex: i, startX: e.clientX, startY: e.clientY, itemStartX: pt[0], itemStartY: pt[1], initialState };
            return;
          }
        }
        // Segments
        for (let i = 0; i < flow.routingPoints.length - 1; i++) {
          const p1 = flow.routingPoints[i]; const p2 = flow.routingPoints[i + 1];
          const mx = (p1[0] + p2[0]) / 2; const my = (p1[1] + p2[1]) / 2;
          if (Math.sqrt((worldX - mx) ** 2 + (worldY - my) ** 2) < 12) {
            dragRef.current = { type: 'segment', id: flow.id, flowId: flow.id, segIndex: i, startX: e.clientX, startY: e.clientY, itemStartX: p1[0], itemStartY: p1[1], initialState };
            return;
          }
        }
      }
    }

    // 2. Check Workstations
    for (const area of factory.areas) {
      for (const line of area.lines || []) {
        for (const wc of line.workCenters || []) {
          const { width: visualW, height: visualH } = getWcVisualSize(wc);
          if (worldX >= wc.x && worldX <= wc.x + visualW && worldY >= wc.y && worldY <= wc.y + visualH) {
            dragRef.current = { type: 'wc', id: wc.id, areaId: area.id, startX: e.clientX, startY: e.clientY, itemStartX: wc.x, itemStartY: wc.y, initialState } as any;
            setSelectedWcId(wc.id); setSelectedAreaId(area.id); setSelectedFlowId(null); return;
          }
        }
      }
    }

    // 3. Check Flow Lines & Arrowheads (Selection)
    for (const flow of (factory.flows || [])) {
      const from = allWcs[flow.fromWsId]; const to = allWcs[flow.toWsId];
      if (!from || !to) continue;

      const flowIndex = factory.flows.indexOf(flow);
      const path = getFlowPoints(flow, from, to, flowIndex);

      // --- Arrowhead Hit Detection ---
      const last = path[path.length - 1];
      if (last) {
        if (Math.sqrt((worldX - last[0]) ** 2 + (worldY - last[1]) ** 2) < 25) {
          setSelectedFlowId(flow.id); setSelectedWcId(null); return;
        }
      }

      // --- Segment Hit Detection ---
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i]; const p2 = path[i + 1];
        const l2 = (p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2;
        if (l2 === 0) continue;
        const t = Math.max(0, Math.min(1, ((worldX - p1[0]) * (p2[0] - p1[0]) + (worldY - p1[1]) * (p2[1] - p1[1])) / l2));
        const dist = Math.sqrt((worldX - (p1[0] + t * (p2[0] - p1[0]))) ** 2 + (worldY - (p1[1] + t * (p2[1] - p1[1]))) ** 2);

        if (dist < 15) {
          setSelectedFlowId(flow.id);
          setSelectedWcId(null);
          if (!flow.routingPoints) {
            setFactory((prev: any) => ({
              ...prev,
              flows: prev.flows.map((f: any) => f.id === flow.id ? { ...f, routingPoints: path } : f)
            }));
          }
          return;
        }
      }
    }

    dragRef.current = { type: 'pan', id: '', startX: e.clientX, startY: e.clientY, itemStartX: viewState.panX, itemStartY: viewState.panY } as any;
    setIsPanning(true);
    setSelectedWcId(null); setSelectedFlowId(null);
  }, [factory, allWcs, viewState, getFlowPoints, isAdmin, readOnly, isPublicView, selectedFlowId, isSpacePressed]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
          const { width: visualW, height: visualH } = getWcVisualSize(wc);
          const wx = wc.x * zoom + panX;
          const wy = wc.y * zoom + panY;
          const ww = visualW * zoom;
          const wh = visualH * zoom;
          if (mx >= wx && mx <= wx + ww && my >= wy && my <= wy + wh) {
            foundHover = wc.id;
            break;
          }
        }
        if (foundHover) break;
      }
      if (foundHover) break;
    }

    if (foundHover !== hoveredWcId) {
      setHoveredWcId(foundHover);
    }

    if (!dragRef.current) return;
    const { type, itemStartX, itemStartY, areaId, id } = dragRef.current;
    const dx = (e.clientX - dragRef.current.startX) / (type === 'pan' ? 1 : viewState.zoom);
    const dy = (e.clientY - dragRef.current.startY) / (type === 'pan' ? 1 : viewState.zoom);
    if (type === 'pan') {
      setViewState(p => ({ ...p, targetPanX: itemStartX + dx, targetPanY: itemStartY + dy }));
    } else if (type === 'wc' && !isAdmin && !readOnly && !isPublicView) {
      const newFactory = { ...factory };
      const area = newFactory.areas.find((a: any) => a.id === areaId);
      let wc: any = null;
      if (area) {
        for (const line of area.lines || []) {
          const found = line.workCenters?.find((w: any) => w.id === id);
          if (found) { wc = found; break; }
        }
      }
      if (wc && area) {
        const targetX = itemStartX + dx; const targetY = itemStartY + dy;
        const { width: visualW, height: visualH } = getWcVisualSize(wc);

        const clampedTargetX = Math.max(area.x, Math.min(area.x + area.width - visualW, targetX));
        const clampedTargetY = Math.max(area.y, Math.min(area.y + area.height - visualH, targetY));

        const startX = wc.x;
        const startY = wc.y;

        // Try moving X first
        let nextX = startX;
        if (clampedTargetX !== startX) {
          const collWc = checkCollision(clampedTargetX, startY, wc.id, visualW, visualH);
          if (!collWc) {
            nextX = clampedTargetX;
          } else {
            const otherWcSize = getWcVisualSize(collWc);
            const closestX = clampedTargetX > startX
              ? collWc.x - visualW - 10
              : collWc.x + otherWcSize.width + 10;
            
            if (closestX >= area.x && closestX <= area.x + area.width - visualW && !checkCollision(closestX, startY, wc.id, visualW, visualH)) {
              nextX = closestX;
            }
          }
        }
        wc.x = nextX;

        // Try moving Y second
        let nextY = startY;
        if (clampedTargetY !== startY) {
          const collWc = checkCollision(wc.x, clampedTargetY, wc.id, visualW, visualH);
          if (!collWc) {
            nextY = clampedTargetY;
          } else {
            const otherWcSize = getWcVisualSize(collWc);
            const closestY = clampedTargetY > startY
              ? collWc.y - visualH - 10
              : collWc.y + otherWcSize.height + 10;
            
            if (closestY >= area.y && closestY <= area.y + area.height - visualH && !checkCollision(wc.x, closestY, wc.id, visualW, visualH)) {
              nextY = closestY;
            }
          }
        }
        wc.y = nextY;

        // STICKY CONNECTIONS
        newFactory.flows = (newFactory.flows || []).map((f: any) => {
          if ((f.fromWsId === id || f.toWsId === id) && f.routingPoints) {
            const newPts = [...f.routingPoints.map((p: any) => [...p])];
            const from = f.fromWsId === id ? wc : allWcs[f.fromWsId];
            const to = f.toWsId === id ? wc : allWcs[f.toWsId];
            
            // Build an updated map of all workstations for this drag frame
            const wcsMap = { ...allWcs, [id]: wc };

            const fromAnchor = resolveWorkstationFlowAnchors(f.fromWsId, f.id, newFactory.flows, wcsMap, getWcVisualSize);
            const toAnchor = resolveWorkstationFlowAnchors(f.toWsId, f.id, newFactory.flows, wcsMap, getWcVisualSize);

            if (fromAnchor) {
              newPts[0] = fromAnchor;
            } else {
              const fromSize = getWcVisualSize(from);
              const fdx = to.x - from.x; const fdy = to.y - from.y;
              newPts[0] = [
                (Math.abs(fdx) > Math.abs(fdy) ? (fdx > 0 ? (from.x + fromSize.width) : from.x) : (from.x + fromSize.width / 2)),
                (Math.abs(fdy) >= Math.abs(fdx) ? (fdy > 0 ? (from.y + fromSize.height) : from.y) : (from.y + fromSize.height / 2))
              ];
            }

            if (toAnchor) {
              newPts[newPts.length - 1] = toAnchor;
            } else {
              const toSize = getWcVisualSize(to);
              const fdx = to.x - from.x; const fdy = to.y - from.y;
              newPts[newPts.length - 1] = [
                (Math.abs(fdx) > Math.abs(fdy) ? (fdx > 0 ? to.x : (to.x + toSize.width)) : (to.x + toSize.width / 2)),
                (Math.abs(fdy) >= Math.abs(fdx) ? (fdy > 0 ? to.y : (to.y + toSize.height)) : (to.y + toSize.height / 2))
              ];
            }

            return { ...f, routingPoints: newPts };
          }
          return f;
        });
        updateFactory(newFactory, false);
      }
    } else if (type === 'waypoint' && !isAdmin && !readOnly && !isPublicView) {
      const flowId = (dragRef.current as any).flowId;
      const wpIndex = (dragRef.current as any).wpIndex;
      if (flowId !== undefined && wpIndex !== undefined) {
        const newFactory = { ...factory };
        const flow = newFactory.flows.find((f: any) => f.id === flowId);
        if (flow && flow.routingPoints) {
          const newPts = [...flow.routingPoints.map((p: any) => [...p])];
          const nx = Math.round((itemStartX + dx) / 20) * 20;
          const ny = Math.round((itemStartY + dy) / 20) * 20;
          if (wpIndex > 0 && wpIndex < flow.routingPoints.length - 1) {
            newPts[wpIndex] = [nx, ny];
            const prev = newPts[wpIndex - 1];
            if (Math.abs(nx - prev[0]) < Math.abs(ny - prev[1])) newPts[wpIndex][0] = prev[0];
            else newPts[wpIndex][1] = prev[1];
            flow.routingPoints = newPts;
            updateFactory(newFactory, false);
          }
        }
      }
    } else if (type === 'segment' && !isAdmin && !readOnly && !isPublicView) {
      const flowId = (dragRef.current as any).flowId;
      const si = (dragRef.current as any).segIndex;
      if (flowId !== undefined && si !== undefined) {
        const newFactory = { ...factory };
        const flow = newFactory.flows.find((f: any) => f.id === flowId);
        if (flow && flow.routingPoints) {
          let newPts = [...flow.routingPoints.map((p: any) => [...p])];
          if (newPts.length === 2) {
            const p0 = newPts[0]; const p1 = newPts[1];
            newPts = [p0, [...p0], [...p1], p1];
            (dragRef.current as any).segIndex = 1;
            (dragRef.current as any).itemStartX = p0[0];
            (dragRef.current as any).itemStartY = p0[1];
          }
          const psi = (dragRef.current as any).segIndex;
          const p1 = newPts[psi]; const p2 = newPts[psi + 1];
          const isVertical = Math.abs(p1[0] - p2[0]) < 1;
          if (isVertical) {
            const nx = Math.round(((dragRef.current as any).itemStartX + dx) / 20) * 20;
            if (psi > 0) newPts[psi][0] = nx;
            if (psi + 1 < newPts.length - 1) newPts[psi + 1][0] = nx;
          } else {
            const ny = Math.round(((dragRef.current as any).itemStartY + dy) / 20) * 20;
            if (psi > 0) newPts[psi][1] = ny;
            if (psi + 1 < newPts.length - 1) newPts[psi + 1][1] = ny;
          }
          flow.routingPoints = newPts;
          updateFactory(newFactory, false);
        }
      }
    }
  }, [factory, viewState, hoveredWcId, allWcs, isAdmin, readOnly, isPublicView, updateFactory]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
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
    setIsPanning(false);
  }, [syncLocalInputs]);



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

    let targetX = area.x + 50;
    let targetY = area.y + 100;
    while (checkCollision(targetX, targetY, '', 100, 100)) {
      targetX += 110;
      if (targetX + 100 > area.x + area.width) {
        targetX = area.x + 50;
        targetY += 110;
      }
    }

    const newWc = {
      id: wsId,
      workCenterId: `W${area.lines[0].workCenters.length + 1}`,
      name: `WS ${area.lines[0].workCenters.length + 1}`,
      machineName: `WS ${area.lines[0].workCenters.length + 1}`,
      x: targetX,
      y: targetY,
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
    const wcs = area.lines[0].workCenters;
    const startX = area.x + 80;
    const startY = area.y + 100;

    if (type === 'Straight') {
      let currentX = startX;
      wcs.forEach((wc: any) => {
        const { width: w } = getWcVisualSize(wc);
        wc.x = currentX;
        wc.y = startY + 120;
        currentX += w + 10;
      });
    } else if (type === 'L-Type') {
      const mid = Math.ceil(wcs.length / 2);
      let currentY = startY;
      let maxColW = 0;
      wcs.forEach((wc: any, i: number) => {
        const { width: w, height: h } = getWcVisualSize(wc);
        if (i < mid) {
          wc.x = startX;
          wc.y = currentY;
          currentY += h + 10;
          maxColW = Math.max(maxColW, w);
        }
      });
      const cornerY = mid > 0 ? wcs[mid - 1].y : startY;
      let currentX = startX + maxColW + 10;
      wcs.forEach((wc: any, i: number) => {
        const { width: w } = getWcVisualSize(wc);
        if (i >= mid) {
          wc.x = currentX;
          wc.y = cornerY;
          currentX += w + 10;
        }
      });
    } else if (type === 'U-Type') {
      const seg = Math.ceil(wcs.length / 3);
      let currentY = startY;
      let maxColW1 = 0;
      wcs.forEach((wc: any, i: number) => {
        const { width: w, height: h } = getWcVisualSize(wc);
        if (i < seg) {
          wc.x = startX;
          wc.y = currentY;
          currentY += h + 10;
          maxColW1 = Math.max(maxColW1, w);
        }
      });
      const bottomY = seg > 0 ? wcs[seg - 1].y : startY;
      let currentX = startX + maxColW1 + 10;
      wcs.forEach((wc: any, i: number) => {
        const { width: w } = getWcVisualSize(wc);
        if (i >= seg && i < 2 * seg) {
          wc.x = currentX;
          wc.y = bottomY;
          currentX += w + 10;
        }
      });
      const lastX = currentX;
      let upY = bottomY;
      wcs.forEach((wc: any, i: number) => {
        const { height: h } = getWcVisualSize(wc);
        if (i >= 2 * seg) {
          upY -= h + 10;
          wc.x = lastX;
          wc.y = upY;
        }
      });
    } else if (type === 'Inverted-U') {
      const seg = Math.ceil(wcs.length / 3);
      let totalH1 = 0;
      let maxColW1 = 0;
      wcs.forEach((wc: any, i: number) => {
        if (i < seg) {
          const { width: w, height: h } = getWcVisualSize(wc);
          totalH1 += h + 10;
          maxColW1 = Math.max(maxColW1, w);
        }
      });
      let currentY = startY + totalH1;
      wcs.forEach((wc: any, i: number) => {
        if (i < seg) {
          const { height: h } = getWcVisualSize(wc);
          currentY -= h + 10;
          wc.x = startX;
          wc.y = currentY;
        }
      });
      const topY = seg > 0 ? wcs[seg - 1].y : startY;
      let currentX = startX + maxColW1 + 10;
      wcs.forEach((wc: any, i: number) => {
        const { width: w } = getWcVisualSize(wc);
        if (i >= seg && i < 2 * seg) {
          wc.x = currentX;
          wc.y = topY;
          currentX += w + 10;
        }
      });
      const lastX = currentX;
      let downY = topY;
      wcs.forEach((wc: any, i: number) => {
        const { height: h } = getWcVisualSize(wc);
        if (i >= 2 * seg) {
          wc.x = lastX;
          wc.y = downY;
          downY += h + 10;
        }
      });
    } else if (type === 'S-Line') {
      const colCount = 3;
      const rows: any[][] = [];
      wcs.forEach((wc: any, i: number) => {
        const r = Math.floor(i / colCount);
        if (!rows[r]) rows[r] = [];
        rows[r].push(wc);
      });
      let currentY = startY;
      rows.forEach((row, r) => {
        let maxH = 0;
        row.forEach((wc) => {
          maxH = Math.max(maxH, getWcVisualSize(wc).height);
        });
        const isRight = r % 2 === 0;
        let currentX = isRight ? startX : startX + colCount * 140;
        row.forEach((wc) => {
          const { width: w } = getWcVisualSize(wc);
          if (isRight) {
            wc.x = currentX;
            currentX += w + 10;
          } else {
            currentX -= w + 10;
            wc.x = currentX;
          }
          wc.y = currentY;
        });
        currentY += maxH + 40;
      });
    }
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
    if (action === 'push' && !adminComment.trim()) {
      return alert("Please provide architectural feedback or comments before pushing back to the developer.");
    }
    try {
      const endpoint = action === 'push' ? 'comment' : action;

      const workstations: any[] = [];
      const areas: any[] = [];
      if (factory && factory.areas) {
        factory.areas.forEach((a: any) => {
          areas.push({ id: a.id, admin_comment: a.adminComment || null });
          if (a.lines) {
            a.lines.forEach((l: any) => {
              if (l.workCenters) {
                l.workCenters.forEach((wc: any) => {
                  workstations.push({ id: wc.id, admin_comment: wc.adminComment || null });
                });
              }
            });
          }
        });
      }

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
          status: (action === 'push' || action === 'reject') ? 'rejected' : 'approved',
          reviewedBy: 'Admin',
          reviewed_by: 'Admin',
          workstations,
          areas
        })
      });

      if (res.ok) {
        let msg = "Action successful!";
        if (action === 'push') msg = "Layout rejected and sent back to developer with feedback!";
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

  const getCursorStyle = () => {
    const isDraggingSomething = isPanning || (dragRef.current !== null);
    if (isDraggingSomething) return 'grabbing';
    if (hoveredWcId) return 'grab';
    return 'grab';
  };

  if (isAdmin || readOnly || isPublicView) {
    return (
      <div className="flex flex-1 flex-col relative bg-[#060b14] overflow-hidden w-full h-full font-sans">
        <div ref={containerRef} className="flex-1 overflow-hidden z-10 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            style={{ cursor: getCursorStyle() }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>

        {/* Responsive Control Toggle (only under xl viewports) */}
        <div className="xl:hidden absolute top-28 left-6 z-30">
          <Button
            onClick={() => setShowAdminPanels(!showAdminPanels)}
            className="bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] rounded-xl h-11 px-4 font-bold shadow-xl flex items-center gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            {showAdminPanels ? 'Hide Controls' : 'Show Display Options'}
          </Button>
        </div>

        <div className={`absolute top-[440px] xl:top-[380px] left-6 xl:left-8 z-20 w-[240px] flex flex-col gap-5 bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl p-6 transition-all duration-300 ${showAdminPanels ? 'translate-x-0 opacity-100' : 'max-xl:-translate-x-[350px] max-xl:opacity-0 xl:translate-x-0'}`}>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3 mb-1">Architectural Legend</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-4 border-2 border-[#10b981] rounded-sm group-hover:scale-110 transition-transform"></div><span>Workstation</span></div>
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-0.5 border-t-2 border-dashed border-[#f59e0b] group-hover:translate-x-1 transition-transform"></div><span className="text-[#f59e0b]">Internal Flow</span></div>
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-0.5 border-t-2 border-dashed border-[#ef4444] group-hover:translate-x-1 transition-transform"></div><span className="text-[#ef4444]">Outer Flow</span></div>
            <div className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-widest group cursor-default"><div className="w-8 h-4 border-2 border-dashed border-slate-700 rounded-sm group-hover:scale-110 transition-transform"></div><span>Area Bound</span></div>
          </div>
        </div>

        <div className={`absolute top-[170px] xl:top-[110px] left-6 xl:left-8 z-20 w-[280px] bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl p-6 transition-all duration-300 ${showAdminPanels ? 'translate-x-0 opacity-100' : 'max-xl:-translate-x-[350px] max-xl:opacity-0 xl:translate-x-0'}`}>
          <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-indigo-400" /> Display Parameters</h3>
          <div className="space-y-4">{allFilters.map(f => (<label key={f.id} className="flex items-start gap-4 p-2 hover:bg-[#1e293b]/50 rounded-xl cursor-pointer transition-colors group"><input type="checkbox" checked={activeFilterIds[f.id]} onChange={() => setActiveFilterIds(p => ({ ...p, [f.id]: !p[f.id] }))} className="mt-0.5 h-4.5 w-4.5 accent-indigo-500 rounded border-slate-700 bg-slate-900" /><div className="flex flex-col gap-0.5"><span className="text-[12px] font-bold text-slate-200 group-hover:text-white">{f.label}</span><span className="text-[10px] text-slate-500">{f.description}</span></div></label>))}</div>
        </div>

        <div className="absolute top-0 left-0 right-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 bg-[#060b14]/90 sm:bg-gradient-to-b sm:from-[#060b14] sm:via-[#060b14]/90 sm:to-transparent border-b border-slate-800/20 md:border-b-0">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <Button onClick={() => window.location.href = isPublicView ? '/' : '/admin'} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl h-12 px-6 font-bold shadow-xl hover:bg-[#334155] transition-all active:scale-95 flex-shrink-0"><ArrowLeft className="mr-3 h-5 w-5" /> {isPublicView ? 'Exit View' : 'Back'}</Button>
            <div className="hidden sm:block h-10 w-px bg-slate-800"></div>
            <div>
              <h2 className="text-white font-bold text-lg sm:text-2xl tracking-tight mb-1">{factory?.name || 'Blueprint Reviewer'} <span className="text-slate-500 font-medium ml-2 text-xs sm:text-sm">ID-{layoutId}</span></h2>
              <p className="text-indigo-400 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> {isPublicView ? 'Public Shared View' : 'Review Mode (View Only)'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
            <Button
              onClick={() => window.open('/admin/help', '_blank')}
              className="bg-[#1e293b] text-white border border-[#334155] rounded-xl h-12 px-4 sm:px-6 font-bold shadow-xl hover:bg-[#334155] text-xs sm:text-sm flex-1 sm:flex-none flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4 text-indigo-400" /> Guide
            </Button>
            <Button
              onClick={() => setShowComments(!showComments)}
              className={`border rounded-xl h-12 px-4 sm:px-6 font-bold shadow-xl transition-all flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none ${showComments ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 font-extrabold' : 'bg-[#1e293b] text-white border-[#334155] hover:bg-[#334155]'}`}
            >
              <MessageSquare className="h-4 w-4" />
              {showComments ? 'Hide Comments' : 'Comments'}
            </Button>
            <Button onClick={handleFitToScreen} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl h-12 px-4 sm:px-6 font-bold shadow-xl hover:bg-[#334155] transition-all active:scale-95 text-xs sm:text-sm flex-1 sm:flex-none"><Maximize2 className="mr-2 h-4 w-4" /> Center</Button>
            <Button onClick={() => navigator.clipboard.writeText(getShareUrl()).then(() => setShareMsg(true))} className="bg-[#1e293b] text-white border border-[#334155] rounded-xl h-12 px-4 sm:px-6 font-bold shadow-xl hover:bg-[#334155] text-xs sm:text-sm flex-1 sm:flex-none">{shareMsg ? 'Copied ✓' : 'Share'}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-indigo-600 text-white rounded-xl h-12 px-4 sm:px-6 font-bold shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none">
                  <Download className="h-4 w-4" /> Download
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
          <div className="absolute bottom-4 sm:bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-full md:max-w-5xl z-20 flex flex-col gap-4 sm:gap-5 bg-[#0f172a]/98 backdrop-blur-xl border border-[#1e293b] p-5 sm:p-8 rounded-3xl shadow-2xl ring-1 ring-white/5 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><MessageSquare className="h-4 w-4 text-indigo-400" /> Reviewer Feedback</h3>
              <div className="flex gap-2 items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div> Secure Session
              </div>
            </div>

            {(selectedWc || selectedArea) && (
              <div className="flex flex-col gap-3 p-4 sm:p-5 bg-[#0b1120] border border-[#1e293b] rounded-2xl animate-in fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-indigo-400 font-extrabold tracking-wider uppercase flex items-center gap-2">
                    <Activity className="h-4 w-4" /> {selectedWc ? `Workstation ${selectedWc.name || selectedWc.workCenterId}` : `Area ${selectedArea?.areaName}`}
                  </span>
                  <button onClick={() => { setSelectedWcId(null); setSelectedAreaId(null); }} className="text-slate-400 hover:text-white transition-colors text-xs font-bold flex items-center gap-1">
                    Clear Selection <X className="h-3 w-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={selectedWc ? (selectedWc.adminComment || '') : (selectedArea?.adminComment || '')}
                  onChange={e => {
                    const val = e.target.value;
                    setFactory((prev: any) => {
                      const next = JSON.parse(JSON.stringify(prev));
                      if (selectedWcId) {
                        next.areas.forEach((a: any) => a.lines.forEach((l: any) => l.workCenters.forEach((wc: any) => {
                          if (wc.id === selectedWcId) wc.adminComment = val;
                        })));
                      } else if (selectedAreaId) {
                        const area = next.areas.find((a: any) => a.id === selectedAreaId);
                        if (area) area.adminComment = val;
                      }
                      return next;
                    });
                  }}
                  className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-5 py-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  placeholder={`Add comments specific to this element here...`}
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center w-full">
              <input type="text" value={adminComment} onChange={e => setAdminComment(e.target.value)} className="flex-1 bg-[#0b1120] border border-[#1e293b] rounded-2xl px-6 py-4 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600" placeholder="Type your detailed architectural feedback here..." />
              <div className="flex flex-wrap gap-2 md:gap-3 justify-end">
                <Button onClick={() => handleReviewAction('push')} className="bg-[#3f83f8] hover:bg-[#2563eb] text-white px-5 sm:px-6 h-12 rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"><Send className="h-4 w-4" /> Push to Dev</Button>
                <Button onClick={() => handleReviewAction('approve')} className="bg-[#10b981] hover:bg-[#059669] text-white px-5 sm:px-6 h-12 rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Approve</Button>
                <Button onClick={() => handleReviewAction('reject')} className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-5 sm:px-6 h-12 rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-wider shadow-lg shadow-rose-500/20 transition-all active:scale-95">Reject</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#f8fafc] font-sans">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-30">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-6 w-6 text-slate-700" />
            <span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Layout Editor</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>
          <span className="text-sm font-bold text-slate-500">{factory?.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          <div className="px-4 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Layout ID-</span>
            <span className="text-xs font-bold text-slate-600">{layoutId}</span>
          </div>
          <Button onClick={() => { if (onSave) onSave(factory); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); }} className="bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 px-6 sm:px-8 rounded-xl shadow-lg shadow-slate-100 w-full sm:w-auto"><Save className="h-4 w-4 mr-2" /> {savedMsg ? 'Saved!' : 'Save Layout'}</Button>
        </div>
      </div>

      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => window.location.href = '/developer'} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white h-11"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>
          <Button onClick={downloadCSV} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white h-11"><Download className="h-4 w-4 mr-2" /> Download CSV</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl border-slate-200 text-indigo-600 font-bold hover:bg-indigo-50 flex items-center gap-2 h-11">
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
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-11 items-center">
            <Button onClick={() => handleZoomButton(false)} variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><ZoomOut className="h-4 w-4" /></Button>
            <div className="flex items-center px-3 text-[11px] font-bold text-slate-400 min-w-[50px] justify-center">{Math.round(viewState.zoom * 100)}%</div>
            <Button onClick={() => handleZoomButton(true)} variant="ghost" size="icon" className="h-9 w-9 text-slate-500"><ZoomIn className="h-4 w-4" /></Button>
          </div>
          <Button onClick={handleFitToScreen} variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 shadow-sm hover:bg-white"><Maximize2 className="h-4 w-4" /></Button>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-11 items-center">
            <Button onClick={undo} disabled={history.length === 0} variant="ghost" size="icon" className="h-9 w-9 text-slate-500 disabled:opacity-30"><Undo2 className="h-4 w-4" /></Button>
            <Button onClick={redo} disabled={redoStack.length === 0} variant="ghost" size="icon" className="h-9 w-9 text-slate-500 disabled:opacity-30"><Redo2 className="h-4 w-4" /></Button>
          </div>
          <Button
            onClick={() => setShowComments(!showComments)}
            variant={showComments ? "default" : "outline"}
            className={`rounded-xl font-bold h-11 transition-all ${showComments ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100' : 'border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{showComments ? 'Hide Comments' : 'Comments'}</span>
            <span className="sm:hidden">{showComments ? 'Hide' : 'Comments'}</span>
          </Button>
          <Button onClick={() => setShowGrid(!showGrid)} variant={showGrid ? "default" : "outline"} className={`rounded-xl font-bold h-11 ${showGrid ? 'bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-white'}`}><Grid3x3 className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Grid</span></Button>
          <Button
            onClick={() => window.open('/developer/help', '_blank')}
            variant="outline"
            className="rounded-xl border-slate-200 text-indigo-650 font-bold hover:bg-indigo-50 h-11 flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Guide</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm overflow-y-auto transition-all duration-300 relative ${isSidebarCollapsed ? 'w-0 border-r-0 opacity-0' : 'w-full md:w-[320px] opacity-100'}`}>
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
                        <option value="S-Line">S Line Type</option>
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

            {selectedFlowId && (
              <div className="bg-sky-900 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-300 border border-sky-800">
                <div className="flex items-center gap-3 mb-6"><div className="p-2.5 rounded-xl bg-white/10 text-white shadow-inner"><Navigation className="h-5 w-5" /></div><div><h4 className="text-sm font-black text-white uppercase tracking-tight">Flow Routing</h4><p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Manual Path Editor</p></div></div>
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Interactive path editing enabled. Drag the <span className="text-sky-400 font-bold">blue handles</span> on the arrow to adjust the routing.
                    End-points remain locked to workstations.
                  </p>
                  <Button
                    onClick={() => {
                      setFactory((prev: any) => ({
                        ...prev,
                        flows: prev.flows.map((f: any) => f.id === selectedFlowId ? { ...f, routingPoints: undefined } : f)
                      }));
                      setSelectedFlowId(null);
                    }}
                    className="w-full rounded-2xl bg-white text-sky-900 border border-sky-200 font-black uppercase text-[10px] tracking-widest h-12 hover:bg-sky-50 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Reset to Auto-Route
                  </Button>
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
          {/* Sidebar Collapse Toggle Button */}
          <Button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 z-30 h-10 w-10 rounded-xl bg-white border-slate-200 text-slate-600 shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5 md:rotate-90" />}
          </Button>

          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ cursor: getCursorStyle() }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          <div className="absolute bottom-6 left-6 right-6 md:right-auto flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-6 px-4 md:px-6 py-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl z-20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><Move className="h-4 w-4 text-slate-400" /> Pan: Space & Drag</div><div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><Search className="h-4 w-4 text-slate-400" /> Zoom: Scroll</div><div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><Maximize2 className="h-4 w-4 text-slate-400" /> Move Machine: Drag Inside Area</div>
          </div>

          {selectedFlowId && (
            <div className="absolute bottom-24 left-8 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-30 animate-in slide-in-from-bottom-4 duration-300">
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg"
                onClick={() => {
                  setFactory((prev: any) => ({
                    ...prev,
                    flows: prev.flows.map((f: any) => {
                      if (f.id === selectedFlowId) {
                        // Simplify to straight line between endpoints
                        const from = allWcs[f.fromWsId]; const to = allWcs[f.toWsId];
                        return { ...f, routingPoints: [[from.x + from.width / 2, from.y + from.height / 2], [to.x + to.width / 2, to.y + to.height / 2]] };
                      }
                      return f;
                    })
                  }));
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-slate-200" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg"><ArrowRight className="h-4 w-4" /></Button>
              <div className="w-px h-4 bg-slate-200" />
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg"
                onClick={() => {
                  // Resetting to auto-route effectively gives the 'Step' look
                  setFactory((prev: any) => ({
                    ...prev,
                    flows: prev.flows.map((f: any) => f.id === selectedFlowId ? { ...f, routingPoints: undefined } : f)
                  }));
                  setSelectedFlowId(null);
                }}
              >
                <CornerDownRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
