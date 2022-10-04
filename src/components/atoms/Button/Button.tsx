import styled from '@emotion/styled'
import { FC } from 'react'
import { Color, hexToHsl } from '../../../utils/Color'

type Props = {
  label: string
  margin: string
  color: string
  fontColor?: string
  bgColor?: string
  fontSize?: string
  disabled?: boolean
  onClick: () => void
  isFloat?: boolean
  isRound?: boolean
}

export const Button: FC<Props> = ({
  label,
  margin,
  color,
  fontColor = Color.text_black,
  bgColor = color,
  fontSize = '16px',
  disabled = false,
  onClick,
  isFloat = true,
  isRound = true,
}) => {
  if (disabled) {
    return (
      <DisableButton>
        <Label
          margin={margin}
          fontColor={Color.text_disable}
          fontSize={fontSize}>
          {label}
        </Label>
      </DisableButton>
    )
  }

  return (
    <Btn
      color={color}
      bgColor={bgColor}
      onClick={onClick}
      isFloat={isFloat}
      isRound={isRound}>
      <Label margin={margin} fontColor={fontColor} fontSize={fontSize}>
        {label}
      </Label>
    </Btn>
  )
}

const getBorderColor = (color: string) => {
  const { h, s, l } = hexToHsl(color)
  const result = `hsl(${h}, ${s * 100}%, ${Math.max(l * 100 - 20, 0)}%)`
  return result
}

const Btn = styled('button')(
  (p: {
    color: string
    bgColor: string
    isFloat: boolean
    isRound: boolean
  }) => ({
    background: p.bgColor,
    borderRadius: p.isRound ? '100px' : '16px',
    boxSizing: 'border-box',
    border: `1px solid ${Color.blue}`,
    cursor: 'pointer',
    padding: '0',
    boxShadow: p.isFloat
      ? 'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px'
      : 'none',
  })
)

const DisableButton = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  background: Color.disable,
  borderRadius: '16px',
  boxSizing: 'border-box',
  border: `1px solid ${Color.disable}`,
  padding: '0',
  boxShadow:
    'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
})

const Label = styled('div')(
  (p: { margin: string; fontColor: string; fontSize: string }) => ({
    margin: p.margin,
    fontSize: p.fontSize,
    color: p.fontColor,
  })
)
