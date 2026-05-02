import type { ColorTemperatureHint, FrameAnalysis, Point } from '../types'

const SAMPLE_WIDTH = 48
const SAMPLE_HEIGHT = 64

export const FRAME_ANALYSIS_INTERVAL_MS = 700

export const EMPTY_FRAME_ANALYSIS: FrameAnalysis = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  backgroundClutter: 0,
  highlightClipping: 0,
  shadowClipping: 0,
  colorTemperatureHint: undefined,
  dominantWeight: 0,
  topEmptySpace: 0,
  score: 0,
  dominantPoint: { x: 0.5, y: 0.5 },
  dominantSpread: 0,
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
  let luminanceSum = 0
  let saturationSum = 0
  let redSum = 0
  let greenSum = 0
  let blueSum = 0

  for (let index = 0; index < luminance.length; index += 1) {
    const pixelIndex = index * 4
    const red = imageData.data[pixelIndex]
    const green = imageData.data[pixelIndex + 1]
    const blue = imageData.data[pixelIndex + 2]
    const value = red * 0.2126 + green * 0.7152 + blue * 0.0722
    luminance[index] = value
    luminanceSum += value
    saturationSum += getPixelSaturation(red, green, blue)
    redSum += red
    greenSum += green
    blueSum += blue
  }

  const pixelCount = luminance.length
  const averageLuminance = luminanceSum / pixelCount
  const brightness = Math.round((averageLuminance / 255) * 100)
  const saturation = Math.round((saturationSum / pixelCount) * 100)
  const averageRed = redSum / pixelCount
  const averageGreen = greenSum / pixelCount
  const averageBlue = blueSum / pixelCount

  let varianceSum = 0
  let minLuma = 255
  let maxLuma = 0
  let weightedX = 0
  let weightedY = 0
  let topEnergy = 0
  let totalEnergy = 0
  let highFrequencyEnergy = 0
  let crispEdgeCount = 0
  let localContrastEnergy = 0
  let borderEnergy = 0
  let borderPixelCount = 0
  let borderCrispEdgeCount = 0
  let highlightPixels = 0
  let shadowPixels = 0

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const index = y * SAMPLE_WIDTH + x
      const value = luminance[index]
      varianceSum += (value - averageLuminance) ** 2
      minLuma = Math.min(minLuma, value)
      maxLuma = Math.max(maxLuma, value)
      highlightPixels += value > 245 ? 1 : 0
      shadowPixels += value < 12 ? 1 : 0

      const right = x < SAMPLE_WIDTH - 1 ? luminance[index + 1] : value
      const down = y < SAMPLE_HEIGHT - 1 ? luminance[index + SAMPLE_WIDTH] : value
      const energy = Math.abs(value - right) + Math.abs(value - down)
      totalEnergy += energy
      weightedX += energy * x
      weightedY += energy * y

      if (y < SAMPLE_HEIGHT * 0.28) {
        topEnergy += energy
      }

      if (isBorderBand(x, y)) {
        borderEnergy += energy
        borderPixelCount += 1
      }

      if (x > 0 && x < SAMPLE_WIDTH - 1 && y > 0 && y < SAMPLE_HEIGHT - 1) {
        const left = luminance[index - 1]
        const up = luminance[index - SAMPLE_WIDTH]
        const laplacian = Math.abs(4 * value - left - right - up - down)
        highFrequencyEnergy += laplacian
        localContrastEnergy += Math.abs(value - left) + Math.abs(value - up)

        if (laplacian > 18) {
          crispEdgeCount += 1
          if (isBorderBand(x, y)) {
            borderCrispEdgeCount += 1
          }
        }
      }
    }
  }

  const stdDeviation = Math.sqrt(varianceSum / pixelCount)
  const contrast = Math.round(Math.min(100, ((maxLuma - minLuma) / 255) * 100))
  const interiorPixelCount = Math.max(1, (SAMPLE_WIDTH - 2) * (SAMPLE_HEIGHT - 2))
  const averageHighFrequency = highFrequencyEnergy / interiorPixelCount
  const crispEdgeShare = crispEdgeCount / interiorPixelCount
  const averageLocalContrast = localContrastEnergy / (interiorPixelCount * 2)
  const averageBorderEnergy = borderEnergy / Math.max(1, borderPixelCount)
  const borderCrispShare = borderCrispEdgeCount / Math.max(1, borderPixelCount)
  const sharpness = clamp(
    Math.round(
      averageHighFrequency * 1.9 +
        crispEdgeShare * 34 +
        Math.min(16, averageLocalContrast * 0.28) -
        Math.max(0, 18 - contrast) * 0.35,
      ),
    0,
    100,
  )
  const backgroundClutter = clamp(
    Math.round(
      averageBorderEnergy * 1.55 +
        borderCrispShare * 42 +
        Math.max(0, averageLocalContrast - 10) * 0.45,
    ),
    0,
    100,
  )
  const highlightClipping = clamp(Math.round((highlightPixels / pixelCount) * 100), 0, 100)
  const shadowClipping = clamp(Math.round((shadowPixels / pixelCount) * 100), 0, 100)
  const dominantPoint: Point =
    totalEnergy > 0
      ? {
          x: clamp(weightedX / totalEnergy / (SAMPLE_WIDTH - 1), 0, 1),
          y: clamp(weightedY / totalEnergy / (SAMPLE_HEIGHT - 1), 0, 1),
        }
      : { x: 0.5, y: 0.5 }

  const centerDistance = Math.hypot(dominantPoint.x - 0.5, dominantPoint.y - 0.5)
  const dominantSpread = clamp(0.18 + stdDeviation / 180, 0.18, 0.42)
  const dominantWeight = Math.round(
    clamp(((1 - dominantSpread) * 100 + contrast * 0.4) / 1.4, 0, 100),
  )
  const topEnergyShare = totalEnergy > 0 ? clamp(topEnergy / totalEnergy, 0, 1) : 0
  const topEmptySpace = Math.round(
    clamp((1 - clamp(topEnergyShare / 0.28, 0, 1)) * 100, 0, 100),
  )

  let score = 78
  score -= brightness < 28 ? 18 : brightness < 38 ? 8 : 0
  score -= contrast < 22 ? 12 : 0
  score -= saturation < 14 ? 8 : saturation > 82 ? 5 : 0
  score -= sharpness < 24 ? 18 : sharpness < 40 ? 9 : 0
  score -= centerDistance < 0.16 ? 12 : 0
  score -= topEmptySpace > 62 ? 10 : 0
  score += brightness >= 38 && brightness <= 72 ? 6 : 0
  score += contrast >= 28 && contrast <= 60 ? 5 : 0
  score += saturation >= 18 && saturation <= 62 ? 4 : 0
  score += sharpness >= 60 ? 4 : sharpness >= 48 ? 2 : 0
  score += centerDistance >= 0.16 && centerDistance <= 0.34 ? 4 : 0
  score = clamp(Math.round(score), 0, 100)

  return {
    brightness,
    contrast,
    saturation,
    sharpness,
    backgroundClutter,
    highlightClipping,
    shadowClipping,
    colorTemperatureHint: getColorTemperatureHint(averageRed, averageGreen, averageBlue, saturation),
    dominantWeight,
    topEmptySpace,
    score,
    dominantPoint,
    dominantSpread,
    // TODO: Merge MediaPipe/object detection subjects into this analysis in V0.2.
    detectedSubjects: undefined,
  }
}

function getPixelSaturation(red: number, green: number, blue: number) {
  const maxChannel = Math.max(red, green, blue)
  const minChannel = Math.min(red, green, blue)
  if (maxChannel === 0) {
    return 0
  }

  return (maxChannel - minChannel) / maxChannel
}

function getColorTemperatureHint(
  averageRed: number,
  averageGreen: number,
  averageBlue: number,
  saturation: number,
): ColorTemperatureHint {
  const warmBias = averageRed - averageBlue
  const neutralBand = Math.abs(warmBias) < 14 || saturation < 12

  if (neutralBand) {
    return 'neutral'
  }

  if (warmBias > 0 && averageRed >= averageGreen * 0.94) {
    return 'warm'
  }

  if (warmBias < 0 && averageBlue >= averageGreen * 0.96) {
    return 'cool'
  }

  return 'neutral'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isBorderBand(x: number, y: number) {
  return (
    x < SAMPLE_WIDTH * 0.18 ||
    x >= SAMPLE_WIDTH * 0.82 ||
    y < SAMPLE_HEIGHT * 0.18 ||
    y >= SAMPLE_HEIGHT * 0.82
  )
}
