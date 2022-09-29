import type { NextPage } from 'next'
import styled from '@emotion/styled'

import { AutoStakingBoard } from '../../src/features/pool/staking/Board'

import { Props as ToastProps } from '../../src/components/atoms/Toast/Toast'
import { Dispatch } from 'react'

type Props = {
  setToast: Dispatch<ToastProps>
}
const Buy: NextPage<Props> = ({ setToast }) => {
  return (
    <Root>
      <Contents>
        <AutoStakingBoard setToast={setToast} />
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
