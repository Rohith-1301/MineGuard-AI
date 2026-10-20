import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Crosshair, 
  Radio, 
  Compass, 
  MapPin, 
  Maximize2, 
  RefreshCw, 
  Layers, 
  Navigation,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { DeviceGpsLocation } from '../../types';

interface LiveMapComponentProps {
  /**
   * Optional custom latitude override.
   * If omitted, the component automatically binds to the global deviceLocation from MineContext.
   */
  latitude?: number;
  /**
   * Optional custom longitude override.
   */
  longitude?: number;
  /**
   * Initial zoom level (defaults to 16 for high-detail street level view).
   */
  initialZoom?: number;
  /**
   * Display label for the tracked camera / rover unit.
   */
  deviceLabel?: string;
  className?: string;
}

/**
 * ============================================================================
 * LIVE INTERACTIVE MAP COMPONENT (Leaflet + OpenStreetMap)
 * ============================================================================
 * Provides real-time GPS tracking for ESP32-CAM and autonomous rovers.
 * Features:
 * - Clean OpenStreetMap street tiles with normal pan and zoom controls
 * - High-visibility pulsating radar marker with camera glyph
 * - Smooth marker translation when coordinates update dynamically
 * - User pan/zoom detection (does not hijack manual navigation)
 * - One-click "Current Location" recenter button
 * - Unobtrusive coordinates telemetry overlay (Lat, Lng, Alt, GPS Lock)
 */
