export const Color = {
  base_white: '#F7F8FA',
  pure_white: '#FFFFFF',
  line: '#EDEEF2',
  gray: '#D9D9D9',
  pink: '#D52D6F',
  text_black: '#0F111A',
  text_gray: '#8E8E8E',
  text_disable: '#CECECE',
  disable: '#E0E0E0',
  error: '#C93E35',
  success: '#2E7D32',
  blue: '#668FCB',
}

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}
export const hexToRgba = (hex: string, alpha: number) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha,
      }
    : {
        r: 0,
        g: 0,
        b: 0,
        a: alpha,
      }
}

export const hexToHsl = (hex: string) => {
  const rgb = hexToRgb(hex)

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  const h = (() => {
    switch (min) {
      case max:
        return 0
      case r:
        return 60 * ((b - g) / diff) + 180
      case g:
        return 60 * ((r - b) / diff) + 300
      case b:
        return 60 * ((g - r) / diff) + 60
    }
  })()

  const s = diff / (1 - Math.abs(max + min - 1))
  const l = (max + min) / 2

  return { h, s, l }
}
