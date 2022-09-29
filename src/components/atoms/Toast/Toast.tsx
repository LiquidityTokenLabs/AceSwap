import styled from '@emotion/styled'
import { FC, useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { ImInfo, ImNotification } from 'react-icons/im'
import { MdClear } from 'react-icons/md'
import { Color } from '../../../utils/Color'

export type Props = {
  isOpen: boolean
  toastMessage: string
  toastState: 'Error' | 'Success' | 'Init'
  time: string
}

export const Toast: FC<Props> = ({
  isOpen,
  toastMessage,
  toastState,
  time,
}) => {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('')

  useEffect(() => {
    console.log('update')
    setMsg(toastMessage)
    setOpen(isOpen)
    setType(toastState)
    setTimeout(() => {
      closeSnackbar()
    }, 6000)
  }, [isOpen, toastMessage, toastState, time])

  const closeSnackbar = () => {
    setOpen(false)
    setMsg('')
    setType('')
  }
  const getIcon = () => {
    if (type === 'Error') {
      return <ImNotification style={{ color: Color.error }} />
    }
    if (type === 'Success') {
      return <ImInfo style={{ color: Color.success }} />
    }
  }

  if (!open) {
    return null
  } else {
    return (
      <Root>
        <IconWrapper color={Color.base_white}>
          <IconContext.Provider value={{ size: '20px' }}>
            {getIcon()}
          </IconContext.Provider>
        </IconWrapper>
        <Wrapper>
          <Text>{msg}</Text>
          <IconButton onClick={closeSnackbar}>
            <IconContext.Provider value={{ size: '24px' }}>
              <MdClear style={{ margin: '6px', color: Color.text_black }} />
            </IconContext.Provider>
          </IconButton>
        </Wrapper>
      </Root>
    )
  }
}

const Root = styled('span')({
  position: 'absolute',
  top: '80px',
  right: '32px',
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center',
  background: Color.base_white,
  boxShadow:
    'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
  borderRadius: '10px',
  minWidth: '300px',
})

const Text = styled('div')({
  paddingRight: '16px',
  fontSize: '12px',
  color: Color.text_black,
  borderRadius: '0px 10px 10px 0px',
  marginBottom: '1px',
})

const Wrapper = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  marginRight: '8px',
})

const IconWrapper = styled('div')((p: { color: string }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: p.color,
  padding: '16px',
  borderRadius: '10px 0px 0px 10px',
  borderRight: `1px solid ${Color.base_white}`,
}))

const IconButton = styled('div')({})
