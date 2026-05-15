import { Factory, Area, Line, WorkCenter, Flow } from './types';

export const CSV_HEADERS = [
  'areaName', 'areaX', 'areaY', 'areaWidth', 'areaHeight',
  'lineName', 'lineX', 'lineY', 'lineWidth', 'lineHeight',
  'machineName', 'machineX', 'machineY', 'machineWidth', 'machineHeight', 'status'
];

export const parseCSV = (csvContent: string): Factory => {
  const lines = csvContent.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('Invalid CSV format: Missing data.');
  }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Check if it's the complex "factory_layout_base" format
  if (headers.includes('factory_code') || headers.includes('canvas_width')) {
    let factoryId = '101', factoryName = 'Factory', layoutName = 'Layout';
    let canvasW = 5000, canvasH = 3500;

    const areasMap = new Map<string, Area>();
    const flows: Flow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 15) continue;

      // Factory Info (only need from first row)
      if (i === 1) {
        factoryId = parts[0] || factoryId;
        factoryName = parts[1] || factoryName;
        layoutName = parts[2] || layoutName;
        canvasW = parseFloat(parts[3]) || canvasW;
        canvasH = parseFloat(parts[4]) || canvasH;
      }

      const areaCode = parts[5];
      const areaName = parts[6];
      const areaX = parseFloat(parts[7]);
      const areaY = parseFloat(parts[8]);
      const areaW = parseFloat(parts[9]);
      const areaH = parseFloat(parts[10]);

      const lineCode = parts[12];
      const lineName = parts[13];
      const lineType = parts[14] as any;

      const wsCode = parts[17];
      const wsName = parts[18];
      const wsSeq = parseInt(parts[19]) || 0;
      const wsX = parseFloat(parts[20]);
      const wsY = parseFloat(parts[21]);
      const wsW = parseFloat(parts[22]);
      const wsH = parseFloat(parts[23]);

      const fromWs = parts[26];
      const toWs = parts[27];
      const detail = parts[31];

      // 1. Get or Create Area
      if (!areasMap.has(areaCode)) {
        areasMap.set(areaCode, {
          id: areaCode,
          areaId: areaCode,
          areaName: areaName,
          x: areaX,
          y: areaY,
          width: areaW,
          height: areaH,
          lines: [],
          buffers: [],
          storage: []
        });
      }
      const area = areasMap.get(areaCode)!;

      // 2. Get or Create Line in Area
      let line = area.lines.find(l => l.lineId === lineCode);
      if (!line) {
        line = {
          id: lineCode,
          lineId: lineCode,
          lineName: lineName,
          x: areaX,
          y: areaY,
          width: areaW,
          height: areaH,
          lineType: (lineType?.includes('U-Type') ? 'U-Type' : lineType?.includes('L-Type') ? 'L-Type' : 'Straight') as any,
          workCenters: []
        };
        area.lines.push(line);
      }

      // 3. Add Workstation
      if (wsCode) {
        // Dynamic parameters from CSV columns
        const parameters: any = {
          lastUpdated: new Date()
        };
        // Add all available columns to parameters for dynamic display
        headers.forEach((h, idx) => {
          if (parts[idx]) parameters[h] = parts[idx];
        });

        line.workCenters.push({
          id: wsCode,
          workCenterId: wsCode,
          machineName: wsName,
          x: wsX,
          y: wsY,
          width: wsW || 90,
          height: wsH || 90,
          status: 'operational',
          detail: detail,
          areaId: areaCode,
          wsSequence: wsSeq,
          parameters: parameters
        });
      }

      // 4. Add Flow
      if (fromWs && toWs) {
        flows.push({
          id: `f-${fromWs}-${toWs}`,
          fromWsId: fromWs,
          toWsId: toWs,
          arrowType: 'escalator',
          label: 'Flow'
        });
      }
    }

    return {
      id: factoryId,
      name: factoryName,
      width: canvasW,
      height: canvasH,
      gridUnit: 50,
      areas: Array.from(areasMap.values()),
      flows: flows
    };
  }

  // --- SIMPLE format fallback ---
  const factory: Factory = {
    id: crypto.randomUUID(),
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
    headers.forEach((h, idx) => data[h] = values[idx]);

    if (!data.areaname) continue;

    if (!areaMap.has(data.areaname)) {
      areaMap.set(data.areaname, {
        id: crypto.randomUUID(),
        areaId: data.areaname.toLowerCase().replace(/\s/g, '-'),
        areaName: data.areaname,
        x: parseFloat(data.areax) || 0,
        y: parseFloat(data.areay) || 0,
        width: parseFloat(data.areawidth) || 400,
        height: parseFloat(data.areaheight) || 800,
        lines: [],
        buffers: [],
        storage: []
      });
    }

    const area = areaMap.get(data.areaname)!;

    let line = area.lines.find(l => l.lineName === data.linename);
    if (!line) {
      if (!data.linename) continue;
      line = {
        id: crypto.randomUUID(),
        lineId: data.linename.toLowerCase().replace(/\s/g, '-'),
        lineName: data.linename,
        x: parseFloat(data.linex) || 0,
        y: parseFloat(data.liney) || 0,
        width: parseFloat(data.linewidth) || 400,
        height: parseFloat(data.lineheight) || 100,
        workCenters: []
      };
      area.lines.push(line);
    }

    if (data.machinename) {
      line.workCenters.push({
        id: crypto.randomUUID(),
        workCenterId: crypto.randomUUID(),
        machineName: data.machinename,
        x: parseFloat(data.machinex) || 0,
        y: parseFloat(data.machiney) || 0,
        width: parseFloat(data.machinewidth) || 50,
        height: parseFloat(data.machineheight) || 50,
        status: (data.status as any) || 'operational',
        areaId: area.id
      });
    }
  }

  factory.areas = Array.from(areaMap.values());
  return factory;
};
