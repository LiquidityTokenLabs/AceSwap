import { FC } from 'react'
import { Component } from './Component'

type Props = {}

export const EmptyPool: FC<Props> = ({}) => {
  return <Component text="You don't have staking pool" />
}
