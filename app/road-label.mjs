export function roadLabel(value) {
  if (typeof value !== "string") return null;

  const name = value.trim();
  if (
    !name ||
    /^(?:N\/D|N\/A)$/i.test(name) ||
    /^[\d\s./-]+[A-Z]?$/i.test(name) ||
    /^[A-Z]{1,4}[- ]*\d[\d\s./-]*[A-Z]?$/i.test(name)
  ) {
    return null;
  }

  return name;
}

export function roadLabelPlacement(coordinates, project, width, viewport) {
  if (!Array.isArray(coordinates) || coordinates.length < 2 || !width) return null;
  const points = coordinates.map(project);
  let best = null;
  let start = 0;

  function consider(end) {
    if (end <= start) return;
    const chord = Math.hypot(points[end].x - points[start].x, points[end].y - points[start].y);
    if (chord < width + 12 || (best && chord <= best.length)) return;

    let length = 0;
    for (let i = start + 1; i <= end; i++) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    let remaining = length / 2;
    for (let i = start + 1; i <= end; i++) {
      const a = points[i - 1];
      const b = points[i];
      const segment = Math.hypot(b.x - a.x, b.y - a.y);
      if (remaining > segment && i < end) {
        remaining -= segment;
        continue;
      }
      const point = {
        x: a.x + (b.x - a.x) * remaining / segment,
        y: a.y + (b.y - a.y) * remaining / segment,
      };
      let angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      const radians = angle * Math.PI / 180;
      const halfX = (Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * 18) / 2 + 4;
      const halfY = (Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * 18) / 2 + 4;
      if (point.x >= halfX && point.y >= halfY &&
          point.x <= viewport.x - halfX && point.y <= viewport.y - halfY) {
        best = { point, angle, halfX, halfY, length: chord };
      }
      return;
    }
  }

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const origin = points[start];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const baseX = a.x - origin.x;
    const baseY = a.y - origin.y;
    const baseLength = Math.hypot(baseX, baseY);
    const segmentLength = Math.hypot(dx, dy);
    const turn = baseLength ? Math.abs(Math.atan2(baseX * dy - baseY * dx, baseX * dx + baseY * dy)) : 0;
    const deviation = baseLength ? Math.abs(baseX * (b.y - origin.y) - baseY * (b.x - origin.x)) / baseLength : 0;
    if (!segmentLength || turn > Math.PI / 9 || deviation > 8) {
      consider(i - 1);
      start = i - 1;
    }
  }
  consider(points.length - 1);
  return best && { point: best.point, angle: best.angle, halfX: best.halfX, halfY: best.halfY };
}

// Splits a projected polyline into the runs that lie inside the viewport (Liang–Barsky clipping).
export function clipToViewport(points, viewport) {
  const runs = [];
  let run = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let t0 = 0;
    let t1 = 1;
    let visible = true;
    for (const [p, q] of [[-dx, a.x], [dx, viewport.x - a.x], [-dy, a.y], [dy, viewport.y - a.y]]) {
      if (p === 0) {
        if (q < 0) visible = false;
      } else {
        const t = q / p;
        if (p < 0) t0 = Math.max(t0, t);
        else t1 = Math.min(t1, t);
      }
    }
    if (!visible || t0 > t1) {
      run = null;
      continue;
    }
    const start = { x: a.x + t0 * dx, y: a.y + t0 * dy };
    const end = { x: a.x + t1 * dx, y: a.y + t1 * dy };
    if (!run || t0 > 0) {
      run = [start];
      runs.push(run);
    }
    run.push(end);
    if (t1 < 1) run = null;
  }
  return runs;
}

// Places a label on the on-screen part of a (possibly long, joined) road, so a street longer
// than the viewport is still labelled where it is visible. Longest visible run wins.
export function placeRoadLabel(coordinates, project, width, viewport) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const runs = clipToViewport(coordinates.map(project), viewport)
    .map((points) => ({ points, length: Math.hypot(points.at(-1).x - points[0].x, points.at(-1).y - points[0].y) }))
    .sort((a, b) => b.length - a.length);
  for (const { points } of runs) {
    const placement = roadLabelPlacement(points, (point) => point, width, viewport);
    if (placement) return placement;
  }
  return null;
}

// True when two placed labels (from roadLabelPlacement) would overlap on screen.
export function labelsOverlap(a, b) {
  return Math.abs(a.point.x - b.point.x) < a.halfX + b.halfX &&
    Math.abs(a.point.y - b.point.y) < a.halfY + b.halfY;
}

function pathLength(coordinates) {
  let length = 0;
  for (let i = 1; i < coordinates.length; i++) {
    length += Math.hypot(coordinates[i][0] - coordinates[i - 1][0], coordinates[i][1] - coordinates[i - 1][1]);
  }
  return length;
}

// Road data splits each street into short block-long pieces, which are too short to carry a
// label until very deep zoom. Join pieces with the same name (and group) that share an endpoint
// into longer chains, longest first, so the regular placement rules can label them earlier.
export function mergeRoadSegments(segments) {
  const key = ([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`;
  const groups = new Map();
  for (const segment of segments) {
    if (!segment.name || !Array.isArray(segment.coordinates) || segment.coordinates.length < 2) continue;
    const id = `${segment.group ?? ""}\u0000${segment.name}`;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(segment);
  }

  const chains = [];
  for (const list of groups.values()) {
    const ends = new Map();
    list.forEach(({ coordinates }, index) => {
      for (const point of [coordinates[0], coordinates.at(-1)]) {
        const end = key(point);
        if (!ends.has(end)) ends.set(end, []);
        ends.get(end).push(index);
      }
    });
    const used = new Set();
    const next = (point) => ends.get(key(point))?.find((index) => !used.has(index));

    list.forEach(({ name, group, coordinates }, index) => {
      if (used.has(index)) return;
      used.add(index);
      let line = [...coordinates];
      for (let j = next(line.at(-1)); j !== undefined; j = next(line.at(-1))) {
        used.add(j);
        const piece = list[j].coordinates;
        const forward = key(piece[0]) === key(line.at(-1)) ? piece : [...piece].reverse();
        line = line.concat(forward.slice(1));
      }
      for (let j = next(line[0]); j !== undefined; j = next(line[0])) {
        used.add(j);
        const piece = list[j].coordinates;
        const forward = key(piece.at(-1)) === key(line[0]) ? piece : [...piece].reverse();
        line = forward.slice(0, -1).concat(line);
      }
      chains.push({ name, group, coordinates: line, length: pathLength(line) });
    });
  }

  return chains.sort((a, b) => b.length - a.length);
}
