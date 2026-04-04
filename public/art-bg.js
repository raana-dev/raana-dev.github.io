const layer = document.getElementById("mist-layer");

if (layer) {
  const BASE_RGB = [119, 221, 119];
  const TOTAL_COUNT = 8;
  const CORNER_COUNT = 2;
  const RANDOM_COUNT = TOTAL_COUNT - CORNER_COUNT;
  const SIZE_MIN = 80;
  const SIZE_MAX = 96;
  const DIST_MIN_BASE = 32;
  const DIST_MIN_ADAPT = 8;
  const DIST_MAX_BASE = 36;
  const DIST_MAX_ADAPT = 8;
  const guaranteedDiagonalIsTopLeftBottomRight = Math.random() < 0.5;
  const guaranteedCorners = guaranteedDiagonalIsTopLeftBottomRight
    ? [
        { x: 4, y: 4 },
        { x: 96, y: 96 },
      ]
    : [
        { x: 96, y: 4 },
        { x: 4, y: 96 },
      ];
  const EXCLUDED_CORNERS = guaranteedDiagonalIsTopLeftBottomRight
    ? [
        { x: 96, y: 4 },
        { x: 4, y: 96 },
      ]
    : [
        { x: 4, y: 4 },
        { x: 96, y: 96 },
      ];
  const EXCLUDED_CORNER_RADIUS = 20;
  const points = [];
  let planeSide = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;

  const randomInRange = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const updatePlaneBounds = () => {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    const maxViewportDimension = Math.max(viewportWidth, viewportHeight);
    planeSide = maxViewportDimension * 1.2;

    layer.style.inset = "auto";
    layer.style.width = String(planeSide) + "px";
    layer.style.height = String(planeSide) + "px";
    layer.style.left = String((viewportWidth - planeSide) * 0.5) + "px";
    layer.style.top = String((viewportHeight - planeSide) * 0.5) + "px";
  };

  updatePlaneBounds();

  const sizeWeight = (size) => (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN);

  const adaptiveMinDistance = (sizeA, sizeB) => {
    const mixedWeight = (sizeWeight(sizeA) + sizeWeight(sizeB)) * 0.3;
    return DIST_MIN_BASE + mixedWeight * DIST_MIN_ADAPT;
  };

  const adaptiveMaxDistance = (sizeA, sizeB) => {
    const mixedWeight = (sizeWeight(sizeA) + sizeWeight(sizeB)) * 0.3;
    return DIST_MAX_BASE + mixedWeight * DIST_MAX_ADAPT;
  };

  const nearestPointInfo = (x, y) => {
    if (points.length === 0) {
      return null;
    }

    let nearestPoint = points[0];
    let nearestDistance = Math.hypot(x - nearestPoint.x, y - nearestPoint.y);

    for (let i = 1; i < points.length; i += 1) {
      const p = points[i];
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestPoint = p;
      }
    }

    return { point: nearestPoint, distance: nearestDistance };
  };

  const inExcludedCorner = (x, y) => {
    for (let i = 0; i < EXCLUDED_CORNERS.length; i += 1) {
      const c = EXCLUDED_CORNERS[i];
      if (Math.hypot(x - c.x, y - c.y) < EXCLUDED_CORNER_RADIUS) {
        return true;
      }
    }
    return false;
  };

  const addGlow = (config) => {
    const glow = document.createElement("i");
    glow.className = "glow";

    glow.style.setProperty(
      "--rgb",
      String(BASE_RGB[0]) +
        ", " +
        String(BASE_RGB[1]) +
        ", " +
        String(BASE_RGB[2]),
    );
    glow.style.setProperty("--x", String(config.x) + "%");
    glow.style.setProperty("--y", String(config.y) + "%");
    glow.style.setProperty("--size", String(config.size) + "vmax");
    glow.style.setProperty("--ratio", String(config.ratio));
    glow.style.setProperty("--blur", String(config.blur) + "px");
    glow.style.setProperty("--opacity", String(config.opacity));

    layer.appendChild(glow);
    points.push({ x: config.x, y: config.y, size: config.size });
  };

  for (let i = 0; i < CORNER_COUNT; i += 1) {
    const corner = guaranteedCorners[i];
    const size = randomInRange(58, 66);
    const sizeMix = sizeWeight(size);

    addGlow({
      x: corner.x,
      y: corner.y,
      size,
      ratio: randomInRange(0.96, 1.12),
      blur: randomInRange(96, 112),
      opacity: clamp(0.7 + sizeMix * 0.18, 0.68, 0.88),
    });
  }

  for (let i = 0; i < RANDOM_COUNT; i += 1) {
    const size = randomInRange(SIZE_MIN, SIZE_MAX);
    const sizeMix = sizeWeight(size);
    let bestCandidate = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let attempt = 0; attempt < 140; attempt += 1) {
      const candidate = { x: randomInRange(14, 86), y: randomInRange(14, 86) };
      if (inExcludedCorner(candidate.x, candidate.y)) {
        continue;
      }

      const nearest = nearestPointInfo(candidate.x, candidate.y);
      if (!nearest) {
        bestCandidate = candidate;
        break;
      }

      const minDist = adaptiveMinDistance(size, nearest.point.size);
      const maxDist = adaptiveMaxDistance(size, nearest.point.size);

      if (nearest.distance >= minDist && nearest.distance <= maxDist) {
        bestCandidate = candidate;
        break;
      }

      const score = Math.min(
        Math.abs(nearest.distance - minDist),
        Math.abs(nearest.distance - maxDist),
      );
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate) {
      bestCandidate = { x: randomInRange(18, 82), y: randomInRange(18, 82) };
    }

    addGlow({
      x: bestCandidate.x,
      y: bestCandidate.y,
      size,
      ratio: randomInRange(0.96, 1.12),
      blur: randomInRange(96, 112),
      opacity: clamp(0.55 + sizeMix * 0.2 + randomInRange(0, 0.04), 0.52, 0.82),
    });
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!prefersReducedMotion) {
    const startAngle = randomInRange(0, Math.PI * 2);
    const cycleMs = randomInRange(16384,32768);
    const accelMs = 3000;
    const directionShiftMinMs = 3200;
    const directionShiftMaxMs = 4800;
    const directionJitterRad = 0.16;
    const noiseShiftMinMs = 1200;
    const noiseShiftMaxMs = 2200;

    let angle = startAngle;
    let targetAngle = startAngle;
    let angleVelocity = 0;
    let noiseValue = 0;
    let noiseTarget = 0;

    let lastFrame = performance.now();
    const startAt = lastFrame;
    let nextDirectionShiftAt =
      startAt +
      accelMs +
      randomInRange(directionShiftMinMs, directionShiftMaxMs);
    let nextNoiseShiftAt =
      startAt + randomInRange(noiseShiftMinMs, noiseShiftMaxMs);
    const breathPhase = randomInRange(0, Math.PI * 2);

    let baseAmplitude = 0;

    const recomputeAmplitude = () => {
      const margin = Math.max(
        24,
        (planeSide - Math.min(viewportWidth, viewportHeight)) * 0.5,
      );
      baseAmplitude = margin * randomInRange(0.72, 0.86);
    };

    recomputeAmplitude();

    const shortestAngleDiff = (a, b) => {
      return Math.atan2(Math.sin(b - a), Math.cos(b - a));
    };

    const smoothstep = (t) => t * t * (3 - 2 * t);

    const tick = (now) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      if (now >= nextDirectionShiftAt) {
        targetAngle += randomInRange(-directionJitterRad, directionJitterRad);
        nextDirectionShiftAt =
          now + randomInRange(directionShiftMinMs, directionShiftMaxMs);
      }

      if (now >= nextNoiseShiftAt) {
        noiseTarget = randomInRange(-0.06, 0.06);
        nextNoiseShiftAt =
          now + randomInRange(noiseShiftMinMs, noiseShiftMaxMs);
      }

      const launchT = clamp((now - startAt) / accelMs, 0, 1);
      const launchFactor = smoothstep(launchT);

      const angleDelta = shortestAngleDiff(angle, targetAngle);
      angleVelocity += angleDelta * dt * 1.2;
      angleVelocity *= Math.exp(-1.9 * dt);
      angle += angleVelocity * dt;

      noiseValue += (noiseTarget - noiseValue) * Math.min(1, dt * 0.9);

      const elapsed = now - startAt;
      const phase = ((elapsed % cycleMs) / cycleMs) * Math.PI * 2;
      const breathing = 1 + 0.08 * Math.sin(phase * 2 + breathPhase);
      const rhythm = Math.sin(phase) * breathing * (1 + noiseValue);
      const radius = baseAmplitude * launchFactor * rhythm;

      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;

      layer.style.transform =
        "translate3d(" +
        offsetX.toFixed(2) +
        "px, " +
        offsetY.toFixed(2) +
        "px, 0)";
      requestAnimationFrame(tick);
    };

    window.addEventListener("resize", () => {
      updatePlaneBounds();
      recomputeAmplitude();
    });

    requestAnimationFrame(tick);
  }
}
