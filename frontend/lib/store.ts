
import { Configuration } from './types';
import { threeAssembliesFactory } from './three-assemblies';

// Initial Mock Interface
let layouts: Configuration[] = [
    {
        id: 'three-assemblies-v1',
        version: '2.0.0',
        name: 'Three Assemblies Layout',
        factory: threeAssembliesFactory as any,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const getLayouts = () => layouts;

export const addLayout = (layout: Configuration) => {
    layouts.push(layout);
    return layout;
};

export const activateLayout = (id: string) => {
    // Deactivate all
    layouts = layouts.map(l => ({ ...l, isActive: false, status: l.status === 'active' ? 'inactive' : l.status }));
    // Activate target
    const index = layouts.findIndex(l => l.id === id);
    if (index !== -1) {
        layouts[index].isActive = true;
        layouts[index].status = 'active';
        return layouts[index];
    }
    return null;
};

export const getActiveLayout = () => {
    return layouts.find(l => l.isActive) || layouts[0];
};

export const updateLayout = (id: string, updates: Partial<Configuration>) => {
    const index = layouts.findIndex(l => l.id === id);
    if (index !== -1) {
        layouts[index] = { ...layouts[index], ...updates, updatedAt: new Date().toISOString() };
        return layouts[index];
    }
    return null;
};

export const removeLayout = (id: string) => {
    layouts = layouts.filter(l => l.id !== id);
};
