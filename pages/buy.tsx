import type { NextPage } from 'next'
import styled from '@emotion/styled'

import { BuyBoard } from '../src/features/buy/Board'
import { Dispatch } from 'react'
import { Props as ToastProps } from '../src/components/atoms/Toast/Toast'

type Props = {
  networkId: number
  setToast: Dispatch<ToastProps>
}

const Buy: NextPage<Props> = ({ networkId, setToast }) => {
  return (
    <Root>
      <Contents>
        <BuyBoard networkId={networkId} setToast={setToast} />
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
