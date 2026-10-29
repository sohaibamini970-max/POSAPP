import React from 'react';
import { Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import DashboardScreen from '../screens/DashboardScreen';
import SaleScreen from '../screens/SaleScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import ProductsScreen from '../screens/ProductsScreen';
import StockScreen from '../screens/StockScreen';
import ReceiptSettingsScreen from '../screens/ReceiptSettingsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const iconMap = {
  Dashboard: 'home',
  Sale: 'shopping-cart',
  Sales: 'list',
  Products: 'box',
  Stock: 'layers',
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveBackgroundColor: '#EFF6FF', // light blue highlight
        tabBarIcon: ({ color, size }) => (
          <Icon name={iconMap[route.name] || 'circle'} size={size} color={color} />
        ),
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: 'transparent' }} // disables ripple
            style={({ pressed }) => [
              props.style,
              pressed && { backgroundColor: '#E0EDFF' }, // light click effect
            ]}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sale" component={SaleScreen} />
      <Tab.Screen name="Sales" component={SalesHistoryScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="Print" component={ReceiptSettingsScreen} options={{tabBarLabel: 'Print',
      tabBarIcon: ({ color, size }) => <Icon name="printer" size={size} color={color} />,
       }}
      />
    </Tab.Navigator>
  );
}