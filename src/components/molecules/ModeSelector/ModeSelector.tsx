import styled from '@emotion/styled'
import { Dispatch, FC } from 'react'
import { Color } from '../../../utils/Color'

type Props = {
  options: string[]
  activeNum: number
  setActiveNum: Dispatch<number>
}

export const ModeSelector: FC<Props> = ({
  options,
  activeNum,
  setActiveNum,
}) => {
  const handleClick = (i: number) => {
    setActiveNum(i)
  }
  return (
    <Root>
      {options.map((o, i) => {
        return (
          <ClickArea
            key={o}
            isActive={i === activeNum}
            onClick={() => handleClick(i)}>
            <Select isActive={i === activeNum}>{o}</Select>
          </ClickArea>
        )
      })}
    </Root>
  )
}

const Root = styled('span')({
  display: 'inline-flex',
  gap: '8px',
  padding: '2px',
  borderRadius: '100px',
  border: `1px solid ${Color.blue}`,
  background: Color.pure_white,
  height: '50px',
  // boxShadow:
  //   'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
})

const ClickArea = styled('div')((p: { isActive: boolean }) => ({
  borderRadius: '100px',
  cursor: 'pointer',
  ':hover': {
    color: Color.text_black,
  },
  background: p.isActive ? Color.base_white : Color.pure_white,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}))

const Select = styled('div')((p: { isActive: boolean }) => ({
  margin: '0px 12px',
  fontSize: '16px',
  fontWeight: p.isActive ? 600 : 400,
  ':hover': {
    color: p.isActive ? Color.blue : Color.text_black,
  },
  color: p.isActive ? Color.blue : Color.text_gray,
}))
