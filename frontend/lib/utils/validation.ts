import { ValidationError, WorkCenter, Area, Factory } from '../types';

export function validateUniqueWorkCenterIds(
  factory: Factory
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  factory.areas.forEach((area, areaIndex) => {
    area.lines.forEach((line) => {
      line.workCenters.forEach((wc) => {
        if (seenIds.has(wc.workCenterId)) {
          errors.push({
            field: 'workCenterId',
            message: `Duplicate work center ID: ${wc.workCenterId}`,
            value: wc.workCenterId,
          });
        }
        seenIds.add(wc.workCenterId);
      });
    });
  });

  return errors;
}

export function validateFactoryDimensions(factory: Factory): ValidationError[] {
  const errors: ValidationError[] = [];

  if (factory.width <= 0 || factory.height <= 0) {
    errors.push({
      field: 'factory',
      message: 'Factory dimensions must be positive',
    });
  }

  factory.areas.forEach((area, index) => {
    if (area.x < 0 || area.y < 0) {
      errors.push({
        field: `area.${index}.position`,
        message: `Area ${area.areaName} has negative coordinates`,
      });
    }

    if (area.x + area.width > factory.width || area.y + area.height > factory.height) {
      errors.push({
        field: `area.${index}.bounds`,
        message: `Area ${area.areaName} extends beyond factory bounds`,
      });
    }

    // Check for overlapping areas
    factory.areas.forEach((otherArea, otherIndex) => {
      if (index < otherIndex) {
        if (
          area.x < otherArea.x + otherArea.width &&
          area.x + area.width > otherArea.x &&
          area.y < otherArea.y + otherArea.height &&
          area.y + area.height > otherArea.y
        ) {
          errors.push({
            field: `area.${index}.overlap`,
            message: `Area ${area.areaName} overlaps with ${otherArea.areaName}`,
          });
        }
      }
    });
  });

  return errors;
}

export function validateWorkCenterBounds(factory: Factory): ValidationError[] {
  const errors: ValidationError[] = [];

  factory.areas.forEach((area) => {
    area.lines.forEach((line) => {
      if (
        line.x < area.x ||
        line.y < area.y ||
        line.x + line.width > area.x + area.width ||
        line.y + line.height > area.y + area.height
      ) {
        errors.push({
          field: 'line.bounds',
          message: `Line ${line.lineName} extends outside its area ${area.areaName}`,
        });
      }

      line.workCenters.forEach((wc) => {
        if (
          wc.x < line.x ||
          wc.y < line.y ||
          wc.x + wc.width > line.x + line.width ||
          wc.y + wc.height > line.y + line.height
        ) {
          errors.push({
            field: 'workCenter.bounds',
            message: `Work center ${wc.machineName} extends outside its line ${line.lineName}`,
          });
        }
      });
    });

    // Check buffers and storage zones
    area.buffers.forEach((buffer) => {
      if (
        buffer.x < area.x ||
        buffer.y < area.y ||
        buffer.x + buffer.width > area.x + area.width ||
        buffer.y + buffer.height > area.y + area.height
      ) {
        errors.push({
          field: 'buffer.bounds',
          message: `Buffer ${buffer.bufferName} extends outside area ${area.areaName}`,
        });
      }
    });

    area.storage.forEach((storage) => {
      if (
        storage.x < area.x ||
        storage.y < area.y ||
        storage.x + storage.width > area.x + area.width ||
        storage.y + storage.height > area.y + area.height
      ) {
        errors.push({
          field: 'storage.bounds',
          message: `Storage ${storage.storageName} extends outside area ${area.areaName}`,
        });
      }
    });
  });

  return errors;
}

export function validateFactory(factory: Factory): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...validateUniqueWorkCenterIds(factory));
  errors.push(...validateFactoryDimensions(factory));
  errors.push(...validateWorkCenterBounds(factory));

  return errors;
}

export function validateCSVRow(
  row: Record<string, string>,
  rowIndex: number,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  requiredFields.forEach((field) => {
    if (!row[field] || row[field].trim() === '') {
      errors.push({
        field,
        message: `Missing required field: ${field}`,
        rowIndex,
      });
    }
  });

  // Validate numeric fields
  const numericFields = ['X', 'Y', 'Width', 'Height', 'factoryWidth', 'factoryHeight'];
  numericFields.forEach((field) => {
    if (row[field] && isNaN(Number(row[field]))) {
      errors.push({
        field,
        message: `${field} must be a number`,
        rowIndex,
        value: row[field],
      });
    }
  });

  return errors;
}

export function validateImageUrl(url: string): boolean {
  if (!url) return true; // Optional field
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 255);
}
