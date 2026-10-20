import { MineSensorPacket, RoverTelemetryPacket } from '../types';

/**
 * ============================================================================
 * ESP32 DUAL HARDWARE INTEGRATION SERVICE
 * ============================================================================
 * Provides dedicated data handlers for the two separate ESP32 microcontrollers:
 * 
 * 1. ESP32 #1: AUTONOMOUS ROVER
 *    Ingests:
 *    - Rover tunnel location (canonical tunnel_id, e.g. "T-B")
 *    - Surface/Decline GPS coordinates (latitude, longitude)
 *    - Speed & driving status ("rescue" | "active" | "standby")
 *    - Telemetry stream status
 * 
 * 2. ESP32 #2: FIXED MINE ENVIRONMENTAL SENSOR HUB
 *    Ingests:
 *    - Tunnel sector location (canonical tunnel_id, e.g. "T-B")
 *    - Toxic Carbon Monoxide (CO ppm via MQ-7)
 *    - Carbon Dioxide (CO2 ppm via MQ-135)
 *    - Flammable gas & methane (MQ-2 / CH4 %)
 *    - Ambient dry bulb temperature (°C) & relative humidity (%)
 */

export interface ESP32DeviceListeners {
  onMineSensorData?: (packet: MineSensorPacket) => void;
  onRoverTelemetry?: (packet: RoverTelemetryPacket) => void;
}

class ESP32Service {
  private listeners: ESP32DeviceListeners = {};

  public registerListeners(listeners: ESP32DeviceListeners) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * Handler for ESP32 #2 (Fixed Mine Sensor Hub)
   * Expected format:
   * {
   *   "device_id": "MINE-SENSOR-01",
   *   "timestamp": "2026-09-25T15:28:00Z",
   *   "tunnel_id": "T-B",
   *   "co": 12,
   *   "co2": 850,
   *   "mq2": 0.42,
   *   "temperature": 31.5,
   *   "humidity": 62
   * }
   */
  public ingestMineSensorPayload(payload: MineSensorPacket) {
    if (this.listeners.onMineSensorData) {
      this.listeners.onMineSensorData(payload);
    }
  }

  /**
   * Handler for ESP32 #1 (Rover ESP32-CAM)
   * Expected format:
   * {
   *   "device_id": "ROVER-04",
   *   "tunnel_id": "T-B",
   *   "latitude": 23.795700,
   *   "longitude": 86.403400,
   *   "speed": 0.8,
   *   "status": "rescue"
   * }
   */
  public ingestRoverPayload(payload: RoverTelemetryPacket) {
    if (this.listeners.onRoverTelemetry) {
      this.listeners.onRoverTelemetry(payload);
    }
  }
}

export const esp32Service = new ESP32Service();
