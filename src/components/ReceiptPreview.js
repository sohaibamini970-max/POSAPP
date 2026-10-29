import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const formatPKR = (amount) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0)}`;

export default function ReceiptPreview({ settings, sale }) {
  if (!sale) {
    return (
      <View style={styles.emptySlip}>
        <Text style={styles.emptyText}>Complete a sale to see the preview</Text>
      </View>
    );
  }

  const headerStyle = {
    textAlign: settings?.header_align || 'center',
    fontWeight: settings?.header_weight || 'bold',
    fontSize: settings?.header_size || 22,
    color: '#000',
  };

  const footerStyle = {
    textAlign: settings?.footer_align || 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  };

  return (
    <View style={styles.slip}>
      {/* HEADER */}
      <Text style={[styles.storeName, headerStyle]}>{settings?.header_text || 'My Store'}</Text>
      <Text style={styles.slipTitle}>RECEIPT</Text>
      <View style={styles.divider} />

      {/* META */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Invoice: {sale.id}</Text>
        <Text style={styles.metaText}>{sale.date}</Text>
      </View>
      <View style={styles.divider} />

      {/* ITEMS */}
      <View style={styles.itemsHeader}>
        <Text style={styles.colItem}>Item</Text>
        <Text style={styles.colQty}>Qty</Text>
        <Text style={styles.colPrice}>Price</Text>
        <Text style={styles.colTotal}>Total</Text>
      </View>
      {sale.items.map((line, idx) => (
        <View key={idx} style={styles.itemRow}>
          <Text style={styles.colItem} numberOfLines={1}>{line.name}</Text>
          <Text style={styles.colQty}>{line.qty}</Text>
          <Text style={styles.colPrice}>{formatPKR(line.price)}</Text>
          <Text style={styles.colTotal}>{formatPKR(line.total)}</Text>
        </View>
      ))}
      <View style={styles.divider} />

      {/* TOTAL */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatPKR(sale.total)}</Text>
      </View>
      <View style={styles.divider} />

      {/* FOOTER */}
      <Text style={footerStyle}>{settings?.footer_text || 'Thank you!'}</Text>
      <Text style={[footerStyle, { fontSize: 10, marginTop: 4 }]}>
        Powered by POSAPP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slip: {
    width: 280,
    backgroundColor: '#FFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  emptySlip: {
    width: 280,
    height: 400,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { color: '#94A3B8', fontSize: 12 },
  storeName: { marginBottom: 4 },
  slipTitle: { fontSize: 12, color: '#666', textAlign: 'center', letterSpacing: 2 },
  divider: { borderBottomWidth: 1, borderColor: '#E2E8F0', marginVertical: 10, borderStyle: 'dashed' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 10, color: '#666' },
  itemsHeader: { flexDirection: 'row', marginBottom: 8 },
  colItem: { flex: 2.5, fontSize: 10, color: '#666', fontWeight: '700' },
  colQty: { flex: 0.8, fontSize: 10, color: '#666', textAlign: 'center', fontWeight: '700' },
  colPrice: { flex: 1.2, fontSize: 10, color: '#666', textAlign: 'right', fontWeight: '700' },
  colTotal: { flex: 1.2, fontSize: 10, color: '#666', textAlign: 'right', fontWeight: '700' },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '800' },
  totalValue: { fontSize: 16, fontWeight: '800' },
});