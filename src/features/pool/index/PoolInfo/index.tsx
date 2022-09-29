import { Dispatch, FC } from 'react'
import { Component } from './Component'
import { Pool } from '../../../../domains/Pool'
import { Props as ToastProps } from '../../../../components/atoms/Toast/Toast'
type Props = {
  pool: Pool
  setToast: Dispatch<ToastProps>
}

export const PoolInfo: FC<Props> = ({ pool, setToast }) => {
  return (
    <Component
      pool={pool}
      curveTypeText="bonding curve"
      volatilityText="volatilit"
      divergenceText="divergence"
      setToast={setToast}
    />
  )
}
