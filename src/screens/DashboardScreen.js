import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';
import { getDBConnection } from '../database/db';

const formatPKR = (amount) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0)}`;

const todayLabel = () =>
  new Date().toLocaleDateString('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState({ name: 'User', role: 'Staff' });

  // Temporary mock sales data until sales table is created
  const MOCK_SALES = [
    { id: '1', item: 'Coffee', qty: 2, total: 800 },
    { id: '2', item: 'Sandwich', qty: 1, total: 650 },
    { id: '3', item: 'Juice', qty: 3, total: 900 },
  ];

  const loadUser = async () => {
    try {
      const db = await getDBConnection();
      const [userRes] = await db.executeSql('SELECT * FROM users LIMIT 1');
      if (userRes.rows.length > 0) {
        setUser(userRes.rows.item(0));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const totalToday = MOCK_SALES.reduce((sum, s) => sum + s.total, 0);
  const itemsSold = MOCK_SALES.reduce((sum, s) => sum + s.qty, 0);
  const avgTicket = MOCK_SALES.length > 0 ? Math.round(totalToday / MOCK_SALES.length) : 0;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.entityIcon}>
              <Icon name="briefcase" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.greeting}>Hi, {user.name.split(' ')[0]}</Text>
              <Text style={styles.headerMeta}>
                My Store · {user.role}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="log-out" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateLabel}>{todayLabel()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ===== GREEN POSTER (SALES SUMMARY) ===== */}
        <View style={styles.poster}>
          <View style={styles.posterContent}>
            <Text style={styles.posterTitle}>Today's Sales</Text>
            <Text style={styles.posterHighlight}>{formatPKR(totalToday)}</Text>
            <Text style={styles.posterSub}>
              {MOCK_SALES.length} transactions completed
            </Text>
            <TouchableOpacity style={styles.posterBtn} onPress={() => navigation.navigate('Sales')}>
              <Text style={styles.posterBtnText}>View Sales</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.posterIconWrap}>
            <Icon name="trending-up" size={80} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* ===== 3 KPI CARDS WITH LEFT BORDER ===== */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.kpiValue}>{MOCK_SALES.length}</Text>
            <Text style={styles.kpiLabel}>Transactions</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.kpiValue}>{itemsSold}</Text>
            <Text style={styles.kpiLabel}>Items Sold</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: colors.danger, marginRight: 0 }]}>
            <Text style={styles.kpiValue}>{formatPKR(avgTicket)}</Text>
            <Text style={styles.kpiLabel}>Avg. Ticket</Text>
          </View>
        </View>

        {/* ===== RECENT SALES ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => navigation.navigate('Sales')}
          >
            <Text style={styles.sectionLink}>See all</Text>
            <Icon name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          {MOCK_SALES.map((sale, idx) => (
            <View
              key={sale.id}
              style={[
                styles.listRow,
                idx < MOCK_SALES.length - 1 && styles.listRowBorder,
              ]}
            >
              <View style={styles.listLeft}>
                <View style={styles.listIconWrap}>
                  <Icon name="shopping-cart" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.listItem}>{sale.item}</Text>
                  <Text style={styles.listMeta}>Qty {sale.qty}</Text>
                </View>
              </View>
              <Text style={styles.listTotal}>{formatPKR(sale.total)}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },

  // ===== HEADER =====
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  entityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greeting: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabel: {
    marginTop: 14,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },

  // ===== BODY =====
  container: { padding: 16, paddingBottom: 40 },

  // GREEN POSTER
  poster: {
    backgroundColor: '#0F766E',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  posterContent: { flex: 1 },
  posterTitle: {
    color: '#99F6E4',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  posterHighlight: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  posterSub: {
    color: '#CCFBF1',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  posterBtn: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  posterBtnText: { color: '#0F766E', fontSize: 12, fontWeight: '700' },
  posterIconWrap: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },

  // 3 KPI CARDS
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    marginRight: 8,
    elevation: 2,
  },
  kpiValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  sectionLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 2,
  },

  // RECENT SALES
  listCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    elevation: 2,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItem: { fontSize: 14, fontWeight: '600', color: colors.text },
  listMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  listTotal: { fontSize: 14, fontWeight: '800', color: colors.text },
});