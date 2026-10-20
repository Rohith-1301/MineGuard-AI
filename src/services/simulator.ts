import { 
  RoverSensors, 
  Worker, 
  Alert, 
  TunnelNode, 
  AIDetectionState, 
  RoverState, 
  WorkerHistoryEntry,
  SystemServiceStatus,
  RiskLevel
} from '../types';

export const INITIAL_ROVER_SENSORS: RoverSensors = {
  methane: {
    value: 0.42,
    unit: '%',
    normalMin: 0,
    normalMax: 1.0,
    warningThreshold: 1.25,
    criticalThreshold: 2.0,
    status: 'NORMAL',
    trend: 0.03,
    history: [
      { time: '13:20', value: 0.38 },
      { time: '13:22', value: 0.40 },
      { time: '13:24', value: 0.41 },
      { time: '13:25', value: 0.42 },
    ],
    lastUpdated: 'Just now'
  },
  carbonMonoxide: {
    value: 1.9,
    unit: '%',
    normalMin: 0,
    normalMax: 5.0,
    warningThreshold: 5.0,
    criticalThreshold: 10.0,
    status: 'NORMAL',
    trend: 0,
    history: [
      { time: '14:15', value: 0.7 },
      { time: '14:16', value: 1.9 },
      { time: '14:17', value: 2.2 },
      { time: '14:18', value: 1.9 },
    ],
    lastUpdated: 'Just now'
  },
  gasSensor: {
    value: 13.6,
    unit: '%',
    normalMin: 0,
    normalMax: 20.0,
    warningThreshold: 25.0,
    criticalThreshold: 40.0,
    status: 'NORMAL',
    trend: 0,
    history: [
      { time: '14:15', value: 15.2 },
      { time: '14:16', value: 13.7 },
      { time: '14:17', value: 13.6 },
      { time: '14:18', value: 13.6 },
    ],
    lastUpdated: 'Just now'
  },
  airQuality: {
    value: 32.6,
    unit: '%',
    normalMin: 0,
    normalMax: 25.0,
    warningThreshold: 25.0,
    criticalThreshold: 50.0,
    status: 'WARNING',
    trend: 0,
    history: [
      { time: '14:15', value: 32.5 },
      { time: '14:16', value: 32.5 },
      { time: '14:17', value: 32.6 },
      { time: '14:18', value: 32.6 },
    ],
    lastUpdated: 'Just now'
  },
  carbonDioxide: {
    value: 610,
    unit: 'ppm',
    normalMin: 350,
    normalMax: 1000,
    warningThreshold: 2000,
    criticalThreshold: 5000,
    status: 'NORMAL',
    trend: 0,
    history: [
      { time: '14:15', value: 605 },
      { time: '14:16', value: 608 },
      { time: '14:17', value: 610 },
      { time: '14:18', value: 610 },
    ],
    lastUpdated: 'Just now'
  },
  oxygen: {
    value: 20.8,
    unit: '%',
    normalMin: 19.5,
    normalMax: 23.5,
    warningThreshold: 19.0,
    criticalThreshold: 18.0,
    status: 'NORMAL',
    trend: 0.0,
    history: [
      { time: '14:15', value: 20.8 },
      { time: '14:16', value: 20.8 },
      { time: '14:17', value: 20.8 },
      { time: '14:18', value: 20.8 },
    ],
    lastUpdated: 'Just now'
  },
  temperature: {
    value: 35.1,
    unit: '°C',
    normalMin: 18,
    normalMax: 32,
    warningThreshold: 35,
    criticalThreshold: 38,
    status: 'WARNING',
    trend: 0.1,
    history: [
      { time: '14:15', value: 35.1 },
      { time: '14:16', value: 35.1 },
      { time: '14:17', value: 35.2 },
      { time: '14:18', value: 35.1 },
    ],
    lastUpdated: 'Just now'
  },
  humidity: {
    value: 40,
    unit: '%',
    normalMin: 40,
    normalMax: 75,
    warningThreshold: 85,
    criticalThreshold: 90,
    status: 'NORMAL',
    trend: 0.0,
    history: [
      { time: '14:15', value: 40 },
      { time: '14:16', value: 40 },
      { time: '14:17', value: 40 },
      { time: '14:18', value: 40 },
    ],
    lastUpdated: 'Just now'
  },
  distance: {
    value: 85,
    unit: 'cm',
    normalMin: 50,
    normalMax: 300,
    warningThreshold: 40,
    criticalThreshold: 20,
    status: 'CLEAR',
    trend: -2,
    history: [
      { time: '15:20', value: 95 },
      { time: '15:22', value: 91 },
      { time: '15:24', value: 89 },
      { time: '15:26', value: 87 },
      { time: '15:28', value: 85 },
    ],
    lastUpdated: 'Just now'
  },
  waterDetected: false,
  timestamp: new Date().toISOString()
};

