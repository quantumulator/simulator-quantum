export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface LogisticsNode {
    id: string;
    name?: string;
    location: GeoLocation;
    type: 'depot' | 'customer';
    demand?: number; // For capacity constraints
    timeWindow?: { start: number; end: number }; // For time window constraints
}

export interface Vehicle {
    id: string;
    capacity: number;
    startLocation: string; // Node ID
    endLocation?: string; // Node ID
    color?: string; // For visualization
}

export interface LogisticsProblem {
    id: string;
    name: string;
    description: string;
    nodes: LogisticsNode[];
    vehicles: Vehicle[];
    constraints?: {
        maxDistance?: number;
        maxTime?: number;
    };
}

export interface Route {
    vehicleId: string;
    stops: string[]; // Order of Node IDs
    totalDistance: number;
    totalLoad: number;
    segments?: { from: GeoLocation; to: GeoLocation }[]; // For 3D drawing
    color: string;
}

export interface SolverState {
    isRunning: boolean;
    iteration: number;
    temperature: number;
    currentCost: number;
    bestCost: number;
    acceptanceProbability: number; // For visualization
    history: { iteration: number; cost: number }[]; // For energy landscape
}

export interface LogisticsSolution {
    routes: Route[];
    totalCost: number;
    unassignedNodes?: string[];
    status: 'optimizing' | 'completed' | 'failed';
}

export interface UIState {
    viewMode: 'globe' | 'city' | 'energy';
    selectedNodeId: string | null;
    showHeatmap: boolean;
    cameraPosition?: { x: number; y: number; z: number };
}
