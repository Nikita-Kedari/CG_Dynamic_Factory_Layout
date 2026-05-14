'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, RotateCcw, Save, ArrowLeft, Move, X, Upload, Download, ChevronRight, ChevronDown, AlignJustify, LayoutGrid, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { defaultFactory } from '@/lib/boilerplate-data';

interface GridEditorProps {
  onSave?: (factory: any) => void;
  initialFactory?: any;
  isAdmin?: boolean;
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

export function GridEditor({ onSave, initialFactory, isAdmin = false }: GridEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  const [factory, setFactory] = useState(initialFactory || defaultFactory);
  const [showGrid, setShowGrid] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  // Smooth view state (same lerp system as dashboard)
  const [viewState, setViewState] = useState({
    zoom: 0.35, panX: 60, panY: 60, time: 0,
    targetZoom: 0.35, targetPanX: 60, targetPanY: 60,
  });

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<{ type: 'area' | 'machine'; id: string } | null>(null);
  const [tooltipState, setTooltipState] = useState<{ x: number, y: number, text: string } | null>(null);
  const [draggingMachine, setDraggingMachine] = useState<{ id: string, areaId: string, lineId: string } | null>(null);
  const [areaLayoutTypes, setAreaLayoutTypes] = useState<Record<string, string>>({});
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingWidth, setEditingWidth] = useState<string | null>(null);
  const [editingHeight, setEditingHeight] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            ctx.lineTo(arrowX - 18 * zoom * Math.cos(angle - Math.PI / 6), arrowY - 18 * zoom * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - 18 * zoom * Math.cos(angle + Math.PI / 6), arrowY - 18 * zoom * Math.sin(angle + Math.PI / 6));
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
            
            const fx = (fromWC.x + fromWC.width / 2) * zoom + panX;
            const fy = (fromWC.y + fromWC.height / 2) * zoom + panY;
            const tx = (toWC.x + toWC.width / 2) * zoom + panX;
            const ty = (toWC.y + toWC.height / 2) * zoom + panY;

            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = '#ef4444'; // Red for inter-area connections
            ctx.lineWidth = 3.5 * zoom;
            ctx.setLineDash([12 * zoom, 8 * zoom]);
            ctx.lineDashOffset = -viewState.time * 25 * zoom;
            ctx.stroke();
            ctx.setLineDash([]);

