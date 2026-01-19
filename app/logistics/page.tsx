"use client";

import { LogisticsLayout } from "@/components/logistics/LogisticsLayout";
import { LogisticsMap } from "@/components/logistics/LogisticsMap";
import { LogisticsInput } from "@/components/logistics/LogisticsInput";
import { StatsPanel } from "@/components/logistics/StatsPanel";
import { EnergyLandscape } from "@/components/logistics/EnergyLandscape";

export default function LogisticsPage() {
    return (
        <LogisticsLayout>
            {/* 3D Main View (Map or Energy) */}
            <LogisticsMap />
            <EnergyLandscape />

            {/* UI Overlay */}
            <StatsPanel />
            <LogisticsInput />

        </LogisticsLayout>
    );
}
