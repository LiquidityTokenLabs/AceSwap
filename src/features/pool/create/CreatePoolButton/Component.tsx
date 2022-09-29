import { FC } from 'react'
import { Button } from '../../../../components/atoms/Button/Button'
import { Color } from '../../../../utils/Color'

type Props = {
  text: string
  onClick: () => void
}

export const Component: FC<Props> = ({ text, onClick }) => {
  return (
    <Button
      label={text}
      margin="16px 154px"
      color={Color.base_white}
      onClick={onClick}
    />
  )
}
