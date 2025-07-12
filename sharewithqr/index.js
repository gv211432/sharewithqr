#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const chunkFile = require('./chunker');
const displayQR = require('./qrdisplay');

const filePath = process.argv[2];
if (!filePath || !fs.existsSync(filePath)) {
  console.error('Usage: sharewithqr <file>');
  process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);
const file = fs.statSync(filePath);
const fileSize = file.size; // in bytes
const fileSizeKB = (fileSize / 1024).toFixed(2); // in KB
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2); // in MB

// Compress file buffer using gzip
const compressedBuffer = zlib.gzipSync(fileBuffer);
const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
const compressedSizeMB = (compressedBuffer.length / (1024 * 1024)).toFixed(2);

const chunks = chunkFile(compressedBuffer);

console.log(`Encoding ${filePath} (${fileBuffer.length} bytes, compressed to ${compressedBuffer.length} bytes) into ${chunks.length} QR codes...`);

(async () => {
  // First QR: metadata
  await displayQR(
    `0/${chunks.length}:${JSON.stringify({
      fileName: path.basename(filePath),
      size: fileSizeKB > 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`,
      compressedSize: compressedSizeKB > 1024 ? `${compressedSizeMB} MB` : `${compressedSizeKB} KB`,
      compression: 'gzip'
    })}`,
    0,
    chunks.length
  );
  // Remaining QRs: chunk data
  for (let i = 0; i < chunks.length; i++) {
    await displayQR(chunks[i], i + 1, chunks.length);
  }
  console.log('Done!');
})();
