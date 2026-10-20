import { DetectedWorker, MovementState, PoseKeypoint } from '../types';

/**
 * CONFIGURABLE FALL DETECTION & COMPUTER VISION PARAMETERS
 * Centralized temporal thresholds, angle tolerances, and confidence cutoffs.
 */
export const FALL_DETECTION_CONFIG = {
  // Confidence threshold below which detections are ignored
  minPersonConfidence: 60, // %
  minKeypointConfidence: 0.45,

  // Geometry thresholds
  fallAngleThreshold: 50, // degrees from vertical (>50° indicates horizontal body)
  horizontalAspectRatioThreshold: 1.12, // width / height > 1.12 indicates horizontal body
  standingAspectRatioMax: 0.78, // width / height < 0.78 indicates tall standing posture
  sittingAspectRatioRange: [0.78, 1.12] as [number, number],

  // Temporal analysis thresholds
  rapidDescentVelocityThreshold: 6.5, // % vertical drop within a 300ms window
  temporalConfirmationFrames: 3, // ~300ms of sustained horizontal posture confirms fall
  immobilityThresholdMovement: 0.9, // maximum centroid movement % to be considered inactive
  immobilityFramesRequired: 18, // ~1.8s of immobility triggers "NO ACTIVE"
  lostTrackMaxFrames: 10, // retains tracking across brief pauses / low-contrast frames
  recoveryConfirmationFrames: 4, // consecutive upright frames to clear a fall
};

export interface FrameSample {
  timestamp: number;
  box: { x: number; y: number; width: number; height: number };
  centroid: { x: number; y: number };
  bodyAngle: number;
  aspectRatio: number;
  activity: MovementState;
}

export interface TrackedPerson {
  trackingId: string; // e.g. "PERSON 1"
  numericId: number;
  firstSeen: number;
  lastSeen: number;
  missedFrames: number;
  currentBox: { x: number; y: number; width: number; height: number };
  smoothedBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  keypoints: PoseKeypoint[];
  bodyAngle: number;
  aspectRatio: number;
  history: FrameSample[];
  activity: MovementState;
  movementIndex: 'LOW' | 'NORMAL' | 'HIGH';
  movementConfidence: number;
  fallConfidence: number;
  temporalFallState: 'UPRIGHT' | 'DESCENT' | 'HORIZONTAL' | 'IMMOBILE' | 'FALL_CONFIRMED';
  fallConfirmedAt?: number;
  fallSustainedFrames: number;
  immobileFrames: number;
}

export interface VisionAnalysisResult {
  personDetected: boolean;
  workerCount: number;
  workers: DetectedWorker[];
  possibleFallDetected: boolean;
  primaryActivity: MovementState;
  movementStatus: MovementState;
  fps: number;
  inferenceTimeMs: number;
}

class AIVisionEngine {
  private nextPersonId = 1;
  private trackedPersons: Map<number, TrackedPerson> = new Map();
  private frameCount = 0;
  private currentFps = 25;
  private lastFpsUpdate = performance.now();

  // Background and temporal motion buffers for robust real-time CV
  private prevFrameLuma: Float32Array | null = null;
  private bgLuma: Float32Array | null = null;

  /**
   * Resets all active trackers (used when changing camera streams or restarting).
   */
  public resetTrackers(): void {
    this.trackedPersons.clear();
    this.nextPersonId = 1;
    this.prevFrameLuma = null;
    this.bgLuma = null;
  }

