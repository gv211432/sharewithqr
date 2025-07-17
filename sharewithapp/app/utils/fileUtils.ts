import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export function getDownloadDir() {
  return FileSystem.documentDirectory + 'sharewithapp/';
}

export async function getDownloadFiles() {
  try {
    return await FileSystem.readDirectoryAsync(getDownloadDir());
  } catch {
    return [];
  }
}


export async function openFileWeb(fileName: string) {
  const fileUri = getDownloadDir() + fileName;
  try {
    await WebBrowser.openBrowserAsync(fileUri);
  } catch (e) {
    console.warn('Failed to open file', e);
  }
}

export async function openFileSharing(fileName: string) {
  const fileUri = getDownloadDir() + fileName;
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing not available on this device');
      return;
    }
    await Sharing.shareAsync(fileUri);
  } catch (e) {
    console.warn('Failed to share file', e);
  }
}


export async function openFile(fileName: string) {
  const fileUri = getDownloadDir() + fileName;
  
  try {
    await Linking.openURL(fileUri);
  } catch (e1) {
    try {
      console.warn('Failed to open file', e1);
      openFileWeb(fileName);
    } catch (e2) {
      try {
        console.warn('Failed to open file', e2);
        openFileSharing(fileName);
      } catch (e3) {
        console.warn('Failed to open file', e3);
      }
    }
  }
}