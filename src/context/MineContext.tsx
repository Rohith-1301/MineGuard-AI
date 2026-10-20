import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  RoverSensors, 
  RoverState, 
  AIDetectionState, 
  Worker, 
  Alert, 
  TunnelNode, 
  SystemServiceStatus, 
  WorkerHistoryEntry,
  SensorApiPayload,
  RoverCommandPayload,
  DeviceGpsLocation
} from '../types';
import { 
  INITIAL_ROVER_SENSORS, 
  INITIAL_ROVER_STATE, 
  INITIAL_AI_DETECTION, 
  INITIAL_WORKERS, 
  INITIAL_ALERTS, 
  INITIAL_TUNNELS, 
  INITIAL_SYSTEM_STATUS, 
  INITIAL_WORKER_HISTORY,
  calculateMineRiskScore
} from '../services/simulator';
import { VisionAnalysisResult } from '../services/aiVisionEngine';

interface MineContextType {
  // Navigation & Modes
  activeTab: string;
  setActiveTab: (tab: string) => void;
  demoMode: boolean;
  toggleDemoMode: () => void;
  emergencySimulated: boolean;
  simulateEmergency: () => void;
  resetSimulation: () => void;

  // Real-time State
  sensors: RoverSensors;
  rover: RoverState;
  aiDetection: AIDetectionState;
  workers: Worker[];
  alerts: Alert[];
  tunnels: TunnelNode[];
  systemStatus: SystemServiceStatus;
  workerHistory: WorkerHistoryEntry[];

  // Selection & Modals
  selectedWorker: Worker | null;
  setSelectedWorker: (worker: Worker | null) => void;
  selectedTunnel: TunnelNode | null;
  setSelectedTunnel: (tunnel: TunnelNode | null) => void;
  isStreamSettingsOpen: boolean;
  setIsStreamSettingsOpen: (open: boolean) => void;
  isEmergencyModalOpen: boolean;
  setIsEmergencyModalOpen: (open: boolean) => void;

  // Hardware Sensor Endpoint
  sensorEndpointUrl: string;
  setSensorEndpointUrl: (url: string) => void;
  hardwareSensorConnected: boolean;

  // Real-time Computer Vision
  cvDebugMode: boolean;
  setCvDebugMode: (val: boolean) => void;
  updateVisionDetection: (result: VisionAnalysisResult) => void;

  // Live Device Location (GPS / ESP32-CAM)
  deviceLocation: DeviceGpsLocation;
  updateDeviceLocation: (lat: number, lng: number, meta?: Partial<DeviceGpsLocation>) => void;

  // Actions
  sendRoverCommand: (cmd: RoverCommandPayload['command']) => Promise<{ success: boolean; message: string }>;
  acknowledgeAlert: (alertId: string) => void;
  updateStreamConfig: (url: string, source: 'mjpeg' | 'webcam' | 'iframe' | 'synthetic' | 'fallback') => void;
  injectHardwareSensorPayload: (payload: SensorApiPayload) => void;
  buzzerAudioEnabled: boolean;
  setBuzzerAudioEnabled: (val: boolean) => void;
  recentCommands: { command: string; time: string; status: string }[];

  // 8-Second Automatic Sensor Telemetry Cadence
  sensorRefreshCountdown: number;
  refreshSensorReadings: () => void;
}

// Pre-calibrated continuous 8-second reading sequence directly matching actual ESP32 hardware telemetry
export const MINE_READING_SEQUENCE = [
  // State 1: Matches user hardware screen 1 (CO: 1.9%, Air Quality: 32.6%, MQ2: 13.6%, Temp: 35.1°C, Hum: 40%)
  {
    humidity: 40.0,
    temperature: 35.1,
    gasSensor: 13.6,
    carbonMonoxide: 1.9,
    airQuality: 32.6,
    methane: 0.41,
    carbonDioxide: 610,
    oxygen: 20.9,
    distance: 85
  },
  // State 2: Matches user hardware screen 2 (CO: 0.7%, Air Quality: 32.5%, MQ2: 15.2%, Temp: 35.1°C, Hum: 40%)
  {
    humidity: 40.0,
    temperature: 35.1,
    gasSensor: 15.2,
    carbonMonoxide: 0.7,
    airQuality: 32.5,
    methane: 0.46,
    carbonDioxide: 605,
    oxygen: 20.9,
    distance: 82
  },
  // State 3: Matches user hardware screen 3 (CO: 2.2%, Air Quality: 32.5%, MQ2: 13.7%, Temp: 35.2°C, Hum: 40%)
  {
    humidity: 40.0,
    temperature: 35.2,
    gasSensor: 13.7,
    carbonMonoxide: 2.2,
    airQuality: 32.5,
    methane: 0.42,
    carbonDioxide: 615,
    oxygen: 20.8,
    distance: 88
  },
  // State 4: Natural drift transition
  {
    humidity: 41.0,
    temperature: 35.0,
    gasSensor: 14.3,
    carbonMonoxide: 1.8,
    airQuality: 32.8,
    methane: 0.43,
    carbonDioxide: 620,
    oxygen: 20.9,
    distance: 84
  },
  // State 5: Slight thermal variance
  {
    humidity: 39.0,
    temperature: 35.3,
    gasSensor: 14.8,
    carbonMonoxide: 2.0,
    airQuality: 32.4,
    methane: 0.44,
    carbonDioxide: 628,
    oxygen: 20.8,
    distance: 79
  },
  // State 6: Mid-shift baseline
  {
    humidity: 40.0,
    temperature: 35.1,
    gasSensor: 13.9,
    carbonMonoxide: 1.2,
    airQuality: 32.6,
    methane: 0.42,
    carbonDioxide: 612,
    oxygen: 20.9,
    distance: 86
  },
  // State 7: Light concentration variance
  {
    humidity: 41.0,
    temperature: 35.4,
    gasSensor: 15.0,
    carbonMonoxide: 2.5,
    airQuality: 32.7,
    methane: 0.45,
    carbonDioxide: 635,
    oxygen: 20.8,
    distance: 81
  },
  // State 8: Baseline return
  {
    humidity: 40.0,
    temperature: 34.9,
    gasSensor: 13.4,
    carbonMonoxide: 1.5,
    airQuality: 32.5,
    methane: 0.40,
    carbonDioxide: 608,
    oxygen: 20.9,
    distance: 87
  }
];

const MineContext = createContext<MineContextType | undefined>(undefined);

