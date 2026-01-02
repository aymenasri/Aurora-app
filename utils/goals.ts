import AsyncStorage from '@react-native-async-storage/async-storage';

export type GoalCategory = 'mental' | 'physical' | 'career' | 'personal' | 'hobbies' | 'other';

export const GOAL_CATEGORIES: GoalCategory[] = [
    'mental',
    'physical',
    'career',
    'personal',
    'hobbies',
    'other'
];

export interface SmartGoal {
    id: string;
    title: string;
    category: GoalCategory;
    deadline: string; // ISO Date String
    frequency: number; // Days per week (1-7)
    startDate: string; // ISO Date String
    checkins: string[]; // List of ISO Date Strings (YYYY-MM-DD)
}

const OLD_GOAL_KEY = 'userSmartGoal';
const GOALS_KEY = 'userGoalsList';

// Helper to generate IDs
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get All Goals (with Migration)
export const getGoals = async (): Promise<SmartGoal[]> => {
    try {
        // 1. Try to get new list
        const jsonValue = await AsyncStorage.getItem(GOALS_KEY);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }

        // 2. If no list, check for old legacy goal and migrate it
        const oldJsonValue = await AsyncStorage.getItem(OLD_GOAL_KEY);
        if (oldJsonValue != null) {
            const oldGoal = JSON.parse(oldJsonValue);
            // Convert to new format
            const aNewGoal: SmartGoal = {
                ...oldGoal,
                id: generateId(),
                category: 'other' // Default category for migration
            };
            // Save to new list
            await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([aNewGoal]));
            // Optionally delete old key? Keeping it for safety for now.
            return [aNewGoal];
        }

        return [];
    } catch (e) {
        console.error("Error getting goals", e);
        return [];
    }
};

// Get the "Principal" Goal for Dashboard (First one for now)
export const getPrincipalGoal = async (): Promise<SmartGoal | null> => {
    const goals = await getGoals();
    return goals.length > 0 ? goals[0] : null;
};

export const addGoal = async (goalData: Omit<SmartGoal, 'id' | 'startDate' | 'checkins'>): Promise<SmartGoal | null> => {
    try {
        const goals = await getGoals();
        const newGoal: SmartGoal = {
            id: generateId(),
            startDate: new Date().toISOString(),
            checkins: [],
            ...goalData
        };
        const updatedGoals = [...goals, newGoal];
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
        return newGoal;
    } catch (e) {
        console.error("Error adding goal", e);
        return null;
    }
};

export const setSmartGoal = addGoal;

export const updateGoal = async (updatedGoal: SmartGoal): Promise<void> => {
    try {
        const goals = await getGoals();
        const newGoals = goals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    } catch (e) {
        console.error("Error updating goal", e);
    }
};

export const deleteGoal = async (id: string): Promise<void> => {
    try {
        const goals = await getGoals();
        const newGoals = goals.filter(g => g.id !== id);
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    } catch (e) {
        console.error("Error deleting goal", e);
    }
};

// Register Check-in for ALL active goals (since app open counts for all "habits" usually, or we can restricting it. 
// For now, let's keep the logic: Daily Check-in applies to keeping the habit alive.
// However, typically "Check-in" might be specific to a goal? 
// The previous logic was "App Open = Checkin". Let's apply this to ALL goals for now to be generous, 
// OR we only check in the principal one. The user said "Smart Goal" (singular) tracker previously.
// Let's check in ALL goals for "App Open" presence if that's the desired mechanic.
export const registerDailyCheckin = async (): Promise<void> => {
    try {
        const goals = await getGoals();
        if (goals.length === 0) return;

        const today = new Date().toISOString().split('T')[0];
        let hasChanges = false;

        const updatedGoals = goals.map(goal => {
            if (!goal.checkins.includes(today)) {
                hasChanges = true;
                return { ...goal, checkins: [...goal.checkins, today] };
            }
            return goal;
        });

        if (hasChanges) {
            await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
        }
    } catch (e) {
        console.error("Error registering checkin", e);
    }
};

// Calculate Progress Stats
export const calculateGoalProgress = (goal: SmartGoal) => {
    if (!goal) return { percentage: 0, daysRemaining: 0, currentCheckins: 0, targetTotalCheckins: 0 };

    const start = new Date(goal.startDate);
    const end = new Date(goal.deadline);
    const today = new Date();

    // Total duration in days
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Total Weeks logic (Approximate)
    const totalWeeks = Math.max(1, totalDays / 7);

    // Target Total Checkins
    const targetTotalCheckins = Math.ceil(totalWeeks * goal.frequency);

    // Current accumulated checkins
    const currentCheckins = goal.checkins.length;

    // Percentage
    const percentage = targetTotalCheckins > 0
        ? Math.min(100, Math.round((currentCheckins / targetTotalCheckins) * 100))
        : 0;

    // Days Remaining
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return {
        percentage,
        daysRemaining,
        currentCheckins,
        targetTotalCheckins
    };
};
