
import { Factory, Area, Line, WorkCenter } from './types';
import { randomUUID } from 'crypto';

export const CSV_HEADERS = [
  'areaName', 'areaX', 'areaY', 'areaWidth', 'areaHeight',
  'lineName', 'lineX', 'lineY', 'lineWidth', 'lineHeight',
  'machineName', 'machineX', 'machineY', 'machineWidth', 'machineHeight', 'status'
];

export const generateSampleCSV = (): string => {
  const headers = CSV_HEADERS.join(',');
  const rows = [
    'Floor Left,0,0,450,800,Line A,20,50,400,100,CNC Machine 1,30,60,80,80,operational',
    'Floor Left,0,0,450,800,Line A,20,50,400,100,CNC Machine 2,150,60,80,80,idle',
    'Floor Mid,500,0,450,800,Line B,520,50,400,100,Assembly Stn 1,530,60,100,80,operational',
  ];
  return `${headers}\n${rows.join('\n')}`;
};

export const parseCSV = (csvContent: string): Factory => {
  const lines = csvContent.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('Invalid CSV format: Missing data.');
  }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Check if it's the complex CSV format
  if (headers.includes('factory_id') || headers.includes('canvas_width')) {
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

    return {
      id: factoryId, name: factoryName, width: Math.max(2000, globalMaxX + 500), height: Math.max(1500, globalMaxY + 500), gridUnit: 50,
      areas: areas,
      flows
    };
  }

  // --- Start of SIMPLE format fallback ---
  const csvHeaders = lines[0].split(',').map(h => h.trim());

  const factory: Factory = {
    id: randomUUID(),
    name: 'Imported Factory',
    width: 2000,
    height: 1000,
    gridUnit: 50,
    areas: []
  };

  const areaMap = new Map<string, Area>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;
    const values = row.split(',').map(v => v.trim());
    const data: any = {};
    csvHeaders.forEach((h, idx) => data[h] = values[idx]);

    if (!data.areaName) continue; // Skip rows causing error

    if (!areaMap.has(data.areaName)) {
      areaMap.set(data.areaName, {
        id: randomUUID(),
        areaId: data.areaName.toLowerCase().replace(/\s/g, '-'),
        areaName: data.areaName,
        x: parseFloat(data.areaX) || 0,
        y: parseFloat(data.areaY) || 0,
        width: parseFloat(data.areaWidth) || 400,
        height: parseFloat(data.areaHeight) || 800,
        lines: [],
        buffers: [],
        storage: []
      });
    }

    const area = areaMap.get(data.areaName)!;
    
    let line = area.lines.find(l => l.lineName === data.lineName);
    if (!line) {
      if (!data.lineName) continue;
      line = {
        id: randomUUID(),
        lineId: data.lineName.toLowerCase().replace(/\s/g, '-'),
        lineName: data.lineName,
        x: parseFloat(data.lineX) || 0,
        y: parseFloat(data.lineY) || 0,
        width: parseFloat(data.lineWidth) || 400,
        height: parseFloat(data.lineHeight) || 100,
        workCenters: []
      };
      area.lines.push(line);
    }

    if (data.machineName) {
      const wc: WorkCenter = {
        id: randomUUID(),
        workCenterId: randomUUID(),
        machineName: data.machineName,
        x: parseFloat(data.machineX) || 0,
        y: parseFloat(data.machineY) || 0,
        width: parseFloat(data.machineWidth) || 50,
        height: parseFloat(data.machineHeight) || 50,
        status: (data.status as any) || 'operational',
        areaId: area.id
      };
      line.workCenters.push(wc);
    }
  }

  factory.areas = Array.from(areaMap.values());
  return factory;
};
