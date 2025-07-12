const CHUNK_SIZE = 300; // bytes per QR (tweak as needed)

function chunkFile(buffer) {
  const chunks = [];
  const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = buffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    // Metadata: {index}/{total}:{base64}
    const payload = `${i + 1}/${totalChunks}:${chunkData.toString('base64')}`;
    chunks.push(payload);
  }
  return chunks;
}

module.exports = chunkFile;