export const INITIAL_ROVER_STATE: RoverState = {
  status: 'ONLINE',
  location: 'Tunnel B – Section 04 (Hazard Zone)',
  zoneId: 'T-B',
  battery: 78,
  speed: 0.8,
  connection: 'CONNECTED',
  mode: 'REMOTE',
  buzzerActive: false,
  streamUrl: 'http://192.168.43.84:81/stream',
  streamStatus: 'CONNECTED',
  streamSource: 'mjpeg',
  emergencyStop: false,
  wifiRssi: -62,
  latencyMs: 28,
  gpsLocation: {
    latitude: 23.7957,
    longitude: 86.4304,
    altitude: 184,
    accuracyMeters: 2.4,
    heading: 42,
    speedKmh: 2.8,
    lastUpdated: 'Just now'
  }
};

export const INITIAL_AI_DETECTION: AIDetectionState = {
  workerCount: 0,
  personDetected: false,
  workers: [],
  movementStatus: 'UNKNOWN',
  possibleFallDetected: false,
  riskScore: 18,
  riskLevel: 'LOW',
  detectedAnomalies: [],
  recommendedAction: 'Autonomous AI vision active. Monitoring tunnel corridor...',
  lastAnalysisTime: 'Monitoring...',
  cvDebugMode: false,
  fps: 24.0,
  inferenceTimeMs: 12
};

