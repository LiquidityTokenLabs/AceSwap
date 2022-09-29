import { FC } from 'react'
import { Component } from './Component'

type Props = {
  onClick: () => void
}

export const SellButton: FC<Props> = ({ onClick }) => {
  return <Component text="Sell" onClick={onClick} />
}
