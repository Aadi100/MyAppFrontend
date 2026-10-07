import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, MonthBar, IconBox, PrimaryButton } from '../ui/kit';
import { C, money, alpha } from '../ui/theme';
import { useStore } from '../store/useStore';

export default function InsightsScreen() {
  const { 
    insights, healthScore, cashflowForecast, detectedSubscriptions,
    fetchInsights, fetchHealthScore, fetchCashflowForecast, fetchDetectedSubscriptions,
    createReminder
  } = useStore();
  
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchInsights(month);
    fetchHealthScore(month);
    fetchCashflowForecast(month);
    fetchDetectedSubscriptions();
  }, [month]);

  const shiftMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = (() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return isNaN(d.getTime()) ? month : d.toLocaleString('default', { month: 'long', year: 'numeric' });
  })();

  const handleConvertReminder = (sub) => {
    Alert.alert('Create Reminder', `Convert ${sub.reason} into a recurring reminder?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => {
          createReminder({
            title: sub.reason,
            due_date: sub.suggested_next_date,
            amount: sub.amount,
            recurrence: sub.likely_recurrence !== 'irregular' ? sub.likely_recurrence : 'monthly',
            notes: 'Auto-detected subscription'
          });
          Alert.alert('Success', 'Reminder created!');
      }}
    ]);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return C.green;
    if (score >= 60) return C.blue;
    if (score >= 40) return C.amber;
    return C.red;
  };

  return (
    <Screen>
      <Header title="Smart Insights" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <MonthBar label={monthLabel} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
        
        {/* Health Score */}
        {healthScore && (
          <Card style={{ marginTop: 16 }} pad={20}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.sectionTitle}>Financial Health</Text>
                <Text style={[styles.healthLabel, { color: getScoreColor(healthScore.overall_score) }]}>
                  {healthScore.label}
                </Text>
              </View>
              <View style={[styles.scoreBadge, { borderColor: getScoreColor(healthScore.overall_score) }]}>
                <Text style={[styles.scoreText, { color: getScoreColor(healthScore.overall_score) }]}>{healthScore.overall_score}</Text>
              </View>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Overspend Score</Text>
                <Text style={styles.metricVal}>{healthScore.overspend_score}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Savings Score</Text>
                <Text style={styles.metricVal}>{healthScore.savings_score}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Cashflow Forecast */}
        {cashflowForecast && (
          <Card style={{ marginTop: 16 }} pad={20}>
            <Text style={styles.sectionTitle}>Cashflow Forecast</Text>
            <Text style={styles.subText}>Daily burn rate: <Text style={{ color: C.acc, fontWeight: '700' }}>{money(cashflowForecast.daily_burn_rate)}</Text></Text>
            
            {cashflowForecast.will_run_out ? (
              <View style={[styles.alertBox, { backgroundColor: alpha(C.red, 0.1), borderColor: alpha(C.red, 0.3) }]}>
                <Ionicons name="warning-outline" size={24} color={C.red} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: C.red, fontWeight: '700' }}>Projected to run out!</Text>
                  <Text style={{ color: C.text, fontSize: 13, marginTop: 4 }}>
                    At your current velocity, you will run out of budget on {cashflowForecast.projected_overspend_date}.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.alertBox, { backgroundColor: alpha(C.green, 0.1), borderColor: alpha(C.green, 0.3) }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color={C.green} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: C.green, fontWeight: '700' }}>On track!</Text>
                  <Text style={{ color: C.text, fontSize: 13, marginTop: 4 }}>
                    You are pacing well and will finish the month with {money(cashflowForecast.projected_remaining)} remaining.
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Spending Insights */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Spending Anomalies</Text>
        {(!insights || insights.length === 0) && <Text style={styles.empty}>No significant deviations found this month.</Text>}
        {insights?.map((insight, idx) => (
          <Card key={idx} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }} pad={16}>
            <IconBox name={insight.direction === 'up' ? 'trending-up-outline' : 'trending-down-outline'} 
                     color={insight.direction === 'up' ? C.red : C.green} size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>{insight.name}</Text>
              <Text style={styles.subText}>Avg: {money(insight.average_spent)}  →  Current: {money(insight.current_spent)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: insight.direction === 'up' ? C.red : C.green, fontWeight: '800' }}>
                {insight.direction === 'up' ? '+' : ''}{insight.pct_change}%
              </Text>
            </View>
          </Card>
        ))}

        {/* Detected Subscriptions */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Detected Subscriptions</Text>
        {(!detectedSubscriptions || detectedSubscriptions.length === 0) && <Text style={styles.empty}>No recurring subscriptions detected.</Text>}
        {detectedSubscriptions?.map((sub, idx) => (
          <Card key={idx} style={{ marginBottom: 12 }} pad={16}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>{sub.reason}</Text>
                <Text style={styles.subText}>{sub.likely_recurrence} · Approx {money(sub.amount)}</Text>
                <Text style={styles.subText}>Next charge: {sub.suggested_next_date}</Text>
              </View>
              <TouchableOpacity style={styles.convertBtn} onPress={() => handleConvertReminder(sub)}>
                <Ionicons name="notifications-outline" size={18} color="#000" />
                <Text style={{ fontWeight: '700', marginLeft: 6 }}>Reminder</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  subText: { color: C.mute, fontSize: 13, marginTop: 4 },
  healthLabel: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  scoreBadge: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 22, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line },
  metric: { flex: 1 },
  metricLabel: { color: C.dim, fontSize: 12 },
  metricVal: { color: C.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  alertBox: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  empty: { color: C.dim, fontStyle: 'italic', marginBottom: 12 },
  convertBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.acc, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }
});
