// App.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './src/navigation/BottomTabs';
import { initDatabase } from './src/database/db';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => console.error('DB Init Error:', err));
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
});