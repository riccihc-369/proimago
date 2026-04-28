import type { FrameAnalysis, Point } from '../types'

const SAMPLE_WIDTH = 48
const SAMPLE_HEIGHT = 64

export const FRAME_ANALYSIS_INTERVAL_MS = 700

export const EMPTY_FRAME_ANALYSIS: FrameAnalysis = {
  brightness: 0,
  brightnessPercent: 0,
  contrast: 0,
  dominantPoint: { x: 0.5, y: 0.5 },
  dominantSpread: 0,
  isTooCentral: false,
  topEmptyRatio: 0,
  isTopTooEmpty: false,
  isTooDark: false,
  isTooFlat: false,
  score: 0,
  detectedSubjects: undefined,
}

export function analyzeFrame(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
): FrameAnalysis {
  const context = canvasElement.getContext('2d', { willReadFrequently: true })
  if (!context || !videoElement.videoWidth || !videoElement.videoHeight) {
    return EMPTY_FRAME_ANALYSIS
  }

  canvasElement.width = SAMPLE_WIDTH
  canvasElement.height = SAMPLE_HEIGHT
  context.drawImage(videoElement, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)

  const imageData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
  const luminance = new Float32Array(SAMPLE_WIDTH * SAMPLE_HEIGHT)
  let brightnessSum = 0

  for (let index = 0; index < luminance.length; index += 1) {
    const pixelIndex = index * 4
    const red = imageData.data[pixelIndex]
    const green = imageData.data[pixelIndex + 1]
    const blue = imageData.data[pixelIndex + 2]
    const value = red * 0.2126 + green * 0.7152 + blue * 0.0722
    luminance[index] = value
    brightnessSum += value
  }

  const brightness = brightnessSum / luminance.length
  const brightnessPercent = Math.round((brightness / 255) * 100)
  let varianceSum = 0
  let minLuma = 255
  let maxLuma = 0
  let weightedX = 0
  let weightedY = 0
  let topEnergy = 0
  let totalEnergy = 0

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const index = y * SAMPLE_WIDTH + x
      const value = luminance[index]
      varianceSum += (value - brightness) ** 2
      minLuma = Math.min(minLuma, value)
      maxLuma = Math.max(maxLuma, value)

      const right = x < SAMPLE_WIDTH - 1 ? luminance[index + 1] : value
      const down = y < SAMPLE_HEIGHT - 1 ? luminance[index + SAMPLE_WIDTH] : value
      const energy = Math.abs(value - right) + Math.abs(value - down)
      totalEnergy += energy
      weightedX += energy * x
      weightedY += energy * y

      if (y < SAMPLE_HEIGHT * 0.28) {
        topEnergy += energy
      }
    }
  }

  const stdDeviation = Math.sqrt(varianceSum / luminance.length)
  const contrast = Math.min(100, ((maxLuma - minLuma) / 255) * 100)
  const dominantPoint: Point =
    totalEnergy > 0
      ? {
          x: clamp(weightedX / totalEnergy / (SAMPLE_WIDTH - 1), 0, 1),
          y: clamp(weightedY / totalEnergy / (SAMPLE_HEIGHT - 1), 0, 1),
        }
      : { x: 0.5, y: 0.5 }

  const centerDistance = Math.hypot(dominantPoint.x - 0.5, dominantPoint.y - 0.5)
  const isTooCentral = centerDistance < 0.16
  const dominantSpread = clamp(0.18 + stdDeviation / 180, 0.18, 0.4)
  const topEmptyRatio = totalEnergy > 0 ? clamp(topEnergy / totalEnergy, 0, 1) : 0
  const isTopTooEmpty = topEmptyRatio < 0.16
  const isTooDark = brightness < 72
  const isTooFlat = contrast < 24 || stdDeviation < 20

  let score = 76
  score -= Math.max(0, 16 - Math.round(centerDistance * 100 * 0.9))
  score -= isTooCentral ? 14 : 0
  score -= isTopTooEmpty ? 10 : 0
  score -= isTooDark ? 16 : 0
  score -= isTooFlat ? 12 : 0
  score += brightness > 95 && brightness < 180 ? 6 : 0
  score += contrast > 34 ? 6 : 0
  score = clamp(Math.round(score), 0, 100)

  return {
    brightness: Math.round(brightness),
    brightnessPercent,
    contrast: Math.round(contrast),
    dominantPoint,
    dominantSpread,
    isTooCentral,
    topEmptyRatio,
    isTopTooEmpty,
    isTooDark,
    isTooFlat,
    score,
    // TODO: Merge MediaPipe/object detection subjects into this analysis in V0.2.
    detectedSubjects: undefined,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
