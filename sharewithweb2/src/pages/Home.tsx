import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
// @ts-ignore
import { gzip, ungzip } from "pako";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
// @ts-ignore
import { saveAs } from "file-saver";

// ------------------ Utilities ------------------
const chunkFile = (buffer: Uint8Array, size = 300) => {
  const total = Math.ceil(buffer.length / size);
  return Array.from({ length: total }, (_, i) => {
    const slice = buffer.slice(i * size, (i + 1) * size);
    const payload = `${i + 1}/${total}:${btoa(String.fromCharCode(...slice))}`;
    return payload;
  });
};

const base64ToUint8Array = (b64: string): Uint8Array =>
  new Uint8Array([...atob(b64)].map((c) => c.charCodeAt(0)));

// ------------------ Alert Modal ------------------
const CustomAlert = ({ message, onClose }: { message: string; onClose: () => void; }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-xl text-center w-4/5 max-w-sm">
      <p className="text-gray-800 dark:text-gray-100">{message}</p>
      <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-4 py-1 rounded">
        OK
      </button>
    </div>
  </div>
);


const getDecompressedData = (
  chunksRef: React.MutableRefObject<Record<number, string>>,
) => {
  try {
    const base64Data = Object.entries(chunksRef.current)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([, chunk]) => chunk).join('');
    // base64 to blob
    const compressedData = base64ToUint8Array(base64Data);
    // if (!compressedData) throw new Error('Invalid base64 data');

    // const compressedData = Buffer.from(base64Data, 'base64');
    // return ungzip(compressedData);
    return compressedData;
    return base64Data;
  } catch (error) {
    console.error('Decompression error:', error);
    return null; // Handle decompression error    
  }
};

// ------------------ Main Page ------------------
const Home: React.FC = () => {
  const [tab, setTab] = useState<"send" | "receive">("send");

  // Send state
  const [qrs, setQrs] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Receive state
  const [chunksMap, setChunksMap] = useState<Map<number, string>>(new Map());
  const chunkMapRef = useRef<Record<number, string>>({});
  const [chunkMapCount, setChunkMapCount] = useState(0);
  const lastIndexRef = useRef(0);
  const [meta, setMeta] = useState<any>(null);
  const [alertIt, setAlert] = useState<string | null>(null);

  // -------------- QR Send Logic --------------
  const handleFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const compressed = gzip(new Uint8Array(buf));
    const chunks = chunkFile(compressed);

    const metadata = `0/${chunks.length}:${JSON.stringify({
      fileName: file.name,
      compression: "gzip",
    })}`;

    setQrs([metadata, ...chunks]);
    setIndex(0);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1 < chunks.length + 1 ? prev + 1 : 0));
    }, 300);
  };


  useEffect(() => {
    if (chunkMapCount === meta?.total) {
      try {
        const decompressed = getDecompressedData(chunkMapRef);
        if (!decompressed) {
          setAlert("Error: Missing chunks or decompression failed.");
          return;
        }
        const blob = new Blob([decompressed]);
        saveAs(blob, meta?.fileName || "UnknownFile");
        setAlert("🎉 File Downloaded!");
      } catch (error) {
        setAlert("Error processing file: " + error);
        return;
      }
    }
  }, [chunkMapCount]);

  // -------------- QR Receive Logic --------------
  const onScanSuccess = (decoded: string) => {
    // alert("QR Code Scanned: " + decoded);
    const [prefix, data] = RegExp(/^(.*?):(.*)$/).exec(decoded)?.slice(1) || [];
    const [idxStr, totalStr] = prefix.split("/");
    const index = parseInt(idxStr);
    const total = parseInt(totalStr);

    if (isNaN(index) || isNaN(total)) return;

    if (index < 0 || index > total) {
      setAlert("Invalid QR code index");
      return;
    }

    if (index > lastIndexRef.current + 1) {
      setAlert(`Missing QR codes: expected ${lastIndexRef.current + 1} but got ${index}`);
      return;
    }

    if (index === 0) {
      if (!meta) {
        try {
          const json = JSON.parse(data);
          setMeta({ ...json, total });
          chunkMapRef.current = {};
          setChunkMapCount(0);
          // setAlert("Metadata received: " + json.fileName);
        } catch {
          setAlert("Invalid metadata QR");
        }
      }
    } else {
      chunkMapRef.current[index] = data;
      setChunkMapCount(Object.keys(chunkMapRef.current).length);
      lastIndexRef.current = index;
    }
  };

  const onScanError = (err: any) => {
    // Optionally log
  };

  useEffect(() => {
    if (tab === "receive") {

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        // Html5QrcodeSupportedFormats.UPC_A,
        // Html5QrcodeSupportedFormats.UPC_E,
        // Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      ];

      const config = {
        fps: 30,
        qrbox: { width: 350, height: 350 },
        rememberLastUsedCamera: true,
        formatsToSupport: formatsToSupport
      };
      const scanner = new Html5QrcodeScanner("qr-reader", config, false);
      scanner.render(onScanSuccess, onScanError);
      return () => { scanner.clear(); };
    }
  }, [tab]);

  return (
    <div className="flex flex-col h-screen dark:bg-black text-black dark:text-white">

      <div className="relative bg-gray-100 dark:bg-slate-800">

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4">
          {tab === "send" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upload and Share File</h2>
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="w-full"
              />
              {qrs.length > 0 && (
                <div className="flex flex-col items-center">
                  <QRCode value={qrs[index]} size={256} />
                  <p className="text-xs text-gray-400 mt-2">
                    QR {index + 1}/{qrs.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "receive" && (
            <div className="space-y-4">

              <h2
                style={{
                  padding: "0.5rem",
                  fontWeight: "bold",
                  fontSize: "1.25rem",
                  textAlign: "center",
                }}
              >Scan File QR</h2>

              <div style={{ padding: "0.5rem", color: "gray" }}>
                <div id="qr-reader" className=" w-full h-[60vh]" />
              </div>

              <div className="text-sm mt-2">
                <p>
                  Scanned: {chunkMapCount}/{meta?.total || "?"}
                </p>
                <p className="truncate">File: {meta?.fileName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navbar */}
        <nav className="fixed h-[3rem] bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-900 border-t dark:border-gray-700 flex">
          <button
            className={`flex-1 p-3 text-center ${tab === "send" ? "text-blue-500 font-bold" : ""}`}
            onClick={() => setTab("send")}
          >
            📤 Send
          </button>
          <button
            className={`flex-1 p-3 text-center ${tab === "receive" ? "text-blue-500 font-bold" : ""}`}
            onClick={() => setTab("receive")}
          >
            📥 Receive
          </button>
        </nav>

        {/* Alert Modal */}
        {alertIt && <CustomAlert message={alertIt} onClose={() => setAlert(null)} />}
      </div>
    </div>
  );
};

export default Home;
