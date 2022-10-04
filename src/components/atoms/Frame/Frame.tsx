import styled from '@emotion/styled'
import { ReactNode, FC } from 'react'
import { Color } from '../../../utils/Color'

type Props = {
  children: ReactNode
  isActive: boolean
}

export const Frame: FC<Props> = ({ children, isActive }) => {
  return <Root isActive={isActive}>{children}</Root>
}

const Root = styled('div')((p: { isActive: boolean }) => ({
  background: Color.base_white,
  cursor: 'pointer',
  width: '120px',
  height: '150px',
  border: `2px solid ${p.isActive ? Color.blue : Color.base_white}`,
  borderRadius: '16px',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  ':hover': {
    border: `2px solid ${p.isActive ? Color.blue : Color.gray}`,
  },
}))
