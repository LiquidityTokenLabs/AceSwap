import { ethers } from 'ethers'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import { Dispatch, FC, useEffect, useState } from 'react'
import { FaArrowLeft } from 'react-icons/fa'
import { Card } from '../../../../components/atoms/Card/Card'
import { NftFrame } from '../../../../components/molecules/NftFrame/NftFrame'
import { Nft } from '../../../../domains/Nft'
import { Color } from '../../../../utils/Color'
import { StakeButton } from '../StakeButton'
import {
  TOKEN_721_ABI,
  CONTRACT_ADDRESS,
  POOL_ADDRESS,
} from '../../../../utils/Config'

import POOL_ABI from '../../../../../artifacts/contracts/AceSwap.sol/AceSwap.json'
import { Props as ToastProps } from '../../../../components/atoms/Toast/Toast'

type Props = {
  title: string
  items: Nft[]
  chainId: number
  setToast: Dispatch<ToastProps>
}

declare global {
  interface Window {
    ethereum: any
  }
}

export const Component: FC<Props> = ({ title, items, chainId, setToast }) => {
  const [nfts, setNfts] = useState<Nft[]>([])
  const router = useRouter()

  const networkSelectorMouseOver = () => {}
  const networkSelectorMouseLeave = () => {}

  const poolAddress = POOL_ADDRESS
  const contractAddress = CONTRACT_ADDRESS

  useEffect(() => {
    setNfts(items)
  }, [items])

  const stakeItems = async () => {
    const ids = nfts.filter((nft) => nft.isActive).map((nft) => nft.id)
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(poolAddress, POOL_ABI.abi, signer)

    const filter = contract.filters.StakeNFT()

    contract.once(filter, async () => {
      const newToast: ToastProps = {
        isOpen: true,
        toastMessage: 'Staked NFT',
        toastState: 'Success',
        time: new Date().getTime().toString(),
      }
      setToast(newToast)
    })

    const nftContract = new ethers.Contract(
      contractAddress,
      TOKEN_721_ABI,
      signer
    )

    const stakeTokeIdList = ids //フロント側からの入力
    ids.forEach((id) => {
      nftContract.approve(poolAddress, id, {
        gasLimit: '500000',
      })
    })

    await contract.stakeNFT(stakeTokeIdList, {
      gasLimit: '3000000',
    })
  }

  const select = (num: number) => {
    const newNfts = nfts.map((nft, i) => {
      if (i === num) {
        nft.isActive = !nft.isActive
      }
      return nft
    })
    setNfts(newNfts)
  }

  return (
    <Root>
      <Card padding="26px">
        <Container>
          <Header>
            <IconWrapper onClick={() => router.push('/pool')}>
              <FaArrowLeft />
            </IconWrapper>
            <Title>{title}</Title>
          </Header>
          <ItemsWrapper>
            {items.map((e, i) => {
              return (
                <Item key={e.name} onClick={() => select(i)}>
                  <NftFrame
                    collection={e.collection}
                    name={e.name}
                    src={e.src}
                    isActive={e.isActive}
                    chainId={chainId}
                  />
                </Item>
              )
            })}
          </ItemsWrapper>
          <BtnWrapper>
            <StakeButton onClick={stakeItems} />
          </BtnWrapper>
        </Container>
      </Card>
    </Root>
  )
}

const Root = styled('div')({
  width: '870px',
})
const Container = styled('div')({})

const Header = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '20px',
  position: 'relative',
  paddingBottom: '30px',
  borderBottom: `1px solid ${Color.line}`,
})

const Title = styled('div')({
  fontSize: '24px',
})

const Item = styled('div')({})

const ItemsWrapper = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '18px',
})

const BtnWrapper = styled('div')({
  marginTop: '20px',
  display: 'flex',
  justifyContent: 'end',
})

const IconWrapper = styled('div')({
  width: '32px',
  height: '32px',
  position: 'absolute',
  left: '0px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '32px',
  ':hover': {
    background: Color.gray,
  },
})
