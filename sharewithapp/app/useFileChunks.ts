import { useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import pako from 'pako';
import { Buffer } from 'buffer';
import { getDownloadDir } from './utils/fileUtils';

export default function useFileChunks() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState<string>('<file_name>');
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState<number | null>(null);
  const [chunkCounter, setChunkCounter] = useState(0);
  const chunksRef = useRef<{ [key: number]: string; }>({});
  const alertActiveRef = useRef(false);
  const lastIndexRef = useRef<number>(-1);

  // Directory
  const APP_DOWNLOADS_DIR = getDownloadDir();

  // Permissions
  useState(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      await FileSystem.makeDirectoryAsync(APP_DOWNLOADS_DIR, { intermediates: true }).catch(() => { });
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string; }) => {
    if (alertActiveRef.current) return;
    try {
      const [meta, chunk] = RegExp(/^(.*?):(.*)$/).exec(data)?.slice(1) || [];
      const [indexStr, totalStr] = meta.split('/');
      const index = parseInt(indexStr, 10) - 1;
      const total = parseInt(totalStr, 10);
      if (isNaN(index) || isNaN(total) || !chunk) throw new Error('Invalid QR chunk format');
      if (!totalChunks) setTotalChunks(total);
      if (index - lastIndexRef.current > 1) {
        alertActiveRef.current = true;
        Alert.alert('Aborted', 'Missed QR chunks', [{
          text: 'OK', onPress: resetAll
        }]);
        return;
      } else {
        lastIndexRef.current = index;
      }
      if (index < 0 && fileName === `<file_name>`) {
        try {
          const meta = JSON.parse(chunk);
          if (meta?.fileName && meta?.size) {
            setFileName(meta.fileName);
            setFileSize(meta.size);
          }
        } catch {
          alertActiveRef.current = true;
          Alert.alert('Aborted', 'Missed First QR', [{
            text: 'OK', onPress: resetAll
          }]);
        }
        return;
      }
      if (index >= 0 && !chunksRef.current[index]) {
        chunksRef.current[index] = chunk;
        setChunkCounter(Object.keys(chunksRef.current).length);
      }
      if (Object.keys(chunksRef.current).length >= (totalChunks || total)) {
        setDone(true);
        setScanning(false);
      }
    } catch (e) {
      alertActiveRef.current = true;
      Alert.alert('Aborted', 'Could not parse QR chunk. Restart scanning.', [{
        text: 'OK', onPress: resetAll
      }]);
    }
  };

  const getDecompressedData = () => {
    try {
      const orderedChunks = [];
      for (let i = 0; i < (totalChunks || 0); i++) {
        if (!chunksRef.current[i]) {
          Alert.alert('Aborted', `Missing chunk ${i}. Aborting file save.`, [{
            text: 'OK', onPress: resetAll
          }]);
          return;
        }
        orderedChunks.push(chunksRef.current[i]);
      }
      const base64Data = orderedChunks.join('');
      const compressedData = Buffer.from(base64Data, 'base64');
      return pako.ungzip(compressedData);
    } catch (error) {
      console.error('Decompression error:', error);
      Alert.alert('Decompression failed', 'Could not decompress file.');
      return null; // Handle decompression error    
    }
  };

  const saveFile = async () => {
    try {
      const fileData = getDecompressedData();
      if (!fileData) {
        resetAll();
        alertActiveRef.current = true;
        setTotalChunks(null);
        setFileName('<file_name>');
        setFileSize(null);
        setChunkCounter(0);
        setDone(false);
        lastIndexRef.current = -1;
        chunksRef.current = {};
        return;
      }
      const fileUri = APP_DOWNLOADS_DIR + fileName;
      await FileSystem.writeAsStringAsync(fileUri, Buffer.from(fileData).toString('utf8'), { encoding: FileSystem.EncodingType.UTF8 });
      Alert.alert('File saved', `Saved to ${fileUri}`);
      resetAll();
    } catch (e: any) {
      resetAll();
      Alert.alert('Save failed', `Could not save file: ${fileName}`);
    }
  };

  function resetAll() {
    setScanning(false);
    chunksRef.current = {};
    setChunkCounter(0);
    setTotalChunks(null);
    setFileName('<file_name>');
    setDone(false);
    alertActiveRef.current = false;
    lastIndexRef.current = -1;
  }

  return {
    hasPermission,
    scanning,
    setScanning,
    done,
    setDone,
    fileName,
    setFileName,
    fileSize,
    setFileSize,
    chunkCounter,
    setChunkCounter,
    totalChunks,
    setTotalChunks,
    handleBarCodeScanned,
    saveFile,
    resetAll,
    lastIndexRef,
    alertActiveRef,
  };
}
