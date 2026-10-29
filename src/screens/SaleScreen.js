import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';
import { getDBConnection } from '../database/db';
import ReceiptPreview from '../components/ReceiptPreview';

const formatPKR = (amount) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0)}`;

const receiptId = () => `INV-${Date.now().toString().slice(-6)}`;

export default function SaleScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customPrice, setCustomPrice] = useState(false);
  const [customQty, setCustomQty] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [receiptSettings, setReceiptSettings] = useState(null);

  // Load Products AND Receipt Settings from DB on Focus
  const loadData = async () => {
    try {
      const db = await getDBConnection();
      
      const [prodResult] = await db.executeSql('SELECT * FROM products');
      const loadedProds = [];
      for (let i = 0; i < prodResult.rows.length; i++) {
        loadedProds.push(prodResult.rows.item(i));
      }
      setProducts(loadedProds);

      const [rsResult] = await db.executeSql('SELECT * FROM receipt_settings LIMIT 1');
      if (rsResult.rows.length > 0) {
        setReceiptSettings(rsResult.rows.item(0));
      }
    } catch (error) {
      console.error('Error loading sale data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const openProduct = (product) => {
    if (product.stock <= 0) {
      Alert.alert('Out of stock', `${product.name} has no stock left.`);
      return;
    }
    setSelectedProduct(product);
    setCustomPrice(true);
    setCustomQty(false);
    setPriceInput(String(product.price));
    setQtyInput('1');
  };

  const closeModal = () => setSelectedProduct(null);

  const unitPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (customPrice) {
      const n = parseFloat(priceInput);
      return isNaN(n) ? 0 : n;
    }
    return selectedProduct.price;
  }, [selectedProduct, customPrice, priceInput]);

  const quantity = useMemo(() => {
    if (!selectedProduct) return 0;
    if (customQty) {
      const n = parseFloat(qtyInput);
      return isNaN(n) ? 0 : n;
    }
    return 1;
  }, [selectedProduct, customQty, qtyInput]);

  const lineTotal = unitPrice * quantity;
  const remainingAfterAdd = selectedProduct ? selectedProduct.stock - quantity : 0;

  const addToCart = () => {
    if (unitPrice <= 0 || quantity <= 0) {
      Alert.alert('Invalid', 'Price and quantity must be greater than 0.');
      return;
    }
    if (quantity > selectedProduct.stock) {
      Alert.alert('Insufficient stock', `Only ${selectedProduct.stock} left in stock.`);
      return;
    }

    const line = {
      id: `${selectedProduct.id}-${Date.now()}`,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: unitPrice,
      qty: quantity,
      total: lineTotal,
      customPrice,
      customQty,
    };
    setCart((prev) => [...prev, line]);
    closeModal();
  };

  const removeLine = (id) => {
    setCart((prev) => prev.filter((l) => l.id !== id));
  };

  const cartTotal = cart.reduce((sum, l) => sum + l.total, 0);
  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const invId = receiptId();
    const dateStr = new Date().toISOString();
    const itemsJson = JSON.stringify(cart);

    try {
      const db = await getDBConnection();
      
      await db.executeSql(
        'INSERT INTO sales (invoice_id, date, total, items, payment_method, cashier) VALUES (?, ?, ?, ?, ?, ?)',
        [invId, dateStr, cartTotal, itemsJson, 'Cash', 'Admin']
      );

      for (const item of cart) {
        await db.executeSql(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.qty, item.productId]
        );
      }

      const slip = {
        id: invId,
        date: new Date(dateStr).toLocaleString('en-PK'),
        items: cart,
        total: cartTotal,
      };
      setReceipt(slip);
      setCart([]);
      loadData(); // Refresh products + settings

    } catch (error) {
      console.error('Checkout Error:', error);
      Alert.alert('Error', 'Could not process sale.');
    }
  };

  const closeReceipt = () => setReceipt(null);

  const handlePrintSlip = () => {
    Alert.alert('Print', 'Sending slip to Bluetooth/USB printer...');
    closeReceipt();
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>New Sale</Text>
        <Text style={styles.subheader}>Tap a product to add</Text>

        <View style={styles.grid}>
          {products.length === 0 ? (
            <Text style={{ width: '100%', textAlign: 'center', marginTop: 20, color: colors.textMuted }}>
              No products found. Add products first.
            </Text>
          ) : (
            products.map((p) => {
              const out = p.stock <= 0;
              const low = p.stock > 0 && p.stock < 10;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.card, out && styles.cardDisabled]}
                  onPress={() => openProduct(p)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconWrap}>
                       {p.image_uri ? (
                          <Image source={{ uri: p.image_uri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                       ) : (
                          <Icon name="box" size={20} color={colors.primary} />
                       )}
                    </View>
                    <Text style={[styles.stockBadge, low && styles.stockLow, out && styles.stockOut]}>
                      {out ? 'Out' : `${p.stock} left`}
                    </Text>
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.cardPrice}>{formatPKR(p.price)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* CART BAR */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarLabel}>{cartCount} item(s)</Text>
            <Text style={styles.cartBarTotal}>{formatPKR(cartTotal)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Checkout</Text>
            <Icon name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* PRODUCT MODAL */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.modalSub}>
              Base price: {formatPKR(selectedProduct?.price || 0)} ·{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {selectedProduct?.stock} in stock
              </Text>
            </Text>

            {/* PRICE */}
            <Text style={styles.fieldLabel}>Price</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, !customPrice && styles.inputDisabled]}
                keyboardType="numeric"
                value={customPrice ? priceInput : String(selectedProduct?.price || '')}
                onChangeText={setPriceInput}
                editable={customPrice}
                placeholder="Enter price"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={styles.checkboxHit}
                onPress={() => setCustomPrice((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, customPrice && styles.checkboxChecked]}>
                  {customPrice && <Icon name="check" size={12} color="#FFF" />}
                </View>
              </TouchableOpacity>
            </View>

            {/* QUANTITY */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Quantity</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, !customQty && styles.inputDisabled]}
                keyboardType="numeric"
                value={customQty ? qtyInput : '1'}
                onChangeText={setQtyInput}
                editable={customQty}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={styles.checkboxHit}
                onPress={() => setCustomQty((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, customQty && styles.checkboxChecked]}>
                  {customQty && <Icon name="check" size={12} color="#FFF" />}
                </View>
              </TouchableOpacity>
            </View>

            {/* REMAINING STOCK */}
            <View style={styles.stockPreview}>
              <Icon name="package" size={14} color={colors.textMuted} />
              <Text style={styles.stockPreviewText}>
                Remaining after add:{' '}
                <Text style={{ fontWeight: '700', color: remainingAfterAdd < 0 ? colors.danger : colors.text }}>
                  {remainingAfterAdd < 0 ? 'Not enough stock' : `${remainingAfterAdd} pcs`}
                </Text>
              </Text>
            </View>

            {/* TOTAL */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Amount</Text>
              <Text style={styles.totalValue}>{formatPKR(lineTotal)}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.addBtn]} onPress={addToCart}>
                <Text style={styles.addText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== NEW RECEIPT / PRINT MODAL ===== */}
      <Modal visible={!!receipt} transparent animationType="fade" onRequestClose={closeReceipt}>
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptBackdrop} />
          <View style={styles.receiptWrapper}>
            
            <View style={styles.receiptTopRow}>
              <Icon name="check-circle" size={24} color={colors.success} />
              <Text style={styles.receiptTitle}>Sale Completed</Text>
            </View>

            <ScrollView style={{ maxHeight: '70%' }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 16 }}>
              <ReceiptPreview settings={receiptSettings} sale={receipt} />
            </ScrollView>

            <View style={styles.receiptActions}>
              <TouchableOpacity style={[styles.receiptBtn, styles.printBtn]} onPress={handlePrintSlip}>
                <Icon name="printer" size={16} color="#FFF" />
                <Text style={styles.receiptBtnText}>Print Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.receiptBtn, styles.skipBtn]} onPress={closeReceipt}>
                <Text style={[styles.receiptBtnText, { color: colors.textMuted }]}>Don't Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 220 },
  header: { fontSize: 24, fontWeight: '800', color: colors.text },
  subheader: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  cardDisabled: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  stockBadge: { fontSize: 10, fontWeight: '700', color: colors.success, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  stockLow: { color: colors.warning, backgroundColor: '#FFFBEB' },
  stockOut: { color: colors.danger, backgroundColor: '#FEF2F2' },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardPrice: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 4 },
  cartBar: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, elevation: 8 },
  cartBarLabel: { color: '#CBD5E1', fontSize: 11 },
  cartBarTotal: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  checkoutText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginRight: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  modalCard: { width: '88%', backgroundColor: colors.card, borderRadius: 18, padding: 20, elevation: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: '#FFF', marginRight: 10 },
  inputDisabled: { backgroundColor: '#F8FAFC', color: colors.textMuted },
  checkboxHit: { padding: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  stockPreview: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  stockPreviewText: { fontSize: 12, color: colors.textMuted, marginLeft: 6 },
  totalBox: { marginTop: 14, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#EFF6FF', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  modalActions: { flexDirection: 'row', marginTop: 18 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9', marginRight: 8 },
  addBtn: { backgroundColor: colors.primary, marginLeft: 8 },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  addText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // ===== RECEIPT MODAL =====
  receiptOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  receiptBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  receiptWrapper: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    elevation: 14,
  },
  receiptTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  receiptTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginLeft: 8 },
  receiptActions: { flexDirection: 'row', marginTop: 12 },
  receiptBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  printBtn: { backgroundColor: colors.primary, marginRight: 8 },
  skipBtn: { backgroundColor: '#F1F5F9', marginLeft: 8 },
  receiptBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', marginLeft: 6 },
});