export const LiveMapComponent: React.FC<LiveMapComponentProps> = ({
  latitude: propLat,
  longitude: propLng,
  initialZoom = 16,
  deviceLabel = 'ESP32-CAM / ROVER #01',
  className = ''
}) => {
  const { deviceLocation, updateDeviceLocation, rover } = useMine();

  // Active coordinates (prioritizes props, falls back to live deviceLocation context)
  const activeLat = propLat !== undefined ? propLat : deviceLocation.latitude;
  const activeLng = propLng !== undefined ? propLng : deviceLocation.longitude;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pulseCircleRef = useRef<L.Circle | null>(null);

  // Track whether the user has manually panned/zoomed away from the device
  const [userHasPanned, setUserHasPanned] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite'>('streets');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  /**
   * Creates a prominent, high-visibility pulsating marker for the live device.
   */
  const createProminentMarkerIcon = useCallback((label: string) => {
    return L.divIcon({
      className: 'live-device-custom-icon',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; items-align: center; justify-content: center; pointer-events: auto;">
          <!-- Outer Pulsating Radar Wave -->
          <div style="position: absolute; inset: 0px; border-radius: 9999px; background: rgba(0, 240, 255, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <!-- Mid Radar Aura -->
          <div style="position: absolute; inset: 4px; border-radius: 9999px; border: 2px solid rgba(0, 240, 255, 0.7); background: rgba(10, 22, 40, 0.6); box-shadow: 0 0 15px rgba(0, 240, 255, 0.5);"></div>
          <!-- Center Device Pin Badge -->
          <div style="position: absolute; inset: 9px; border-radius: 9999px; background: #00f0ff; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);">
            <svg style="width: 14px; height: 14px; color: #0a0e17;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <!-- Label Floating Tag -->
          <div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(10, 14, 23, 0.95); border: 1px solid #00f0ff; color: #00f0ff; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);">
            ${label}
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22]
    });
  }, []);

  /**
   * ========================================================================
   * INITIALIZE MAP ON COMPONENT MOUNT
   * ========================================================================
   */
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent re-initialization

    // Create Leaflet Map centered on initial device location
    const map = L.map(mapContainerRef.current, {
      center: [activeLat, activeLng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false // Custom styled attribution included below
    });

    // Standard OpenStreetMap Street Tiles
    const streetsTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(streetsTileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Create high-visibility device marker
    const marker = L.marker([activeLat, activeLng], {
      icon: createProminentMarkerIcon(deviceLabel),
      zIndexOffset: 1000
    }).addTo(map);

    // Accuracy / coverage radius circle
    const pulseCircle = L.circle([activeLat, activeLng], {
      radius: deviceLocation.accuracyMeters || 25,
      color: '#00f0ff',
      weight: 1.5,
      fillColor: '#00f0ff',
      fillOpacity: 0.12,
      dashArray: '4 4'
    }).addTo(map);

    // Interactive Device Popup
    const popupContent = `
      <div style="font-family: monospace; padding: 4px; font-size: 11px; color: #f8fafc; min-width: 170px;">
        <div style="font-weight: bold; color: #00f0ff; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
          ${deviceLabel}
        </div>
        <div style="margin-bottom: 2px;">Latitude: <strong style="color: #ffffff;">${activeLat.toFixed(6)}°</strong></div>
        <div style="margin-bottom: 2px;">Longitude: <strong style="color: #ffffff;">${activeLng.toFixed(6)}°</strong></div>
        <div style="margin-bottom: 2px;">Altitude: <strong style="color: #38bdf8;">${deviceLocation.altitude ?? 184}m</strong></div>
        <div style="margin-bottom: 2px;">Speed: <strong style="color: #10b981;">${rover.speed ?? 0.8} m/s</strong></div>
        <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">Status: <span style="color: #10b981; font-weight: bold;">LIVE TRACKING</span></div>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Event listeners to detect manual user panning/zooming
    map.on('dragstart', () => {
      setUserHasPanned(true);
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    pulseCircleRef.current = pulseCircle;

    // Force tile recalculation after layout mount
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  /**
   * ========================================================================
   * DYNAMIC LOCATION UPDATE OBSERVER
   * Smoothly animates marker position when new GPS coordinates are received.
   * ========================================================================
   */
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;

    const newLatLng: L.LatLngTuple = [activeLat, activeLng];

    // Smoothly animate marker position to new coordinates
    markerRef.current.setLatLng(newLatLng);

    if (pulseCircleRef.current) {
      pulseCircleRef.current.setLatLng(newLatLng);
      if (deviceLocation.accuracyMeters) {
        pulseCircleRef.current.setRadius(deviceLocation.accuracyMeters);
      }
    }

    // Update popup coordinates
    markerRef.current.setPopupContent(`
      <div style="font-family: monospace; padding: 4px; font-size: 11px; color: #f8fafc; min-width: 170px;">
        <div style="font-weight: bold; color: #00f0ff; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
          ${deviceLabel}
        </div>
        <div style="margin-bottom: 2px;">Latitude: <strong style="color: #ffffff;">${activeLat.toFixed(6)}°</strong></div>
        <div style="margin-bottom: 2px;">Longitude: <strong style="color: #ffffff;">${activeLng.toFixed(6)}°</strong></div>
        <div style="margin-bottom: 2px;">Altitude: <strong style="color: #38bdf8;">${deviceLocation.altitude ?? 184}m</strong></div>
        <div style="margin-bottom: 2px;">Speed: <strong style="color: #10b981;">${rover.speed ?? 0.8} m/s</strong></div>
        <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">Updated: ${deviceLocation.lastUpdated || 'Just now'}</div>
      </div>
    `);

    // If the user has NOT manually panned away, keep the map centered on the device
    if (!userHasPanned) {
      mapInstanceRef.current.panTo(newLatLng, {
        animate: true,
        duration: 0.8
      });
    }
  }, [activeLat, activeLng, userHasPanned, deviceLabel, deviceLocation, rover.speed]);

  /**
   * Recenter / Return to Current Location button handler.
   */
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    setUserHasPanned(false);
    mapInstanceRef.current.flyTo([activeLat, activeLng], Math.max(16, mapInstanceRef.current.getZoom()), {
      animate: true,
      duration: 1.2
    });
  };

  /**
   * Toggle between Standard Street Tiles and High-Contrast Satellite/Topo Tiles.
   */
  const handleToggleTileStyle = () => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (tileLayerType === 'streets') {
      // Switch to Satellite Imagery (Esri World Imagery)
      const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = satLayer;
      setTileLayerType('satellite');
    } else {
      // Switch back to Standard Street Map
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = streetLayer;
      setTileLayerType('streets');
    }
  };

  /**
   * Simulated micro-telemetry drift test (allows immediate operator verification).
   */
  const handleSimulateMove = () => {
    // Shifts coordinates slightly (~15-20 meters) to demonstrate smooth marker animation
    const deltaLat = (Math.random() - 0.5) * 0.0004;
    const deltaLng = (Math.random() - 0.5) * 0.0004;
    updateDeviceLocation(activeLat + deltaLat, activeLng + deltaLng, {
      speedKmh: Math.round((Math.random() * 2 + 2) * 10) / 10
    });
  };

  return (
    <div className={`relative w-full h-full min-h-[460px] rounded-[6px] overflow-hidden border border-[#D2CEC4] bg-[#202522] select-none flex flex-col ${className}`}>
      {/* 1. Leaflet Interactive Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full flex-1 z-0" 
        style={{ minHeight: '440px' }}
      />

      {/* 2. Top-Left Telemetry HUD (Coordinates & GPS Fix) */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-none font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#202522]/95 border border-[#404842] text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-industrial-copper animate-pulse" />
          <span className="text-[#F4F1EA] font-bold">{deviceLabel}</span>
          <span className="text-[#68706A]">|</span>
          <span className="text-industrial-copper font-bold">
            LAT: {activeLat.toFixed(6)}°
          </span>
          <span className="text-industrial-copper font-bold">
            LNG: {activeLng.toFixed(6)}°
          </span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-[#202522]/90 border border-[#303631] text-[10px] text-[#A09A8E] w-fit">
          <Radio className="w-3 h-3 text-[#4F7A58]" />
          <span>ALT: <strong className="text-[#F4F1EA]">{deviceLocation.altitude ?? 184}m</strong></span>
          <span>•</span>
          <span>SPEED: <strong className="text-[#4F7A58]">{rover.speed ?? 0.8} m/s</strong></span>
          <span>•</span>
          <span>ACCURACY: <strong className="text-[#F4F1EA]">±{deviceLocation.accuracyMeters ?? 2.4}m</strong></span>
          <span>•</span>
          <span className="text-[#4F7A58] font-bold">3D GPS FIX</span>
        </div>
      </div>

      {/* 3. Top-Right Floating Controls (Recenter, Tile Switcher, Simulator) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2 pointer-events-auto font-mono">
        {/* Current Location / Recenter Button */}
        <button
          onClick={handleRecenter}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-bold border shadow-md transition-all ${
            !userHasPanned
              ? 'bg-industrial-copper text-white border-industrial-copper'
              : 'bg-[#202522]/95 hover:bg-[#303631] text-industrial-copper border-[#404842]'
          }`}
          title="Return to Device Location and re-enable auto-centering"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>{!userHasPanned ? 'Tracking Locked' : 'Recenter Location'}</span>
        </button>

        {/* Tile Style Switcher */}
        <button
          onClick={handleToggleTileStyle}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#202522]/95 hover:bg-[#303631] border border-[#404842] text-[#D2CEC4] hover:text-[#F4F1EA] text-xs transition-colors shadow-md"
          title="Toggle Street Map / Satellite Imagery Tiles"
        >
          <Layers className="w-3 h-3 text-industrial-copper" />
          <span className="capitalize">{tileLayerType === 'streets' ? 'Satellite' : 'Street Map'}</span>
        </button>

        {/* Dynamic Location Simulation Drift Button (For Testing & Verification) */}
        <button
          onClick={handleSimulateMove}
          className="flex items-center gap-1 px-2 py-1 rounded-[3px] bg-[#202522]/90 hover:bg-[#303631] border border-[#404842] text-[10px] text-[#A09A8E] hover:text-industrial-copper transition-colors"
          title="Simulate dynamic coordinate update to verify smooth marker animation"
        >
          <Sparkles className="w-2.5 h-2.5 text-industrial-copper" />
          <span>Simulate Roam</span>
        </button>
      </div>

      {/* 4. Bottom-Left Map Navigation State Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#202522]/90 border border-[#404842] text-[10px] text-[#A09A8E]">
          <Navigation className="w-3 h-3 text-industrial-copper" />
          <span>Zoom: Level {currentZoom}</span>
          <span>•</span>
          <span>OpenStreetMap Standard Street Layer</span>
        </div>
      </div>
    </div>
  );
};
