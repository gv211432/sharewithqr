import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { openFile, getDownloadFiles, getDownloadDir } from './utils/fileUtils';
import * as FileSystem from 'expo-file-system';

export default function Downloads() {
  const [files, setFiles] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [actionVisible, setActionVisible] = useState(false);


  useEffect(() => {
    (async () => {
      const result = await getDownloadFiles();
      setFiles(result);
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* <Text style={styles.text}>Downloaded Files:</Text> */}
      <FlatList
        data={files}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => {
              setSelectedFile(item);
              setActionVisible(true);
            }}
            onPress={() => {
              setFileName(item);
              // openFile(item);
            }}>
            <View style={styles.fileItem}>
              <MaterialIcons name="insert-drive-file" size={20} color="#666" />
              <Text style={{ marginLeft: 8 }}>{item}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ margin: 20 }}>No files found.</Text>}
      />
      
      {fileName && <Image
        source={{ uri: getDownloadDir() + fileName }}
        style={{ width: 300, height: 300 }}
      />}

      {actionVisible && selectedFile && (
        <View style={styles.actionSheet}>
          <TouchableOpacity onPress={() => {
            setFileName(selectedFile);
            setActionVisible(false);
          }}>
            <Text style={styles.actionOption}>👁 View</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            openFile(selectedFile);
            setActionVisible(false);
          }}>
            <Text style={styles.actionOption}>📤 Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            const path = getDownloadDir() + selectedFile;
            await FileSystem.deleteAsync(path, { idempotent: true });
            const updated = await getDownloadFiles();
            setFiles(updated);
            setActionVisible(false);
          }}>
            <Text style={[styles.actionOption, { color: 'red' }]}>🗑 Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActionVisible(false)}>
            <Text style={[styles.actionOption, { color: '#666' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: 'black',
    fontSize: 18,
    marginBottom: 10,
    marginLeft: 14,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    elevation: 20,
  },
  actionOption: {
    fontSize: 18,
    paddingVertical: 10,
  },
});

