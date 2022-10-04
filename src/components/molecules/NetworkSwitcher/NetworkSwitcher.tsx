import styled from '@emotion/styled'
import { FC } from 'react'
import { Color } from '../../../utils/Color'

import Image from 'next/image'
import { FaAngleDown } from 'react-icons/fa'
import { IoWarningOutline } from 'react-icons/io5'

type Props = {
  chainName: string
  changeAstar: () => void
}

export const NetworkSwitcher: FC<Props> = ({ chainName, changeAstar }) => {
  console.log({ chainName })
  if (chainName === 'ERR') {
    return (
      <SwitchNetwork onClick={changeAstar}>
        <IoWarningOutline />
        <Text>Switch Network</Text>
        <FaAngleDown />
      </SwitchNetwork>
    )
  }

  return (
    <Astar>
      <Image src="/icons/astar.jpeg" alt="astar" width={20} height={20} />
      <Text>Astar</Text>
    </Astar>
  )
}

const SwitchNetwork = styled('div')({
  background: Color.error,
  color: Color.pure_white,
  // border: `1px solid ${Color.blue}`,
  display: 'flex',
  alignItems: 'center',
  height: '50px',
  padding: '8px',
  borderRadius: '16px',
})

const Astar = styled('div')({
  background: Color.pure_white,
  color: Color.blue,
  border: `1px solid ${Color.blue}`,
  padding: '8px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  height: '50px',
})

const Text = styled('div')({
  fontSize: '16px',
  margin: '0px 16px',
  minWidth: '100px',
})
