import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SmartGoal {
    title: string;
    deadline: string; // ISO Date String
    frequency: number; // Days per week (1-7)
    startDate: string; // ISO Date String
    checkins: string[]; // List of ISO Date Strings (YYYY-MM-DD)
}

const GOAL_KEY = 'userSmartGoal';

// Get the Goal
export const getSmartGoal = async (): Promise<SmartGoal | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(GOAL_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error("Error reading smart goal", e);
        return null;
    }
};

// Set/Update the Goal
export const setSmartGoal = async (goal: SmartGoal): Promise<void> => {
    try {
        await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    } catch (e) {
        console.error("Error saving smart goal", e);
    }
};

// Register a Check-in (e.g., app open)
export const registerDailyCheckin = async (): Promise<SmartGoal | null> => {
    try {
        const goal = await getSmartGoal();
        if (!goal) return null;

        const today = new Date().toISOString().split('T')[0];
        if (!goal.checkins.includes(today)) {
            goal.checkins.push(today);
            await setSmartGoal(goal);
        }
        return goal;
    } catch (e) {
        console.error("Error registering checkin", e);
        return null;
    }
};

// Calculate Progress Stats
export const calculateGoalProgress = (goal: SmartGoal) => {
    const start = new Date(goal.startDate);
    const end = new Date(goal.deadline);
    const today = new Date();

    // Total duration in days
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Total Weeks logic (Approximate)
    const totalWeeks = totalDays / 7;

    // Target Total Checkins required to reach 100%
    // If frequency is 5 days/week, total targets = weeks * 5
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