            // Red Arrow Head
            const angle = Math.atan2(ty - fy, tx - fx);
            const ptRadius = Math.max(toWC.width / 2, toWC.height / 2) * zoom + (5 * zoom);
            const arrowX = tx - Math.cos(angle) * ptRadius;
            const arrowY = ty - Math.sin(angle) * ptRadius;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 18 * zoom * Math.cos(angle - Math.PI / 6), arrowY - 18 * zoom * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - 18 * zoom * Math.cos(angle + Math.PI / 6), arrowY - 18 * zoom * Math.sin(angle + Math.PI / 6));
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
            const statusColor =
              wc.status === 'operational' ? '#10b981' :
                wc.status === 'idle' ? '#f59e0b' :
                  wc.status === 'maintenance' ? '#f97316' : '#ef4444';

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
            if (wc.name) {
              const text = wc.name.toUpperCase();
              ctx.fillStyle = isMachineHovered ? '#bae6fd' : '#f8fafc'; // glowing text
              ctx.font = `bold ${Math.max(12, 22 * zoom)}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, wx + ww / 2, wy + wh / 2);
              ctx.textAlign = 'left';
              ctx.textBaseline = 'alphabetic';
            }

            // Lower detail name
            if (zoom > 0.8) {
              ctx.fillStyle = '#94a3b8';
              ctx.font = `500 ${Math.max(6, 9 * zoom)}px Inter, sans-serif`;
              const name = wc.machineName.length > 15 ? wc.machineName.substring(0, 13) + '..' : wc.machineName;
              ctx.fillText(name, wx + 6 * zoom, wy + wh - 10 * zoom);
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
  }, [factory, viewState, hoveredEntity, selectedAreaId, showGrid]);

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
    const targetZoom = Math.min(scaleX, scaleY, 2.0);
    setViewState(prev => ({
      ...prev,
      targetZoom,
      targetPanX: padding,
      targetPanY: padding,
    }));
  }, [factory]);

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

    if (foundMachine && !isAdmin) {
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
        if (zoom > 0.5) {
          area.lines?.forEach((line: any) => {
            line.workCenters?.forEach((wc: any) => {
              if (mx >= wc.x && mx <= wc.x + wc.width && my >= wc.y && my <= wc.y + wc.height) {
                found = { type: 'machine', id: wc.id };
                if (wc.detail) {
                  newTooltip = { x: e.clientX, y: e.clientY - 40, text: wc.detail };
                }
              }
            });
          });
        }
      }
    });

    // Explicit clear if no machine hovered
    if (!found || (found as any).type !== 'machine') {
      newTooltip = null;
    }

    setHoveredEntity(found);
    setTooltipState(newTooltip);
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

        if (hitArea) {
          setSelectedAreaId(hitArea.id === selectedAreaId ? null : hitArea.id);
        } else {
          setSelectedAreaId(null);
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
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const newZoom = Math.max(0.1, Math.min(3.0, viewState.targetZoom + delta));
    setViewState(prev => ({ ...prev, targetZoom: newZoom }));
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
          id: wId, workCenterId: wId, machineName: wName || mName, name: wName,
          wsSequence: wSeq,
          x: wX * 2.5, y: wY * 2.5,
          width: Math.max(wW * 6, 90), height: Math.max(wH * 6, 90),
          icon: 'tool', status: 'operational', detail: detail.replace(/"/g, '').trim()
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

  const selectedArea = factory?.areas?.find((a: any) => a.id === selectedAreaId);

  return (
    <div className="flex h-full flex-col bg-slate-50">
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

        {/* CSV Editor Sidebar */}
        <div className="w-[340px] bg-slate-50 border-r border-slate-200 z-20 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-800">{isAdmin ? 'Admin Review' : 'CSV Editor'}</h2>
                {!isAdmin && <span className="text-[9px] font-bold tracking-wider bg-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-full uppercase">Active Sync</span>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isAdmin && (
              <div className="mb-8 p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                <label className="text-sm font-semibold text-slate-800 mb-2 block flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" /> Developer Comments
                </label>
                <textarea
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-indigo-400 min-h-[120px] resize-none shadow-inner"
                  placeholder="Add your comments here for the developer to review..."
                  value={factory?.adminComments || ''}
                  onChange={e => {
                    setFactory((prev: any) => ({ ...prev, adminComments: e.target.value }));
                  }}
                />
                <Button 
                  onClick={() => {
                    setSavedMsg(true);
                    if (onSave) onSave(factory);
                    setTimeout(() => setSavedMsg(false), 2000);
                  }}
                  className="w-full mt-3 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md h-10 transition-colors"
                >
                  <Save className="h-4 w-4" /> Save Comments
                </Button>
                {savedMsg && <p className="text-xs text-emerald-600 font-medium text-center mt-2">Comments saved successfully!</p>}
              </div>
            )}

            {(!isAdmin && factory?.adminComments) && (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Admin Feedback
                </h3>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{factory.adminComments}</p>
              </div>
            )}

            {factory?.areas?.map((area: any) => (
              <div key={`edit-area-${area.id}`} className="mb-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                {/* Area Title Header */}
                <div 
                  className="flex items-center gap-2 mb-4 cursor-pointer group"
                  onClick={() => setCollapsedAreas(prev => ({ ...prev, [area.id]: !prev[area.id] }))}
                >
                  <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide group-hover:text-indigo-600 transition-colors">{area.areaName || 'Assembly Area'}</h3>
                  <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                    {area.lines?.[0]?.workCenters?.length || 0} WCs
                  </span>
                  {(!isAdmin && collapsedAreas[area.id]) ? <ChevronRight className="h-4 w-4 text-slate-400 ml-1" /> : !isAdmin ? <ChevronDown className="h-4 w-4 text-slate-400 ml-1" /> : null}
                </div>

                {(!isAdmin && !collapsedAreas[area.id]) && (
                  <div className="space-y-3">
                    {/* Area Bounds Pill */}
                    <div
                      onClick={() => setExpandedId(expandedId === area.id ? null : area.id)}
                      className="group relative flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer mb-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold font-mono">A</div>
                        <span className="text-sm font-semibold text-indigo-900">Area Constraints</span>
                      </div>
                      {expandedId === area.id ? <ChevronDown className="h-4 w-4 text-indigo-400" /> : <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400" />}
                    </div>

                    {/* Expansion content for Area */}
                    {expandedId === area.id && (
                      <div className="p-4 bg-white border border-slate-100 rounded-xl mb-4 shadow-sm space-y-3">
                        <div className="mb-3">
                          <label className="text-xs text-slate-500 font-medium mb-1 block">Layout Engine</label>
                          <select
                            value={areaLayoutTypes[area.id] || 'U-Shape'}
                            onChange={(e) => applyAutoLayout(area.id, e.target.value, area.width, area.height, false)}
                            className="w-full text-sm font-medium border border-slate-200 rounded-md bg-white text-indigo-700 px-2.5 py-1.5 outline-none cursor-pointer hover:border-indigo-300 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                          >
                            <option value="U-Shape">U-Shape Layout</option>
                            <option value="Inverted U-Shape">Inverted U-Shape Layout</option>
                            <option value="L-Shape">L-Shape Layout</option>
                            <option value="Straight">Straight Layout</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Width (W)</label>
                            <input type="number" 
                              value={editingWidth !== null ? editingWidth : Math.round(area.width)} 
                              onChange={e => {
                                setEditingWidth(e.target.value);
                                applyAutoLayout(area.id, areaLayoutTypes[area.id] || 'U-Shape', Number(e.target.value), area.height, false);
                              }}
                              onBlur={e => {
                                setEditingWidth(null);
                                applyAutoLayout(area.id, areaLayoutTypes[area.id] || 'U-Shape', Number(e.target.value), area.height, true);
                              }}
                              className="w-full text-sm border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium mb-1 block">Height (H)</label>
                            <input type="number" 
                              value={editingHeight !== null ? editingHeight : Math.round(area.height)} 
                              onChange={e => {
                                setEditingHeight(e.target.value);
                                applyAutoLayout(area.id, areaLayoutTypes[area.id] || 'U-Shape', area.width, Number(e.target.value), false);
                              }}
                              onBlur={e => {
                                setEditingHeight(null);
                                applyAutoLayout(area.id, areaLayoutTypes[area.id] || 'U-Shape', area.width, Number(e.target.value), true);
                              }}
                              className="w-full text-sm border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WorkCenters List */}
                    {area.lines?.map((line: any) =>
                      line.workCenters?.map((wc: any, i: number) => (
                        <div key={`edit-wc-${wc.id}`} className="mb-2.5">
                          <div
                            onClick={() => setExpandedId(expandedId === wc.id ? null : wc.id)}
                            className="group relative flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 text-xs font-bold font-mono border border-slate-100">{i + 1}</div>
                              <span className="text-[15px] font-medium text-slate-800 truncate max-w-[180px]">
                                {wc.detail ? wc.detail.split(':')[1]?.trim() || wc.detail : wc.name || 'Workstation'}
                              </span>
                            </div>
                            {expandedId === wc.id ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                          </div>

                          {/* Expansion content for Machine */}
                          {expandedId === wc.id && (
                            <div className="p-4 mt-2 mb-2 bg-slate-50 border border-slate-100 rounded-lg shadow-inner space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Pos X</label>
                                  <input type="number" value={Math.round(wc.x)} onChange={e => {
                                    setFactory((prev: any) => {
                                      const nf = { ...prev };
                                      const targetArea = nf.areas.find((a: any) => a.id === area.id);
                                      const targetLine = targetArea?.lines?.find((l: any) => l.id === line.id);
                                      const targetWc = targetLine?.workCenters?.find((w: any) => w.id === wc.id);
                                      if (!targetWc) return prev;
                                      const headerH = 45;
                                      let newX = Number(e.target.value);
                                      // Clamp to area bounds
                                      if (newX < targetArea.x + 5) newX = targetArea.x + 5;
                                      if (newX + targetWc.width > targetArea.x + targetArea.width - 5) newX = targetArea.x + targetArea.width - targetWc.width - 5;
                                      targetWc.x = newX;
                                      return nf;
                                    });
                                  }} className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white outline-none focus:border-indigo-400" />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Pos Y</label>
                                  <input type="number" value={Math.round(wc.y)} onChange={e => {
                                    setFactory((prev: any) => {
                                      const nf = { ...prev };
                                      const targetArea = nf.areas.find((a: any) => a.id === area.id);
                                      const targetLine = targetArea?.lines?.find((l: any) => l.id === line.id);
                                      const targetWc = targetLine?.workCenters?.find((w: any) => w.id === wc.id);
                                      if (!targetWc) return prev;
                                      const headerH = 45;
                                      let newY = Number(e.target.value);
                                      // Clamp to area bounds
                                      if (newY < targetArea.y + headerH) newY = targetArea.y + headerH;
                                      if (newY + targetWc.height > targetArea.y + targetArea.height - 5) newY = targetArea.y + targetArea.height - targetWc.height - 5;
                                      targetWc.y = newY;
                                      return nf;
                                    });
                                  }} className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white outline-none focus:border-indigo-400" />
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

          {!isAdmin && (
            <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10">
              <Button onClick={handleExportCSV} className="w-full gap-2 bg-slate-800 hover:bg-slate-900 text-white shadow-md rounded-xl h-11">
                <Download className="h-4 w-4" /> Export CSV Layout
              </Button>
            </div>
          )}
        </div>

        {/* Canvas Container */}
        <div ref={containerRef} className="flex-1 overflow-hidden z-10 bg-[#0f172a]">
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            className="w-full h-full cursor-grab active:cursor-grabbing block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={e => e.preventDefault()}
          />

          {/* Hover Tooltip */}
          {tooltipState && (
            <div
              className="fixed z-50 pointer-events-none px-3 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg shadow-xl max-w-xs transition-opacity duration-150"
              style={{ left: tooltipState.x + 15, top: tooltipState.y }}
            >
              {tooltipState.text}
            </div>
          )}
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
