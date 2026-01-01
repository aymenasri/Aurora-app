import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import PageTransition from '../../components/PageTransition';

export default function GoalsScreen() {
    const { t, i18n } = useTranslation();
    const [smartGoal, setSmartGoal] = useState<any>(null);
    const [goalStats, setGoalStats] = useState<any>({ percentage: 0, daysRemaining: 0, currentCheckins: 0 });
    const [markedDates, setMarkedDates] = useState<any>({});

    useFocusEffect(
        useCallback(() => {
            loadGoalData();
        }, [])
    );

    const loadGoalData = async () => {
        try {
            const { getSmartGoal, calculateGoalProgress } = require('../../utils/goals');
            const goal = await getSmartGoal();
            if (goal) {
                setSmartGoal(goal);
                setGoalStats(calculateGoalProgress(goal));

                // Prepare marked dates for calendar
                const marks: any = {};
                goal.checkins.forEach((date: string) => {
                    marks[date] = { selected: true, selectedColor: '#6C5CE7' };
                });

                // Mark today differently if checked in
                const today = new Date().toISOString().split('T')[0];
                if (marks[today]) {
                    marks[today] = { selected: true, selectedColor: '#55EFC4', marked: true, dotColor: '#FFF' };
                }

                setMarkedDates(marks);
            }
        } catch (e) {
            console.error("Failed to load goal", e);
        }
    };

    if (!smartGoal) {
        return (
            <PageTransition style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('goals.no_goal', 'Aucun objectif défini.')}</Text>
                </View>
            </PageTransition>
        );
    }

    return (
        <PageTransition style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* HEADER */}
                <LinearGradient
                    colors={['#E3F2FD', '#FFFFFF']} // Light blue fade 
                    style={styles.header}
                >
                    <Text style={styles.pageTitle}>{t('goals.page_title', 'Mon Objectif')}</Text>
                    <View style={styles.headerIconBg}>
                        <Ionicons name="trophy" size={24} color="#FDCB6E" />
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* SUMMARY CARD */}
                    <View style={styles.summaryCard}>
                        <LinearGradient
                            colors={['#6C5CE7', '#A29BFE']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.summaryGradient}
                        >
                            <Text style={styles.goalTitle}>{smartGoal.title}</Text>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${goalStats.percentage}%` }]} />
                                </View>
                                <Text style={styles.progressLabel}>{goalStats.percentage}%</Text>
                            </View>

                            <View style={styles.metaContainer}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.metaText}>
                                        {new Date(smartGoal.deadline).toLocaleDateString(i18n.language)}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="repeat-outline" size={16} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.metaText}>
                                        {smartGoal.frequency}j / sem
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* STATS ROW */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{goalStats.currentCheckins}</Text>
                            <Text style={styles.statLabel}>{t('goals.total_days', 'Jours Totaux')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#FD79A8' }]}>{goalStats.daysRemaining}</Text>
                            <Text style={styles.statLabel}>{t('goals.days_left', 'Jours Restants')}</Text>
                        </View>
                    </View>

                    {/* CALENDAR */}
                    <View style={styles.calendarCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="calendar" size={20} color="#6C5CE7" />
                            <Text style={styles.sectionTitle}>{t('goals.calendar_title', 'Historique')}</Text>
                        </View>
                        <Calendar
                            markedDates={markedDates}
                            theme={{
                                todayTextColor: '#6C5CE7',
                                arrowColor: '#6C5CE7',
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: 'bold'
                            }}
                            // Disable interactions for now, just visualization
                            disableAllTouchEventsForDisabledDays={true}
                        />
                    </View>

                </View>
            </ScrollView>
        </PageTransition>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#B2BEC3' },

    header: {
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20
    },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#2D3436' },
    headerIconBg: { backgroundColor: '#FFF', padding: 8, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },

    content: { padding: 20 },

    summaryCard: {
        borderRadius: 24, marginBottom: 25,
        shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8,
    },
    summaryGradient: { padding: 25, borderRadius: 24 },
    goalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginRight: 15 },
    progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
    progressLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statCard: {
        flex: 1, backgroundColor: '#F8F9FA', padding: 15, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#F0F0F0'
    },
    statValue: { fontSize: 24, fontWeight: '800', color: '#6C5CE7', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#636E72', textTransform: 'uppercase', fontWeight: '600' },

    calendarCard: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
        borderWidth: 1, borderColor: '#F0F0F0'
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3436' }
});
