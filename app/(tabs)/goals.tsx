import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { LinearTransition, SlideOutLeft } from 'react-native-reanimated';
import PageTransition from '../../components/PageTransition';
import { formatDate } from '../../utils/date';

// Import Types and Utils
const { getGoals, addGoal, updateGoal, deleteGoal, calculateGoalProgress, GOAL_CATEGORIES } = require('../../utils/goals');

export default function GoalsScreen() {
    const { t, i18n } = useTranslation();

    // State
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<string>(GOAL_CATEGORIES[0]);
    const [frequency, setFrequency] = useState(3);
    const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // ~1 month
    const [showDatePicker, setShowDatePicker] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadGoals();
        }, [])
    );

    const loadGoals = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const data = await getGoals();
        setGoals(data);
        if (showLoading) setLoading(false);
    };

    const handleAddPress = () => {
        setEditingGoal(null);
        setTitle('');
        setCategory(GOAL_CATEGORIES[0]);
        setFrequency(3);
        setDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        setModalVisible(true);
    };

    const handleEditPress = (goal: any) => {
        setEditingGoal(goal);
        setTitle(goal.title);
        setCategory(goal.category);
        setFrequency(goal.frequency);
        setDeadline(new Date(goal.deadline));
        setModalVisible(true);
    };

    const handleDeletePress = (id: string) => {
        const confirmDelete = () => {
            // Optimistic Update
            setGoals(currentGoals => currentGoals.filter(g => g.id !== id));

            // Background delete
            deleteGoal(id).then(() => loadGoals(false));
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Supprimer cet objectif ?")) confirmDelete();
        } else {
            Alert.alert(
                t('common.delete', 'Supprimer'),
                t('goals.delete_confirmation', 'Voulez-vous vraiment supprimer cet objectif ?'),
                [
                    { text: t('common.cancel', 'Annuler'), style: 'cancel' },
                    { text: t('common.delete', 'Supprimer'), style: 'destructive', onPress: confirmDelete }
                ]
            );
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        const goalData = {
            title,
            category,
            frequency,
            deadline: deadline.toISOString(),
        };

        if (editingGoal) {
            await updateGoal({ ...editingGoal, ...goalData });
        } else {
            await addGoal({
                ...goalData,
                startDate: new Date().toISOString()
            });
        }

        setModalVisible(false);
        loadGoals();
    };

    // Prepare Sections for List
    const sections = GOAL_CATEGORIES.map((cat: string) => ({
        title: cat,
        data: goals.filter(g => g.category === cat)
    })).filter(section => section.data.length > 0);

    const renderRightActions = (progress: any, dragX: any, id: string) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDeletePress(id)}
            >
                <Ionicons name="trash-outline" size={24} color="#FFF" />
                <Text style={styles.deleteActionText}>Supprimer</Text>
            </TouchableOpacity>
        );
    };

    const renderGoalItem = ({ item }: { item: any }) => {
        const stats = calculateGoalProgress(item);
        return (
            <Animated.View exiting={SlideOutLeft} layout={LinearTransition}>
                <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item.id)}>
                    <TouchableOpacity
                        style={styles.goalCard}
                        onPress={() => handleEditPress(item)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={styles.goalCardGradient}
                        >
                            <View style={styles.goalHeader}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Text style={styles.goalProgress}>{stats.percentage}%</Text>
                                </View>
                            </View>

                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${stats.percentage}%`, backgroundColor: getCategoryColor(item.category) }]} />
                            </View>

                            <View style={styles.goalFooter}>
                                <Text style={styles.goalMeta}>{stats.daysRemaining} {t('goals.days_remaining_suffix')}</Text>
                                <Text style={styles.goalMeta}>{item.frequency} {t('goals.days_per_week_suffix')}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Swipeable>
            </Animated.View>
        );
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'mental': return '#A29BFE';
            case 'physical': return '#55EFC4';
            case 'career': return '#74B9FF';
            case 'personal': return '#FDCB6E';
            default: return '#6C5CE7';
        }
    };

    return (
        <PageTransition style={styles.container}>
            <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.header}>
                <Text style={styles.pageTitle}>{t('goals.page_title', 'Mes Objectifs')}</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            {sections.length === 0 && !loading ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('goals.empty_state')}</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={handleAddPress}>
                        <Text style={styles.emptyBtnText}>{t('goals.start_button')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGoalItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{t(`onboarding.cat_${title}`, { defaultValue: title })}</Text>
                    )}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                />
            )}

            {/* MODAL AJOUT / EDITION */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{editingGoal ? t('goals.edit_goal') : t('goals.new_goal')}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#636E72" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 400 }}>
                                <Text style={styles.label}>{t('goals.title_label')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('goals.title_placeholder')}
                                    value={title}
                                    onChangeText={setTitle}
                                />

                                <Text style={styles.label}>{t('goals.category_label')}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                    {GOAL_CATEGORIES.map((cat: string) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
                                            onPress={() => setCategory(cat)}
                                        >
                                            <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>
                                                {t(`onboarding.cat_${cat}`, { defaultValue: cat })}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.label}>{t('goals.frequency_label', { count: frequency })}</Text>
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={1}
                                    maximumValue={7}
                                    step={1}
                                    value={frequency}
                                    onValueChange={setFrequency}
                                    minimumTrackTintColor="#6C5CE7"
                                    maximumTrackTintColor="#DFE6E9"
                                    thumbTintColor="#6C5CE7"
                                />

                                <Text style={styles.label}>{t('goals.deadline_label')}</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(!showDatePicker)}>
                                    <Text style={styles.dateText}>{formatDate(deadline, i18n.language)}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6C5CE7" />
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={deadline}
                                        mode="date"
                                        display="default"
                                        minimumDate={new Date()}
                                        onChange={(event, date) => {
                                            if (Platform.OS === 'android') {
                                                setShowDatePicker(false);
                                            }
                                            if (date) setDeadline(date);
                                        }}
                                    />
                                )}
                            </ScrollView>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                            </TouchableOpacity>

                            {editingGoal && (
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => {
                                    setModalVisible(false);
                                    handleDeletePress(editingGoal.id);
                                }}>
                                    <Text style={styles.deleteBtnText}>{t('common.delete', 'Supprimer')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </PageTransition>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        marginBottom: 10
    },
    pageTitle: { fontSize: 24, fontWeight: '800', color: '#2D3436' },
    addButton: { backgroundColor: '#6C5CE7', padding: 10, borderRadius: 12, shadowColor: '#6C5CE7', shadowOpacity: 0.3, shadowRadius: 5 },

    listContent: { padding: 20, paddingBottom: 100 },
    sectionHeader: { fontSize: 18, fontWeight: '700', color: '#636E72', marginTop: 20, marginBottom: 10 },

    goalCard: {
        marginBottom: 15, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        backgroundColor: '#FFF'
    },
    goalCardGradient: { padding: 20, borderRadius: 16 },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    goalTitle: { fontSize: 16, fontWeight: '700', color: '#2D3436' },
    goalProgress: { fontWeight: 'bold', color: '#6C5CE7' },
    progressBarBg: { height: 6, backgroundColor: '#F1F2F6', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    goalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    goalMeta: { fontSize: 12, color: '#B2BEC3' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#B2BEC3', marginBottom: 20 },
    emptyBtn: { backgroundColor: '#6C5CE7', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
    emptyBtnText: { color: '#FFF', fontWeight: 'bold' },

    // Modal
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3436' },
    label: { fontSize: 14, fontWeight: '600', color: '#636E72', marginTop: 15, marginBottom: 8 },
    input: { backgroundColor: '#F1F2F6', padding: 12, borderRadius: 12, fontSize: 16 },

    categoryScroll: { flexDirection: 'row', marginBottom: 5 },
    categoryChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F1F2F6', borderRadius: 20, marginRight: 10 },
    categoryChipSelected: { backgroundColor: '#6C5CE7' },
    categoryText: { color: '#636E72', fontWeight: '600' },
    categoryTextSelected: { color: '#FFF' },

    dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F2F6', padding: 12, borderRadius: 12 },
    dateText: { fontSize: 16, color: '#2D3436' },

    saveBtn: { backgroundColor: '#00B894', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 25, marginBottom: 10 },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    deleteBtn: { backgroundColor: '#FF7675', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
    deleteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    deleteAction: {
        backgroundColor: '#FF7675',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
        marginBottom: 15,
        borderRadius: 16,
        marginLeft: 10
    },
    deleteActionText: { color: '#FFF', fontWeight: 'bold', marginTop: 5, fontSize: 12 }
});
