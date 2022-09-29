import { FC } from 'react'
import { Component } from './Component'

type Props = {
  onClick: () => void
}

export const BuyButton: FC<Props> = ({ onClick }) => {
  return <Component text="Buy" onClick={onClick} />
}
