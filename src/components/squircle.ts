// iOS "squircle" (continuous-curvature superellipse) shape, approximated for
// the web via an SVG path used as a clip-path. Plain border-radius produces
// circular-arc corners; real iOS icons/panels use a smoother superellipse
// blend. n=5 is a close approximation of Apple's actual curve.
export function squirclePath(width: number, height: number, n = 5): string {
  const steps = 64
  const rx = width / 2
  const ry = height / 2
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const cosT = Math.cos(t)
    const sinT = Math.sin(t)
    const x = rx + rx * Math.sign(cosT) * Math.abs(cosT) ** (2 / n)
    const y = ry + ry * Math.sign(sinT) * Math.abs(sinT) ** (2 / n)
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}

export function squircleClipPath(width: number, height: number, n = 5): string {
  return `path('${squirclePath(width, height, n)}')`
}
