import styled from '@emotion/styled'
import { Dispatch, FC, useState } from 'react'
import { EmptyPool } from '../index/EmptyPool'
import { PoolInfo } from '../index/PoolInfo'
import { Pool } from '../../../domains/Pool'
import { Card } from '../../../components/atoms/Card/Card'
import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'
type Props = {
  title: string
  pools: Pool[]
  setToast: Dispatch<ToastProps>
}

export const Component: FC<Props> = ({ pools, setToast }) => {
  if (pools.length === 0) {
    return (
      <Root>
        <Card padding="26px">
          <EmptyPool />
        </Card>
      </Root>
    )
  }
  return (
    <Root>
      <Card padding="26px">
        <Header>
          <Title>{`$Pool(${pools.length})`}</Title>
        </Header>
        <PoolsWrapper>
          {pools.map((pool) => {
            return <PoolInfo key={pool.id} pool={pool} setToast={setToast} />
          })}
        </PoolsWrapper>
      </Card>
    </Root>
  )
}

const Root = styled('div')({
  width: '870px',
})

const PoolsWrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
})

const Header = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  height: '50px',
})

const Title = styled('div')({
  fontSize: '24px',
})
