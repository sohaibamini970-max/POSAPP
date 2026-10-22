import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'Espresso', price: 400, stock: 24, category: 'Coffee' },
  { id: 'p2', name: 'Club Sandwich', price: 650, stock: 12, category: 'Food' },
  { id: 'p3', name: 'Orange Juice', price: 300, stock: 8, category: 'Drinks' },
  { id: 'p4', name: 'Green Tea', price: 250, stock: 30, category: 'Coffee' },
  { id: 'p5', name: 'Chocolate Cake', price: 500, stock: 5, category: 'Bakery' },
  { id: 'p6', name: 'Beef Burger', price: 750, stock: 15, category: 'Food' },
];

const formatPKR = (amount) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0)}`;

export default function ProductsScreen() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState(['All', 'Coffee', 'Food', 'Drinks', 'Bakery']);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: 'Coffee' });

  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, activeCategory]);

  // --- Handlers ---
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) {
      Alert.alert('Error', 'Category already exists.');
      return;
    }
    setCategories([...categories, newCatName.trim()]);
    setNewCatName('');
    setShowAddCategory(false);
  };

  const handleAddProduct = () => {
    const price = parseFloat(newProduct.price);
    const stock = parseInt(newProduct.stock, 10);
    
    if (!newProduct.name.trim() || isNaN(price) || isNaN(stock)) {
      Alert.alert('Missing Info', 'Please fill out all fields correctly.');
      return;
    }

    const item = {
      id: `p${Date.now()}`,
      name: newProduct.name.trim(),
      price,
      stock,
      category: newProduct.category,
    };

    setProducts([item, ...products]);
    setNewProduct({ name: '', price: '', stock: '', category: categories[1] || 'Coffee' });
    setShowAddProduct(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Products Inventory</Text>
          <TouchableOpacity style={styles.bellBtn}>
            <Icon name="bell" size={20} color={colors.text} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* ===== SEARCH & FILTER ===== */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search product here"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="sliders" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ===== ACTION BUTTONS ===== */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.mainBtn} onPress={() => setShowAddProduct(true)}>
            <Icon name="plus" size={16} color="#FFF" />
            <Text style={styles.mainBtnText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowAddCategory(true)}>
            <Icon name="folder-plus" size={16} color="#0F766E" />
            <Text style={styles.outlineBtnText}>Add Category</Text>
          </TouchableOpacity>
        </View>

        {/* ===== CATEGORIES ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ===== GREEN POSTER ===== */}
        <View style={styles.poster}>
          <View style={styles.posterContent}>
            <Text style={styles.posterTitle}>Store Inventory</Text>
            <Text style={styles.posterHighlight}>{totalItems} Items</Text>
            <Text style={styles.posterSub}>
              Across {categories.length - 1} product categories
            </Text>
          </View>
          <View style={styles.posterIconWrap}>
            <Icon name="package" size={80} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* ===== POPULAR PRODUCTS ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
        </View>

        <View style={styles.grid}>
          {filtered.length === 0 ? (
            <Text style={{ width: '100%', textAlign: 'center', marginTop: 20, color: colors.textMuted }}>
              No products found.
            </Text>
          ) : (
            filtered.map((item) => {
              const low = item.stock < 10;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => setSelectedProduct(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.imageWrap}>
                    <Icon name="image" size={40} color={colors.border} />
                    {low && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{item.stock} left</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.heartBtn}>
                      <Icon name="heart" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardSub}>{item.category}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardPrice}>{formatPKR(item.price)}</Text>
                      <Text style={styles.stockText}>{item.stock} in stock</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ===== PRODUCT DETAILS MODAL ===== */}
      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedProduct(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalImageWrap}>
              <Icon name="image" size={80} color={colors.border} />
            </View>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                <Text style={styles.modalCategory}>{selectedProduct?.category}</Text>
              </View>
              <Text style={styles.modalPrice}>{formatPKR(selectedProduct?.price || 0)}</Text>
            </View>
            <View style={styles.modalDivider} />
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatBox}>
                <Text style={styles.statValue}>{selectedProduct?.stock}</Text>
                <Text style={styles.statLabel}>In Stock</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.statValue}>{formatPKR((selectedProduct?.stock || 0) * (selectedProduct?.price || 0))}</Text>
                <Text style={styles.statLabel}>Inventory Value</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedProduct(null)}>
              <Text style={styles.closeModalText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== ADD PRODUCT MODAL ===== */}
      <Modal visible={showAddProduct} transparent animationType="fade" onRequestClose={() => setShowAddProduct(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayCenter}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAddProduct(false)} />
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>Add New Product</Text>
            
            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Iced Latte" value={newProduct.name} onChangeText={(t) => setNewProduct({...newProduct, name: t})} />
            
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Price (PKR)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={newProduct.price} onChangeText={(t) => setNewProduct({...newProduct, price: t})} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Stock</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={newProduct.stock} onChangeText={(t) => setNewProduct({...newProduct, stock: t})} />
              </View>
            </View>

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories.filter(c => c !== 'All').map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.pickChip, newProduct.category === cat && styles.pickChipActive]}
                  onPress={() => setNewProduct({...newProduct, category: cat})}
                >
                  <Text style={[styles.pickChipText, newProduct.category === cat && { color: '#FFF' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddProduct(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddProduct}>
                <Text style={styles.saveText}>Save Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== ADD CATEGORY MODAL ===== */}
      <Modal visible={showAddCategory} transparent animationType="fade" onRequestClose={() => setShowAddCategory(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayCenter}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAddCategory(false)} />
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>Add New Category</Text>
            
            <Text style={styles.label}>Category Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Snacks" value={newCatName} onChangeText={setNewCatName} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddCategory(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddCategory}>
                <Text style={styles.saveText}>Add Category</Text>
              </TouchableOpacity>
            </View>
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
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  bellDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },

  // SEARCH
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, borderRadius: 16, height: 52, marginRight: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.text },
  filterBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // ACTION BUTTONS (Add Product / Category)
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  mainBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 12, marginRight: 8 },
  mainBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  outlineBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0F766E', paddingVertical: 14, borderRadius: 12, marginLeft: 8 },
  outlineBtnText: { color: '#0F766E', fontSize: 14, fontWeight: '700', marginLeft: 6 },

  // SECTIONS
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  // CHIPS
  chipScroll: { paddingBottom: 24 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.card, marginRight: 10, elevation: 1 },
  catChipActive: { backgroundColor: '#0F766E' },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  catChipTextActive: { color: '#FFF' },

  // GREEN POSTER
  poster: { backgroundColor: '#0F766E', borderRadius: 20, padding: 24, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, overflow: 'hidden' },
  posterContent: { flex: 1 },
  posterTitle: { color: '#99F6E4', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  posterHighlight: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  posterSub: { color: '#CCFBF1', fontSize: 12, marginTop: 4 },
  posterIconWrap: { position: 'absolute', right: -10, bottom: -10 },

  // PRODUCT CARDS
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: colors.card, borderRadius: 20, marginBottom: 16, elevation: 2, overflow: 'hidden' },
  imageWrap: { height: 140, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  heartBtn: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: colors.text },
  stockText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  // MODALS COMMON
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  
  // DETAILS MODAL (Bottom Sheet)
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  modalImageWrap: { height: 160, backgroundColor: '#F1F5F9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  modalCategory: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  modalPrice: { fontSize: 22, fontWeight: '800', color: colors.primary },
  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  modalStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalStatBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  closeModalBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  closeModalText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // CENTER MODALS (Add Product / Category)
  centerCard: { width: '90%', backgroundColor: colors.card, borderRadius: 20, padding: 24, elevation: 10 },
  centerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, backgroundColor: '#FFF' },
  pickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: '#FFF' },
  pickChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  pickChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  modalActions: { flexDirection: 'row', marginTop: 24 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9', marginRight: 8 },
  saveBtn: { backgroundColor: '#0F766E', marginLeft: 8 },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  saveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});