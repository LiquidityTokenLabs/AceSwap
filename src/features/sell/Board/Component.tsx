import styled from '@emotion/styled'
import { Dispatch, FC, useEffect, useState } from 'react'
import { Card } from '../../../components/atoms/Card/Card'
import { Nft } from '../../../domains/Nft'
import { SellButton } from '../SellButton'

import { ethers } from 'ethers'
import POOL_ABI from '../../../../artifacts/contracts/AceSwap.sol/AceSwap.json'
import { CONTRACT_ADDRESS, POOL_ADDRESS } from '../../../utils/Config'
import TOKEN_721_ABI from '../../../../artifacts/contracts/SampleNFT.sol/SampleNFT.json'
import { Color } from '../../../utils/Color'
import { NftFrameWrapper } from './NftFrameWrapper'

import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'

type Props = {
  title: string
  items: Nft[]
  delta: number
  chainId: number
  sellNum: number
  setToast: Dispatch<ToastProps>
}

export const Component: FC<Props> = ({
  title,
  items,
  delta,
  chainId,
  sellNum,
  setToast,
}) => {
  const [nfts, setNfts] = useState<Nft[]>([])
  const [anchorAmount, setAnchorAmount] = useState(0)
  const [totalFee, setTotalFee] = useState(0)

  const selectedCount = nfts.filter((nft) => nft.isActive).length

  const poolAddress = POOL_ADDRESS
  const contractAddress = CONTRACT_ADDRESS

  const networkSelectorMouseOver = () => {}
  const networkSelectorMouseLeave = () => {}

  useEffect(() => {
    setNfts(items)
  }, [items])

  const sellItems = async () => {
    const ids = nfts.filter((nft) => nft.isActive).map((nft) => nft.id)
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(poolAddress, POOL_ABI.abi, signer)

    const swapTokenIdList = ids //フロント側からの入力
    const minExpectFee = await contract.getCalcSellInfo(ids.length) //フロント側からの入力

    const nftContract = new ethers.Contract(
      contractAddress,
      TOKEN_721_ABI.abi,
      signer
    )

    const filter = contract.filters.SwapNFTforFT()

    contract.once(filter, async () => {
      console.log('uttayo')
      const newToast: ToastProps = {
        isOpen: true,
        toastMessage: 'Sold NFT',
        toastState: 'Success',
        time: new Date().getTime().toString(),
      }
      setToast(newToast)
    })
    console.log({ ids })
    ids.forEach((id) => {
      nftContract.approve(poolAddress, id, {
        gasLimit: '500000',
      })
    })

    console.log({ swapTokenIdList })

    contract.swapNFTforFT(swapTokenIdList, minExpectFee, {
      gasLimit: '3000000',
    })
  }

  const select = (num: number) => {
    console.log({ sellNum })
    const newNfts = nfts.map((nft, i) => {
      if (i === num) {
        if (!nft.isActive) {
          if (selectedCount < sellNum) {
            nft.isActive = true
          } else {
            const newToast: ToastProps = {
              isOpen: true,
              toastMessage: 'Cannot be selected',
              toastState: 'Error',
              time: new Date().getTime().toString(),
            }
            console.log({ newToast })
            setToast(newToast)
          }
        } else {
          nft.isActive = false
        }
      }
      return nft
    })
    setNfts(newNfts)
  }

  useEffect(() => {
    getTotalFee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCount])

  const getTotalFee = async () => {
    if (selectedCount === 0) {
      setTotalFee(0)
      return
    }
    // return selectedCount * spotPrice + selectedCount * delta
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(poolAddress, POOL_ABI.abi, signer)
    const tmpFee = await contract.getCalcSellInfo(selectedCount)
    const fee = Number(ethers.utils.formatEther(tmpFee.toString()))
    setTotalFee(fee)
  }

  return (
    <Root>
      <Card padding="26px">
        <Container>
          <Header>
            <Title>{title}</Title>
          </Header>
          <ItemsWrapper>
            {items.map((e, i) => {
              return (
                <Item key={e.name} onClick={() => select(i)}>
                  <NftFrameWrapper
                    amount={e.amount}
                    collection={e.collection}
                    name={e.name}
                    src={e.src}
                    isActive={e.isActive}
                    selectedCount={selectedCount}
                    setAnchorPrice={setAnchorAmount}
                    anchorPrice={anchorAmount}
                    delta={delta}
                    chainId={chainId}
                  />
                </Item>
              )
            })}
          </ItemsWrapper>
          <BottomWrapper>
            <TotalPrice>Total Fee {totalFee} ASTR</TotalPrice>
            <SellButton onClick={sellItems} />
          </BottomWrapper>
        </Container>
      </Card>
    </Root>
  )
}

const Root = styled('div')({
  width: '870px',
})
const Container = styled('div')({
  height: '470px',
})

const Header = styled('div')({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '20px',
  gap: '4px',
  height: '50px',
})

const Title = styled('div')({
  fontSize: '24px',
})

const Item = styled('div')({})

const ItemsWrapper = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '18px',
  height: '318px',
  overflowY: 'scroll',
  '::-webkit-scrollbar-track': {
    background: Color.pure_white,
  },
  '::-webkit-scrollbar-thumb': {
    borderRadius: '4px',
    background: Color.gray,
  },
  '::-webkit-scrollbar': {
    width: '4px',
    borderRadius: '4px',
  },
})

const BottomWrapper = styled('div')({
  marginTop: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
})

const TotalPrice = styled('div')({
  fontSize: '16px',
  color: Color.blue,
})
