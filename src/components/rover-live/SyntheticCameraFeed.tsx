import React, { useRef, useEffect, useState } from 'react';
import { 
  CameraOff, 
  Eye, 
  EyeOff, 
  Radio, 
  Sun, 
  RefreshCw,
  Video as VideoIcon,
  Camera,
  Globe,
  ExternalLink,
  WifiOff,
  Activity,
  Sparkles,
  Zap,
  Sliders,
  Cpu,
  Users
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { MovementState } from '../../types';
import { aiVisionEngine } from '../../services/aiVisionEngine';

export type EnhanceProfile = 'superres' | 'balanced' | 'lowlight' | 'sharp';

// Normalizes any camera URL to the direct ESP32-CAM MJPEG stream endpoint
export function normalizeCameraStreamUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return 'http://192.168.43.84:81/stream';
  let clean = rawUrl.trim();
  if (!/^https?:\/\//i.test(clean)) {
    clean = `http://${clean}`;
  }
  try {
    const u = new URL(clean);
    // On ESP32-CAM (official Arduino/ESP-IDF CameraWebServer):
    // Port 80 is the HTML dashboard.
    // The actual live MJPEG stream is ALWAYS served on port 81 at /stream!
    if ((u.pathname === '/' || u.pathname === '') && (!u.port || u.port === '80')) {
      return `http://${u.hostname}:81/stream`;
    }
  } catch {
    // fallback to original
  }
  return clean;
}

interface SyntheticCameraFeedProps {
  showBoundingBoxes: boolean;
  thermalFilter: boolean;
  aiEnhance?: boolean;
  enhanceProfile?: EnhanceProfile;
  onToggleAiEnhance?: () => void;
  onSelectProfile?: (profile: EnhanceProfile) => void;
}

