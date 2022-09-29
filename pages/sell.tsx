import type { NextPage } from 'next'
import styled from '@emotion/styled'

import { SellBoard } from '../src/features/sell/Board'

import { Dispatch } from 'react'
import { Props as ToastProps } from '../src/components/atoms/Toast/Toast'

type Props = {
  setToast: Dispatch<ToastProps>
}

const Buy: NextPage<Props> = ({ setToast }) => {
  return (
    <Root>
      <Contents>
        <SellBoard setToast={setToast} />
      </Contents>
    </Root>
  )
}

export default Buy

const Root = styled('div')({
  // marginTop: '76px',
})

const Contents = styled('div')({
  // paddingTop: '44px',
  display: 'grid',
  justifyItems: 'center',
})
