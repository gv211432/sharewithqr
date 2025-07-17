import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Scanner from './Scanner';
import Downloads from './Downloads';

export default function App() {
  const [screen, setScreen] = useState<'scan' | 'downloads'>('scan');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>ShareWithQR</Text>
        <TouchableOpacity onPress={() => setScreen(screen === 'scan' ? 'downloads' : 'scan')}>
          <MaterialIcons name={screen === 'scan' ? 'folder' : 'camera-alt'} size={28} color="#333" />
        </TouchableOpacity>
      </View>
      {screen === 'scan' ? <Scanner /> : <Downloads />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#f5f5f5' },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
});
