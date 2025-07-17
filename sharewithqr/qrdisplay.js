const qrcode = require('qrcode-terminal');

let startTime = null;
let processedCount = 0;

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}

function displayQR(data, index, total, interval = 1000) {
  return new Promise((resolve) => {
    const now = Date.now();

    if (index === 1) {
      startTime = now;
      processedCount = 0;
    }

    processedCount++;

    let estimatedTime = '';
    if (processedCount > 1) {
      const elapsed = now - startTime;
      const avgPerQR = elapsed / processedCount;
      const remaining = (total - index) * avgPerQR;
      estimatedTime = ` ~ ETA: ${formatTime(remaining)}`;
    }

    console.clear();
    console.log(`QR ${index}/${total}${estimatedTime}`);

    qrcode.generate(data, { small: true }, (qr) => {
      console.log(qr);
      setTimeout(resolve, interval);
    });
  });
}

module.exports = displayQR;