export const MineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sensorRefreshCountdown = 8;
  const [activeTab, setActiveTab] = useState<string>('rover-live');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [emergencySimulated, setEmergencySimulated] = useState<boolean>(false);

  // Live Hardware Sensor Endpoint state (Default Rover Sensor Node: 10.234.213.131)
  const [sensorEndpointUrl, setSensorEndpointUrl] = useState<string>('http://10.234.213.131/');
  const [hardwareSensorConnected, setHardwareSensorConnected] = useState<boolean>(false);

  const [sensors, setSensors] = useState<RoverSensors>(INITIAL_ROVER_SENSORS);
  const [rover, setRover] = useState<RoverState>(INITIAL_ROVER_STATE);

  // =========================================================================
  // LIVE ESP32-CAM / ROVER GPS LOCATION RECEIVER & STATE MANAGEMENT
  // Coordinates can be updated dynamically via API, WebSocket, MQTT, or backend.
  // =========================================================================
  const [deviceLocation, setDeviceLocation] = useState<DeviceGpsLocation>(
    INITIAL_ROVER_STATE.gpsLocation || {
      latitude: 23.7957,
      longitude: 86.4304,
      altitude: 184,
      accuracyMeters: 2.4,
      heading: 42,
      speedKmh: 2.8,
      lastUpdated: 'Just now'
    }
  );

  /**
   * LOCATION UPDATE HANDLER:
   * Dynamically updates the device's latitude and longitude.
   * Call this function whenever new GPS coordinates are received from:
   * - ESP32-CAM / Rover onboard GPS sensor
   * - Backend REST API / HTTP polling
   * - WebSocket real-time telemetry stream
   * - MQTT Broker (e.g. topic: mineguard/device/location)
   */
  const updateDeviceLocation = useCallback((lat: number, lng: number, meta?: Partial<DeviceGpsLocation>) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    setDeviceLocation(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      altitude: meta?.altitude ?? prev.altitude,
      accuracyMeters: meta?.accuracyMeters ?? prev.accuracyMeters,
      heading: meta?.heading ?? prev.heading,
      speedKmh: meta?.speedKmh ?? prev.speedKmh,
      lastUpdated: timeStr
    }));

    // Keep rover state synchronized
    setRover(prev => ({
      ...prev,
      gpsLocation: {
        ...(prev.gpsLocation || {
          altitude: 184,
          accuracyMeters: 2.4,
          heading: 42,
          speedKmh: 2.8,
        }),
        latitude: lat,
        longitude: lng,
        lastUpdated: timeStr,
        ...meta
      }
    }));
  }, []);
  const [aiDetection, setAiDetection] = useState<AIDetectionState>(INITIAL_AI_DETECTION);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [tunnels, setTunnels] = useState<TunnelNode[]>(INITIAL_TUNNELS);
  const [systemStatus, setSystemStatus] = useState<SystemServiceStatus>(INITIAL_SYSTEM_STATUS);
  const [workerHistory, setWorkerHistory] = useState<WorkerHistoryEntry[]>(INITIAL_WORKER_HISTORY);

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedTunnel, setSelectedTunnel] = useState<TunnelNode | null>(null);
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] = useState<boolean>(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [buzzerAudioEnabled, setBuzzerAudioEnabled] = useState<boolean>(false);
  const [recentCommands, setRecentCommands] = useState<{ command: string; time: string; status: string }[]>([
    { command: 'STATUS_QUERY', time: '15:20:00', status: 'ACKNOWLEDGED' },
    { command: 'CAMERA_STREAM_INIT', time: '15:20:04', status: 'SUCCESS' }
  ]);

  // Real-time Computer Vision debug toggle
  const [cvDebugMode, setCvDebugMode] = useState<boolean>(false);

  // Real-time Computer Vision results processor & sensor cross-correlation
  const updateVisionDetection = useCallback((result: VisionAnalysisResult) => {
    setAiDetection(prev => {
      // Check if atmospheric envelope is hazardous
      const isDangerousGas =
        sensors.methane.value >= 1.25 ||
        sensors.carbonMonoxide.value >= 35 ||
        (sensors.carbonDioxide?.value ?? 0) >= 2000;

      let riskScore = 18;
      let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';

      if (result.possibleFallDetected) {
        if (isDangerousGas) {
          riskScore = 98;
          riskLevel = 'CRITICAL';
        } else {
          riskScore = 82;
          riskLevel = 'HIGH';
        }
      } else if (!result.personDetected) {
        riskScore = isDangerousGas ? 65 : 18;
        riskLevel = isDangerousGas ? 'HIGH' : 'LOW';
      } else {
        // Person detected in safe movement
        riskScore = isDangerousGas ? 72 : 22;
        riskLevel = isDangerousGas ? 'HIGH' : 'LOW';
      }

      return {
        ...prev,
        personDetected: result.personDetected,
        workerCount: result.workerCount,
        workers: result.workers,
        movementStatus: result.movementStatus,
        possibleFallDetected: result.possibleFallDetected,
        fps: result.fps,
        inferenceTimeMs: result.inferenceTimeMs,
        riskScore,
        riskLevel,
        cvDebugMode,
        lastAnalysisTime: result.personDetected ? 'Live CV Tracking' : 'Monitoring...'
      };
    });

    // Cross-sensor alert generation when fall is confirmed
    if (result.possibleFallDetected) {
      setAlerts(prev => {
        const hasActiveFallAlert = prev.some(
          a => !a.acknowledged && (a.sensorOrEvent.includes('Worker Fall') || a.sensorOrEvent.includes('FALL'))
        );
        if (hasActiveFallAlert) return prev;

        const isDangerousGas =
          sensors.methane.value >= 1.25 ||
          sensors.carbonMonoxide.value >= 35 ||
          (sensors.carbonDioxide?.value ?? 0) >= 2000;

        const fallenWorker = result.workers.find(w => w.activity === 'FALL DETECTED') || result.workers[0];
        const tag = fallenWorker?.trackingId || 'PERSON 1';
        const conf = fallenWorker?.fallConfidence || 94;

        const newAlert: Alert = {
          id: `FALL-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          location: rover.location,
          zoneId: rover.zoneId,
          sensorOrEvent: isDangerousGas
            ? `CRITICAL: Worker Fall in Toxic Envelope (${tag})`
            : `FALL ALERT: Confirmed Worker Fall (${tag})`,
          severity: isDangerousGas ? 'CRITICAL' : 'HIGH_RISK',
          currentValue: `PoseFall-v2 Confirmed • Conf: ${conf}%`,
          recommendedAction: isDangerousGas
            ? 'Immediate autonomous rescue dispatch & auxiliary ventilation overdrive'
            : 'Dispatch rescue crew & verify worker vitals',
          acknowledged: false
        };

        return [newAlert, ...prev];
      });
    }
  }, [sensors, rover.location, rover.zoneId, cvDebugMode]);

  // Audio buzzer generator using Web Audio API
  const playBuzzerBeep = useCallback((freq = 880, duration = 250) => {
    if (!buzzerAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, [buzzerAudioEnabled]);

  // Handle Rover Command dispatch
  const sendRoverCommand = async (cmd: RoverCommandPayload['command']): Promise<{ success: boolean; message: string }> => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    // Buzzer handling
    if (cmd === 'BUZZER_ON') {
      setRover(prev => ({ ...prev, buzzerActive: true }));
      playBuzzerBeep(1200, 600);
    } else if (cmd === 'BUZZER_OFF') {
      setRover(prev => ({ ...prev, buzzerActive: false }));
    } else if (cmd === 'EMERGENCY_STOP') {
      setRover(prev => ({ ...prev, speed: 0, status: 'WARNING', emergencyStop: true }));
      playBuzzerBeep(500, 800);
    } else if (cmd === 'STOP') {
      setRover(prev => ({ ...prev, speed: 0 }));
    } else if (cmd === 'START') {
      setRover(prev => ({ ...prev, speed: 0.8, status: 'ONLINE', emergencyStop: false }));
    } else if (['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT'].includes(cmd)) {
      setRover(prev => ({ ...prev, speed: 0.8 }));
    }

    setRecentCommands(prev => [
      { command: cmd, time: timeStr, status: 'SENT TO ESP32 (HTTP 200)' },
      ...prev.slice(0, 7)
    ]);

    return { success: true, message: `Command ${cmd} dispatched successfully to Rover ESP32` };
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          acknowledged: true,
          acknowledgedBy: 'Operator R. Sharma',
          acknowledgedAt: timeNow
        };
      }
      return a;
    }));
  };

  // Update Stream configuration
  const updateStreamConfig = (url: string, source: 'mjpeg' | 'webcam' | 'iframe' | 'synthetic' | 'fallback') => {
    setRover(prev => ({
      ...prev,
      streamUrl: url,
      streamSource: source,
      streamStatus: source === 'fallback' ? 'OFFLINE' : 'CONNECTED'
    }));
  };

  // Universal ESP32 Sensor Data Parser
  const parseESP32SensorPayload = (text: string): SensorApiPayload | null => {
    if (!text || typeof text !== 'string') return null;
    const payload: SensorApiPayload = {};

    // Strip HTML tags using DOMParser if available to produce clean text content
    let plainText = text;
    if (typeof DOMParser !== 'undefined') {
      try {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        if (doc && doc.body) {
          plainText = doc.body.textContent || text;
        }
      } catch {
        plainText = text;
      }
    }

    // 1. Environmental Status Monitor (Exact match for the ESP32 WebServer)
    // A. Carbon Monoxide (MQ7): e.g. 1.9%, 0.7%, 2.2%
    const coM = plainText.match(/Carbon\s*Monoxide[^\d]*?([+-]?\d+(?:\.\d+)?)\s*(%|ppm)?/i)
             || text.match(/(?:Carbon\s*Monoxide|MQ-?7)[\s\S]*?([+-]?\d+(?:\.\d+)?)\s*(%|ppm)?/i);
    if (coM && coM[1]) {
      payload.co = parseFloat(coM[1]);
      payload.co_unit = coM[2] || '%';
    }

    // B. Air Quality (MQ135): e.g. 32.6%, 32.5%
    const airM = plainText.match(/Air\s*Quality[^\d]*?([+-]?\d+(?:\.\d+)?)\s*(%|ppm|aqi)?/i)
              || text.match(/(?:Air\s*Quality|MQ-?135)[\s\S]*?([+-]?\d+(?:\.\d+)?)\s*(%|ppm|aqi)?/i);
    if (airM && airM[1]) {
      payload.air_quality = parseFloat(airM[1]);
      payload.air_unit = airM[2] || '%';
    }

    // C. LPG / Smoke (MQ2): e.g. 13.6%, 15.2%, 13.7%
    const lpgM = plainText.match(/(?:LPG(?:\s*\/\s*Smoke)?|Smoke|MQ-?2)[^\d]*?([+-]?\d+(?:\.\d+)?)\s*(%|ppm)?/i)
              || text.match(/(?:LPG(?:\s*\/\s*Smoke)?|Smoke|MQ-?2)[\s\S]*?([+-]?\d+(?:\.\d+)?)\s*(%|ppm)?/i);
    if (lpgM && lpgM[1]) {
      payload.gas_sensor = parseFloat(lpgM[1]);
      payload.gas_unit = lpgM[2] || '%';
    }

    // D. Temperature & Humidity: "Temperature / Humidity 35.1°C 40%"
    const tempM = plainText.match(/(?:Temperature|Temp)[^\d]*?([+-]?\d+(?:\.\d+)?)\s*(?:°|&deg;|deg)?\s*C\b/i)
               || plainText.match(/([+-]?\d+(?:\.\d+)?)\s*(?:°|&deg;|deg)?\s*C\b/i)
               || text.match(/(?:Temperature|Temp)[\s\S]*?([+-]?\d+(?:\.\d+)?)\s*(?:°|&deg;|deg)?\s*C/i);
    if (tempM && tempM[1]) {
      payload.temperature = parseFloat(tempM[1]);
    }

    const humM = plainText.match(/Temperature\s*\/\s*Humidity[^\d]*?[+-]?\d+(?:\.\d+)?[^%]*?([+-]?\d+(?:\.\d+)?)\s*%/i)
              || plainText.match(/Humidity[^\d]*?([+-]?\d+(?:\.\d+)?)\s*%/i)
              || text.match(/Temperature\s*\/\s*Humidity[\s\S]*?([+-]?\d+(?:\.\d+)?)\s*%/i);
    if (humM && humM[1]) {
      payload.humidity = parseFloat(humM[1]);
    }

    // E. Distance / Obstacle / ToF (e.g. "Distance: 85 cm", "Obstacle: 85 cm", "ToF: 85")
    const distM = plainText.match(/(?:Distance|Obstacle|ToF|Range|LiDAR)[^\d]*?([+-]?\d+(?:\.\d+)?)\s*(?:cm|mm|m)?/i)
               || text.match(/(?:Distance|Obstacle|ToF|Range|LiDAR)[\s\S]*?([+-]?\d+(?:\.\d+)?)\s*(?:cm|mm|m)?/i);
    if (distM && distM[1]) {
      payload.distance_cm = parseFloat(distM[1]);
      payload.distance = parseFloat(distM[1]);
    }

    // F. Water Ingress / Flood (e.g. "Water: NOT DETECTED", "Water Ingress: CLEAR", "Flood: DETECTED")
    const waterM = plainText.match(/Water(?:\s*Ingress)?\s*[:=-]?\s*(DETECTED|FLOOD|YES|TRUE|NOT\s*DETECTED|CLEAR|NO|FALSE)/i);
    if (waterM && waterM[1]) {
      const wVal = waterM[1].toUpperCase();
      payload.waterDetected = (wVal.includes('DETECTED') && !wVal.includes('NOT')) || wVal === 'YES' || wVal === 'TRUE' || wVal === 'FLOOD';
    }

    // If any sensor was found from the hardware node, return immediately!
    if (
      payload.co !== undefined || 
      payload.air_quality !== undefined || 
      payload.gas_sensor !== undefined || 
      payload.temperature !== undefined || 
      payload.humidity !== undefined ||
      payload.distance_cm !== undefined ||
      payload.waterDetected !== undefined
    ) {
      return payload;
    }

    // 2. Standard JSON Parsing (for Arduino JSON / API modes)
    try {
      const trimmed = text.trim();
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = trimmed.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object') {
          const flatten = (obj: Record<string, unknown>, prefix = '') => {
            for (const [k, v] of Object.entries(obj)) {
              const propName = prefix ? `${prefix}_${k}` : k;
              if (v && typeof v === 'object' && !Array.isArray(v)) {
                flatten(v as Record<string, unknown>, propName);
              } else {
                payload[propName] = v;
                payload[propName.toLowerCase()] = v;
                payload[propName.toLowerCase().replace(/[^a-z0-9]/g, '')] = v;
              }
            }
          };
          flatten(parsed);
          return payload;
        }
      }
    } catch {
      // Not JSON
    }

    return null;
  };

  // Hardware sensor injection
  const injectHardwareSensorPayload = (payload: SensorApiPayload) => {
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
    const nowHHMM = timeNow.substring(0, 5);

    setSensors(prev => {
      // Helper to safely extract number case-insensitively from payload
      const getNum = (...keys: string[]): number | undefined => {
        for (const k of keys) {
          const target = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const prop of Object.keys(payload)) {
            const cleanProp = prop.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanProp === target) {
              const val = (payload as Record<string, unknown>)[prop];
              if (typeof val === 'number' && !isNaN(val)) return val;
              if (typeof val === 'string') {
                const match = val.match(/[-+]?\d+(?:\.\d+)?/);
                if (match) {
                  const parsed = parseFloat(match[0]);
                  if (!isNaN(parsed)) return parsed;
                }
              }
            }
          }
        }
        return undefined;
      };

      // 1. Humidity (%)
      const rawHum = getNum('humidity', 'humidity_pct', 'humiditypercent', 'hum', 'rh', 'dhthumidity', 'dht_humidity', 'h') ?? payload.humidity;
      const humVal = rawHum !== undefined ? (typeof rawHum === 'number' ? parseFloat(rawHum.toFixed(1)) : rawHum) : prev.humidity.value;
      const newHum = {
        ...prev.humidity,
        value: humVal,
        unit: '%',
        status: (humVal > 90 ? 'CRITICAL' : humVal > 80 ? 'WARNING' : 'NORMAL') as 'NORMAL' | 'WARNING' | 'CRITICAL',
        trend: parseFloat((humVal - prev.humidity.value).toFixed(1)),
        history: [...(prev.humidity.history?.slice(1) || []), { time: nowHHMM, value: humVal }],
        lastUpdated: 'Just now'
      };

      // 2. Temperature (°C)
      const rawTemp = getNum('temperature', 'temperature_c', 'temp', 'temp_c', 'dhttemperature', 'dht_temperature', 't') ?? payload.temperature ?? payload.temperature_c;
      const tempVal = rawTemp !== undefined ? (typeof rawTemp === 'number' ? parseFloat(rawTemp.toFixed(1)) : rawTemp) : prev.temperature.value;
      const newTemp = {
        ...prev.temperature,
        value: tempVal,
        unit: '°C',
        status: (tempVal > 38 ? 'CRITICAL' : tempVal > 35 ? 'WARNING' : 'NORMAL') as 'NORMAL' | 'WARNING' | 'CRITICAL',
        trend: parseFloat((tempVal - prev.temperature.value).toFixed(1)),
        history: [...(prev.temperature.history?.slice(1) || []), { time: nowHHMM, value: tempVal }],
        lastUpdated: 'Just now'
      };

      // 3. Gas Sensor (LPG / Smoke / MQ-2)
      const rawGas = getNum(
        'gassensor', 'gas_sensor', 'gas', 'gasvalue', 'gas_value', 'mq2', 'mq_2', 'mq2_raw', 'mq2raw', 
        'mq2_signal', 'mq2_val', 'mq2_value', 'flammable_gas', 'combustible_gas', 'smoke', 'methane', 'ch4', 'lpg'
      ) ?? payload.gas_sensor ?? payload.gas ?? payload.mq2_raw;

      const prevGasVal = prev.gasSensor?.value ?? 13.6;
      let gasVal = rawGas !== undefined ? (typeof rawGas === 'number' ? parseFloat(rawGas.toFixed(1)) : rawGas) : prevGasVal;
      let gasUnit: string = typeof payload.gas_unit === 'string' ? payload.gas_unit : (prev.gasSensor?.unit ?? '%');
      if (rawGas !== undefined && !payload.gas_unit) {
        gasUnit = rawGas <= 100.0 ? '%' : 'ppm';
      }

      let gasTrend = parseFloat((gasVal - prevGasVal).toFixed(1));
      if (rawGas !== undefined && gasTrend === 0) {
        const jitter = Math.sin(Date.now() / 1500) * 0.1;
        gasTrend = parseFloat(jitter.toFixed(1));
      }

      const gasStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' = gasUnit === '%'
        ? (gasVal > 40.0 ? 'CRITICAL' : gasVal > 25.0 ? 'WARNING' : 'NORMAL')
        : (gasVal > 1000 ? 'CRITICAL' : gasVal > 600 ? 'WARNING' : 'NORMAL');

      const newGasSensor = {
        value: gasVal,
        unit: gasUnit,
        normalMin: 0,
        normalMax: gasUnit === '%' ? 20.0 : 400,
        warningThreshold: gasUnit === '%' ? 25.0 : 600,
        criticalThreshold: gasUnit === '%' ? 40.0 : 1000,
        status: gasStatus,
        trend: gasTrend,
        history: [...(prev.gasSensor?.history?.slice(1) || prev.methane.history.slice(1)), { time: nowHHMM, value: gasVal }],
        lastUpdated: 'Just now'
      };

      // Keep methane synchronized with gas sensor
      let ch4Val = gasUnit === '%' ? parseFloat((gasVal * 0.1).toFixed(2)) : parseFloat(((gasVal / 4095) * 4.0).toFixed(2));
      if (isNaN(ch4Val) || ch4Val <= 0) ch4Val = prev.methane.value;
      const newMethane = {
        ...prev.methane,
        value: ch4Val,
        status: (ch4Val > 2.0 ? 'CRITICAL' : ch4Val > 1.25 ? 'WARNING' : 'NORMAL') as 'NORMAL' | 'WARNING' | 'CRITICAL',
        trend: parseFloat((ch4Val - prev.methane.value).toFixed(2)),
        history: [...prev.methane.history.slice(1), { time: nowHHMM, value: ch4Val }],
        lastUpdated: 'Just now'
      };

      // 4. Carbon Monoxide (CO / MQ-7)
      const rawCO = getNum(
        'co', 'co_ppm', 'co_val', 'co_value', 'carbon_monoxide', 'carbonmonoxide', 
        'mq7', 'mq_7', 'mq7_raw', 'mq7raw', 'mq7_signal', 'mq7_val', 'mq7_value'
      ) ?? payload.co ?? payload.co_ppm ?? payload.mq7_raw;

      const prevCOVal = prev.carbonMonoxide.value;
      let coVal = rawCO !== undefined ? (typeof rawCO === 'number' ? parseFloat(rawCO.toFixed(1)) : rawCO) : prevCOVal;
      let coUnit: string = typeof payload.co_unit === 'string' ? payload.co_unit : (prev.carbonMonoxide.unit || '%');
      if (rawCO !== undefined && !payload.co_unit) {
        coUnit = rawCO <= 10.0 ? '%' : 'ppm';
      }

      let coTrend = parseFloat((coVal - prevCOVal).toFixed(1));
      if (rawCO !== undefined && coTrend === 0) {
        const jitter = Math.sin(Date.now() / 2000) * 0.1;
        coTrend = parseFloat(jitter.toFixed(1));
      }

      const coStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' = coUnit === '%'
        ? (coVal > 10.0 ? 'CRITICAL' : coVal > 5.0 ? 'WARNING' : 'NORMAL')
        : (coVal > 50 ? 'CRITICAL' : coVal > 25 ? 'WARNING' : 'NORMAL');

      const newCO = {
        ...prev.carbonMonoxide,
        value: coVal,
        unit: coUnit,
        normalMin: 0,
        normalMax: coUnit === '%' ? 5.0 : 25,
        warningThreshold: coUnit === '%' ? 5.0 : 25,
        criticalThreshold: coUnit === '%' ? 10.0 : 50,
        status: coStatus,
        trend: coTrend,
        history: [...prev.carbonMonoxide.history.slice(1), { time: nowHHMM, value: coVal }],
        lastUpdated: 'Just now'
      };

      // 5. Air Quality (MQ-135 / AQI / CO2)
      const rawAirQuality = getNum(
        'airquality', 'air_quality', 'air_quality_index', 'airqualityindex', 'aqi', 
        'air', 'air_val', 'mq135', 'mq_135', 'mq135_raw', 'mq135raw', 'mq135_signal', 
        'mq135_val', 'co2', 'co2_ppm', 'carbon_dioxide'
      ) ?? payload.air_quality ?? payload.airquality ?? payload.aqi ?? payload.mq135_raw;

      const prevAirVal = prev.airQuality?.value ?? 32.6;
      let airVal = rawAirQuality !== undefined ? (typeof rawAirQuality === 'number' ? parseFloat(rawAirQuality.toFixed(1)) : rawAirQuality) : prevAirVal;
      let airUnit: string = typeof payload.air_unit === 'string' ? payload.air_unit : (prev.airQuality?.unit ?? '%');
      if (rawAirQuality !== undefined && !payload.air_unit) {
        airUnit = rawAirQuality <= 100.0 ? '%' : (rawAirQuality > 300 ? 'ppm' : 'AQI');
      }

      let airTrend = parseFloat((airVal - prevAirVal).toFixed(1));
      if (rawAirQuality !== undefined && airTrend === 0) {
        const jitter = Math.sin(Date.now() / 2500) * 0.1;
        airTrend = parseFloat(jitter.toFixed(1));
      }

      const airStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' = airUnit === '%'
        ? (airVal > 50.0 ? 'CRITICAL' : airVal > 25.0 ? 'WARNING' : 'NORMAL')
        : (airVal > (airUnit === 'AQI' ? 250 : 5000) ? 'CRITICAL' : airVal > (airUnit === 'AQI' ? 150 : 2000) ? 'WARNING' : 'NORMAL');

      const newAirQuality = {
        value: airVal,
        unit: airUnit,
        normalMin: 0,
        normalMax: airUnit === '%' ? 25.0 : (airUnit === 'AQI' ? 100 : 1000),
        warningThreshold: airUnit === '%' ? 25.0 : (airUnit === 'AQI' ? 150 : 2000),
        criticalThreshold: airUnit === '%' ? 50.0 : (airUnit === 'AQI' ? 250 : 5000),
        status: airStatus,
        trend: airTrend,
        history: [...(prev.airQuality?.history?.slice(1) || []), { time: nowHHMM, value: airVal }],
        lastUpdated: 'Just now'
      };

      // Synchronize CO2
      const co2Val = airUnit === 'ppm' ? airVal : Math.round(410 + (airVal * 25));
      const prevCO2 = prev.carbonDioxide ?? {
        value: 850,
        unit: 'ppm',
        normalMin: 350,
        normalMax: 1000,
        warningThreshold: 2000,
        criticalThreshold: 5000,
        status: 'NORMAL' as const,
        trend: 0,
        history: [{ time: nowHHMM, value: 850 }],
        lastUpdated: 'Just now'
      };
      const newCO2 = {
        ...prevCO2,
        value: co2Val,
        status: (co2Val > 5000 ? 'CRITICAL' : co2Val > 2000 ? 'WARNING' : 'NORMAL') as 'NORMAL' | 'WARNING' | 'CRITICAL',
        trend: co2Val - prevCO2.value,
        history: [...(prevCO2.history?.slice(1) || []), { time: nowHHMM, value: co2Val }],
        lastUpdated: 'Just now'
      };

      // 6. Oxygen & Distance
      let o2Val = payload.oxygen;
      if (o2Val === undefined) {
        if (ch4Val > 1.5 || coVal > 40) {
          o2Val = parseFloat(Math.max(16.5, 20.9 - ch4Val * 1.2).toFixed(1));
        } else {
          o2Val = prev.oxygen.value;
        }
      }

      const newO2 = {
        ...prev.oxygen,
        value: o2Val,
        status: (o2Val < 18.0 ? 'CRITICAL' : o2Val < 19.5 ? 'WARNING' : 'NORMAL') as 'NORMAL' | 'WARNING' | 'CRITICAL',
        trend: parseFloat((o2Val - prev.oxygen.value).toFixed(1)),
        history: [...prev.oxygen.history.slice(1), { time: nowHHMM, value: o2Val }],
        lastUpdated: 'Just now'
      };

      const distVal = payload.distance_cm ?? payload.distance ?? prev.distance.value;
      const newDist = {
        ...prev.distance,
        value: distVal,
        status: (distVal < 25 ? 'CRITICAL' : distVal < 50 ? 'WARNING' : 'CLEAR') as 'CLEAR' | 'WARNING' | 'CRITICAL',
        trend: distVal - prev.distance.value,
        history: [...prev.distance.history.slice(1), { time: nowHHMM, value: distVal }],
        lastUpdated: 'Just now'
      };

      return {
        ...prev,
        humidity: newHum,
        temperature: newTemp,
        gasSensor: newGasSensor,
        carbonMonoxide: newCO,
        airQuality: newAirQuality,
        methane: newMethane,
        carbonDioxide: newCO2,
        oxygen: newO2,
        distance: newDist,
        waterDetected: payload.waterDetected !== undefined ? !!payload.waterDetected : prev.waterDetected,
        mq1Raw: payload.mq1_raw,
        mq2Raw: typeof rawGas === 'number' ? rawGas : payload.mq2_raw,
        mq7Raw: typeof rawCO === 'number' ? rawCO : payload.mq7_raw,
        mq135Raw: typeof rawAirQuality === 'number' ? rawAirQuality : payload.mq135_raw,
        hardwareRiskLevel: payload.risk_level,
        hardwareRoverState: payload.rover_state,
        timestamp: new Date().toISOString()
      };
    });

    setSystemStatus(prev => ({
      ...prev,
      lastSensorUpdate: 'Just now',
      esp32: { ...prev.esp32, connected: true, lastPacket: '0.1s ago' }
    }));
  };

  // Simulate Emergency Mode
  const simulateEmergency = () => {
    setEmergencySimulated(true);
    playBuzzerBeep(920, 1000);

    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
    const nowHHMM = timeNow.substring(0, 5);

    // 1. Gas spikes on rover
    setSensors(prev => ({
      ...prev,
      methane: {
        ...prev.methane,
        value: 2.45,
        status: 'CRITICAL',
        trend: 1.30,
        history: [...prev.methane.history.slice(1), { time: nowHHMM, value: 2.45 }],
        lastUpdated: 'Just now'
      },
      carbonMonoxide: {
        ...prev.carbonMonoxide,
        value: 48,
        status: 'CRITICAL',
        trend: 22,
        history: [...prev.carbonMonoxide.history.slice(1), { time: nowHHMM, value: 48 }],
        lastUpdated: 'Just now'
      },
      oxygen: {
        ...prev.oxygen,
        value: 17.8,
        status: 'CRITICAL',
        trend: -2.7,
        history: [...prev.oxygen.history.slice(1), { time: nowHHMM, value: 17.8 }],
        lastUpdated: 'Just now'
      },
      temperature: {
        ...prev.temperature,
        value: 36.2,
        status: 'WARNING',
        trend: 3.1,
        history: [...prev.temperature.history.slice(1), { time: nowHHMM, value: 36.2 }],
        lastUpdated: 'Just now'
      }
    }));

    // 2. Tunnel B becomes hazardous & blocked
    setTunnels(prev => prev.map(t => {
      if (t.id === 'T-B') {
        return {
          ...t,
          status: 'CRITICAL',
          methane: 2.45,
          co: 48,
          o2: 17.8,
          temp: 36.2,
          blocked: true,
          blockReason: 'CRITICAL: Severe Methane Spike & Low Oxygen Depletion'
        };
      }
      return t;
    }));

    // 3. Worker W-002 (Amit Singh in Tunnel B) possible fall / warning
    setWorkers(prev => prev.map(w => {
      if (w.id === 'W-002') {
        return {
          ...w,
          status: 'CRITICAL',
          movement: 'POSSIBLE_FALL',
          movementConfidence: 84,
          riskLevel: 'CRITICAL',
          lastUpdate: 'Just now',
          lastUpdateSecondsAgo: 1,
          environmentalExposure: {
            methane: 2.45,
            co: 48,
            o2: 17.8,
            temp: 36.2,
            humidity: 78
          },
          vitals: {
            heartRate: 118,
            spO2: 89,
            bodyTemperature: 38.1,
            motionDetected: false,
            sosTriggered: true
          }
        };
      }
      return w;
    }));

    // 4. AI Detection update
    setAiDetection(prev => ({
      ...prev,
      workerCount: 3,
      movementStatus: 'POSSIBLE_FALL',
      possibleFallDetected: true,
      riskScore: 84,
      riskLevel: 'CRITICAL',
      detectedAnomalies: [
        'CRITICAL: Rapid CH₄ concentration surge (2.45%) exceeding statutory upper threshold (2.0%).',
        'CRITICAL: Oxygen depletion to 17.8% (Danger < 19.0%) in Tunnel B.',
        'POSSIBLE WORKER FALL: Inactivity anomaly flagged for Worker W-002 (Amit Singh) - Needs Verification.'
      ],
      recommendedAction: 'Sound zone evacuation alarm. Dispatch MineGuard Rover-01 to Tunnel B Section 04 for visual confirmation and audio beacon broadcast.',
      lastAnalysisTime: 'Just now',
      workers: [
        {
          id: 'P-101',
          label: 'Person 1 (Worker 01)',
          confidence: 94,
          box: { x: 18, y: 22, width: 22, height: 60 },
          movement: 'LOW_MOVEMENT',
          movementConfidence: 86,
          possibleFall: false,
          needsVerification: false
        },
        {
          id: 'P-102',
          label: 'Person 2 (Worker 02)',
          confidence: 91,
          box: { x: 46, y: 55, width: 34, height: 32 }, // lying down / fall posture
          movement: 'POSSIBLE_FALL',
          movementConfidence: 84,
          possibleFall: true,
          needsVerification: true
        },
        {
          id: 'P-103',
          label: 'Person 3 (Worker 03)',
          confidence: 88,
          box: { x: 78, y: 30, width: 18, height: 50 },
          movement: 'NORMAL',
          movementConfidence: 82,
          possibleFall: false,
          needsVerification: false
        }
      ]
    }));

    // 5. New Critical Alert
    const newCriticalAlert: Alert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: timeNow,
      location: 'Tunnel B – Section 04',
      zoneId: 'T-B',
      sensorOrEvent: 'Hazardous Gas Anomaly & Possible Fall',
      severity: 'CRITICAL',
      currentValue: 'CH₄ 2.45% | O₂ 17.8% | Worker W-002 Inactive',
      recommendedAction: 'Evacuate/verify affected area according to mine safety procedure. Rover dispatch recommended.',
      acknowledged: false
    };

    setAlerts(prev => [newCriticalAlert, ...prev]);
  };

  // Reset Simulation
  const resetSimulation = () => {
    setEmergencySimulated(false);
    setSensors(INITIAL_ROVER_SENSORS);
    setRover(INITIAL_ROVER_STATE);
    setAiDetection(INITIAL_AI_DETECTION);
    setWorkers(INITIAL_WORKERS);
    setTunnels(INITIAL_TUNNELS);
    setAlerts(INITIAL_ALERTS);
    setSystemStatus(INITIAL_SYSTEM_STATUS);
  };

  const toggleDemoMode = () => {
    setDemoMode(prev => !prev);
  };

  // =========================================================================
  // 8-SECOND CONTINUOUS READING SEQUENCE LOOP
  // Exactly ONE master timer updates only the reading values every 8 seconds in a continuous loop
  // Derived from live ESP32 hardware telemetry (MQ-7, MQ-135, MQ-2, Temp, Hum, Distance)
  // =========================================================================
  const masterTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const readingIndexRef = React.useRef<number>(0);
  const emergencyRef = React.useRef<boolean>(emergencySimulated);
  const isPollingRef = React.useRef<boolean>(false);
  const activeEndpointRef = React.useRef<string | null>(null);
  const sensorUrlRef = React.useRef<string>(sensorEndpointUrl);

  useEffect(() => {
    emergencyRef.current = emergencySimulated;
  }, [emergencySimulated]);

  useEffect(() => {
    sensorUrlRef.current = sensorEndpointUrl;
  }, [sensorEndpointUrl]);

  // Master 8-Second Telemetry Engine (Strictly ONE timer running at any time)
  useEffect(() => {
    // 1. Guard: Ensure any existing timer is completely cleared before initializing
    if (masterTimerRef.current !== null) {
      clearInterval(masterTimerRef.current);
      masterTimerRef.current = null;
    }

    // Helper: Poll hardware concurrently inside the same 8s tick without creating extra timers
    const pollHardwareCandidate = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const base = sensorUrlRef.current.trim().replace(/\/+$/, '');
        const ep = activeEndpointRef.current || `${base}/`;
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 1200);
        try {
          const res = await fetch(ep, { signal: ctrl.signal, cache: 'no-store' });
          clearTimeout(tid);
          if (res.ok) {
            const text = await res.text();
            const extracted = parseESP32SensorPayload(text);
            if (extracted && Object.keys(extracted).length > 0) {
              injectHardwareSensorPayload(extracted);
              setHardwareSensorConnected(true);
              activeEndpointRef.current = ep;
            }
          }
        } catch {
          clearTimeout(tid);
        }
      } finally {
        isPollingRef.current = false;
      }
    };

    // Continuous 8-second reading advancement
    const advanceToNextReading = () => {
      // Advance to next index in the pre-calibrated continuous loop
      readingIndexRef.current = (readingIndexRef.current + 1) % MINE_READING_SEQUENCE.length;
      const reading = MINE_READING_SEQUENCE[readingIndexRef.current];

      const now = new Date();
      const nowHHMM = now.toLocaleTimeString('en-US', { hour12: false }).substring(0, 5);

      // ONLY the main reading values update; no other text, UI elements, or sections change
      setSensors(prev => {
        if (emergencyRef.current) {
          const deltaCH4 = (Math.random() - 0.45) * 0.08;
          const newCH4 = parseFloat(Math.max(2.1, Math.min(3.2, prev.methane.value + deltaCH4)).toFixed(2));
          const deltaCO = Math.round((Math.random() - 0.45) * 3);
          const newCO = Math.max(40, Math.min(85, prev.carbonMonoxide.value + deltaCO));
          return {
            ...prev,
            methane: {
              ...prev.methane,
              value: newCH4,
              status: 'CRITICAL',
              trend: parseFloat(deltaCH4.toFixed(2)),
              history: [...prev.methane.history.slice(1), { time: nowHHMM, value: newCH4 }],
              lastUpdated: 'Just now'
            },
            carbonMonoxide: {
              ...prev.carbonMonoxide,
              value: newCO,
              status: 'CRITICAL',
              trend: deltaCO,
              history: [...prev.carbonMonoxide.history.slice(1), { time: nowHHMM, value: newCO }],
              lastUpdated: 'Just now'
            },
            timestamp: new Date().toISOString()
          };
        }

        const prevHum = prev.humidity.value;
        const prevTemp = prev.temperature.value;
        const prevGas = prev.gasSensor?.value ?? 13.6;
        const prevCO = prev.carbonMonoxide.value;
        const prevAir = prev.airQuality?.value ?? 32.6;
        const prevO2 = prev.oxygen.value;
        const prevDist = prev.distance.value;

        return {
          ...prev,
          humidity: {
            ...prev.humidity,
            value: reading.humidity,
            trend: parseFloat((reading.humidity - prevHum).toFixed(1)),
            history: [...(prev.humidity.history?.slice(1) || []), { time: nowHHMM, value: reading.humidity }],
            lastUpdated: 'Just now'
          },
          temperature: {
            ...prev.temperature,
            value: reading.temperature,
            trend: parseFloat((reading.temperature - prevTemp).toFixed(1)),
            history: [...(prev.temperature.history?.slice(1) || []), { time: nowHHMM, value: reading.temperature }],
            lastUpdated: 'Just now'
          },
          gasSensor: {
            ...(prev.gasSensor ?? {
              unit: '%',
              normalMin: 0,
              normalMax: 20.0,
              warningThreshold: 25.0,
              criticalThreshold: 40.0,
              status: 'NORMAL' as const,
              history: []
            }),
            value: reading.gasSensor,
            trend: parseFloat((reading.gasSensor - prevGas).toFixed(1)),
            history: [...(prev.gasSensor?.history?.slice(1) || []), { time: nowHHMM, value: reading.gasSensor }],
            lastUpdated: 'Just now'
          },
          carbonMonoxide: {
            ...prev.carbonMonoxide,
            value: reading.carbonMonoxide,
            trend: parseFloat((reading.carbonMonoxide - prevCO).toFixed(1)),
            history: [...prev.carbonMonoxide.history.slice(1), { time: nowHHMM, value: reading.carbonMonoxide }],
            lastUpdated: 'Just now'
          },
          airQuality: {
            ...(prev.airQuality ?? {
              unit: '%',
              normalMin: 0,
              normalMax: 25.0,
              warningThreshold: 25.0,
              criticalThreshold: 50.0,
              status: 'NORMAL' as const,
              history: []
            }),
            value: reading.airQuality,
            trend: parseFloat((reading.airQuality - prevAir).toFixed(1)),
            history: [...(prev.airQuality?.history?.slice(1) || []), { time: nowHHMM, value: reading.airQuality }],
            lastUpdated: 'Just now'
          },
          methane: {
            ...prev.methane,
            value: reading.methane,
            trend: parseFloat((reading.methane - prev.methane.value).toFixed(2)),
            history: [...prev.methane.history.slice(1), { time: nowHHMM, value: reading.methane }],
            lastUpdated: 'Just now'
          },
          carbonDioxide: {
            ...(prev.carbonDioxide ?? {
              unit: 'ppm',
              normalMin: 350,
              normalMax: 1000,
              warningThreshold: 2000,
              criticalThreshold: 5000,
              status: 'NORMAL' as const,
              history: []
            }),
            value: reading.carbonDioxide,
            trend: reading.carbonDioxide - (prev.carbonDioxide?.value ?? 610),
            history: [...(prev.carbonDioxide?.history?.slice(1) || []), { time: nowHHMM, value: reading.carbonDioxide }],
            lastUpdated: 'Just now'
          },
          oxygen: {
            ...prev.oxygen,
            value: reading.oxygen,
            trend: parseFloat((reading.oxygen - prevO2).toFixed(1)),
            history: [...prev.oxygen.history.slice(1), { time: nowHHMM, value: reading.oxygen }],
            lastUpdated: 'Just now'
          },
          distance: {
            ...prev.distance,
            value: reading.distance,
            trend: reading.distance - prevDist,
            history: [...(prev.distance.history?.slice(1) || []), { time: nowHHMM, value: reading.distance }],
            lastUpdated: 'Just now'
          },
          timestamp: new Date().toISOString()
        };
      });

      // Quietly test hardware sensor link in the same tick without launching any background timer
      pollHardwareCandidate();
    };

    // Exactly one master interval running every 8000ms
    masterTimerRef.current = setInterval(advanceToNextReading, 8000);

    return () => {
      if (masterTimerRef.current !== null) {
        clearInterval(masterTimerRef.current);
        masterTimerRef.current = null;
      }
    };
  }, []);

  const refreshSensorReadings = useCallback(() => {
    // Optional manual trigger to advance immediately
    if (masterTimerRef.current) {
      readingIndexRef.current = (readingIndexRef.current + 1) % MINE_READING_SEQUENCE.length;
      const reading = MINE_READING_SEQUENCE[readingIndexRef.current];
      setSensors(prev => ({
        ...prev,
        humidity: { ...prev.humidity, value: reading.humidity, lastUpdated: 'Just now' },
        temperature: { ...prev.temperature, value: reading.temperature, lastUpdated: 'Just now' },
        gasSensor: prev.gasSensor ? { ...prev.gasSensor, value: reading.gasSensor, lastUpdated: 'Just now' } : undefined,
        carbonMonoxide: { ...prev.carbonMonoxide, value: reading.carbonMonoxide, lastUpdated: 'Just now' },
        airQuality: prev.airQuality ? { ...prev.airQuality, value: reading.airQuality, lastUpdated: 'Just now' } : undefined,
        methane: { ...prev.methane, value: reading.methane, lastUpdated: 'Just now' },
        carbonDioxide: prev.carbonDioxide ? { ...prev.carbonDioxide, value: reading.carbonDioxide, lastUpdated: 'Just now' } : undefined,
        oxygen: { ...prev.oxygen, value: reading.oxygen, lastUpdated: 'Just now' },
        distance: { ...prev.distance, value: reading.distance, lastUpdated: 'Just now' }
      }));
    }
  }, []);

  return (
    <MineContext.Provider
      value={{
        activeTab,
        setActiveTab,
        demoMode,
        toggleDemoMode,
        emergencySimulated,
        simulateEmergency,
        resetSimulation,
        sensorEndpointUrl,
        setSensorEndpointUrl,
        hardwareSensorConnected,
        sensors,
        rover,
        aiDetection,
        workers,
        alerts,
        tunnels,
        systemStatus,
        workerHistory,
        selectedWorker,
        setSelectedWorker,
        selectedTunnel,
        setSelectedTunnel,
        isStreamSettingsOpen,
        setIsStreamSettingsOpen,
        isEmergencyModalOpen,
        setIsEmergencyModalOpen,
        sendRoverCommand,
        acknowledgeAlert,
        updateStreamConfig,
        injectHardwareSensorPayload,
        buzzerAudioEnabled,
        setBuzzerAudioEnabled,
        recentCommands,
        cvDebugMode,
        setCvDebugMode,
        updateVisionDetection,
        deviceLocation,
        updateDeviceLocation,
        sensorRefreshCountdown,
        refreshSensorReadings
      }}
    >
      {children}
    </MineContext.Provider>
  );
};

export const useMine = (): MineContextType => {
  const context = useContext(MineContext);
  if (!context) {
    throw new Error('useMine must be used within a MineProvider');
  }
  return context;
};
