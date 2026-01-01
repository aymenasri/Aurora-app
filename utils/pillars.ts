import AsyncStorage from '@react-native-async-storage/async-storage';

export type PillarType = 'mind' | 'body' | 'work' | 'soul';

export interface DailyPillars {
    mind: number;
    body: number;
    work: number;
    soul: number;
}

const DEFAULT_PILLARS: DailyPillars = {
    mind: 0,
    body: 0,
    work: 0,
    soul: 0
};

const getTodayKey = () => `pillars_${new Date().toISOString().split('T')[0]}`;

export const getDailyPillars = async (): Promise<DailyPillars> => {
    try {
        const key = getTodayKey();
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : DEFAULT_PILLARS;
    } catch (e) {
        console.error("Error reading pillars", e);
        return DEFAULT_PILLARS;
    }
};

export const updatePillarProgress = async (pillar: PillarType, progress: number): Promise<DailyPillars> => {
    try {
        const current = await getDailyPillars();
        const updated = { ...current, [pillar]: progress };

        const key = getTodayKey();
        await AsyncStorage.setItem(key, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Error updating pillars", e);
        return DEFAULT_PILLARS;
    }
};
