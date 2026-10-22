import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

const INITIAL_STOCK = [
  { id: 'p1', name: 'Coffee', stock: 24, unit: 'cups', icon: 'coffee', category: 'Coffee' },
  { id: 'p2', name: 'Sandwich', stock: 12, unit: 'pcs', icon: 'layers', category: 'Food' },
  { id: 'p3', name: 'Juice', stock: 8, unit: 'glasses', icon: 'droplet', category: 'Drinks' },
  { id: 'p4', name: 'Tea', stock: 30, unit: 'cups', icon: 'coffee', category: 'Coffee' },
  { id: 'p5', name: 'Cake', stock: 5, unit: 'slices', icon: 'gift', category: 'Bakery' },
  { id: 'p6', name: 'Burger', stock: 0, unit: 'pcs', icon: 'circle', category: 'Food' },
];

export default function StockScreen() {
  const [stockData, setStockData] = useState(INITIAL_STOCK);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentInput, setAdjustmentInput] = useState('');

  // --- CALCULATIONS ---
  const totalItems = stockData.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = stockData.filter((item) => item.stock > 0 && item.stock < 10).length;
  const outOfStockCount = stockData.filter((item) => item.stock === 0).length;

  // Filter based on search
  const filteredStock = useMemo(() => {
    return stockData.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [stockData, search]);

  // --- HANDLERS ---
  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setAdjustmentInput('');
  };

  const closeUpdateModal = () => {
    setSelectedItem(null);
    setAdjustmentInput('');
  };

  const handleAdjustment = (type) => {
    const amount = parseInt(adjustmentInput, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number greater than 0.');
      return;
    }

    let newStock = selectedItem.stock;
    if (type === 'add') newStock += amount;
    if (type === 'remove') newStock = Math.max(0, newStock - amount); // Prevent negative

    setStockData((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, stock: newStock } : item
      )
    );
    closeUpdateModal();
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Inventory Stock</Text>
            <Text style={styles.headerSub}>Manage and track your item levels</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Icon name="layers" size={20} color="#0F766E" />
          </View>
        </View>

        {/* ===== SUMMARY POSTER ===== */}
        <View style={styles.poster}>
          <View style={styles.posterContent}>
            <Text style={styles.posterTitle}>Total Items in Stock</Text>
            <Text style={styles.posterHighlight}>{totalItems}</Text>
            
            <View style={styles.posterStatsRow}>
              <View style={styles.posterStat}>
                <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.posterStatText}>{lowStockCount} Low Stock</Text>
              </View>
              <View style={styles.posterStat}>
                <View style={[styles.statDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.posterStatText}>{outOfStockCount} Out of Stock</Text>
              </View>
            </View>
          </View>
          <View style={styles.posterIconWrap}>
            <Icon name="package" size={80} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* ===== SEARCH BAR ===== */}
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* ===== STOCK LIST ===== */}
        <View style={styles.listContainer}>
          {filteredStock.length === 0 ? (
            <Text style={styles.emptyText}>No items found.</Text>
          ) : (
            filteredStock.map((item, index) => {
              const isOut = item.stock === 0;
              const isLow = item.stock > 0 && item.stock < 10;
              const isLast = index === filteredStock.length - 1;

              return (
                <View
                  key={item.id}
                  style={[styles.stockRow, !isLast && styles.stockRowBorder]}
                >
                  {/* Left Icon */}
                  <View style={styles.rowIconWrap}>
                    <Icon name={item.icon} size={20} color={colors.primary} />
                  </View>

                  {/* Middle Info */}
                  <View style={styles.rowDetails}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowCategory}>{item.category}</Text>
                  </View>

                  {/* Right Stock & Action */}
                  <View style={styles.rowRight}>
                    <View
                      style={[
                        styles.stockBadge,
                        isLow && styles.stockBadgeLow,
                        isOut && styles.stockBadgeOut,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockText,
                          isLow && styles.stockTextLow,
                          isOut && styles.stockTextOut,
                        ]}
                      >
                        {item.stock} {item.unit}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => openUpdateModal(item)}
                      activeOpacity={0.7}
                    >
                      <Icon name="edit-2" size={14} color="#0F766E" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ===== UPDATE STOCK MODAL ===== */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={closeUpdateModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayCenter}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeUpdateModal}
          />
          
          <View style={styles.centerCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Stock</Text>
                <Text style={styles.modalSub}>{selectedItem?.name}</Text>
              </View>
              <View style={styles.currentStockBadge}>
                <Text style={styles.currentStockLabel}>Current</Text>
                <Text style={styles.currentStockValue}>
                  {selectedItem?.stock} {selectedItem?.unit}
                </Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.inputLabel}>Adjustment Amount</Text>
            <TextInput
              style={styles.adjustInput}
              keyboardType="numeric"
              placeholder="e.g. 10"
              placeholderTextColor={colors.textMuted}
              value={adjustmentInput}
              onChangeText={setAdjustmentInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={() => handleAdjustment('remove')}
              >
                <Icon name="minus" size={18} color={colors.danger} />
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, styles.addBtn]}
                onPress={() => handleAdjustment('add')}
              >
                <Icon name="plus" size={18} color="#FFF" />
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.cancelLink} onPress={closeUpdateModal}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { padding: 16, paddingBottom: 40 },

  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  headerIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },

  // POSTER
  poster: { backgroundColor: '#0F766E', borderRadius: 20, padding: 24, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, overflow: 'hidden', elevation: 4 },
  posterContent: { flex: 1 },
  posterTitle: { color: '#99F6E4', fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  posterHighlight: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  posterStatsRow: { flexDirection: 'row', marginTop: 12 },
  posterStat: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  posterStatText: { color: '#CCFBF1', fontSize: 12, fontWeight: '600' },
  posterIconWrap: { position: 'absolute', right: -10, bottom: -10 },

  // SEARCH
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, borderRadius: 16, height: 52, marginBottom: 16, elevation: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.text },

  // LIST
  listContainer: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, elevation: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  stockRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowDetails: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowCategory: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  stockBadge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, marginRight: 10,
  },
  stockBadgeLow: { backgroundColor: '#FFFBEB' },
  stockBadgeOut: { backgroundColor: '#FEF2F2' },
  stockText: { fontSize: 12, fontWeight: '700', color: colors.success },
  stockTextLow: { color: colors.warning },
  stockTextOut: { color: colors.danger },

  updateBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#CCFBF1',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 20 },

  // MODAL
  modalOverlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  centerCard: { width: '90%', backgroundColor: colors.card, borderRadius: 20, padding: 24, elevation: 10 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  currentStockBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  currentStockLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  currentStockValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },

  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  
  inputLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  adjustInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text,
    backgroundColor: '#FFF', textAlign: 'center', fontWeight: '600',
  },

  modalActions: { flexDirection: 'row', marginTop: 20, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  removeBtn: { backgroundColor: '#FEF2F2', marginRight: 8 },
  addBtn: { backgroundColor: '#0F766E', marginLeft: 8 },
  removeText: { fontSize: 14, fontWeight: '700', color: colors.danger, marginLeft: 6 },
  addText: { fontSize: 14, fontWeight: '700', color: '#FFF', marginLeft: 6 },
  
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
});