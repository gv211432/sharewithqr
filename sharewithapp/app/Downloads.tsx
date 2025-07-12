import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { openFile, getDownloadFiles } from './utils/fileUtils';

export default function Downloads() {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const result = await getDownloadFiles();
      setFiles(result);
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.text}>Downloaded Files:</Text>
      <FlatList
        data={files}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openFile(item)}>
            <View style={styles.fileItem}>
              <MaterialIcons name="insert-drive-file" size={20} color="#666" />
              <Text style={{ marginLeft: 8 }}>{item}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ margin: 20 }}>No files found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  text: { color: 'black', fontSize: 18, marginBottom: 10 },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
