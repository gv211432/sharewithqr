import React, { useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import useFileChunks from './useFileChunks';

export default function Scanner() {
  const cameraRef = useRef<CameraView | null>(null);
  const {
    hasPermission,
    scanning,
    setScanning,
    done,
    setDone,
    fileName,
    fileSize,
    chunkCounter,
    totalChunks,
    handleBarCodeScanned,
    saveFile,
    resetAll,
    lastIndexRef,
    alertActiveRef,
  } = useFileChunks();

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.center}>
      <Text style={{
        marginBottom: 10,
      }}>No access to camera</Text>

      {/* Request Permision */}
      <Button title="Grant Permission" onPress={() => Camera.requestCameraPermissionsAsync()} />
    </View>;
  }

  return (
    <View style={{ flex: 1 }}>

      {/* If neither scanning nor scaned */}
      {!scanning && !done && (
        <View style={styles.center}>
          <Button title="Start Scanning" onPress={() => setScanning(true)} />
        </View>
      )}

      {/* If scannig */}
      {scanning && (
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={[styles.overlay, StyleSheet.absoluteFill]}>
            <Text style={[styles.text, styles.textBorder]}>Scan QR codes continuously</Text>
            <Button
              title="Stop"
              onPress={resetAll}
            />
          </View>
        </View>
      )}

      {/* If scanning is completed */}
      {done && (
        <View style={styles.center}>
          <Text>
            File: {fileName}
            Size: {fileSize || 'Unknown'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Button
              title="Rescan" onPress={() => {
                setScanning(true);
                setDone(false);
                lastIndexRef.current = -1;
                alertActiveRef.current = false;
              }} />
            <Button title="Save File" onPress={saveFile} />
            <Button
              color={'red'}
              title="Reset"
              onPress={resetAll}
            />
          </View>
        </View>
      )}

      {/* If scannig */}
      {scanning && <View style={styles.status}>
        <Text>QRs scanned: {chunkCounter}/{totalChunks || '?'}</Text>
        <Text>File name: {fileName}</Text>
        <Text>File size: {fileSize || 'Unknown'}</Text>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    flex: 1, backgroundColor: 'transparent',
    justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40
  },
  text: { color: 'red', fontSize: 18, marginBottom: 10 },
  textBorder: {
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  status: { padding: 10, backgroundColor: '#eee' },
});
