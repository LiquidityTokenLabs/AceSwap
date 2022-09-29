import styled from '@emotion/styled'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { FC, ReactNode, useState } from 'react'
import { MenuItem } from '../../../domains/MenuItem'
import { Color } from '../../../utils/Color'

type Props = {
  icon: ReactNode
  menuItems: MenuItem[]
}

export const Menu: FC<Props> = ({ icon, menuItems }) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const router = useRouter()
  const openMenu = () => {
    setIsOpenMenu(true)
  }
  const closeMenu = () => {
    setIsOpenMenu(false)
  }

  const getButton = (item: MenuItem) => {
    return (
      <Wrapper>
        {item.icon}
        <Item>{item.label}</Item>
      </Wrapper>
    )
  }

  const getContent = (item: MenuItem) => {
    if (item.available) {
      if (item.type === 'BUTTON') {
        return (
          <MenuItems onClick={item.clickHandler}>{getButton(item)}</MenuItems>
        )
      } else {
        if (item.linkInfo && item.linkInfo.isOutside) {
          return (
            <MenuItems>
              <Wrapper>
                {item.icon}
                <OutsideLink href={item.linkInfo.href || ''} target="_blank">
                  <Item>{item.label}</Item>
                </OutsideLink>
              </Wrapper>
            </MenuItems>
          )
        } else {
          return (
            <MenuItems>
              <Wrapper
                onClick={() => {
                  console.log(item.linkInfo?.locale)
                }}>
                {item.icon}
                <Link
                  href={item.linkInfo?.href || '/'}
                  locale={item.linkInfo?.locale}>
                  <Item>{item.label}</Item>
                </Link>
              </Wrapper>
            </MenuItems>
          )
        }
      }
    } else {
      if (item.type === 'BUTTON') {
        return <MenuItemsDisable>{getButton(item)}</MenuItemsDisable>
      } else {
        if (item.linkInfo && item.linkInfo.isOutside) {
          return (
            <MenuItemsDisable>
              <Wrapper>
                {item.icon}
                <OutsideLink href={item.linkInfo.href || ''} target="_blank">
                  <Item>{item.label}</Item>
                </OutsideLink>
              </Wrapper>
            </MenuItemsDisable>
          )
        } else {
          return (
            <MenuItemsDisable>
              <Wrapper>
                {item.icon}
                <Link
                  href={item.linkInfo?.href || ''}
                  locale={item.linkInfo?.locale}>
                  <Item>{item.label}</Item>
                </Link>
              </Wrapper>
            </MenuItemsDisable>
          )
        }
      }
    }
  }

  return (
    <MenuWrapper onMouseOver={openMenu} onMouseLeave={closeMenu}>
      {icon}
      {isOpenMenu && (
        <SMenu>
          {menuItems.map((e, i) => {
            return (
              <React.Fragment key={i}>
                {getContent(e)}
                {i === menuItems.length - 1 || <Hr />}
              </React.Fragment>
            )
          })}
        </SMenu>
      )}
    </MenuWrapper>
  )
}

const SMenu = styled('div')({
  position: 'absolute',
  top: '60px',
  left: '-140px',

  width: '200px',
  background: Color.pure_white,
  padding: '8px',
  borderRadius: '8px',
  boxSizing: 'border-box',

  ':hover': {
    border: `none`,
  },
})

const MenuWrapper = styled('div')({
  position: 'relative',
  ':hover': {
    height: '100px',
  },
})

const MenuItems = styled('div')({
  fontSize: '16px',
  margin: '4px',
  cursor: 'pointer',
  color: Color.text_black,
  ':hover': {
    background: Color.base_white,
  },
})
const MenuItemsDisable = styled('div')({
  fontSize: '16px',
  margin: '4px',
  color: Color.text_disable,
})

const Hr = styled('div')({
  height: '1px',
  background: Color.gray,
})

const Wrapper = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  margin: '0px 8px',
  height: '30px',
})

const Item = styled('div')({
  fontSize: '16px',
})

const OutsideLink = styled('a')({
  textDecoration: 'none',
  color: Color.text_black,
})
