import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';
import { getDBConnection } from '../database/db';
import ReceiptPreview from '../components/ReceiptPreview';

const SAMPLE_SALE = {
  id: 'INV-849201',
  date: new Date().toLocaleString('en-PK'),
  items: [
    { name: 'Espresso', price: 400, qty: 2, total: 800 },
    { name: 'Sandwich', price: 650, qty: 1, total: 650 },
    { name: 'Juice', price: 300, qty: 3, total: 900 },
  ],
  total: 2350,
};

const ALIGN_OPTIONS = ['left', 'center', 'right'];
const WEIGHT_OPTIONS = ['normal', 'bold'];

export default function ReceiptSettingsScreen() {
  const [settings, setSettings] = useState({
    id: null,
    header_text: 'My Store',
    header_align: 'center',
    header_weight: 'bold',
    header_size: 22,
    footer_text: 'Thank you for shopping with us!',
    footer_align: 'center',
    auto_print: 1,
  });

  const loadSettings = async () => {
    try {
      const db = await getDBConnection();
      const [res] = await db.executeSql('SELECT * FROM receipt_settings LIMIT 1');
      if (res.rows.length > 0) {
        setSettings(res.rows.item(0));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    try {
      const db = await getDBConnection();
      if (settings.id) {
        await db.executeSql(
          'UPDATE receipt_settings SET header_text=?, header_align=?, header_weight=?, header_size=?, footer_text=?, footer_align=?, auto_print=? WHERE id=?',
          [settings.header_text, settings.header_align, settings.header_weight, settings.header_size, settings.footer_text, settings.footer_align, settings.auto_print, settings.id]
        );
      } else {
        await db.executeSql(
          'INSERT INTO receipt_settings (header_text, header_align, header_weight, header_size, footer_text, footer_align, auto_print) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [settings.header_text, settings.header_align, settings.header_weight, settings.header_size, settings.footer_text, settings.footer_align, settings.auto_print]
        );
      }
      Alert.alert('Saved', 'Receipt format updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Could not save receipt format.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Receipt Format</Text>
          <Text style={styles.headerSub}>Customize how your slip looks when printed</Text>
        </View>

        {/* ============ LIVE PREVIEW ============ */}
        <Text style={styles.sectionTitle}>Live Preview</Text>
        <View style={styles.previewContainer}>
          <ReceiptPreview settings={settings} sale={SAMPLE_SALE} />
        </View>

        {/* ============ HEADER SETTINGS ============ */}
        <Text style={styles.sectionTitle}>Header Settings</Text>
        <Text style={styles.label}>Store / Header Text</Text>
        <TextInput
          style={styles.input}
          value={settings.header_text}
          onChangeText={(t) => setSettings({ ...settings, header_text: t })}
        />

        <Text style={styles.label}>Alignment</Text>
        <View style={styles.chipRow}>
          {ALIGN_OPTIONS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.optChip, settings.header_align === a && styles.optChipActive]}
              onPress={() => setSettings({ ...settings, header_align: a })}
            >
              <Text style={[styles.optText, settings.header_align === a && { color: '#FFF' }]}>{a.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Font Weight</Text>
        <View style={styles.chipRow}>
          {WEIGHT_OPTIONS.map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.optChip, settings.header_weight === w && styles.optChipActive]}
              onPress={() => setSettings({ ...settings, header_weight: w })}
            >
              <Text style={[styles.optText, settings.header_weight === w && { color: '#FFF' }]}>{w.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Font Size (18-28)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(settings.header_size)}
          onChangeText={(t) => setSettings({ ...settings, header_size: parseInt(t, 10) || 22 })}
        />

        {/* ============ FOOTER SETTINGS ============ */}
        <Text style={styles.sectionTitle}>Footer Settings</Text>
        <Text style={styles.label}>Footer Text</Text>
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          multiline
          value={settings.footer_text}
          onChangeText={(t) => setSettings({ ...settings, footer_text: t })}
        />

        <Text style={styles.label}>Alignment</Text>
        <View style={styles.chipRow}>
          {ALIGN_OPTIONS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.optChip, settings.footer_align === a && styles.optChipActive]}
              onPress={() => setSettings({ ...settings, footer_align: a })}
            >
              <Text style={[styles.optText, settings.footer_align === a && { color: '#FFF' }]}>{a.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ============ AUTO PRINT TOGGLE ============ */}
        <Text style={styles.sectionTitle}>Print Options</Text>
        <TouchableOpacity
          style={[styles.toggleRow, { marginBottom: 30 }]}
          onPress={() => setSettings({ ...settings, auto_print: settings.auto_print ? 0 : 1 })}
        >
          <View>
            <Text style={styles.toggleTitle}>Auto-print after sale</Text>
            <Text style={styles.toggleSub}>Automatically send to printer after checkout</Text>
          </View>
          <View style={[styles.switch, settings.auto_print && styles.switchOn]}>
            <View style={[styles.switchKnob, settings.auto_print && styles.switchKnobOn]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Icon name="save" size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>Save Format</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: colors.text, backgroundColor: '#FFF',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  optChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 8,
    backgroundColor: '#FFF',
  },
  optChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  optText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  previewContainer: { alignItems: 'center', marginVertical: 12, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 12 },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, padding: 16, borderRadius: 12, elevation: 1,
  },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  toggleSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  switch: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: '#CBD5E1',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  switchOn: { backgroundColor: '#0F766E' },
  switchKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  switchKnobOn: { alignSelf: 'flex-end' },

  saveBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0F766E', paddingVertical: 16, borderRadius: 14,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },
});