import styled from '@emotion/styled'
import { FC, useState } from 'react'
import { Color } from '../../../utils/Color'
import { getNetworkConfByChainId } from '../../../utils/Config'
import { Frame } from '../../atoms/Frame/Frame'
import Image from 'next/image'

type Props = {
  amount?: number
  src: string
  collection: string
  name: string
  isActive: boolean
  chainId: number
}

export const NftFrame: FC<Props> = ({
  amount = -Infinity,
  src,
  collection,
  name,
  isActive,
  chainId,
}) => {
  const chainConf = getNetworkConfByChainId(chainId)

  return (
    <Frame isActive={isActive}>
      <Root>
        <NftImage>
          <Img src={src} />
        </NftImage>
        <Wrapper>
          <IconWrapper>
            <Image
              src={chainConf?.src || ''}
              alt={'chain logo'}
              width={20}
              height={20}
            />
          </IconWrapper>
          {amount !== -Infinity && <Text>{amount.toFixed(3)}</Text>}
        </Wrapper>
      </Root>
    </Frame>
  )
}

const Wrapper = styled('div')({
  marginTop: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
})

const Circle = styled('div')({
  width: '16px',
  height: '16px',
  borderRadius: '8px',
  background: Color.gray,
})

const Text = styled('span')({
  fontSize: '16px',
  lineHeight: '19px',
})

const Root = styled('div')({
  marginTop: '6px',
  marginRight: '6px',
  marginLeft: '6px',
})

const NftImage = styled('div')({
  width: '108px',
  height: '108px',
  borderRadius: '16px',
})

const Img = styled('img')({
  width: '100%',
  height: '100%',
  borderRadius: '16px',
  objectFit: 'contain',
})

const Info = styled('div')({
  fontSize: '12px',
  fontWeight: 700,
})
const Label = styled('div')({
  fontSize: '8px',
})

const InfoWrapper = styled('div')({
  margin: '8px',
})

const IconWrapper = styled('div')({
  width: '20px',
  height: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})
