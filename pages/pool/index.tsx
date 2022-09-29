import type { NextPage } from 'next'
import styled from '@emotion/styled'
import { PoolBoard } from '../../src/features/pool/Board'
import { useRouter } from 'next/router'
import { Button } from '../../src/components/atoms/Button/Button'
import { Color } from '../../src/utils/Color'

import { Props as ToastProps } from '../../src/components/atoms/Toast/Toast'
import { Dispatch } from 'react'

type Props = {
  setToast: Dispatch<ToastProps>
}

const Buy: NextPage<Props> = ({ setToast }) => {
  const router = useRouter()
  return (
    <Root>
      <Contents>
        <Header>
          <Title>Pool</Title>
          <BtnWrapper>
            <Button
              label="Auto Staking"
              margin="12px 16px"
              color={Color.pure_white}
              onClick={() => router.push('pool/autostaking')}
            />
            <Button
              label="Create pool"
              margin="12px 16px"
              color={Color.pure_white}
              onClick={() => ''}
            />
          </BtnWrapper>
        </Header>
        <PoolBoard setToast={setToast} />
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

const Header = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  width: '870px',
  marginBottom: '28px',
})

const Title = styled('div')({
  fontSize: '36px',
})

const BtnWrapper = styled('div')({
  display: 'flex',
  gap: '8px',
})
