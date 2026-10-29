import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Calendar } from 'react-native-calendars';
import { colors } from '../theme/colors';
import { getDBConnection } from '../database/db';

const formatPKR = (amount) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0)}`;

const formatDateTime = (dateString) => {
  const d = new Date(dateString);
  return {
    time: d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
};

export default function SalesHistoryScreen() {
  const [dbHistory, setDbHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Filter States
  const [filterMode, setFilterMode] = useState('Day'); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch from SQLite
  const loadSales = async () => {
    try {
      const db = await getDBConnection();
      const [res] = await db.executeSql('SELECT * FROM sales ORDER BY id DESC');
      const loaded = [];
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        loaded.push({
          ...row,
          items: JSON.parse(row.items), // Parse the JSON string back into array
        });
      }
      setDbHistory(loaded);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [])
  );

  // --- CALCULATION & FILTERING LOGIC ---
  const filteredHistory = useMemo(() => {
    let result = dbHistory;
    const now = new Date();
    
    if (filterMode === 'Day') {
      if (selectedDate) {
        result = result.filter(sale => sale.date.startsWith(selectedDate));
      } else {
        const todayStr = now.toISOString().split('T')[0];
        result = result.filter(sale => sale.date.startsWith(todayStr));
      }
    } 
    else if (filterMode === 'Week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(sale => new Date(sale.date) >= lastWeek);
    }
    else if (filterMode === 'Month') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(sale => new Date(sale.date) >= lastMonth);
    }
    else if (filterMode === 'Year') {
      const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      result = result.filter(sale => new Date(sale.date) >= lastYear);
    }

    if (search) {
      result = result.filter(
        (sale) =>
          sale.invoice_id.toLowerCase().includes(search.toLowerCase()) ||
          (sale.cashier && sale.cashier.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filterMode, selectedDate, search, dbHistory]);

  const totalRevenue = filteredHistory.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredHistory.length;
  const totalItems = filteredHistory.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => itemSum + item.qty, 0);
  }, 0);

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setFilterMode('Day');
    setShowCalendar(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Sales History</Text>
            <Text style={styles.headerSub}>View and manage past transactions</Text>
          </View>
          <TouchableOpacity style={styles.headerIconWrap} onPress={() => setShowCalendar(true)}>
            <Icon name="calendar" size={20} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {/* FILTER PILLS */}
        <View style={styles.filterRow}>
          {['Day', 'Week', 'Month', 'Year'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.filterPill, filterMode === mode && styles.filterPillActive]}
              onPress={() => {
                setFilterMode(mode);
                if (mode !== 'Day') setSelectedDate(null);
              }}
            >
              <Text style={[styles.filterText, filterMode === mode && styles.filterTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUMMARY POSTER */}
        <View style={styles.poster}>
          <View style={styles.posterContent}>
            <Text style={styles.posterTitle}>{filterMode}'s Summary</Text>
            <Text style={styles.posterHighlight}>{formatPKR(totalRevenue)}</Text>
            <View style={styles.posterStatsRow}>
              <View style={styles.posterStat}>
                <Icon name="shopping-bag" size={12} color="#CCFBF1" />
                <Text style={styles.posterStatText}>{totalTransactions} Sales</Text>
              </View>
              <View style={styles.posterStat}>
                <Icon name="box" size={12} color="#CCFBF1" />
                <Text style={styles.posterStatText}>{totalItems} Items</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Invoice..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
          {filteredHistory.length === 0 ? (
            <Text style={styles.emptyText}>No sales found for this period.</Text>
          ) : (
            filteredHistory.map((sale, index) => {
              const dt = formatDateTime(sale.date);
              const isLast = index === filteredHistory.length - 1;

              return (
                <TouchableOpacity
                  key={sale.id}
                  style={[styles.saleRow, !isLast && styles.saleRowBorder]}
                  onPress={() => setSelectedSale(sale)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowIconWrap}>
                    <Icon name="file-text" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.rowDetails}>
                    <Text style={styles.rowInvoice}>{sale.invoice_id}</Text>
                    <Text style={styles.rowMeta}>{dt.time} · {dt.date}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowTotal}>{formatPKR(sale.total)}</Text>
                    <Text style={styles.rowItems}>
                      {sale.items.reduce((sum, i) => sum + i.qty, 0)} items
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* CALENDAR MODAL */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCalendar(false)} />
          <View style={styles.calendarCard}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{ [selectedDate || new Date().toISOString().split('T')[0]]: { selected: true, selectedColor: '#0F766E' } }}
              theme={{ todayTextColor: '#0F766E', selectedDayBackgroundColor: '#0F766E', arrowColor: '#0F766E' }}
            />
          </View>
        </View>
      </Modal>

      {/* ===== CENTERED DETAILS MODAL ===== */}
      <Modal visible={!!selectedSale} transparent animationType="fade" onRequestClose={() => setSelectedSale(null)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedSale(null)} />
          
          <View style={styles.centerReceiptCard}>
            <View style={styles.receiptHeader}>
              <View>
                <Text style={styles.receiptTitle}>Receipt Details</Text>
                <Text style={styles.receiptMeta}>{selectedSale?.invoice_id}</Text>
              </View>
              <View style={styles.receiptHeaderIcon}>
                <Icon name="check-circle" size={24} color={colors.success} />
              </View>
            </View>

            <View style={styles.receiptDivider} />

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {selectedSale?.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{formatPKR(item.price)} × {item.qty}</Text>
                  </View>
                  <Text style={styles.itemTotal}>{formatPKR(item.total)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.receiptDivider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalValue}>{formatPKR(selectedSale?.total || 0)}</Text>
            </View>

            <TouchableOpacity style={styles.printBtn} onPress={() => setSelectedSale(null)}>
              <Icon name="x" size={18} color="#FFF" />
              <Text style={styles.printBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { padding: 16, paddingBottom: 40 },

  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  headerIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },

  // FILTER PILLS
  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  filterPillActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: '#FFF' },

  // POSTER
  poster: { backgroundColor: '#0F766E', borderRadius: 20, padding: 24, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, overflow: 'hidden', elevation: 4 },
  posterContent: { flex: 1 },
  posterTitle: { color: '#99F6E4', fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  posterHighlight: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  posterStatsRow: { flexDirection: 'row', marginTop: 12 },
  posterStat: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  posterStatText: { color: '#CCFBF1', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  posterIconWrap: { position: 'absolute', right: -10, bottom: -10 },

  // SEARCH
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, borderRadius: 16, height: 52, marginBottom: 16, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.text },

  // LIST
  listContainer: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, elevation: 2 },
  saleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  saleRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowDetails: { flex: 1 },
  rowInvoice: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', marginLeft: 10 },
  rowTotal: { fontSize: 15, fontWeight: '800', color: colors.text },
  rowItems: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 4 },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 20 },

  // MODALS COMMON
  modalOverlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  
  // CALENDAR MODAL
  calendarCard: { width: '90%', backgroundColor: colors.card, borderRadius: 20, padding: 20, elevation: 10 },
  
  // CENTERED DETAILS MODAL
  centerReceiptCard: { 
    width: '88%', 
    backgroundColor: colors.card, 
    borderRadius: 24, 
    padding: 24, 
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  receiptMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  receiptHeaderIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  receiptDivider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  grandTotalLabel: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  grandTotalValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  printBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16 },
  printBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});