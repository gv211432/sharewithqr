const CHUNK_SIZE_DEFALUT = 300; // bytes per QR (tweak as needed)

function chunkFile(buffer, chunkSize = CHUNK_SIZE_DEFALUT) {
  const chunks = [];
  const totalChunks = Math.ceil(buffer.length / chunkSize);
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
    // Metadata: {index}/{total}:{base64}
    const payload = `${i + 1}/${totalChunks}:${chunkData.toString('base64')}`;
    chunks.push(payload);
  }
  return chunks;
}

module.exports = chunkFile;
