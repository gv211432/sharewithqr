#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const chunkFile = require('./chunker');
const displayQR = require('./qrdisplay');
const { version } = require('./package.json'); // Assuming package.json exists in the same directory

// --- Default values ---
let QR_REFRESH_INTERVAL = 200; // in ms
let CHUNK_SIZE = 300; // bytes per QR

// --- Parse CLI flags ---
const args = process.argv.slice(2);
let filePath = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '-v' || arg === '--version') {
    console.log(`sharewithqr v${version}`);
    process.exit(0);
  }

  if (arg === '-h' || arg === '--help') {
    console.log(`
  Usage: sharewithqr [options] <file>
  Options:
    -v, --version           Show version
    -h, --help              Show this help message
    -r, --refreshrate <ms>  QR refresh rate in milliseconds (default: 200)
    -b, --bytes <n>         Chunk size in bytes per QR code (default: 300)

  Example:
    sharewithqr -r 300 -b 400 ./file.png
`);
    process.exit(0);
  }

  if (arg === '-r' || arg === '--refreshrate') {
    const rate = parseInt(args[i + 1], 10);
    if (!isNaN(rate)) QR_REFRESH_INTERVAL = rate;
    i++;
    continue;
  }

  if (arg === '-b' || arg === '--bytes') {
    const bytes = parseInt(args[i + 1], 10);
    if (!isNaN(bytes)) CHUNK_SIZE = bytes;
    i++;
    continue;
  }

  // Assume it's the file
  if (!arg.startsWith('-') && !filePath) {
    filePath = arg;
  }
}

// --- Validate file path ---
if (!filePath || !fs.existsSync(filePath)) {
  console.error('Error: file path is required.\nRun with --help for usage.');
  process.exit(1);
}

// --- Read and compress the file ---
const fileBuffer = fs.readFileSync(filePath);
const file = fs.statSync(filePath);
const fileSize = file.size;
const fileSizeKB = (fileSize / 1024).toFixed(2);
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

const compressedBuffer = zlib.gzipSync(fileBuffer, { level: zlib.constants.Z_BEST_COMPRESSION });
const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
const compressedSizeMB = (compressedBuffer.length / (1024 * 1024)).toFixed(2);

console.log({
  filePath,
  fileSize: `${fileSizeKB} KB (${fileSizeMB} MB)`,
  compressedSize: `${compressedSizeKB} KB (${compressedSizeMB} MB)`,
  refreshRate: `${QR_REFRESH_INTERVAL} ms`,
  chunkSize: `${CHUNK_SIZE} bytes`
});

// const chunks = chunkFile(compressedBuffer, CHUNK_SIZE);
const chunks = chunkFile(fileBuffer, CHUNK_SIZE);
console.log(`Encoding ${filePath} (${fileBuffer.length} bytes, compressed to ${compressedBuffer.length} bytes) into ${chunks.length} QR codes...`);

// --- Display QRs ---
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
    chunks.length,
    3 * 1000 // Show metadata QR for 3 seconds
  );

  // Remaining QR codes
  for (let i = 0; i < chunks.length; i++) {
    await displayQR(chunks[i], i + 1, chunks.length, QR_REFRESH_INTERVAL);
  }

  console.log('✅ Done!');
})();
