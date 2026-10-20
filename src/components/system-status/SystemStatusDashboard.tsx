import React, { useState } from 'react';
import { 
  Cpu, 
  Server, 
  Wifi, 
  Video, 
  Database, 
  Radio, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Code2, 
  Send, 
  FileCode, 
  Layers, 
  Zap,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { StatusIndicator } from '../common/StatusIndicator';
import { SensorApiPayload } from '../../types';

export const SystemStatusDashboard: React.FC = () => {
  const { systemStatus, sensors, rover, injectHardwareSensorPayload } = useMine();

  // Interactive Hardware API Sandbox State
  const [testPayload, setTestPayload] = useState<SensorApiPayload>({
    roverId: 'ROVER-01',
    methane: 0.85,
    co: 18,
    oxygen: 20.1,
    temperature: 32.4,
    humidity: 71,
    distance: 62,
    waterDetected: false,
    timestamp: new Date().toISOString()
  });

  const [injectSuccess, setInjectSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleInject = () => {
    injectHardwareSensorPayload(testPayload);
    setInjectSuccess(true);
    setTimeout(() => setInjectSuccess(false), 2000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleArduinoCode = `// MineGuard AI - ESP32 Telemetry Transmitter (Arduino C++)
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "MINE_MESH_AP_04";
const char* password = "UNDERGROUND_PASS";
const char* serverUrl = "http://192.168.1.50:8000/api/sensors";

void sendSensorData() {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["roverId"] = "ROVER-01";
    doc["methane"] = readMethaneMQ4();      // %
    doc["co"] = readCarbonMonoxideMQ7();    // ppm
    doc["oxygen"] = readOxygenOpt();        // %
    doc["temperature"] = readDHT22Temp();   // °C
    doc["humidity"] = readDHT22Hum();       // %
    doc["distance"] = readToFLiDAR();       // cm
    doc["waterDetected"] = digitalRead(WATER_PIN);

    String payload;
    serializeJson(doc, payload);
    int httpResponseCode = http.POST(payload);
    http.end();
  }
}`;

  const samplePythonAiCode = `# MineGuard AI - Computer Vision & Anomaly Inference Service (Python)
import cv2
from ultralytics import YOLO
import requests

model = YOLO("yolov8n-pose.pt")  # MineWorker posture model

def process_rover_frame(frame):
    results = model(frame)
    detected_workers = []
    possible_fall = False

    for r in results:
        boxes = r.boxes
        for box in boxes:
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            if cls == 0 and conf > 0.70:  # Person class
                # Analyze aspect ratio & keypoints for fall posture
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                aspect = (x2 - x1) / max(1, (y2 - y1))
                if aspect > 1.2:  # Horizontal posture
                    possible_fall = True

    # Post AI results to MineGuard backend
    requests.post("http://localhost:8000/api/ai/telemetry", json={
        "worker_count": len(detected_workers),
        "person_detected": len(detected_workers) > 0,
        "possible_fall": possible_fall,
        "risk_level": "CRITICAL" if possible_fall else "LOW"
    })`;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-mine-cyan" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              SYSTEM STATUS & HARDWARE INTEGRATION
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-mine-cyan">
              INFRASTRUCTURE HEALTH
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Component link health, real-time data freshness, REST/WebSocket specifications & hardware injection testbench
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusIndicator status="ONLINE" label="ALL SYSTEMS NOMINAL" />
        </div>
      </div>

      {/* 20. System Component Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ESP32 Telemetry */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono space-y-2 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>ESP32 MICROCONTROLLER</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              CONNECTED
            </span>
          </div>
          <div className="text-slate-400 text-[11px] space-y-1">
            <div>IP Address: <strong className="text-white">{systemStatus.esp32.ip}</strong></div>
            <div>Wi-Fi RSSI: <strong className="text-cyan-400">{systemStatus.esp32.rssi} dBm</strong></div>
            <div>Last Telemetry Packet: <strong className="text-white">{systemStatus.esp32.lastPacket}</strong></div>
          </div>
        </div>

        {/* Rover Video Camera */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono space-y-2 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>ESP32-CAM / IP FEED</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              CONNECTED
            </span>
          </div>
          <div className="text-slate-400 text-[11px] space-y-1">
            <div>Resolution: <strong className="text-white">{systemStatus.camera.resolution}</strong></div>
            <div>Frame Rate: <strong className="text-emerald-400">{systemStatus.camera.fps} FPS</strong></div>
            <div>Stream Endpoint: <code className="text-cyan-400 truncate block">{rover.streamUrl}</code></div>
          </div>
        </div>

        {/* Backend API Service */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono space-y-2 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>BACKEND API SERVER</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              ONLINE
            </span>
          </div>
          <div className="text-slate-400 text-[11px] space-y-1">
            <div>Latency: <strong className="text-emerald-400">{systemStatus.backend.latency} ms</strong></div>
            <div>Uptime: <strong className="text-white">{systemStatus.backend.uptime}</strong></div>
            <div>Protocol: <strong className="text-white">HTTP/2 + WebSocket</strong></div>
          </div>
        </div>

        {/* AI Inference Engine */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono space-y-2 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>AI INFERENCE ENGINE</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              ONLINE
            </span>
          </div>
          <div className="text-slate-400 text-[11px] space-y-1">
            <div>Model: <strong className="text-white">{systemStatus.aiEngine.model}</strong></div>
            <div>Inference Time: <strong className="text-cyan-400">{systemStatus.aiEngine.inferenceTimeMs} ms</strong></div>
            <div>Posture Classifier: <strong className="text-emerald-400">Active</strong></div>
          </div>
        </div>

        {/* Subterranean Database */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono space-y-2 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>TIMESERIES DATABASE</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              ONLINE
            </span>
          </div>
          <div className="text-slate-400 text-[11px] space-y-1">
            <div>Historical Records: <strong className="text-white">{systemStatus.database.records.toLocaleString()}</strong></div>
            <div>Throughput: <strong className="text-white">{systemStatus.database.writeRate}</strong></div>
            <div>Storage Engine: <strong className="text-cyan-400">IndexedDB + SQLite</strong></div>
          </div>
        </div>

        {/* WebSocket Real-time Bus */}
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono space-y-2 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>WEBSOCKET REAL-TIME BUS</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              CONNECTED
            </span>
          </div>
          <div className="text-slate-400 text-[11px] space-y-1">
            <div>Active Channels: <strong className="text-white">{systemStatus.websocket.activeChannels} (Sensors, Vision, Rover, Alerts)</strong></div>
            <div>Last Update: <strong className="text-emerald-400">{sensors.methane.lastUpdated}</strong></div>
            <div>Staleness Monitor: <strong className="text-emerald-400">Fresh (0 Delay)</strong></div>
          </div>
        </div>
      </div>

      {/* 21. Hardware Integration Architecture & Interactive Testbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Live API Testbench (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl bg-mine-card border border-mine-border p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-mine-cyan" />
              <h3 className="text-sm font-bold font-mono text-white">
                HARDWARE SENSOR INGESTION SANDBOX
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              POST /api/sensors
            </span>
          </div>

          <p className="text-xs font-mono text-slate-400">
            Inject realistic sensor telemetry directly into the live dashboard to test real-time rendering without page reload:
          </p>

          {/* Form Fields */}
          <div className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Methane CH₄ (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={testPayload.methane}
                  onChange={(e) => setTestPayload({ ...testPayload, methane: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CO (ppm)</label>
                <input
                  type="number"
                  value={testPayload.co}
                  onChange={(e) => setTestPayload({ ...testPayload, co: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Oxygen O₂ (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testPayload.oxygen}
                  onChange={(e) => setTestPayload({ ...testPayload, oxygen: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={testPayload.temperature}
                  onChange={(e) => setTestPayload({ ...testPayload, temperature: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Obstacle Dist (cm)</label>
                <input
                  type="number"
                  value={testPayload.distance}
                  onChange={(e) => setTestPayload({ ...testPayload, distance: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Water Detected</label>
                <select
                  value={testPayload.waterDetected ? 'true' : 'false'}
                  onChange={(e) => setTestPayload({ ...testPayload, waterDetected: e.target.value === 'true' })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-400"
                >
                  <option value="false">Clear (No Water)</option>
                  <option value="true">Water Detected</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleInject}
              className="w-full py-2.5 rounded-lg bg-mine-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {injectSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Payload Ingested Successfully!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Payload to /api/sensors</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hardware & AI Code Templates for SIH Team (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl bg-mine-card border border-mine-border p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-mine-cyan" />
              <h3 className="text-sm font-bold font-mono text-white">
                HARDWARE INTEGRATION CODE SPECIFICATION
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ESP32 & Python AI
            </span>
          </div>

          <div className="space-y-4">
            {/* ESP32 Arduino snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-bold flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  ESP32 Arduino C++ Firmware Template:
                </span>
                <button
                  onClick={() => copyToClipboard(sampleArduinoCode, 'arduino')}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedCode === 'arduino' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'arduino' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-black/80 border border-slate-800 text-[10px] font-mono text-cyan-300/90 overflow-x-auto max-h-36">
                {sampleArduinoCode}
              </pre>
            </div>

            {/* Python AI Service snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Python YOLO Worker Detection & Fall Classifier:
                </span>
                <button
                  onClick={() => copyToClipboard(samplePythonAiCode, 'python')}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedCode === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'python' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-black/80 border border-slate-800 text-[10px] font-mono text-amber-300/90 overflow-x-auto max-h-36">
                {samplePythonAiCode}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
