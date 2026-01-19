import { LogisticsProblem, LogisticsSolution, Route, LogisticsNode, GeoLocation } from './types';

// Haversine distance in kilometers
function distance(a: GeoLocation, b: GeoLocation): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * (Math.PI / 180);
    const dLon = (b.lng - a.lng) * (Math.PI / 180);
    const lat1 = a.lat * (Math.PI / 180);
    const lat2 = b.lat * (Math.PI / 180);

    const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
}

type VRPSolutionState = string[][];

// Greedy Nearest Neighbor baseline
function greedyBaseline(problem: LogisticsProblem): { routes: Route[]; totalCost: number } {
    const nodesMap = new Map(problem.nodes.map(n => [n.id, n]));
    const customers = problem.nodes.filter(n => n.type === 'customer').map(n => n.id);
    const vehicles = problem.vehicles;
    const depot = problem.nodes.find(n => n.type === 'depot');

    if (!depot) {
        return { routes: [], totalCost: Infinity };
    }

    const assigned = new Set<string>();
    const routes: Route[] = [];
    let totalCost = 0;

    vehicles.forEach((vehicle) => {
        const route: string[] = [depot.id];
        let currentPos = depot.location;
        let load = 0;

        while (true) {
            // Find nearest unassigned customer
            let nearest: string | null = null;
            let nearestDist = Infinity;

            for (const custId of customers) {
                if (assigned.has(custId)) continue;
                const cust = nodesMap.get(custId)!;
                const d = distance(currentPos, cust.location);
                if (d < nearestDist && load + (cust.demand || 1) <= vehicle.capacity) {
                    nearestDist = d;
                    nearest = custId;
                }
            }

            if (!nearest) break;

            route.push(nearest);
            assigned.add(nearest);
            const custNode = nodesMap.get(nearest)!;
            currentPos = custNode.location;
            load += custNode.demand || 1;
        }

        route.push(depot.id);

        // Calculate segments and distance
        let routeDistance = 0;
        const segments: { from: GeoLocation; to: GeoLocation }[] = [];

        for (let i = 0; i < route.length - 1; i++) {
            const from = nodesMap.get(route[i])!;
            const to = nodesMap.get(route[i + 1])!;
            const d = distance(from.location, to.location);
            routeDistance += d;
            segments.push({ from: from.location, to: to.location });
        }

        totalCost += routeDistance;

        routes.push({
            vehicleId: vehicle.id,
            stops: route,
            totalDistance: routeDistance,
            totalLoad: load,
            segments,
            color: vehicle.color || '#888888'
        });
    });

    return { routes, totalCost };
}

function generateInitialSolution(problem: LogisticsProblem): VRPSolutionState {
    const customers = problem.nodes.filter(n => n.type === 'customer').map(n => n.id);
    const vehicles = problem.vehicles;
    const routes: string[][] = Array(vehicles.length).fill(null).map(() => []);

    // Shuffle customers for randomness
    const shuffled = [...customers].sort(() => Math.random() - 0.5);

    shuffled.forEach((custId, idx) => {
        const vehicleIdx = idx % vehicles.length;
        routes[vehicleIdx].push(custId);
    });

    return routes;
}

export interface SolverResult extends LogisticsSolution {
    baselineCost: number;
    improvement: number;
    improvementPercent: number;
}

