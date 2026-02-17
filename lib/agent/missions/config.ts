export interface AgentMission {
    id: string;
    name: string;
    priority: number;
    config: {
        regions: string[];
        dailyTarget: number;
        confidenceThreshold: number;
        autoPublish: boolean;
        highwayAnalysis: boolean;
    };
    lastRun?: string;
}

export const ACTIVE_MISSIONS: AgentMission[] = [
    {
        id: 'curator-optimizer-001',
        name: 'Curador + Optimizador de Highway',
        priority: 1,
        config: {
            regions: ['nayarit-mx', 'cancun-mx', 'miami-us'],
            dailyTarget: 10,
            confidenceThreshold: 0.85,
            autoPublish: true,
            highwayAnalysis: true
        }
    }
];
