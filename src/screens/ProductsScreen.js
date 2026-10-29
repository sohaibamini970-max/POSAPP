import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import { getDBConnection } from '../database/db';

const formatPKR = (amount) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0)}`;

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newProduct, setNewProduct] = useState({ 
    id: null, name: '', price: '', stock: '', category_id: null, image_uri: null 
  });

  // Load data from Database
  const loadData = async () => {
    try {
      const db = await getDBConnection();
      
      const [catResult] = await db.executeSql('SELECT * FROM categories');
      const loadedCats = [];
      for (let i = 0; i < catResult.rows.length; i++) {
        loadedCats.push(catResult.rows.item(i));
      }
      setCategories([{ id: 'all', name: 'All' }, ...loadedCats]);

      const [prodResult] = await db.executeSql(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `);
      const loadedProds = [];
      for (let i = 0; i < prodResult.rows.length; i++) {
        loadedProds.push(prodResult.rows.item(i));
      }
      setProducts(loadedProds);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || p.category_name === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, activeCategory]);

  // --- Handlers ---
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    if (categories.find(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      Alert.alert('Error', 'Category already exists.');
      return;
    }
    
    try {
      const db = await getDBConnection();
      await db.executeSql('INSERT INTO categories (name) VALUES (?)', [newCatName.trim()]);
      setNewCatName('');
      setShowAddCategory(false);
      loadData(); 
    } catch (error) {
      Alert.alert('Error', 'Could not add category.');
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', 'Could not pick image.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setNewProduct({ ...newProduct, image_uri: response.assets[0].uri });
      }
    });
  };

  // Save Product (Handles both Add and Update)
  const handleSaveProduct = async () => {
    const price = parseFloat(newProduct.price);
    const stock = parseInt(newProduct.stock, 10);
    
    if (!newProduct.name.trim() || isNaN(price) || isNaN(stock) || !newProduct.category_id) {
      Alert.alert('Missing Info', 'Please fill out all fields correctly.');
      return;
    }

    try {
      const db = await getDBConnection();
      
      if (newProduct.id) {
        await db.executeSql(
          'UPDATE products SET name=?, price=?, stock=?, category_id=?, image_uri=? WHERE id=?',
          [newProduct.name.trim(), price, stock, newProduct.category_id, newProduct.image_uri, newProduct.id]
        );
      } else {
        await db.executeSql(
          'INSERT INTO products (name, price, stock, category_id, image_uri) VALUES (?, ?, ?, ?, ?)',
          [newProduct.name.trim(), price, stock, newProduct.category_id, newProduct.image_uri]
        );
      }
      
      setNewProduct({ id: null, name: '', price: '', stock: '', category_id: null, image_uri: null });
      setShowAddProduct(false);
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save product.');
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to remove this product? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDBConnection();
              await db.executeSql('DELETE FROM products WHERE id = ?', [productId]);
              setSelectedProduct(null);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Could not delete product.');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item) => {
    setSelectedProduct(null);
    setNewProduct({
      id: item.id,
      name: item.name,
      price: String(item.price),
      stock: String(item.stock),
      category_id: item.category_id,
      image_uri: item.image_uri
    });
    setShowAddProduct(true);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Products Inventory</Text>
          <TouchableOpacity style={styles.bellBtn}>
            <Icon name="bell" size={20} color={colors.text} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
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
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.mainBtn} onPress={() => {
             if (categories.length <= 1) {
               Alert.alert('No Categories', 'Please create a category first.');
               return;
             }
             setNewProduct({ 
               id: null, name: '', price: '', stock: '', 
               category_id: categories[1].id, image_uri: null 
             });
             setShowAddProduct(true);
          }}>
            <Icon name="plus" size={16} color="#FFF" />
            <Text style={styles.mainBtnText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowAddCategory(true)}>
            <Icon name="folder-plus" size={16} color="#0F766E" />
            <Text style={styles.outlineBtnText}>Add Category</Text>
          </TouchableOpacity>
        </View>

        {/* CATEGORIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        {categories.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {categories.map((cat) => {
              const isActive = cat.name === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, isActive && styles.catChipActive]}
                  onPress={() => setActiveCategory(cat.name)}
                >
                  <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={{ color: colors.textMuted, marginBottom: 24 }}>No categories yet.</Text>
        )}

        {/* GREEN POSTER */}
        <View style={styles.poster}>
          <View style={styles.posterContent}>
            <Text style={styles.posterTitle}>Store Inventory</Text>
            <Text style={styles.posterHighlight}>{totalItems} Items</Text>
            <Text style={styles.posterSub}>Across {categories.length > 0 ? categories.length - 1 : 0} categories</Text>
          </View>
          <View style={styles.posterIconWrap}>
            <Icon name="package" size={80} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* PRODUCTS GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
        </View>

        <View style={styles.grid}>
          {filtered.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', marginTop: 40 }}>
              <Icon name="box" size={40} color={colors.border} />
              <Text style={{ color: colors.textMuted, marginTop: 12 }}>No products found.</Text>
            </View>
          ) : (
            filtered.map((item) => {
              const low = item.stock < 10;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => setSelectedProduct(item)}
                >
                  <View style={styles.imageWrap}>
                    {item.image_uri ? (
                      <Image source={{ uri: item.image_uri }} style={styles.productImage} />
                    ) : (
                      <Icon name="image" size={40} color={colors.border} />
                    )}
                    {low && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{item.stock} left</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardSub}>{item.category_name}</Text>
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

      {/* ===== CENTERED DETAILS MODAL ===== */}
      <Modal visible={!!selectedProduct} transparent animationType="fade" onRequestClose={() => setSelectedProduct(null)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedProduct(null)} />
          
          <View style={styles.centerModalCard}>
            <View style={styles.modalImageWrap}>
              {selectedProduct?.image_uri ? (
                <Image source={{ uri: selectedProduct.image_uri }} style={styles.modalImage} />
              ) : (
                <Icon name="image" size={80} color={colors.border} />
              )}
            </View>
            
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                <Text style={styles.modalCategory}>{selectedProduct?.category_name}</Text>
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

            {/* ACTION BUTTONS */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(selectedProduct)}>
                <Icon name="edit-2" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(selectedProduct.id)}>
                <Icon name="trash-2" size={18} color={colors.danger} />
                <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal visible={showAddProduct} transparent animationType="fade" onRequestClose={() => setShowAddProduct(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlayCenter}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAddProduct(false)} />
          <View style={styles.centerCard}>
            <Text style={styles.centerTitle}>{newProduct.id ? 'Edit Product' : 'Add New Product'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                {newProduct.image_uri ? (
                  <Image source={{ uri: newProduct.image_uri }} style={styles.pickedImage} />
                ) : (
                  <>
                    <Icon name="camera" size={24} color={colors.primary} />
                    <Text style={styles.imagePickerText}>Upload Photo</Text>
                  </>
                )}
              </TouchableOpacity>

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
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.pickChip, newProduct.category_id === cat.id && styles.pickChipActive]}
                    onPress={() => setNewProduct({...newProduct, category_id: cat.id})}
                  >
                    <Text style={[styles.pickChipText, newProduct.category_id === cat.id && { color: '#FFF' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddProduct(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSaveProduct}>
                <Text style={styles.saveText}>{newProduct.id ? 'Save Changes' : 'Save Product'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ADD CATEGORY MODAL */}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  bellDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, borderRadius: 16, height: 52, marginRight: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.text },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  mainBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 12, marginRight: 8 },
  mainBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  outlineBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0F766E', paddingVertical: 14, borderRadius: 12, marginLeft: 8 },
  outlineBtnText: { color: '#0F766E', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  chipScroll: { paddingBottom: 24 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.card, marginRight: 10, elevation: 1 },
  catChipActive: { backgroundColor: '#0F766E' },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  catChipTextActive: { color: '#FFF' },
  poster: { backgroundColor: '#0F766E', borderRadius: 20, padding: 24, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, overflow: 'hidden' },
  posterContent: { flex: 1 },
  posterTitle: { color: '#99F6E4', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  posterHighlight: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  posterSub: { color: '#CCFBF1', fontSize: 12, marginTop: 4 },
  posterIconWrap: { position: 'absolute', right: -10, bottom: -10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: colors.card, borderRadius: 20, marginBottom: 16, elevation: 2, overflow: 'hidden' },
  imageWrap: { height: 140, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardInfo: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: colors.text },
  stockText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  // ===== MODALS =====
  modalOverlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  
  // CENTERED DETAILS MODAL
  centerModalCard: { 
    width: '88%', 
    backgroundColor: colors.card, 
    borderRadius: 24, 
    padding: 24, 
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalImageWrap: { height: 160, backgroundColor: '#F1F5F9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  modalImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  modalCategory: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  modalPrice: { fontSize: 22, fontWeight: '800', color: colors.primary },
  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  modalStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalStatBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  // MODAL BUTTONS
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  editBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 12, marginRight: 8 },
  deleteBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 12, marginLeft: 8 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', marginLeft: 6 },

  // OTHER MODALS
  centerCard: { width: '90%', backgroundColor: colors.card, borderRadius: 20, padding: 24, elevation: 10 },
  centerTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  imagePickerBtn: { height: 120, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePickerText: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 6 },
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