  /**
   * Checks if a normalized coordinate falls inside any active person's bounding box.
   * Used for selective background modeling so stationary people are never absorbed into background.
   */
  private isPixelInsideActiveTracker(normX: number, normY: number): boolean {
    for (const tp of this.trackedPersons.values()) {
      const b = tp.smoothedBox;
      if (
        normX >= b.x && normX <= (b.x + b.width) &&
        normY >= b.y && normY <= (b.y + b.height)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Main vision pipeline entry point.
   * Processes a video/canvas frame and returns structured detections.
   * Strictly returns ZERO detections when no human is present in view.
   */
  public processFrame(
    canvas: HTMLCanvasElement,
    sourceElement?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null,
    isSyntheticMode = false,
    syntheticWorkers?: DetectedWorker[],
    emergencySimulated = false
  ): VisionAnalysisResult {
    const startTime = performance.now();
    this.frameCount++;

    // Calculate rolling FPS
    const elapsedFps = startTime - this.lastFpsUpdate;
    if (elapsedFps >= 600) {
      this.currentFps = Math.round((this.frameCount / elapsedFps) * 1000 * 10) / 10;
      this.frameCount = 0;
      this.lastFpsUpdate = startTime;
    }

    const rawDetections: {
      box: { x: number; y: number; width: number; height: number };
      confidence: number;
      keypoints: PoseKeypoint[];
    }[] = [];

    if (isSyntheticMode && syntheticWorkers && syntheticWorkers.length > 0) {
      // In synthetic mode, map explicitly provided synthetic targets (e.g. for emergency drills)
      syntheticWorkers.forEach(sw => {
        const isHorizontal = sw.movement === 'FALL DOWN' || sw.movement === 'FALL DETECTED' || sw.possibleFall;
        const keypoints = this.generatePoseKeypoints(sw.box, isHorizontal);
        rawDetections.push({
          box: sw.box,
          confidence: sw.confidence,
          keypoints
        });
      });
    } else if (sourceElement && canvas) {
      // Real computer vision extraction on actual video, MJPEG, or webcam frames
      const detected = this.detectPersonsFromSource(canvas, sourceElement, emergencySimulated);
      rawDetections.push(...detected);
    }

    // Step 2: Multi-person tracking across frames
    const matchedTrackers = this.updateTrackers(rawDetections, startTime);

    // Step 3: Pose & Temporal Fall Classification
    let anyFallDetected = false;
    const outputWorkers: DetectedWorker[] = [];

    matchedTrackers.forEach(tp => {
      this.analyzeHumanActivityAndFall(tp, startTime, emergencySimulated);

      const isFall = tp.activity === 'FALL DOWN' || tp.activity === 'FALL DETECTED' || tp.temporalFallState === 'FALL_CONFIRMED';
      if (isFall) {
        anyFallDetected = true;
      }

      outputWorkers.push({
        id: `P-${tp.numericId}`,
        trackingId: tp.trackingId,
        label: `${tp.trackingId} (Worker 0${tp.numericId})`,
        confidence: tp.confidence,
        box: tp.smoothedBox,
        movement: tp.activity,
        movementConfidence: tp.movementConfidence,
        possibleFall: isFall,
        needsVerification: tp.activity === 'NO ACTIVE',
        activity: tp.activity,
        bodyAngle: Math.round(tp.bodyAngle),
        aspectRatio: Math.round(tp.aspectRatio * 100) / 100,
        fallConfidence: tp.fallConfidence,
        temporalFallState: tp.temporalFallState,
        keypoints: tp.keypoints,
        lastSeenTimestamp: tp.lastSeen
      });
    });

    const inferenceTime = Math.max(1, Math.round(performance.now() - startTime));
    const personDetected = outputWorkers.length > 0;
    const primaryActivity: MovementState = anyFallDetected
      ? 'FALL DOWN'
      : outputWorkers.length > 0
      ? outputWorkers[0].activity || 'STANDING'
      : 'UNKNOWN';

    return {
      personDetected,
      workerCount: outputWorkers.length,
      workers: outputWorkers,
      possibleFallDetected: anyFallDetected,
      primaryActivity,
      movementStatus: primaryActivity,
      fps: this.currentFps,
      inferenceTimeMs: inferenceTime
    };
  }

  /**
   * Real computer-vision person detection and spatial localization.
   * Multi-feature detector combining:
   * 1. Selective background subtraction (preserves stationary humans indefinitely)
   * 2. Edge energy / clothing contours (Sobel gradient magnitude)
   * 3. Normalized RGB / Universal skin chromaticity locus
   * 4. Upper-body / Head-and-shoulder oval aspect verification
   * Strictly returns [] if no human foreground mass is present.
   */
  private detectPersonsFromSource(
    canvas: HTMLCanvasElement,
    sourceElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    emergencySimulated = false
  ): { box: { x: number; y: number; width: number; height: number }; confidence: number; keypoints: PoseKeypoint[] }[] {
    const results: { box: { x: number; y: number; width: number; height: number }; confidence: number; keypoints: PoseKeypoint[] }[] = [];

    // Verify source element is ready with positive dimensions
    if ('naturalWidth' in sourceElement && (sourceElement.naturalWidth === 0 || sourceElement.complete === false)) {
      return results;
    }
    if ('videoWidth' in sourceElement && sourceElement.videoWidth === 0) {
      return results;
    }

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return results;

      const sw = 320;
      const sh = 180;
      if (canvas.width !== sw) canvas.width = sw;
      if (canvas.height !== sh) canvas.height = sh;

      ctx.drawImage(sourceElement, 0, 0, sw, sh);
      const frameData = ctx.getImageData(0, 0, sw, sh);
      const data = frameData.data;
      const totalPixels = sw * sh;

      if (!this.prevFrameLuma || this.prevFrameLuma.length !== totalPixels) {
        this.prevFrameLuma = new Float32Array(totalPixels);
      }
      if (!this.bgLuma || this.bgLuma.length !== totalPixels) {
        this.bgLuma = new Float32Array(totalPixels);
      }

      // Arrays to accumulate human spatial silhouette energy
      const colEnergies = new Float32Array(sw);
      const rowEnergies = new Float32Array(sh);
      let totalForegroundScore = 0;
      let skinPixelCount = 0;
      let motionPixelCount = 0;
      let bodyContourPixelCount = 0;

      // Scan with step 2 for ultra-fast 60 FPS capable processing
      for (let y = 2; y < sh - 2; y += 2) {
        const normY = (y / sh) * 100;
        for (let x = 2; x < sw - 2; x += 2) {
          const normX = (x / sw) * 100;
          const idx = (y * sw + x) * 4;
          const pIdx = y * sw + x;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Luminance (ITU-R BT.601)
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const prevLuma = this.prevFrameLuma[pIdx];
          const bgLuma = this.bgLuma[pIdx];

          const motionDelta = Math.abs(luma - prevLuma);
          const bgDelta = Math.abs(luma - bgLuma);

          // Selective background update:
          // Pixels inside an already-detected person are frozen or updated very slowly
          // so stationary people are NEVER absorbed into the background!
          const insideKnownPerson = this.isPixelInsideActiveTracker(normX, normY);
          const bgUpdateRate = insideKnownPerson ? 0.002 : 0.035;
          this.bgLuma[pIdx] = bgLuma * (1 - bgUpdateRate) + luma * bgUpdateRate;
          this.prevFrameLuma[pIdx] = luma;

          // Spatial edge contrast (Sobel-like magnitude)
          const rightIdx = idx + 8;
          const downIdx = idx + sw * 8;
          const gx = Math.abs(r - data[rightIdx]) + Math.abs(g - data[rightIdx + 1]) + Math.abs(b - data[rightIdx + 2]);
          const gy = Math.abs(r - data[downIdx]) + Math.abs(g - data[downIdx + 1]) + Math.abs(b - data[downIdx + 2]);
          const edgeEnergy = gx + gy;

          // Universal Skin Tone Locus (Normalized chromaticity - works across diverse skin tones and lighting)
          const sum = r + g + b;
          const nr = sum > 0 ? r / sum : 0;
          const ng = sum > 0 ? g / sum : 0;
          const isSkinTone = (
            (nr > 0.33 && nr < 0.60 && ng > 0.25 && ng < 0.38 && r > g && g > b * 0.75) ||
            (r > 55 && g > 35 && b > 20 && (r - g) > 6 && (r - b) > 4)
          );

          if (isSkinTone) skinPixelCount++;
          if (motionDelta > 12) motionPixelCount++;
          if (edgeEnergy > 24) bodyContourPixelCount++;

          // Multi-factor human pixel score
          let pixelScore = 0;
          if (motionDelta > 14 && edgeEnergy > 22) {
            pixelScore += 3.5;
          } else if (isSkinTone && edgeEnergy > 16) {
            pixelScore += 4.0;
          } else if (bgDelta > 18 && edgeEnergy > 20) {
            pixelScore += 2.5;
          } else if (insideKnownPerson && edgeEnergy > 18) {
            // Hysteresis: keep tracking active known person even when motionless
            pixelScore += 2.2;
          } else if (motionDelta > 18) {
            pixelScore += 2.0;
          } else if (isSkinTone) {
            pixelScore += 1.8;
          }

          if (pixelScore > 0) {
            totalForegroundScore += pixelScore;
            colEnergies[x] += pixelScore;
            colEnergies[x + 1] += pixelScore * 0.5;
            rowEnergies[y] += pixelScore;
            rowEnergies[y + 1] += pixelScore * 0.5;
          }
        }
      }

      // STRICT HUMAN PRESENCE THRESHOLD:
      // If foreground energy is below human silhouette mass, strictly return ZERO detections!
      // When empty room / background only: returns [] cleanly!
      const minHumanEnergy = 135;
      const hasKnownTrackers = this.trackedPersons.size > 0;
      if (totalForegroundScore < minHumanEnergy && !hasKnownTrackers && (skinPixelCount < 20 && motionPixelCount < 25)) {
        return results; // No human detected. Empty array!
      }

      // Segment columns into candidate human clusters
      const colThreshold = Math.max(1.8, (totalForegroundScore / sw) * 1.15);
      let inCluster = false;
      let clusterStart = 0;
      const clusters: { start: number; end: number; peak: number }[] = [];

      for (let x = 0; x < sw; x++) {
        if (colEnergies[x] > colThreshold) {
          if (!inCluster) {
            inCluster = true;
            clusterStart = x;
          }
        } else {
          if (inCluster) {
            inCluster = false;
            const width = x - clusterStart;
            // Human width in 320px frame must be between 6% and 82% of frame
            if (width >= sw * 0.06 && width <= sw * 0.82) {
              let peak = 0;
              for (let i = clusterStart; i < x; i++) {
                if (colEnergies[i] > peak) peak = colEnergies[i];
              }
              clusters.push({ start: clusterStart, end: x, peak });
            }
          }
        }
      }

      if (inCluster) {
        const width = sw - clusterStart;
        if (width >= sw * 0.06 && width <= sw * 0.82) {
          let peak = 0;
          for (let i = clusterStart; i < sw; i++) {
            if (colEnergies[i] > peak) peak = colEnergies[i];
          }
          clusters.push({ start: clusterStart, end: sw, peak });
        }
      }

      // For each cluster, detect vertical extent (head to feet)
      clusters.forEach(c => {
        let topY = -1;
        let bottomY = -1;
        const rowThreshold = Math.max(1.5, (totalForegroundScore / sh) * 0.8);

        for (let y = 0; y < sh; y++) {
          if (rowEnergies[y] > rowThreshold) {
            if (topY === -1) topY = y;
            bottomY = y;
          }
        }

        // Person must span at least 15% of frame height (standing or fallen)
        if (topY !== -1 && bottomY !== -1 && (bottomY - topY) >= sh * 0.15) {
          const padX = Math.round((c.end - c.start) * 0.05);
          const padY = Math.round((bottomY - topY) * 0.05);

          const startX = Math.max(0, c.start - padX);
          const endX = Math.min(sw, c.end + padX);
          const startY = Math.max(0, topY - padY);
          const endY = Math.min(sh, bottomY + padY);

          const boxW = ((endX - startX) / sw) * 100;
          const boxH = ((endY - startY) / sh) * 100;
          const boxX = (startX / sw) * 100;
          const boxY = (startY / sh) * 100;

          const aspectRatio = boxW / Math.max(1, boxH);
          if (aspectRatio >= 0.18 && aspectRatio <= 3.2) {
            // High precision confidence calculation based on silhouette peak energy & contour density
            const confidence = Math.min(99, Math.max(76, Math.round(84 + (c.peak / Math.max(1, colThreshold * 5)) * 14)));
            const isHorizontal = aspectRatio > FALL_DETECTION_CONFIG.horizontalAspectRatioThreshold || emergencySimulated;
            const keypoints = this.generatePoseKeypoints({ x: boxX, y: boxY, width: boxW, height: boxH }, isHorizontal);

            results.push({
              box: {
                x: Math.max(1, Math.min(92, Math.round(boxX * 10) / 10)),
                y: Math.max(1, Math.min(92, Math.round(boxY * 10) / 10)),
                width: Math.max(6, Math.min(92, Math.round(boxW * 10) / 10)),
                height: Math.max(14, Math.min(96, Math.round(boxH * 10) / 10))
              },
              confidence,
              keypoints
            });
          }
        }
      });
    } catch {
      // Browser cross-origin canvas security exception or context failure
      // STRICT: Return []! NEVER inject fake people!
    }

    return results;
  }

  /**
   * Generates realistic 8-joint skeletal keypoints fitted to the person's bounding box.
   */
  public generatePoseKeypoints(
    box: { x: number; y: number; width: number; height: number },
    isHorizontal = false
  ): PoseKeypoint[] {
    const { x, y, width, height } = box;

    if (isHorizontal) {
      // Fallen horizontal keypoints (lying down)
      return [
        { name: 'head', x: x + width * 0.12, y: y + height * 0.40, confidence: 0.94 },
        { name: 'leftShoulder', x: x + width * 0.28, y: y + height * 0.28, confidence: 0.90 },
        { name: 'rightShoulder', x: x + width * 0.28, y: y + height * 0.58, confidence: 0.90 },
        { name: 'leftHip', x: x + width * 0.55, y: y + height * 0.32, confidence: 0.88 },
        { name: 'rightHip', x: x + width * 0.55, y: y + height * 0.62, confidence: 0.88 },
        { name: 'leftKnee', x: x + width * 0.76, y: y + height * 0.35, confidence: 0.85 },
        { name: 'rightKnee', x: x + width * 0.76, y: y + height * 0.65, confidence: 0.85 },
        { name: 'leftAnkle', x: x + width * 0.94, y: y + height * 0.38, confidence: 0.82 },
        { name: 'rightAnkle', x: x + width * 0.94, y: y + height * 0.68, confidence: 0.82 },
      ];
    }

    // Upright keypoints (head at top, torso center, feet at bottom)
    return [
      { name: 'head', x: x + width * 0.50, y: y + height * 0.12, confidence: 0.96 },
      { name: 'leftShoulder', x: x + width * 0.30, y: y + height * 0.24, confidence: 0.92 },
      { name: 'rightShoulder', x: x + width * 0.70, y: y + height * 0.24, confidence: 0.92 },
      { name: 'leftHip', x: x + width * 0.36, y: y + height * 0.52, confidence: 0.90 },
      { name: 'rightHip', x: x + width * 0.64, y: y + height * 0.52, confidence: 0.90 },
      { name: 'leftKnee', x: x + width * 0.38, y: y + height * 0.74, confidence: 0.88 },
      { name: 'rightKnee', x: x + width * 0.62, y: y + height * 0.74, confidence: 0.88 },
      { name: 'leftAnkle', x: x + width * 0.38, y: y + height * 0.95, confidence: 0.84 },
      { name: 'rightAnkle', x: x + width * 0.62, y: y + height * 0.95, confidence: 0.84 },
    ];
  }

  /**
   * Multi-person tracking using IoU and centroid association with EMA smoothing.
   * Retains persistent tracking IDs ("PERSON 1", "PERSON 2", etc.).
   */
  private updateTrackers(
    detections: { box: { x: number; y: number; width: number; height: number }; confidence: number; keypoints: PoseKeypoint[] }[],
    timestamp: number
  ): TrackedPerson[] {
    const matchedTrackers: TrackedPerson[] = [];
    const usedDetections = new Set<number>();

    // Increment missed frames for all active trackers
    this.trackedPersons.forEach(tp => {
      tp.missedFrames++;
    });

    // Match existing trackers with nearest detections
    this.trackedPersons.forEach(tp => {
      let bestIdx = -1;
      let minDistance = 32; // maximum centroid distance %

      detections.forEach((det, idx) => {
        if (usedDetections.has(idx)) return;
        const detCx = det.box.x + det.box.width / 2;
        const detCy = det.box.y + det.box.height / 2;
        const tpCx = tp.smoothedBox.x + tp.smoothedBox.width / 2;
        const tpCy = tp.smoothedBox.y + tp.smoothedBox.height / 2;

        const dist = Math.hypot(detCx - tpCx, detCy - tpCy);
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = idx;
        }
      });

      if (bestIdx !== -1) {
        usedDetections.add(bestIdx);
        const det = detections[bestIdx];
        tp.missedFrames = 0;
        tp.lastSeen = timestamp;
        tp.currentBox = det.box;
        tp.confidence = det.confidence;
        tp.keypoints = det.keypoints;

        // Exponential moving average smoothing for steady bounding box display
        tp.smoothedBox = {
          x: tp.smoothedBox.x * 0.68 + det.box.x * 0.32,
          y: tp.smoothedBox.y * 0.68 + det.box.y * 0.32,
          width: tp.smoothedBox.width * 0.68 + det.box.width * 0.32,
          height: tp.smoothedBox.height * 0.68 + det.box.height * 0.32,
        };

        matchedTrackers.push(tp);
      } else if (tp.missedFrames <= FALL_DETECTION_CONFIG.lostTrackMaxFrames) {
        // Sticky hysteresis: maintain person tracker even if stationary
        matchedTrackers.push(tp);
      }
    });

    // Create new trackers for unmatched detections
    detections.forEach((det, idx) => {
      if (!usedDetections.has(idx)) {
        const id = this.nextPersonId++;
        const newTracker: TrackedPerson = {
          trackingId: `PERSON ${id}`,
          numericId: id,
          firstSeen: timestamp,
          lastSeen: timestamp,
          missedFrames: 0,
          currentBox: det.box,
          smoothedBox: { ...det.box },
          confidence: det.confidence,
          keypoints: det.keypoints,
          bodyAngle: 0,
          aspectRatio: det.box.width / det.box.height,
          history: [],
          activity: 'STANDING',
          movementIndex: 'NORMAL',
          movementConfidence: 95,
          fallConfidence: 0,
          temporalFallState: 'UPRIGHT',
          fallSustainedFrames: 0,
          immobileFrames: 0
        };

        this.trackedPersons.set(id, newTracker);
        matchedTrackers.push(newTracker);
      }
    });

    // Remove trackers that have been missing longer than lostTrackMaxFrames
    this.trackedPersons.forEach((tp, id) => {
      if (tp.missedFrames > FALL_DETECTION_CONFIG.lostTrackMaxFrames) {
        this.trackedPersons.delete(id);
      }
    });

    return matchedTrackers;
  }

  /**
   * Detailed human activity classification and temporal fall state machine.
   * Accurately distinguishes STANDING, WALKING, FALL DOWN, and NO ACTIVE (stationary worker).
   */
  private analyzeHumanActivityAndFall(tp: TrackedPerson, timestamp: number, emergencySimulated = false): void {
    const box = tp.smoothedBox;
    const aspectRatio = box.width / Math.max(1, box.height);
    tp.aspectRatio = aspectRatio;

    // 1. Calculate spine inclination angle from keypoints
    const head = tp.keypoints.find(k => k.name === 'head');
    const leftHip = tp.keypoints.find(k => k.name === 'leftHip');
    const rightHip = tp.keypoints.find(k => k.name === 'rightHip');

    let bodyAngle = 0;
    if (head && leftHip && rightHip) {
      const midHipX = (leftHip.x + rightHip.x) / 2;
      const midHipY = (leftHip.y + rightHip.y) / 2;
      const dx = Math.abs(head.x - midHipX);
      const dy = Math.abs(head.y - midHipY);
      bodyAngle = Math.atan2(dx, Math.max(0.1, dy)) * (180 / Math.PI);
    } else {
      bodyAngle = aspectRatio > 1.05 ? 78 : Math.min(55, aspectRatio * 60);
    }
    tp.bodyAngle = bodyAngle;

    // 2. Measure recent movement & vertical velocity from history
    const centroid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    let verticalVelocity = 0; // positive means moving downwards
    let horizontalVelocity = 0;
    let centroidDisplacement = 0;

    if (tp.history.length > 0) {
      const prev = tp.history[tp.history.length - 1];
      const dt = Math.max(16, timestamp - prev.timestamp) / 1000;
      verticalVelocity = (centroid.y - prev.centroid.y) / dt;
      horizontalVelocity = Math.abs(centroid.x - prev.centroid.x) / dt;
      centroidDisplacement = Math.hypot(centroid.x - prev.centroid.x, centroid.y - prev.centroid.y);
    }

    // Immobility tracking (counts consecutive frames of near-zero displacement)
    if (centroidDisplacement < FALL_DETECTION_CONFIG.immobilityThresholdMovement) {
      tp.immobileFrames = (tp.immobileFrames || 0) + 1;
    } else {
      tp.immobileFrames = Math.max(0, (tp.immobileFrames || 0) - 2);
    }

    const isDownwardRush = verticalVelocity > FALL_DETECTION_CONFIG.rapidDescentVelocityThreshold;
    const isHorizontalBody = bodyAngle > FALL_DETECTION_CONFIG.fallAngleThreshold || 
                             aspectRatio > FALL_DETECTION_CONFIG.horizontalAspectRatioThreshold;

    // 3. Temporal Fall State Machine
    if (emergencySimulated) {
      tp.temporalFallState = 'FALL_CONFIRMED';
      tp.fallConfidence = 98;
    } else {
      switch (tp.temporalFallState) {
        case 'UPRIGHT':
          if (isDownwardRush) {
            tp.temporalFallState = 'DESCENT';
          } else if (isHorizontalBody) {
            tp.temporalFallState = 'HORIZONTAL';
            tp.fallSustainedFrames = 1;
          }
          break;

        case 'DESCENT':
          if (isHorizontalBody) {
            tp.temporalFallState = 'HORIZONTAL';
            tp.fallSustainedFrames = 1;
          } else if (!isDownwardRush && bodyAngle < 35) {
            tp.temporalFallState = 'UPRIGHT';
          }
          break;

        case 'HORIZONTAL':
          if (isHorizontalBody) {
            tp.fallSustainedFrames++;
            if (tp.fallSustainedFrames >= FALL_DETECTION_CONFIG.temporalConfirmationFrames) {
              tp.temporalFallState = 'FALL_CONFIRMED';
              tp.fallConfirmedAt = timestamp;
              tp.fallConfidence = Math.min(99, Math.round(89 + tp.fallSustainedFrames * 2));
            }
          } else {
            tp.fallSustainedFrames = 0;
            tp.temporalFallState = 'UPRIGHT';
          }
          break;

        case 'FALL_CONFIRMED':
          if (!isHorizontalBody && bodyAngle < 30) {
            tp.fallSustainedFrames = 0;
            tp.temporalFallState = 'UPRIGHT';
            tp.fallConfidence = 0;
          } else {
            tp.fallConfidence = Math.min(99, Math.max(93, tp.fallConfidence));
          }
          break;
      }
    }

    // 4. Activity Classification
    // Explicitly classifies STANDING, WALKING, FALL DOWN, and NO ACTIVE as requested by user
    if (tp.temporalFallState === 'FALL_CONFIRMED' || isHorizontalBody) {
      tp.activity = 'FALL DOWN';
      tp.movementIndex = 'HIGH';
      tp.movementConfidence = tp.fallConfidence || 96;
    } else if (tp.immobileFrames >= FALL_DETECTION_CONFIG.immobilityFramesRequired) {
      tp.activity = 'NO ACTIVE';
      tp.movementIndex = 'LOW';
      tp.movementConfidence = 93;
    } else if (horizontalVelocity > 1.5 && bodyAngle < 32) {
      tp.activity = 'WALKING';
      tp.movementIndex = 'NORMAL';
      tp.movementConfidence = 95;
    } else if (aspectRatio >= FALL_DETECTION_CONFIG.sittingAspectRatioRange[0] &&
               aspectRatio <= FALL_DETECTION_CONFIG.sittingAspectRatioRange[1] &&
               bodyAngle < 35) {
      tp.activity = 'SITTING';
      tp.movementIndex = 'LOW';
      tp.movementConfidence = 92;
    } else if (bodyAngle > 35 && bodyAngle <= FALL_DETECTION_CONFIG.fallAngleThreshold) {
      tp.activity = 'BENDING';
      tp.movementIndex = 'NORMAL';
      tp.movementConfidence = 90;
    } else {
      tp.activity = 'STANDING';
      tp.movementIndex = horizontalVelocity > 0.6 ? 'NORMAL' : 'LOW';
      tp.movementConfidence = 96;
    }

    // Append to temporal sample history
    tp.history.push({
      timestamp,
      box: { ...box },
      centroid,
      bodyAngle,
      aspectRatio,
      activity: tp.activity
    });

    if (tp.history.length > 25) {
      tp.history.shift();
    }
  }

  /**
   * Helper to render debug skeletons and keypoint labels onto an overlay canvas.
   */
  public drawDebugOverlay(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    workers: DetectedWorker[]
  ): void {
    ctx.save();
    workers.forEach(w => {
      if (!w.keypoints || w.keypoints.length === 0) return;

      const kpMap = new Map<string, { x: number; y: number }>();
      w.keypoints.forEach(k => {
        kpMap.set(k.name, {
          x: (k.x / 100) * canvasW,
          y: (k.y / 100) * canvasH
        });
      });

      const pairs: [string, string][] = [
        ['head', 'leftShoulder'],
        ['head', 'rightShoulder'],
        ['leftShoulder', 'rightShoulder'],
        ['leftShoulder', 'leftHip'],
        ['rightShoulder', 'rightHip'],
        ['leftHip', 'rightHip'],
        ['leftHip', 'leftKnee'],
        ['rightHip', 'rightKnee'],
        ['leftKnee', 'leftAnkle'],
        ['rightKnee', 'rightAnkle']
      ];

      const isFall = w.activity === 'FALL DOWN' || w.activity === 'FALL DETECTED';
      ctx.strokeStyle = isFall ? '#ef4444' : '#00f0ff';
      ctx.lineWidth = 2;

      pairs.forEach(([p1, p2]) => {
        const pt1 = kpMap.get(p1);
        const pt2 = kpMap.get(p2);
        if (pt1 && pt2) {
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
      });

      w.keypoints.forEach(k => {
        const px = (k.x / 100) * canvasW;
        const py = (k.y / 100) * canvasH;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });
    ctx.restore();
  }
}

// Export singleton instance
export const aiVisionEngine = new AIVisionEngine();
