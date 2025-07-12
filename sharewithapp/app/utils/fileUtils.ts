import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
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

export async function openFile(fileName: string) {
  const fileUri = getDownloadDir() + fileName;
  try {
    await Linking.openURL(fileUri);
  } catch (e) {
    // fallback or error
  }
}