export async function solveVRP(
    problem: LogisticsProblem,
    onProgress: (state: { iteration: number; cost: number; temp: number; bestCost: number }) => void
): Promise<SolverResult> {
    const nodesMap = new Map(problem.nodes.map(n => [n.id, n]));
    const vehicles = problem.vehicles;
    const depot = problem.nodes.find(n => n.type === 'depot');

    if (!depot) {
        throw new Error("No depot found in problem");
    }

    // Calculate baseline first
    const baseline = greedyBaseline(problem);
    const baselineCost = baseline.totalCost;

    const getFullOrbit = (customerIds: string[], vehicleIdx: number): string[] => {
        const v = vehicles[vehicleIdx];
        const start = v.startLocation;
        const end = v.endLocation || v.startLocation;
        return [start, ...customerIds, end];
    };

    const getCost = (state: VRPSolutionState) => {
        let cost = 0;
        state.forEach((routeCusts, idx) => {
            const fullPath = getFullOrbit(routeCusts, idx);
            for (let i = 0; i < fullPath.length - 1; i++) {
                const u = nodesMap.get(fullPath[i]);
                const v = nodesMap.get(fullPath[i + 1]);
                if (u && v) cost += distance(u.location, v.location);
            }
        });
        return cost;
    };

    const newState = (currentState: VRPSolutionState): VRPSolutionState => {
        const next = currentState.map(r => [...r]);
        const moveType = Math.random();

        if (moveType < 0.4) {
            // Relocate
            const r1 = Math.floor(Math.random() * next.length);
            if (next[r1].length > 0) {
                const cIdx = Math.floor(Math.random() * next[r1].length);
                const cust = next[r1].splice(cIdx, 1)[0];
                const r2 = Math.floor(Math.random() * next.length);
                const insertPos = Math.floor(Math.random() * (next[r2].length + 1));
                next[r2].splice(insertPos, 0, cust);
            }
        } else if (moveType < 0.7) {
            // Inter-route swap
            const r1 = Math.floor(Math.random() * next.length);
            const r2 = Math.floor(Math.random() * next.length);
            if (next[r1].length > 0 && next[r2].length > 0) {
                const c1Idx = Math.floor(Math.random() * next[r1].length);
                const c2Idx = Math.floor(Math.random() * next[r2].length);
                const temp = next[r1][c1Idx];
                next[r1][c1Idx] = next[r2][c2Idx];
                next[r2][c2Idx] = temp;
            }
        } else if (moveType < 0.9) {
            // Intra-route 2-opt
            const r = Math.floor(Math.random() * next.length);
            if (next[r].length > 2) {
                const i = Math.floor(Math.random() * (next[r].length - 1));
                const j = i + 1 + Math.floor(Math.random() * (next[r].length - i - 1));
                // Reverse segment
                const segment = next[r].slice(i, j + 1).reverse();
                next[r].splice(i, segment.length, ...segment);
            }
        } else {
            // Or-opt: move sequence of 2-3 customers
            const r = Math.floor(Math.random() * next.length);
            if (next[r].length > 3) {
                const seqLen = 2 + Math.floor(Math.random() * 2);
                const start = Math.floor(Math.random() * (next[r].length - seqLen));
                const seq = next[r].splice(start, seqLen);
                const insertPos = Math.floor(Math.random() * (next[r].length + 1));
                next[r].splice(insertPos, 0, ...seq);
            }
        }

        return next;
    };

    let current = generateInitialSolution(problem);
    let currentCost = getCost(current);
    let best = current;
    let bestCost = currentCost;
    let temp = 500;
    const coolingRate = 0.997;
    const maxIter = 3000;

    // Initial progress
    onProgress({ iteration: 0, cost: currentCost, temp, bestCost });

    for (let i = 0; i < maxIter; i++) {
        const neighbor = newState(current);
        const neighborCost = getCost(neighbor);
        const delta = neighborCost - currentCost;

        if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
            current = neighbor;
            currentCost = neighborCost;

            if (currentCost < bestCost) {
                best = current.map(r => [...r]);
                bestCost = currentCost;
            }
        }

        temp *= coolingRate;

        if (i % 30 === 0) {
            onProgress({ iteration: i, cost: currentCost, temp, bestCost });
            await new Promise(r => setTimeout(r, 1));
        }
    }

    // Final progress
    onProgress({ iteration: maxIter, cost: bestCost, temp, bestCost });

    // Build final routes
    const finalRoutes: Route[] = best.map((custIds, idx) => {
        const fullIds = getFullOrbit(custIds, idx);
        const vehicle = vehicles[idx];

        let d = 0;
        const segments: { from: GeoLocation; to: GeoLocation }[] = [];

        for (let i = 0; i < fullIds.length - 1; i++) {
            const u = nodesMap.get(fullIds[i]);
            const v = nodesMap.get(fullIds[i + 1]);
            if (u && v) {
                d += distance(u.location, v.location);
                segments.push({ from: u.location, to: v.location });
            }
        }

        return {
            vehicleId: vehicle.id,
            stops: fullIds,
            totalDistance: d,
            totalLoad: custIds.length,
            segments,
            color: vehicle.color || '#ff0000'
        };
    });

    const improvement = baselineCost - bestCost;
    const improvementPercent = (improvement / baselineCost) * 100;

    return {
        routes: finalRoutes,
        totalCost: bestCost,
        status: 'completed',
        baselineCost,
        improvement,
        improvementPercent
    };
}
