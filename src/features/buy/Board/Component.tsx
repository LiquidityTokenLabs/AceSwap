import styled from '@emotion/styled'
import { Dispatch, FC, useEffect, useState } from 'react'
import { Card } from '../../../components/atoms/Card/Card'
import { DropDown } from '../../../components/atoms/DropDown/DropDown'
import { NftFrame } from '../../../components/molecules/NftFrame/NftFrame'
import { Nft } from '../../../domains/Nft'
import { Color } from '../../../utils/Color'
import { BuyButton } from '../BuyButton'

import POOL_ABI from '../../../../artifacts/contracts/AceSwap.sol/AceSwap.json'
import { ethers } from 'ethers'
import {
  getNetworkConfByChainId,
  CONTRACT_ADDRESS,
  POOL_ADDRESS,
  NFT_NAME,
} from '../../../utils/Config'
import TOKEN_721_ABI from '../../../../artifacts/contracts/SampleNFT.sol/SampleNFT.json'
import { NftFrameWrapper } from './NftFrameWrapper'
import {
  Toast,
  Props as ToastProps,
} from '../../../components/atoms/Toast/Toast'
import { useMoralis } from 'react-moralis'

type Props = {
  title: string
  items: Nft[]
  delta: number
  chainId: number
  setToast: Dispatch<ToastProps>
}

export const Component: FC<Props> = ({
  title,
  items,
  delta,
  chainId,
  setToast,
}) => {
  const [nfts, setNfts] = useState<Nft[]>([])
  const [anchorAmount, setAnchorAmount] = useState(0)
  const [totalFee, setTotalFee] = useState(0)

  const [toastProps, setToastProps] = useState<ToastProps>({} as ToastProps)

  const chainLogo = getNetworkConfByChainId(chainId)?.src

  const poolAddress = POOL_ADDRESS
  const contractAddress = CONTRACT_ADDRESS

  const { user } = useMoralis()

  const selectedCount = nfts.filter((nft) => nft.isActive).length
  const networkSelectorMouseOver = () => {}
  const networkSelectorMouseLeave = () => {}

  useEffect(() => {
    setNfts(items)
  }, [items])

  const buyItems = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(poolAddress, POOL_ABI.abi, signer)

    const addr = user.get('ethAddress')

    const nftContract = new ethers.Contract(
      contractAddress,
      TOKEN_721_ABI.abi,
      signer
    )

    const ids = nfts.filter((nft) => nft.isActive).map((nft) => nft.id)

    const swapTokeIdList: string[] = ids //フロント側からの入力

    const fee = await contract.getCalcBuyInfo(swapTokeIdList.length)

    const filter = contract.filters.SwapFTforNFT()

    contract.once(filter, async () => {
      const newToast: ToastProps = {
        isOpen: true,
        toastMessage: 'Bought NFT',
        toastState: 'Success',
        time: new Date().getTime().toString(),
      }
      setToastProps(newToast)
    })

    contract.swapFTforNFT(swapTokeIdList, {
      value: fee,
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
    const tmpFee = await contract.getCalcBuyInfo(selectedCount)
    const fee = Number(ethers.utils.formatEther(tmpFee.toString()))
    setTotalFee(fee)
  }
  return (
    <Root>
      <Card padding="26px">
        <Container>
          <Header>
            <Title>{title}</Title>
            <DropDown
              label={NFT_NAME}
              color={Color.base_white}
              src={chainLogo}
              mouseOver={networkSelectorMouseOver}
              mouseLeave={networkSelectorMouseLeave}
              isOpenMenu={false}
              clickHandler={(id: number) => {}}
              menuItems={[]}
              isFloat={false}
            />
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
            <BuyButton onClick={buyItems} />
          </BottomWrapper>
        </Container>
      </Card>
      <Toast {...toastProps} />
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
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
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