export const INITIAL_WORKERS: Worker[] = [
  {
    id: 'W-001',
    name: 'Rajesh Kumar',
    role: 'Lead Excavation Miner',
    status: 'ACTIVE',
    location: 'Tunnel A – Zone 03',
    zoneId: 'T-A',
    lastUpdate: '10 sec ago',
    lastUpdateSecondsAgo: 10,
    movement: 'NORMAL',
    movementConfidence: 92,
    riskLevel: 'LOW',
    battery: 86,
    environmentalExposure: { methane: 0.42, co: 12, o2: 20.5, temp: 31.5, humidity: 68 },
    vitals: { heartRate: 78, spO2: 98, bodyTemperature: 36.8, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-002',
    name: 'Amit Singh',
    role: 'Drill Machine Operator',
    status: 'WARNING',
    location: 'Tunnel B – Section 04',
    zoneId: 'T-B',
    lastUpdate: '5 sec ago',
    lastUpdateSecondsAgo: 5,
    movement: 'LOW_MOVEMENT',
    movementConfidence: 88,
    riskLevel: 'HIGH',
    battery: 72,
    environmentalExposure: { methane: 1.15, co: 26, o2: 19.2, temp: 33.1, humidity: 74 },
    vitals: { heartRate: 94, spO2: 95, bodyTemperature: 37.2, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-003',
    name: 'Vikram Patel',
    role: 'Blaster & Charge Specialist',
    status: 'ACTIVE',
    location: 'Tunnel A – Face 01',
    zoneId: 'T-A',
    lastUpdate: '12 sec ago',
    lastUpdateSecondsAgo: 12,
    movement: 'NORMAL',
    movementConfidence: 94,
    riskLevel: 'LOW',
    battery: 91,
    environmentalExposure: { methane: 0.38, co: 10, o2: 20.7, temp: 30.8, humidity: 65 },
    vitals: { heartRate: 74, spO2: 99, bodyTemperature: 36.6, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-004',
    name: 'Sunita Soren',
    role: 'Mine Safety & Gas Officer',
    status: 'ACTIVE',
    location: 'Main Adit – Junction 01',
    zoneId: 'J-01',
    lastUpdate: '3 sec ago',
    lastUpdateSecondsAgo: 3,
    movement: 'WALKING',
    movementConfidence: 96,
    riskLevel: 'LOW',
    battery: 95,
    environmentalExposure: { methane: 0.18, co: 6, o2: 20.9, temp: 28.5, humidity: 62 },
    vitals: { heartRate: 82, spO2: 98, bodyTemperature: 36.7, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-005',
    name: 'Mohan Lal Hansda',
    role: 'Roof Bolter & Support Crew',
    status: 'ACTIVE',
    location: 'Tunnel B – Section 02',
    zoneId: 'T-B',
    lastUpdate: '15 sec ago',
    lastUpdateSecondsAgo: 15,
    movement: 'NORMAL',
    movementConfidence: 89,
    riskLevel: 'MODERATE',
    battery: 64,
    environmentalExposure: { methane: 0.85, co: 18, o2: 19.8, temp: 32.2, humidity: 71 },
    vitals: { heartRate: 88, spO2: 97, bodyTemperature: 37.0, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-006',
    name: 'Deepak Sharma',
    role: 'Electrical Foreman',
    status: 'ACTIVE',
    location: 'Substation – Junction 02',
    zoneId: 'J-02',
    lastUpdate: '20 sec ago',
    lastUpdateSecondsAgo: 20,
    movement: 'IDLE',
    movementConfidence: 91,
    riskLevel: 'LOW',
    battery: 88,
    environmentalExposure: { methane: 0.22, co: 8, o2: 20.8, temp: 29.4, humidity: 64 },
    vitals: { heartRate: 70, spO2: 98, bodyTemperature: 36.5, motionDetected: false, sosTriggered: false }
  },
  {
    id: 'W-007',
    name: 'Gopal Mahato',
    role: 'Haulage & Conveyor Tech',
    status: 'ACTIVE',
    location: 'Tunnel C – Ventilation Drift',
    zoneId: 'T-C',
    lastUpdate: '8 sec ago',
    lastUpdateSecondsAgo: 8,
    movement: 'NORMAL',
    movementConfidence: 90,
    riskLevel: 'LOW',
    battery: 80,
    environmentalExposure: { methane: 0.31, co: 11, o2: 20.6, temp: 30.1, humidity: 66 },
    vitals: { heartRate: 76, spO2: 98, bodyTemperature: 36.7, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-008',
    name: 'Ravi Teja',
    role: 'Surveyor & Geotech',
    status: 'ACTIVE',
    location: 'Stope 04 – Drilling Panel',
    zoneId: 'ST-04',
    lastUpdate: '18 sec ago',
    lastUpdateSecondsAgo: 18,
    movement: 'NORMAL',
    movementConfidence: 87,
    riskLevel: 'LOW',
    battery: 79,
    environmentalExposure: { methane: 0.45, co: 14, o2: 20.4, temp: 31.8, humidity: 69 },
    vitals: { heartRate: 80, spO2: 97, bodyTemperature: 36.9, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-009',
    name: 'Arjun Verma',
    role: 'Surface Portal Marshal & Access',
    status: 'ACTIVE',
    location: 'Surface Portal – Zone 00',
    zoneId: 'ENT-00',
    lastUpdate: '2 sec ago',
    lastUpdateSecondsAgo: 2,
    movement: 'WALKING',
    movementConfidence: 97,
    riskLevel: 'LOW',
    battery: 98,
    environmentalExposure: { methane: 0.04, co: 2, o2: 20.9, temp: 24.2, humidity: 55 },
    vitals: { heartRate: 72, spO2: 99, bodyTemperature: 36.5, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-010',
    name: 'Manoj Kumar',
    role: 'Main Haulage Decline Winch Operator',
    status: 'ACTIVE',
    location: 'Main Decline – Level 01',
    zoneId: 'MAIN-01',
    lastUpdate: '14 sec ago',
    lastUpdateSecondsAgo: 14,
    movement: 'NORMAL',
    movementConfidence: 91,
    riskLevel: 'LOW',
    battery: 84,
    environmentalExposure: { methane: 0.12, co: 5, o2: 20.9, temp: 27.8, humidity: 61 },
    vitals: { heartRate: 75, spO2: 98, bodyTemperature: 36.6, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-011',
    name: 'Kavita Devi',
    role: 'Geotechnical Strata Inspector',
    status: 'ACTIVE',
    location: 'Stope 04 – Drilling Panel',
    zoneId: 'ST-04',
    lastUpdate: '7 sec ago',
    lastUpdateSecondsAgo: 7,
    movement: 'NORMAL',
    movementConfidence: 93,
    riskLevel: 'LOW',
    battery: 89,
    environmentalExposure: { methane: 0.42, co: 13, o2: 20.5, temp: 31.6, humidity: 68 },
    vitals: { heartRate: 79, spO2: 98, bodyTemperature: 36.8, motionDetected: true, sosTriggered: false }
  },
  {
    id: 'W-012',
    name: 'Suresh Prasad',
    role: 'High-Voltage Substation Electrician',
    status: 'ACTIVE',
    location: 'Substation – Junction 02',
    zoneId: 'J-02',
    lastUpdate: '11 sec ago',
    lastUpdateSecondsAgo: 11,
    movement: 'IDLE',
    movementConfidence: 89,
    riskLevel: 'LOW',
    battery: 82,
    environmentalExposure: { methane: 0.25, co: 9, o2: 20.7, temp: 29.8, humidity: 63 },
    vitals: { heartRate: 71, spO2: 98, bodyTemperature: 36.6, motionDetected: false, sosTriggered: false }
  }
];

// Additional worker references to simulate full 24 detected workers count
export const TOTAL_DETECTED_WORKERS_COUNT = 24;

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-1092',
    timestamp: '15:24:12',
    location: 'Tunnel B – Section 04',
    zoneId: 'T-B',
    sensorOrEvent: 'Methane Concentration (CH₄)',
    severity: 'WARNING',
    currentValue: '1.15 % (Warning > 1.0 %)',
    recommendedAction: 'Increase local booster ventilation airflow and monitor worker proximity.',
    acknowledged: false
  },
  {
    id: 'ALT-1090',
    timestamp: '15:10:05',
    location: 'Shaft 04 – Level 3 Adit',
    zoneId: 'J-01',
    sensorOrEvent: 'Shift Gas Baseline Calibrated',
    severity: 'INFO',
    currentValue: 'Normal',
    recommendedAction: 'All optical gas sensors verified against reference test cylinder.',
    acknowledged: true,
    acknowledgedBy: 'Operator R. Sharma',
    acknowledgedAt: '15:11:00'
  }
];

export const INITIAL_TUNNELS: TunnelNode[] = [
  {
    id: 'ENT-00',
    name: 'Mine Surface Adit Portal',
    zone: 'Portal Surface',
    type: 'entrance',
    coords: { x: 120, y: 280 },
    connections: ['MAIN-01'],
    status: 'SAFE',
    methane: 0.05,
    co: 2,
    o2: 20.9,
    temp: 26.2,
    workersPresent: ['W-009'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'INBYE',
    airflowVelocity: 3.2,
    depthLevel: 0,
    lengthMeters: 150,
    crossSection: '5.2m × 4.2m Concrete Arch',
    rqdStability: 96,
    humidity: 55,
    dustLevel: 0.8
  },
  {
    id: 'MAIN-01',
    name: 'Main Intake Decline Shaft',
    zone: 'Main Adit',
    type: 'shaft',
    coords: { x: 260, y: 280 },
    connections: ['ENT-00', 'J-01'],
    status: 'SAFE',
    methane: 0.12,
    co: 5,
    o2: 20.9,
    temp: 27.8,
    workersPresent: ['W-010'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'INBYE',
    airflowVelocity: 2.8,
    depthLevel: -80,
    lengthMeters: 220,
    crossSection: '4.8m × 4.0m Decline Drift',
    rqdStability: 92,
    humidity: 61,
    dustLevel: 1.2
  },
  {
    id: 'J-01',
    name: 'Junction 01 (Central Hub)',
    zone: 'Junction 01',
    type: 'junction',
    coords: { x: 420, y: 280 },
    connections: ['MAIN-01', 'T-A', 'T-B', 'T-C'],
    status: 'SAFE',
    methane: 0.20,
    co: 7,
    o2: 20.8,
    temp: 28.5,
    workersPresent: ['W-004'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'SPLIT',
    airflowVelocity: 2.4,
    depthLevel: -140,
    lengthMeters: 45,
    crossSection: '6.0m × 5.0m Quad Junction',
    rqdStability: 90,
    humidity: 63,
    dustLevel: 1.4
  },
  {
    id: 'T-A',
    name: 'Tunnel A (North Extraction)',
    zone: 'Tunnel A',
    type: 'tunnel',
    coords: { x: 580, y: 140 },
    connections: ['J-01', 'ST-04'],
    status: 'SAFE',
    methane: 0.42,
    co: 12,
    o2: 20.5,
    temp: 31.5,
    workersPresent: ['W-001', 'W-003'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'INBYE',
    airflowVelocity: 1.8,
    depthLevel: -180,
    lengthMeters: 310,
    crossSection: '4.5m × 3.8m Arch Drift',
    rqdStability: 88,
    humidity: 68,
    dustLevel: 1.8,
    safeKm: 3.1,
    warningKm: 0.0,
    hazardKm: 0.0
  },
  {
    id: 'T-B',
    name: 'Tunnel B (East Development)',
    zone: 'Tunnel B',
    type: 'tunnel',
    coords: { x: 620, y: 280 },
    connections: ['J-01', 'J-02'],
    status: 'WARNING',
    methane: 1.15,
    co: 26,
    o2: 19.2,
    temp: 33.1,
    workersPresent: ['W-002', 'W-005'],
    hasRover: true,
    blocked: false,
    blockReason: undefined,
    airflowDirection: 'RETURN',
    airflowVelocity: 1.1,
    depthLevel: -180,
    lengthMeters: 280,
    crossSection: '4.5m × 3.8m Haulage Drift',
    rqdStability: 76,
    humidity: 74,
    dustLevel: 2.8,
    safeKm: 2.8,
    warningKm: 0.6,
    hazardKm: 0.4
  },
  {
    id: 'T-C',
    name: 'Tunnel C (South Ventilation Drift)',
    zone: 'Tunnel C',
    type: 'tunnel',
    coords: { x: 560, y: 440 },
    connections: ['J-01', 'REFUGE-01'],
    status: 'SAFE',
    methane: 0.31,
    co: 11,
    o2: 20.6,
    temp: 30.1,
    workersPresent: ['W-007'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'RETURN',
    airflowVelocity: 2.1,
    depthLevel: -180,
    lengthMeters: 260,
    crossSection: '4.2m × 3.6m Vent Drift',
    rqdStability: 89,
    humidity: 66,
    dustLevel: 1.6
  },
  {
    id: 'ST-04',
    name: 'Stope 04 (Drill & Blast Face)',
    zone: 'Stope 04',
    type: 'stope',
    coords: { x: 800, y: 140 },
    connections: ['T-A'],
    status: 'SAFE',
    methane: 0.45,
    co: 14,
    o2: 20.4,
    temp: 31.8,
    workersPresent: ['W-008', 'W-011'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'INBYE',
    airflowVelocity: 1.4,
    depthLevel: -210,
    lengthMeters: 190,
    crossSection: '5.5m × 4.2m Production Stope',
    rqdStability: 78,
    humidity: 69,
    dustLevel: 3.4
  },
  {
    id: 'J-02',
    name: 'Junction 02 (Substation Loop)',
    zone: 'Junction 02',
    type: 'junction',
    coords: { x: 790, y: 280 },
    connections: ['T-B', 'REFUGE-01'],
    status: 'SAFE',
    methane: 0.28,
    co: 9,
    o2: 20.7,
    temp: 29.4,
    workersPresent: ['W-006', 'W-012'],
    hasRover: false,
    blocked: false,
    airflowDirection: 'RETURN',
    airflowVelocity: 1.9,
    depthLevel: -180,
    lengthMeters: 60,
    crossSection: '5.0m × 4.5m Substation Vault',
    rqdStability: 94,
    humidity: 64,
    dustLevel: 1.1
  },
  {
    id: 'REFUGE-01',
    name: 'Pressurized Emergency Refuge Chamber',
    zone: 'Safety Refuge',
    type: 'refuge',
    coords: { x: 750, y: 440 },
    connections: ['T-C', 'J-02'],
    status: 'SAFE',
    methane: 0.08,
    co: 3,
    o2: 21.0,
    temp: 24.5,
    workersPresent: [],
    hasRover: false,
    blocked: false,
    airflowDirection: 'POSITIVE_PRESSURE',
    airflowVelocity: 0.5,
    depthLevel: -180,
    lengthMeters: 35,
    crossSection: '4.0m × 3.5m Airtight Steel Shelter',
    rqdStability: 98,
    humidity: 52,
    dustLevel: 0.2
  }
];

export const INITIAL_SYSTEM_STATUS: SystemServiceStatus = {
  esp32: {
    connected: true,
    ip: '10.234.213.131',
    rssi: -58,
    lastPacket: '0.5s ago'
  },
  camera: {
    connected: true,
    url: 'http://10.234.213.153/',
    fps: 24,
    resolution: '1280x720 (HD)'
  },
  backend: {
    online: true,
    latency: 18,
    uptime: '48h 12m'
  },
  aiEngine: {
    online: true,
    model: 'YOLOv8-MineWorker + PoseFall-v2',
    inferenceTimeMs: 38
  },
  database: {
    online: true,
    records: 489201,
    writeRate: '120 writes/sec'
  },
  websocket: {
    connected: true,
    activeChannels: 4
  },
  lastSensorUpdate: 'Just now',
  lastCameraUpdate: 'Just now'
};

export const INITIAL_WORKER_HISTORY: WorkerHistoryEntry[] = [
  {
    id: 'H-01',
    workerId: 'W-001',
    workerName: 'Rajesh Kumar',
    timestamp: '15:25:00',
    location: 'Tunnel A – Zone 03',
    movement: 'NORMAL',
    methane: 0.42,
    co: 12,
    o2: 20.5,
    temperature: 31.5,
    riskLevel: 'LOW',
    events: 'Inspecting scraper conveyor'
  },
  {
    id: 'H-02',
    workerId: 'W-002',
    workerName: 'Amit Singh',
    timestamp: '15:24:30',
    location: 'Tunnel B – Section 04',
    movement: 'LOW_MOVEMENT',
    methane: 1.15,
    co: 26,
    o2: 19.2,
    temperature: 33.1,
    riskLevel: 'HIGH',
    events: 'Warning: Approaching local methane pocket'
  },
  {
    id: 'H-03',
    workerId: 'W-003',
    workerName: 'Vikram Patel',
    timestamp: '15:23:45',
    location: 'Tunnel A – Face 01',
    movement: 'NORMAL',
    methane: 0.38,
    co: 10,
    o2: 20.7,
    temperature: 30.8,
    riskLevel: 'LOW',
    events: 'Pre-blast safety checks complete'
  },
  {
    id: 'H-04',
    workerId: 'W-004',
    workerName: 'Sunita Soren',
    timestamp: '15:22:10',
    location: 'Main Adit – Junction 01',
    movement: 'WALKING',
    methane: 0.18,
    co: 6,
    o2: 20.9,
    temperature: 28.5,
    riskLevel: 'LOW',
    events: 'Routine safety audit traversal'
  },
  {
    id: 'H-05',
    workerId: 'W-002',
    workerName: 'Amit Singh',
    timestamp: '15:15:00',
    location: 'Tunnel B – Section 03',
    movement: 'NORMAL',
    methane: 0.72,
    co: 18,
    o2: 20.1,
    temperature: 32.0,
    riskLevel: 'MODERATE',
    events: 'Relocating hydraulic jumbo drill'
  }
];

export function calculateMineRiskScore(sensors: RoverSensors, possibleFall: boolean): { score: number; level: RiskLevel } {
  let score = 15; // baseline

  // Methane contribution (critical weight)
  const ch4 = sensors.methane.value;
  if (ch4 > 2.0) score += 45;
  else if (ch4 > 1.25) score += 30;
  else if (ch4 > 0.8) score += 15;
  else if (ch4 > 0.4) score += 5;

  // CO contribution
  const co = sensors.carbonMonoxide.value;
  if (co > 45) score += 25;
  else if (co > 30) score += 15;
  else if (co > 20) score += 8;

  // O2 depletion
  const o2 = sensors.oxygen.value;
  if (o2 < 18.0) score += 35;
  else if (o2 < 19.5) score += 20;

  // Temperature
  const temp = sensors.temperature.value;
  if (temp > 38) score += 15;
  else if (temp > 34) score += 8;

  // Worker fall / immobility event
  if (possibleFall) {
    score += 35;
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, Math.round(score)));

  let level: RiskLevel = 'LOW';
  if (score >= 76) level = 'CRITICAL';
  else if (score >= 51) level = 'HIGH';
  else if (score >= 26) level = 'MODERATE';

  return { score, level };
}