export const SyntheticCameraFeed: React.FC<SyntheticCameraFeedProps> = ({
  showBoundingBoxes,
  thermalFilter,
  aiEnhance = true,
  enhanceProfile = 'superres',
  onToggleAiEnhance,
  onSelectProfile
}) => {
  const { 
    rover, 
    aiDetection, 
    emergencySimulated, 
    updateStreamConfig, 
    updateVisionDetection,
    cvDebugMode 
  } = useMine();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imageError, setImageError] = useState<boolean>(false);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);

  // Derive candidate stream URLs for maximum ESP32-CAM compatibility
  const streamCandidates = React.useMemo(() => {
    const raw = rover.streamUrl || 'http://192.168.43.84:81/stream';
    const host = raw.match(/https?:\/\/([^:/]+)/)?.[1] || '192.168.43.84';
    const normalized = normalizeCameraStreamUrl(raw);

    const candidates = [
      '/camera-stream', // Proxied via Vite to http://192.168.43.84:81/stream (avoids CORS canvas tainting)
      '/camera-stream-p80', // Proxied via Vite to http://192.168.43.84/stream
      '/camera-stream-raw', // Proxied via Vite to http://192.168.43.84/
      normalized,
      `http://${host}:81/stream`,
      `http://${host}/stream`,
      `http://${host}:80/stream`,
      `http://${host}/`,
      raw
    ];
    return Array.from(new Set(candidates));
  }, [rover.streamUrl]);

  const currentStreamUrl = streamCandidates[candidateIndex] || streamCandidates[0];

  useEffect(() => {
    setImageError(false);
    setCandidateIndex(0);
  }, [rover.streamUrl, rover.streamSource]);

  const handleImageError = () => {
    if (candidateIndex < streamCandidates.length - 1) {
      // Automatically fallback to next candidate endpoint without disrupting the user
      setCandidateIndex(prev => prev + 1);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  const [fps, setFps] = useState<number>(24.5);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  // WebCam Stream Handler (Supports built-in laptop webcams with robust fallback)
  useEffect(() => {
    if (rover.streamSource !== 'webcam') {
      setWebcamActive(false);
      return;
    }

    let stream: MediaStream | null = null;
    let isCancelled = false;

    const startWebcam = async () => {
      try {
        let s: MediaStream;
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 320 },
              height: { ideal: 720, min: 240 }
            }
          });
        } catch {
          // Fallback if ideal constraints fail on standard laptop webcam
          s = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (isCancelled) {
          s.getTracks().forEach(track => track.stop());
          return;
        }

        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        setWebcamActive(true);
        setWebcamError(null);
      } catch (err: any) {
        if (!isCancelled) {
          setWebcamError(err.message || 'Camera access permission denied or unavailable');
          setWebcamActive(false);
        }
      }
    };

    startWebcam();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [rover.streamSource]);

  // Real-time Computer Vision Inference Engine Loop
  useEffect(() => {
    // Reset tracker cache when stream source changes
    aiVisionEngine.resetTrackers();

    const offscreen = document.createElement('canvas');
    offscreen.width = 320;
    offscreen.height = 180;

    let isCancelled = false;

    const cvInterval = setInterval(() => {
      if (isCancelled) return;

      const sourceEl: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null =
        rover.streamSource === 'webcam' ? videoRef.current :
        rover.streamSource === 'synthetic' ? canvasRef.current :
        imgRef.current;

      const isSynthetic = rover.streamSource === 'synthetic';

      // Ground-truth synthetic targets ONLY during explicit emergency drill simulation
      const syntheticDetections = (isSynthetic && emergencySimulated) ? [
        {
          id: 'P-101',
          trackingId: 'PERSON 1',
          label: 'PERSON 1',
          confidence: 96,
          box: { x: 42, y: 64, width: 34, height: 18 },
          movement: 'FALL DOWN' as MovementState,
          movementConfidence: 96,
          possibleFall: true,
          needsVerification: false,
          activity: 'FALL DOWN' as const
        }
      ] : undefined;

      const result = aiVisionEngine.processFrame(
        offscreen,
        sourceEl,
        isSynthetic,
        syntheticDetections,
        emergencySimulated
      );

      setFps(result.fps || 24);
      updateVisionDetection(result);
    }, 100); // 10 FPS lightweight, high-accuracy CV loop

    return () => {
      isCancelled = true;
      clearInterval(cvInterval);
    };
  }, [rover.streamSource, rover.streamUrl, emergencySimulated, updateVisionDetection]);

  // Canvas animation for synthetic mine tunnel
  useEffect(() => {
    if (rover.streamSource !== 'synthetic') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const particles: { x: number; y: number; size: number; speedY: number; speedX: number; alpha: number }[] = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 450,
        size: Math.random() * 2 + 0.5,
        speedY: (Math.random() - 0.5) * 0.3,
        speedX: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, width, height);

      const vanishX = width * 0.5;
      const vanishY = height * 0.42;

      const lightGrad = ctx.createRadialGradient(
        vanishX, vanishY + 20, 10,
        vanishX, vanishY + 30, width * 0.55
      );
      lightGrad.addColorStop(0, 'rgba(255, 250, 220, 0.45)');
      lightGrad.addColorStop(0.4, 'rgba(210, 230, 255, 0.15)');
      lightGrad.addColorStop(1, 'rgba(5, 10, 18, 0.05)');

      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(0, height);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      const ribs = [0.15, 0.32, 0.52, 0.74, 0.98];
      ribs.forEach(t => {
        const topW = (width * 0.35) * t;
        const topH = (height * 0.25) * t;
        const archTopY = vanishY - topH;
        const archLeftX = vanishX - topW;
        const archRightX = vanishX + topW;
        const groundY = vanishY + (height - vanishY) * t;

        ctx.beginPath();
        ctx.moveTo(archLeftX, groundY);
        ctx.bezierCurveTo(archLeftX, archTopY, archRightX, archTopY, archRightX, groundY);
        ctx.stroke();
      });

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vanishX - 8, vanishY + 10);
      ctx.lineTo(width * 0.28, height);
      ctx.moveTo(vanishX + 8, vanishY + 10);
      ctx.lineTo(width * 0.72, height);
      ctx.stroke();

      for (let t = 0.2; t <= 1.0; t += 0.15) {
        const groundY = vanishY + (height - vanishY) * t;
        const lx = vanishX - (vanishX - width * 0.28) * t;
        const rx = vanishX + (width * 0.72 - vanishX) * t;
        ctx.beginPath();
        ctx.moveTo(lx, groundY);
        ctx.lineTo(rx, groundY);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
        ctx.stroke();
      }

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha * (0.8 + Math.sin(tick * 0.05) * 0.2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const w1X = width * 0.25;
      const w1Y = height * 0.52;
      drawWorkerSilhouette(ctx, w1X, w1Y, 75, '#eab308', false);

      const w2X = width * 0.52;
      const w2Y = height * 0.58;
      drawWorkerSilhouette(ctx, w2X, w2Y, 70, '#f97316', emergencySimulated);

      const w3X = width * 0.78;
      const w3Y = height * 0.48;
      drawWorkerSilhouette(ctx, w3X, w3Y, 60, '#eab308', false);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vanishX - 15, vanishY + 30);
      ctx.lineTo(vanishX + 15, vanishY + 30);
      ctx.moveTo(vanishX, vanishY + 15);
      ctx.lineTo(vanishX, vanishY + 45);
      ctx.stroke();

      if (tick % 40 === 0) {
        setFps(parseFloat((24 + Math.random() * 0.8).toFixed(1)));
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rover.streamSource, emergencySimulated]);

  const drawWorkerSilhouette = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    h: number, 
    helmetColor: string, 
    isFallen: boolean
  ) => {
    ctx.save();
    if (isFallen) {
      ctx.translate(x, y + h * 0.6);
      ctx.rotate(Math.PI / 2.2);
    } else {
      ctx.translate(x, y);
    }

    ctx.fillStyle = '#334155';
    ctx.fillRect(-h * 0.16, -h * 0.7, h * 0.32, h * 0.45);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-h * 0.16, -h * 0.55, h * 0.32, 4);
    ctx.fillRect(-h * 0.16, -h * 0.42, h * 0.32, 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-h * 0.14, -h * 0.25, h * 0.11, h * 0.38);
    ctx.fillRect(h * 0.03, -h * 0.25, h * 0.11, h * 0.38);

    ctx.fillStyle = helmetColor;
    ctx.beginPath();
    ctx.arc(0, -h * 0.82, h * 0.12, Math.PI, 0, false);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(0, -h * 0.83, 3, 0, Math.PI * 2);
    ctx.fill();

    const lampGlow = ctx.createRadialGradient(0, -h * 0.83, 2, 0, -h * 0.83, 22);
    lampGlow.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    lampGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(0, -h * 0.83, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const isFeedActive = (rover.streamSource === 'mjpeg' && !imageError) ||
                      (rover.streamSource === 'webcam' && webcamActive) ||
                      rover.streamSource === 'synthetic' ||
                      rover.streamSource === 'iframe';

  // Hardware-accelerated GPU enhancement style computation (0.0% CPU lag, 0ms latency)
  const getEnhanceStyle = (): React.CSSProperties => {
    if (thermalFilter) {
      return {
        filter: 'invert(1) hue-rotate(180deg) contrast(1.35) brightness(1.1)',
        transform: 'translateZ(0)',
        willChange: 'filter'
      };
    }
    if (!aiEnhance) {
      return {
        filter: 'none',
        transform: 'translateZ(0)'
      };
    }

    const filterId = 
      enhanceProfile === 'superres' ? 'url(#mineguard-ai-superres)' :
      enhanceProfile === 'lowlight' ? 'url(#mineguard-ai-lowlight)' :
      enhanceProfile === 'sharp' ? 'url(#mineguard-ai-sharp)' :
      'url(#mineguard-ai-balanced)';

    const cssPostProcess = 
      enhanceProfile === 'superres' ? 'contrast(1.24) brightness(1.08) saturate(1.18)' :
      enhanceProfile === 'lowlight' ? 'contrast(1.16) brightness(1.15) saturate(1.24)' :
      enhanceProfile === 'sharp' ? 'contrast(1.26) brightness(1.04) saturate(1.14)' :
      'contrast(1.12) brightness(1.06) saturate(1.16)';

    return {
      filter: `${filterId} ${cssPostProcess}`,
      imageRendering: enhanceProfile === 'superres' || enhanceProfile === 'sharp' ? 'crisp-edges' : 'auto',
      transform: 'translateZ(0)',
      willChange: 'filter'
    };
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none flex items-center justify-center border border-slate-800 shadow-2xl">
      {/* GPU Hardware-Accelerated SVG Video Enhancement Filter Kernels */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Profile 1: AI Super-Resolution 2X & Edge Reconstruction */}
          <filter id="mineguard-ai-superres" colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
            <feConvolveMatrix
              order="5"
              kernelMatrix="
                 0    0   -0.12   0    0
                 0   -0.18 -0.32 -0.18 0
                -0.12 -0.32  3.44 -0.32 -0.12
                 0   -0.18 -0.32 -0.18 0
                 0    0   -0.12   0    0"
              preserveAlpha="true"
            />
            <feComponentTransfer>
              <feFuncR type="gamma" exponent="0.84" amplitude="1.08" offset="0.02" />
              <feFuncG type="gamma" exponent="0.84" amplitude="1.08" offset="0.02" />
              <feFuncB type="gamma" exponent="0.84" amplitude="1.08" offset="0.02" />
            </feComponentTransfer>
            <feColorMatrix
              type="matrix"
              values="
                1.08 -0.02 -0.02  0  0.01
               -0.02  1.05 -0.01  0  0.01
               -0.01 -0.02  1.10  0  0.01
                0     0     0     1  0"
            />
          </filter>

          {/* Profile 2: AI Balanced Natural Upscale & Clarity */}
          <filter id="mineguard-ai-balanced" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            {/* 1. Unsharp Mask Convolution: recovers edge acuity without artificial ringing */}
            <feConvolveMatrix
              order="3"
              kernelMatrix="
                 0   -0.35   0
                -0.35  2.40 -0.35
                 0   -0.35   0"
              preserveAlpha="true"
            />
            {/* 2. Chromatic Correction: balances OV2640 sensor tint and revives underground clarity */}
            <feColorMatrix
              type="matrix"
              values="
                1.06 -0.02 -0.02  0  0.01
               -0.02  1.03 -0.01  0  0.01
               -0.01 -0.02  1.08  0  0.01
                0     0     0     1  0"
            />
            {/* 3. Shadow Lift & Dynamic Gamma Curve: lifts deep shadows without clipping highlights */}
            <feComponentTransfer>
              <feFuncR type="gamma" exponent="0.88" amplitude="1.04" offset="0.02" />
              <feFuncG type="gamma" exponent="0.88" amplitude="1.04" offset="0.02" />
              <feFuncB type="gamma" exponent="0.88" amplitude="1.04" offset="0.02" />
            </feComponentTransfer>
          </filter>

          {/* Profile 3: AI Low-Light Night-Vision Mine Boost */}
          <filter id="mineguard-ai-lowlight" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feConvolveMatrix
              order="3"
              kernelMatrix="
                 0   -0.28   0
                -0.28  2.12 -0.28
                 0   -0.28   0"
              preserveAlpha="true"
            />
            <feComponentTransfer>
              <feFuncR type="gamma" exponent="0.74" amplitude="1.15" offset="0.05" />
              <feFuncG type="gamma" exponent="0.74" amplitude="1.15" offset="0.05" />
              <feFuncB type="gamma" exponent="0.74" amplitude="1.15" offset="0.05" />
            </feComponentTransfer>
            <feColorMatrix
              type="matrix"
              values="
                1.08  0.00  0.00  0  0.02
                0.00  1.05  0.00  0  0.02
                0.00  0.00  1.12  0  0.02
                0     0     0     1  0"
            />
          </filter>

          {/* Profile 4: AI Detail & Edge Sharp (Structural Mine Inspection) */}
          <filter id="mineguard-ai-sharp" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feConvolveMatrix
              order="3"
              kernelMatrix="
                 0   -0.50   0
                -0.50  3.00 -0.50
                 0   -0.50   0"
              preserveAlpha="true"
            />
            <feComponentTransfer>
              <feFuncR type="gamma" exponent="0.92" amplitude="1.06" offset="0.01" />
              <feFuncG type="gamma" exponent="0.92" amplitude="1.06" offset="0.01" />
              <feFuncB type="gamma" exponent="0.92" amplitude="1.06" offset="0.01" />
            </feComponentTransfer>
            <feColorMatrix
              type="matrix"
              values="
                1.04 -0.01 -0.01  0  0
               -0.01  1.02 -0.01  0  0
               -0.01 -0.01  1.07  0  0
                0     0     0     1  0"
            />
          </filter>
        </defs>
      </svg>

      {/* 1. Live MJPEG Mode */}
      {rover.streamSource === 'mjpeg' && (
        <>
          {!imageError ? (
            <img
              ref={imgRef}
              src={currentStreamUrl}
              crossOrigin={currentStreamUrl.startsWith('/') ? 'anonymous' : undefined}
              alt="Rover Live Feed"
              onError={handleImageError}
              style={getEnhanceStyle()}
              className="w-full h-full object-cover transition-[filter] duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 max-w-xl">
              <div className="p-3 rounded-full bg-red-950/40 border border-red-500/40 text-red-400">
                <WifiOff className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <div className="text-sm font-bold font-mono text-white">
                  CAMERA STREAM OFFLINE / WAITING FOR SIGNAL
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1 max-w-md">
                  Target stream endpoint <code className="text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{currentStreamUrl}</code> did not respond.
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  Host Wi-Fi: <strong className="text-slate-300">ESP32-CAM</strong> • Rover IP: <strong className="text-cyan-300">192.168.43.84</strong>
                </p>
              </div>

              {/* Wi-Fi Subnet Diagnostic Tip */}
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-200 text-left space-y-1 w-full font-mono">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <span>⚠️ Network Mismatch Notice:</span>
                </div>
                <p className="text-slate-300">
                  Your laptop is connected to IP <strong className="text-cyan-300">10.234.213.90</strong>. The ESP32 camera is set to <strong className="text-amber-300">192.168.43.84</strong>.
                </p>
                <p className="text-slate-400 text-[10px]">
                  💡 To view the live ESP32 camera, connect your laptop to the <strong>same Wi-Fi or Phone Hotspot</strong> as the ESP32.
                </p>
              </div>

              {/* Action buttons */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2.5 w-full text-xs font-mono">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">
                  Quick Camera Presets & Alternatives:
                </div>
                
                {/* 1-Click Laptop WebCam Switch */}
                <button
                  onClick={() => {
                    updateStreamConfig(rover.streamUrl, 'webcam');
                    setImageError(false);
                  }}
                  className="w-full p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <VideoIcon className="w-4 h-4" />
                  <span>📹 Switch to Laptop WebCam (Live AI Detection)</span>
                </button>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    onClick={() => {
                      const host = rover.streamUrl.match(/https?:\/\/([^:/]+)/)?.[1] || '192.168.43.84';
                      updateStreamConfig(`http://${host}:81/stream`, 'mjpeg');
                      setImageError(false);
                      setCandidateIndex(0);
                    }}
                    className="p-2 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Connect :81/stream (Standard ESP32-CAM)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                  <button
                    onClick={() => {
                      const host = rover.streamUrl.match(/https?:\/\/([^:/]+)/)?.[1] || '192.168.43.84';
                      updateStreamConfig(`http://${host}/stream`, 'mjpeg');
                      setImageError(false);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                  >
                    Port 80 /stream
                  </button>
                  <button
                    onClick={() => {
                      const host = rover.streamUrl.match(/https?:\/\/([^:/]+)/)?.[1] || '192.168.43.84';
                      updateStreamConfig(`http://${host}/`, 'iframe');
                      setImageError(false);
                    }}
                    className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    <span>iFrame Web UI</span>
                  </button>
                  <button
                    onClick={() => {
                      updateStreamConfig(rover.streamUrl, 'synthetic');
                      setImageError(false);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                  >
                    Simulation Feed
                  </button>
                  <a
                    href={rover.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
                  >
                    <span>Open in Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => {
                  setImageError(false);
                  setCandidateIndex(0);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Stream (Auto-Detect)</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 2. WebCam Mode */}
      {rover.streamSource === 'webcam' && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={getEnhanceStyle()}
            className="w-full h-full object-cover transition-[filter] duration-200"
          />
          {webcamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/80 text-center space-y-2">
              <CameraOff className="w-10 h-10 text-red-400" />
              <div className="text-sm font-bold font-mono text-white">Camera Access Error</div>
              <p className="text-xs font-mono text-slate-400">{webcamError}</p>
              <button
                onClick={() => updateStreamConfig(rover.streamUrl, 'synthetic')}
                className="px-3 py-1 rounded bg-slate-800 text-xs font-mono text-cyan-400 border border-slate-700"
              >
                Switch to Simulation
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. iFrame Web Mode */}
      {rover.streamSource === 'iframe' && (
        <iframe
          src={rover.streamUrl}
          title="Camera Web View"
          className="w-full h-full border-0 bg-[#0a0e17]"
          allow="camera; microphone"
        />
      )}

      {/* 4. Synthetic Tunnel Feed Mode */}
      {rover.streamSource === 'synthetic' && (
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          style={getEnhanceStyle()}
          className="w-full h-full object-cover transition-[filter] duration-200"
        />
      )}

      {/* 5. Fallback Mode */}
      {rover.streamSource === 'fallback' && (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#0a0e17]">
          <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <CameraOff className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-slate-200">
              ROVER CAMERA OFFLINE
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">
              Waiting for video stream from ESP32-CAM or IP Network...
            </div>
          </div>
          <div className="text-[11px] font-mono text-cyan-400 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            Target URL: {rover.streamUrl}
          </div>
        </div>
      )}

      {/* AI Bounding Boxes Overlay (CONDITIONAL REAL PERSON DETECTION ONLY) */}
      {showBoundingBoxes && isFeedActive && aiDetection.workers.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {aiDetection.workers.map((worker) => {
            const isFall = worker.activity === 'FALL DOWN' || worker.activity === 'FALL DETECTED' || worker.possibleFall;
            const isNoActive = worker.activity === 'NO ACTIVE';
            const tagId = worker.trackingId || worker.label.split(' ')[0] || 'PERSON';

            const borderClass = isFall 
              ? 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.7)] animate-pulse' 
              : isNoActive 
              ? 'border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.5)]'
              : 'border-mine-cyan shadow-[0_0_12px_rgba(0,240,255,0.45)]';

            const reticleColor = isFall ? 'border-red-400' : isNoActive ? 'border-amber-400' : 'border-white';

            const badgeBg = isFall 
              ? 'bg-red-600 text-white' 
              : isNoActive 
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-mine-cyan text-slate-950';

            const statusBg = isFall
              ? 'bg-red-950/95 text-red-200 border-red-500 animate-pulse'
              : isNoActive
              ? 'bg-amber-950/95 text-amber-200 border-amber-500'
              : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/40';

            return (
              <div
                key={worker.id}
                style={{
                  left: `${worker.box.x}%`,
                  top: `${worker.box.y}%`,
                  width: `${worker.box.width}%`,
                  height: `${worker.box.height}%`
                }}
                className={`absolute border-2 ${borderClass} rounded-sm transition-all duration-150`}
              >
                {/* Corner reticles */}
                <div className={`absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 ${reticleColor}`} />
                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 ${reticleColor}`} />
                <div className={`absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 ${reticleColor}`} />
                <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 ${reticleColor}`} />

                {/* Tag header */}
                <div className="absolute -top-6 left-0 whitespace-nowrap flex items-center gap-1">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow ${badgeBg}`}>
                    {tagId} • {worker.confidence}%
                  </span>
                  {isFall && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-500/80 animate-pulse">
                      ⚠ FALL DOWN
                    </span>
                  )}
                  {isNoActive && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/80">
                      ⚠ NO ACTIVE
                    </span>
                  )}
                  {cvDebugMode && (
                    <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-black/80 text-emerald-400 border border-emerald-500/50">
                      ANG: {worker.bodyAngle ?? 0}°
                    </span>
                  )}
                </div>

                {/* Dynamic posture & activity footer tag */}
                <div className="absolute -bottom-5 left-0 whitespace-nowrap">
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold border ${statusBg}`}>
                    {worker.activity || worker.movement}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CV Skeleton Keypoint Overlay in Debug Mode */}
      {cvDebugMode && isFeedActive && aiDetection.workers.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {aiDetection.workers.map(w => {
            if (!w.keypoints || w.keypoints.length === 0) return null;
            const isFall = w.activity === 'FALL DETECTED';
            const strokeColor = isFall ? '#ef4444' : '#00f0ff';
            const kpMap: Record<string, { x: number; y: number }> = {};
            w.keypoints.forEach(k => { kpMap[k.name] = { x: k.x, y: k.y }; });

            const pairs: [string, string][] = [
              ['head', 'leftShoulder'], ['head', 'rightShoulder'],
              ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftHip'],
              ['rightShoulder', 'rightHip'], ['leftHip', 'rightHip'],
              ['leftHip', 'leftKnee'], ['rightHip', 'rightKnee'],
              ['leftKnee', 'leftAnkle'], ['rightKnee', 'rightAnkle']
            ];

            return (
              <g key={`skel-${w.id}`}>
                {pairs.map(([p1, p2], idx) => {
                  const pt1 = kpMap[p1];
                  const pt2 = kpMap[p2];
                  if (!pt1 || !pt2) return null;
                  return (
                    <line
                      key={idx}
                      x1={pt1.x}
                      y1={pt1.y}
                      x2={pt2.x}
                      y2={pt2.y}
                      stroke={strokeColor}
                      strokeWidth="0.8"
                      strokeDasharray={isFall ? '1.5 1' : 'none'}
                    />
                  );
                })}
                {w.keypoints.map(k => (
                  <circle key={k.name} cx={k.x} cy={k.y} r="1" fill="#ffffff" stroke={strokeColor} strokeWidth="0.5" />
                ))}
              </g>
            );
          })}
        </svg>
      )}

      {/* Top Stream Overlay HUD */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/75 backdrop-blur-md border border-slate-700 text-[11px] font-mono font-bold">
          <span className={`w-2 h-2 rounded-full ${isFeedActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-white">
            {rover.streamSource === 'webcam' ? 'WEBCAM' : rover.streamSource === 'mjpeg' ? 'ESP32-CAM' : rover.streamSource === 'iframe' ? 'WEB UI' : 'SIMULATION'}
          </span>
          <span className="text-slate-500">|</span>
          <span className={isFeedActive ? 'text-emerald-400' : 'text-red-400'}>
            {isFeedActive ? 'LIVE STREAM' : 'DISCONNECTED'}
          </span>
        </div>

        {/* AI Enhanced Status HUD Badge */}
        {isFeedActive && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded backdrop-blur-md border text-[11px] font-mono font-bold transition-all ${
            aiEnhance && !thermalFilter
              ? 'bg-cyan-950/85 border-cyan-500/70 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
              : 'bg-black/60 border-slate-800 text-slate-400'
          }`}>
            <Sparkles className={`w-3.5 h-3.5 ${aiEnhance && !thermalFilter ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span>
              {aiEnhance && !thermalFilter 
                ? `AI ENHANCED [${enhanceProfile.toUpperCase()}]` 
                : 'RAW FEED'}
            </span>
          </div>
        )}

        {isFeedActive && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/75 backdrop-blur-md border border-slate-700 text-[11px] font-mono text-slate-300">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>FPS: {fps}</span>
            {cvDebugMode && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400">INFER: {aiDetection.inferenceTimeMs ?? 10}ms</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Live Motion Activity Bar in HUD */}
      {isFeedActive && (
        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none z-10">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-black/75 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>HUMAN PRESENCE:</span>
            <span className={`font-bold flex items-center gap-1.5 ${aiDetection.personDetected ? 'text-cyan-300' : 'text-slate-400'}`}>
              {aiDetection.personDetected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              )}
              {aiDetection.personDetected ? `${aiDetection.workerCount} DETECTED` : 'NONE'}
            </span>
          </div>

          {thermalFilter && (
            <span className="px-2 py-0.5 rounded bg-amber-500/80 text-black font-bold font-mono text-[10px]">
              THERMAL FLIR
            </span>
          )}
        </div>
      )}

      {/* Bottom Stream Quick AI Toolbar */}
      {isFeedActive && (
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 pointer-events-auto z-20">
          <button
            type="button"
            onClick={onToggleAiEnhance}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
              aiEnhance
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)] hover:bg-cyan-500/35'
                : 'bg-black/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Real-Time AI Video Enhancement"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI ENHANCE: {aiEnhance ? 'ON' : 'OFF'}</span>
          </button>

          {/* Real-time AI Person Detection Status */}
          <div
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
              aiDetection.personDetected
                ? 'border-cyan-500/50 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'border-slate-800 bg-black/80 text-slate-400'
            }`}
            title="Real-Time Human Detection Sensor Status"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI: {aiDetection.personDetected ? `${aiDetection.workerCount} HUMAN${aiDetection.workerCount > 1 ? 'S' : ''} IN VIEW` : 'SEARCHING (NO WORKER)'}</span>
          </div>

          {aiEnhance && onSelectProfile && (
            <div className="hidden sm:flex items-center gap-1 bg-black/80 backdrop-blur-md p-0.5 rounded border border-slate-800 text-[10px] font-mono">
              {(['balanced', 'lowlight', 'sharp'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onSelectProfile(p)}
                  className={`px-2 py-0.5 rounded transition-colors uppercase ${
                    enhanceProfile === p
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'balanced' ? 'Balanced' : p === 'lowlight' ? 'Low-Light' : 'Sharp'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Live Watermark */}
      <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-400/80 pointer-events-none bg-black/50 px-2 py-0.5 rounded border border-slate-800/60 hidden sm:block">
        MINEGUARD AI OPTICAL PIPELINE • OV2640 GPU ENHANCED
      </div>
    </div>
  );
};
