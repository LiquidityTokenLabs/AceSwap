import { FC } from 'react'
import { Component } from './Component'

type Props = {
  onClick: () => void
}

export const CreatePoolButton: FC<Props> = ({ onClick }) => {
  return <Component text="Create pool" onClick={onClick} />
}
