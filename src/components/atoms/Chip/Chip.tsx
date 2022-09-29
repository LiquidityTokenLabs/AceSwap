import styled from '@emotion/styled'
import { FC } from 'react'
import { Color } from '../../../utils/Color'

type Props = {
  label: string
}

export const Chip: FC<Props> = ({ label }) => {
  return <Root>{label}</Root>
}

const Root = styled('span')({
  background: Color.gray,
  padding: '4px 16px',
  borderRadius: '12px',
  fontSize: '8px',
})
