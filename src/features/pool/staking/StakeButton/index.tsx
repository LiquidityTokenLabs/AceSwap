import { FC } from 'react'
import { Component } from './Component'

type Props = {
  onClick: () => void
}

export const StakeButton: FC<Props> = ({ onClick }) => {
  return <Component text="Staking" onClick={onClick} />
}
