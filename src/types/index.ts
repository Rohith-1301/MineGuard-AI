export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SafetyStatus = 'SAFE' | 'WARNING' | 'CRITICAL';
export type SystemConnection = 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type MovementState = 
  | 'STANDING'
  | 'WALKING'
  | 'SITTING'
  | 'BENDING'
  | 'FALL DETECTED'
  | 'FALL DOWN'
  | 'NO ACTIVE'
  | 'UNKNOWN'
  | 'NORMAL' 
  | 'LOW_MOVEMENT' 
  | 'NO_MOVEMENT' 
  | 'POSSIBLE_FALL' 
  | 'POSSIBLE_IMMOBILITY' 
  | 'PERSON_DETECTED'
  | 'IDLE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export interface SensorReading {
  value: number;
  unit: string;
  normalMin?: number;
  normalMax?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'CLEAR';
  trend: number; // positive or negative delta
  history: { time: string; value: number }[];
  lastUpdated: string;
}

export interface RoverSensors {
  methane: SensorReading;      // CH4 (%)
  carbonMonoxide: SensorReading; // CO (ppm)
  oxygen: SensorReading;       // O2 (%)
  temperature: SensorReading;  // °C
  humidity: SensorReading;     // %
  distance: SensorReading;     // cm
  waterDetected: boolean;      // Water detection status
  carbonDioxide?: SensorReading; // CO2 (ppm) from MQ-135
  gasSensor?: SensorReading;   // Dedicated Gas Sensor (MQ-2)
  airQuality?: SensorReading;  // Dedicated Air Quality (MQ-135 / AQI)
  mq1Raw?: number;             // Raw ADC from MQ1
  mq2Raw?: number;             // Raw ADC from MQ2
  mq7Raw?: number;             // Raw ADC from MQ7 (CO)
  mq135Raw?: number;           // Raw ADC from MQ135 (CO2)
  hardwareRiskLevel?: string;  // e.g. "DANGER", "NORMAL", "SAFE"
  hardwareRoverState?: string; // e.g. "SEARCH", "IDLE"
  timestamp: string;
}

export interface PoseKeypoint {
  name: 'head' | 'leftShoulder' | 'rightShoulder' | 'leftHip' | 'rightHip' | 'leftKnee' | 'rightKnee' | 'leftAnkle' | 'rightAnkle';
  x: number; // normalized 0..100
  y: number; // normalized 0..100
  confidence: number; // 0..1
}

export interface DetectedWorker {
  id: string;
  trackingId?: string; // e.g. "PERSON 1"
  label: string;
  confidence: number; // 0 - 100
  box: { x: number; y: number; width: number; height: number }; // normalized 0..100
  movement: MovementState;
  movementConfidence: number;
  possibleFall: boolean;
  needsVerification: boolean;
  activity?: MovementState;
  bodyAngle?: number; // degrees from vertical
  aspectRatio?: number; // width / height
  fallConfidence?: number; // 0 - 100
  temporalFallState?: 'UPRIGHT' | 'DESCENT' | 'HORIZONTAL' | 'IMMOBILE' | 'FALL_CONFIRMED';
  keypoints?: PoseKeypoint[];
  lastSeenTimestamp?: number;
}

export interface AIDetectionState {
  workerCount: number;
  personDetected: boolean;
  workers: DetectedWorker[];
  movementStatus: MovementState;
  possibleFallDetected: boolean;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  detectedAnomalies: string[];
  recommendedAction: string;
  lastAnalysisTime: string;
  // Real-time CV pipeline metrics
  cvDebugMode?: boolean;
  fps?: number;
  inferenceTimeMs?: number;
  cvSource?: string;
}

export interface DeviceGpsLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracyMeters?: number;
  heading?: number;
  speedKmh?: number;
  lastUpdated: string;
}

export interface RoverState {
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  location: string;
  zoneId: string;
  battery: number; // 0 - 100
  speed: number;   // m/s
  connection: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  mode: 'REMOTE' | 'AUTO' | 'INSPECTION';
  buzzerActive: boolean;
  streamUrl: string;
  streamStatus: 'CONNECTED' | 'OFFLINE' | 'CONNECTING';
  streamSource: 'mjpeg' | 'webcam' | 'iframe' | 'synthetic' | 'fallback';
  emergencyStop: boolean;
  wifiRssi: number; // dBm
  latencyMs: number;
  gpsLocation?: DeviceGpsLocation;
}

