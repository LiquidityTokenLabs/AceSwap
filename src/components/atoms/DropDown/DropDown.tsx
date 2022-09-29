import styled from '@emotion/styled'
import { FC, useState } from 'react'
import { Color } from '../../../utils/Color'
import { FaAngleDown } from 'react-icons/fa'
import { Network } from '../../../domains/Network'
import Image from 'next/image'

type Props = {
  label: string
  src?: string
  color: string
  mouseOver: () => void
  mouseLeave: () => void
  isOpenMenu: boolean
  menuItems: Network[]
  clickHandler: (id: number) => void
  isFloat?: boolean
}

export const DropDown: FC<Props> = ({
  label,
  src = '404',
  color,
  mouseOver,
  mouseLeave,
  isOpenMenu,
  menuItems,
  clickHandler,
  isFloat = true,
}) => {
  const getBody = () => {
    if (!isOpenMenu) return <></>
    return (
      <Body>
        {menuItems.map((e) => {
          return (
            <Item key={e.name} onClick={() => clickHandler(e.id)}>
              {e.src !== '404' ? (
                <IconWrapper>
                  <Image src={e.src} alt={e.name} width={20} height={20} />
                </IconWrapper>
              ) : (
                <Circle />
              )}
              <Label>{e.name}</Label>
            </Item>
          )
        })}
      </Body>
    )
  }

  return (
    <Root onMouseOver={mouseOver} onMouseLeave={mouseLeave}>
      <Btn color={color} isFloat={isFloat}>
        <Wrapper>
          <Circle>
            {src !== '404' && (
              <Image src={src} alt={label} width={20} height={20} />
            )}
          </Circle>
          <Label>{label}</Label>
          <FaAngleDown />
        </Wrapper>
      </Btn>
      {getBody()}
    </Root>
  )
}

const Btn = styled('button')((p: { color: string; isFloat: boolean }) => ({
  background: p.color,
  borderRadius: '16px',
  boxSizing: 'border-box',
  border: `1px solid ${Color.pure_white}`,
  cursor: 'pointer',
  padding: '0',
  width: '200px',
  boxShadow: p.isFloat
    ? 'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px'
    : 'none',
}))

const Label = styled('div')({
  fontSize: '16px',
  width: '120px',
  textAlign: 'left',
})

const Wrapper = styled('div')({
  display: 'flex',
  gap: '8px',
  margin: '12px 8px',
  alignItems: 'center',
})

const Circle = styled('div')({
  width: '20px',
  height: '20px',
  borderRadius: '10px',
  background: Color.gray,
})

const Body = styled('div')({
  marginTop: '8px',
  zIndex: 99,
  background: Color.pure_white,
  borderRadius: '16px',
  padding: '16px',
  width: '200px',
})

const Root = styled('div')({
  width: 'fit-content',
})

const Item = styled('div')({
  fontSize: '16px',
  cursor: 'pointer',
  margin: '8px',
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  ':hover': {
    background: Color.base_white,
  },
})

const IconWrapper = styled('div')({
  width: '20px',
  height: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})
