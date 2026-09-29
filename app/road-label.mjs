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
        best = { point, angle, length: chord };
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
  return best && { point: best.point, angle: best.angle };
}
