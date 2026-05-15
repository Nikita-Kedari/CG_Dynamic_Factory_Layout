const fs = require('fs');
const csvPath = 'c:/Users/gujar/Desktop/Capgemini_Project/frontend/three_assemblies_layout.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim() !== '');
const headers = lines[0].split(',').map(h => h.trim());

const areasMap = new Map();
const flows = [];

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',').map(p => p.trim());
  if (parts.length < 20) continue;

  const areaId = parts[9];
  const areaName = parts[10];
  // Scale areas to match workstation coordinate system (approx 10x)
  const areaX = parseFloat(parts[11]) * 10;
  const areaY = parseFloat(parts[12]) * 10;
  const areaW = parseFloat(parts[13]) * 15; // Increased to fit the U-shapes better
  const areaH = parseFloat(parts[14]) * 20;

  const lineId = parts[15];
  const lineName = parts[16];
  const lineType = parts[21] || 'U-Type'; // Default to U-Type as per the coordinates

  const wsId = parts[22];
  const wsName = parts[23];
  const wsSeq = parseInt(parts[24]);
  const wsX = parseFloat(parts[25]);
  const wsY = parseFloat(parts[26]);
  const wsW = parseFloat(parts[27]);
  const wsH = parseFloat(parts[28]);

  const fromWs = parts[36];
  const toWs = parts[37];
  const detail = parts[40];

  if (!areasMap.has(areaId)) {
    areasMap.set(areaId, {
      id: areaId,
      areaId: areaId,
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
  const area = areasMap.get(areaId);

  let line = area.lines.find(l => l.lineId === lineId);
  if (!line) {
    line = {
      id: lineId,
      lineId: lineId,
      lineName: lineName,
      x: areaX,
      y: areaY,
      width: areaW,
      height: areaH,
      lineType: lineType,
      workCenters: []
    };
    area.lines.push(line);
  }

  if (wsId) {
    line.workCenters.push({
      id: wsId,
      workCenterId: wsId,
      machineName: wsName,
      x: wsX,
      y: wsY,
      width: wsW * 10 || 80, // Scaling machine size too
      height: wsH * 10 || 80,
      status: 'operational',
      detail: detail,
      areaId: areaId,
      wsSequence: wsSeq,
      parameters: {}
    });
    
    // Store all original columns in parameters
    headers.forEach((h, idx) => {
      if (parts[idx]) line.workCenters[line.workCenters.length - 1].parameters[h] = parts[idx];
    });
  }

  if (fromWs && toWs && toWs !== '0.0' && toWs !== '0' && toWs !== '') {
    flows.push({
      id: `f-${fromWs}-${toWs}`,
      fromWsId: fromWs,
      toWsId: toWs,
      arrowType: 'escalator',
      label: 'Flow'
    });
  }
}

const factory = {
  id: 'three-assemblies-factory',
  name: 'three_assemblies_layout',
  width: 5000,
  height: 3500,
  gridUnit: 50,
  areas: Array.from(areasMap.values()),
  flows: flows,
  csvHeaders: headers
};

const output = `
import { Factory } from './types';

export const threeAssembliesFactory: Factory = ${JSON.stringify(factory, null, 2)};
`;

fs.writeFileSync('c:/Users/gujar/Desktop/Capgemini_Project/frontend/lib/three-assemblies.ts', output);
console.log('Successfully regenerated frontend/lib/three-assemblies.ts');