export interface WorkerVitals {
  heartRate: number;      // bpm
  spO2: number;           // % (Physiological blood oxygen)
  bodyTemperature: number;// °C
  motionDetected: boolean;
  sosTriggered: boolean;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'RESTING';
  location: string;
  zoneId: string;
  lastUpdate: string;
  lastUpdateSecondsAgo: number;
  movement: MovementState;
  movementConfidence: number;
  riskLevel: RiskLevel;
  battery: number; // Wearable battery %
  environmentalExposure: {
    methane: number; // %
    co: number;      // ppm
    o2: number;      // %
    temp: number;    // °C
    humidity: number;// %
  };
  vitals?: WorkerVitals;
}

export interface WorkerHistoryEntry {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: string;
  location: string;
  movement: MovementState;
  methane: number;
  co: number;
  o2: number;
  temperature: number;
  riskLevel: RiskLevel;
  events: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  location: string;
  zoneId: string;
  sensorOrEvent: string;
  severity: AlertSeverity;
  currentValue: string;
  recommendedAction: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface TunnelNode {
  id: string;
  name: string;
  zone: string;
  type: 'entrance' | 'shaft' | 'tunnel' | 'junction' | 'stope' | 'refuge';
  coords: { x: number; y: number }; // coordinate on schematic (0-1000, 0-600)
  connections: string[];
  status: SafetyStatus;
  methane: number;
  co: number;
  o2: number;
  temp: number;
  workersPresent: string[]; // Worker IDs
  hasRover: boolean;
  blocked: boolean;
  blockReason?: string;
  airflowDirection?: string;
  airflowVelocity?: number; // m/s
  depthLevel?: number;      // meters below surface (e.g. 180)
  lengthMeters?: number;    // meters (e.g. 280)
  crossSection?: string;    // e.g. "4.5m × 3.8m Arch"
  rqdStability?: number;    // percentage (e.g. 86)
  humidity?: number;        // percentage (e.g. 74)
  dustLevel?: number;       // mg/m3 (e.g. 2.1)
  safeKm?: number;
  warningKm?: number;
  hazardKm?: number;
}

export interface TunnelRoute {
  id: string;
  start: string;
  destination: string;
  path: string[];
  status: 'CLEAR' | 'BLOCKED' | 'CAUTION';
  reason?: string;
}

export interface SystemServiceStatus {
  esp32: { connected: boolean; ip: string; rssi: number; lastPacket: string };
  camera: { connected: boolean; url: string; fps: number; resolution: string };
  backend: { online: boolean; latency: number; uptime: string };
  aiEngine: { online: boolean; model: string; inferenceTimeMs: number };
  database: { online: boolean; records: number; writeRate: string };
  websocket: { connected: boolean; activeChannels: number };
  lastSensorUpdate: string;
  lastCameraUpdate: string;
}

export interface SensorApiPayload {
  roverId?: string;
  methane?: number;
  co?: number;
  oxygen?: number;
  temperature?: number;
  humidity?: number;
  distance?: number;
  waterDetected?: boolean;
  timestamp?: string;

  // Direct ESP32 hardware endpoint keys
  gas?: number;
  gas_sensor?: number;
  gassensor?: number;
  air_quality?: number;
  airquality?: number;
  aqi?: number;
  temp?: number;
  hum?: number;
  temperature_c?: number;
  humidity_pct?: number;
  mq1_raw?: number;
  mq2_raw?: number;
  mq7?: number;
  mq7_raw?: number;
  mq135?: number;
  mq135_raw?: number;
  co2?: number;
  co2_ppm?: number;
  co_ppm?: number;
  co_unit?: string;
  gas_unit?: string;
  air_unit?: string;
  distance_cm?: number;
  risk_level?: string;
  rover_state?: string;
  [key: string]: unknown;
}

export interface RoverCommandPayload {
  command: 'START' | 'STOP' | 'FORWARD' | 'BACKWARD' | 'LEFT' | 'RIGHT' | 'BUZZER_ON' | 'BUZZER_OFF' | 'EMERGENCY_STOP';
  timestamp?: string;
  source?: string;
}

export interface MineTopology {
  sector: string;
  sectorName: string;
  level: number;
  grid: string;
  locations: TunnelNode[];
}

export interface MineSensorPacket {
  device_id: string; // e.g. "MINE-SENSOR-01"
  timestamp: string;
  tunnel_id: string; // e.g. "T-B"
  co: number;
  co2: number;
  mq2: number;
  temperature: number;
  humidity: number;
}

export interface RoverTelemetryPacket {
  device_id: string; // e.g. "ROVER-04"
  tunnel_id: string; // e.g. "T-B"
  latitude: number;
  longitude: number;
  speed: number;
  status: 'rescue' | 'active' | 'standby';
}

