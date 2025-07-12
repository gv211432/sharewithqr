const qrcode = require('qrcode-terminal');

function displayQR(data, index, total) {
  return new Promise((resolve) => {
    console.clear();
    console.log(`QR ${index}/${total}`);
    qrcode.generate(data, { small: true }, (qr) => {
      console.log(qr);
      setTimeout(resolve, 200); // 1.5s per QR, adjust as needed
    });
  });
}

module.exports = displayQR;
