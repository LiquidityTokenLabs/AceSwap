import styled from '@emotion/styled'
import { Dispatch, FC, useEffect, useState } from 'react'
import { Card } from '../../../components/atoms/Card/Card'
import { Button } from '../../../components/atoms/Button/Button'
import { Color } from '../../../utils/Color'
import { Nft } from '../../../domains/Nft'
import { NftFrame } from '../../../components/molecules/NftFrame/NftFrame'
import YOMISWAP_POOL_ABI from '../../../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'
import { useMoralis } from 'react-moralis'
import { ethers } from 'ethers'
import {
  ASTAR_ID,
  TOKEN_721_ABI,
  YOMI_ASTAR_CONTRACT,
  YOMI_ASTAR_POOL,
  YOMI_CURVE,
} from '../../../utils/Config'
import { ModeSelector } from '../../../components/molecules/ModeSelector/ModeSelector'

import { Pool } from '../../../domains/Pool'
import { History } from '../../../domains/History'
import { getShortAddress, round } from '../../../utils/Format'

import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'

type Props = {
  pool: Pool
  items: Nft[]
  activeNum: number
  setActiveNum: Dispatch<number>
  history: History[]
  price: number
  userFee: string
  chainId: number
  setToast: Dispatch<ToastProps>
}

declare global {
  interface Window {
    ethereum: any
  }
}

export const Component: FC<Props> = ({
  pool,
  items,
  activeNum,
  setActiveNum,
  history,
  price,
  userFee,
  chainId,
  setToast,
}) => {
  const [nfts, setNfts] = useState<Nft[]>([])

  const [userInitBuyNum, setUserInitBuyNum] = useState(0)
  const [buyNum, setBuyNum] = useState(0)
  const [spotPrice, setSpotPrice] = useState<number>(0)
  const [volatilit, setVolatilit] = useState('')
  const [divergence, setDivergence] = useState('')
  const selectedCount = nfts.filter((nft) => nft.isActive).length

  const { user } = useMoralis()

  const poolAddress = YOMI_ASTAR_POOL

  const contractAddress = YOMI_ASTAR_CONTRACT

  useEffect(() => {
    if (chainId === ASTAR_ID) {
      getInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    setNfts(items)
  }, [items])

  useEffect(() => {
    const initNfts = items.map((nft) => {
      nft.isActive = false
      return nft
    })
    console.log({ initNfts })

    setNfts(initNfts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNum])

  const done = async () => {
    console.log({
      userInitBuyNum,
      buyNum,
    })

    if (activeNum === 0) {
      upLiquidity()
    } else {
      releaseLiquidity()
    }
  }

  const getInfo = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      poolAddress,
      YOMISWAP_POOL_ABI.abi,
      signer
    )
    const accounts = await provider.send('eth_requestAccounts', [])

    const ubn = await contract.getUserInitBuyNum(user.get('ethAddress'))
    const bn = await contract.buyNum()
    const tmpSpotPrice = await contract.spotPrice()
    const tmpDelta = await contract.delta()

    setUserInitBuyNum(Number(ubn.toString()))
    setBuyNum(Number(bn.toString()))
    setVolatilit(ethers.utils.formatEther(tmpDelta.toString()))
    setDivergence(ethers.utils.formatEther(tmpDelta.toString()))
    setSpotPrice(Number(ethers.utils.formatEther(tmpSpotPrice.toString())))
  }

  const upLiquidity = async () => {
    console.log('up liquidity')
    const ids = nfts.filter((nft) => nft.isActive).map((nft) => nft.id)
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      poolAddress,
      YOMISWAP_POOL_ABI.abi,
      signer
    )

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

  const releaseLiquidity = async () => {
    console.log('release liquidity')
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      poolAddress,
      YOMISWAP_POOL_ABI.abi,
      signer
    )

    const filter = contract.filters.RemoveLP()

    contract.once(filter, async () => {
      const newToast: ToastProps = {
        isOpen: true,
        toastMessage: 'Got reward',
        toastState: 'Success',
        time: new Date().getTime().toString(),
      }
      setToast(newToast)
    })

    const accounts = await provider.send('eth_requestAccounts', [])

    const swapTokenIdList = nfts
      .filter((nft) => nft.isActive)
      .map((nft) => nft.id)

    if (userInitBuyNum < buyNum) {
      if (userInitBuyNum !== swapTokenIdList.length) {
        console.log('dame')
        return
      }
      // NFTで引き出す
      await contract.withdrawNFTAndFee(swapTokenIdList, {
        gasLimit: '3000000',
      })
    } else {
      // FTも引き出す
      console.log({ swapTokenIdList })
      await contract.withdrawNFTAndFTAndFee(swapTokenIdList, {
        gasLimit: '3000000',
      })
    }
  }

  const select = async (num: number) => {
    if (!user) return

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      poolAddress,
      YOMISWAP_POOL_ABI.abi,
      signer
    )

    const selectedCount = nfts.filter((nft) => nft.isActive).length
    const userBuyNum = await contract.getUserInitBuyNum(user.get('ethAddress'))

    const newNfts = nfts.map((nft, i) => {
      if (i === num) {
        if (!nft.isActive) {
          if (selectedCount < userBuyNum || activeNum === 0) {
            nft.isActive = true
          }
        } else {
          nft.isActive = false
        }
      }
      return nft
    })
    setNfts(newNfts)
  }

  const getButton = () => {
    if (activeNum === 0) {
      // 上げる
      return (
        <Button
          label="Increase liquidity"
          margin="20px 32px"
          color={Color.pink}
          fontColor={Color.pure_white}
          fontSize="20px"
          onClick={done}
        />
      )
    }
    if (activeNum === 1) {
      // 解除
      const enabled =
        selectedCount === userInitBuyNum || selectedCount === buyNum
      return (
        <Button
          label="Unlock liquidity"
          margin="20px 32px"
          color={Color.pink}
          fontColor={Color.pure_white}
          fontSize="20px"
          disabled={!enabled}
          onClick={done}
        />
      )
    }
    if (activeNum === 2) {
      // 履歴
    }
    return <></>
  }

  const getBoard = () => {
    if (activeNum === 2) {
      return (
        <Table>
          <TableHeader>
            <TableHeaderItem width="60px">EventId</TableHeaderItem>
            <TableHeaderItem width="110px">Event</TableHeaderItem>
            <TableHeaderItem width="110px">Address</TableHeaderItem>
            <TableHeaderItem width="70px">Token num</TableHeaderItem>
          </TableHeader>
          {history.map((h, i) => {
            return (
              <TableRow
                key={h.id}
                color={i % 2 === 0 ? Color.base_white : Color.pure_white}>
                <TableItem width="60px">{h.id}</TableItem>
                <TableItem width="110px">{h.type}</TableItem>
                <TableItem width="110px">
                  {getShortAddress(h.address)}
                </TableItem>
                <TableItem width="70px">{h.tokenIds.length}item</TableItem>
              </TableRow>
            )
          })}
        </Table>
      )
    }

    return (
      <Container>
        {nfts.map((e, i) => {
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
      </Container>
    )
  }

  const getError = () => {
    if (activeNum === 1 && Math.min(userInitBuyNum, buyNum) !== selectedCount) {
      const count = Math.min(userInitBuyNum, buyNum) - selectedCount
      return (
        <Error>
          <ErrorText>{`Please select ${count} more`}</ErrorText>
        </Error>
      )
    }
  }

  return (
    <Root>
      <Pool>Pool</Pool>
      <TitleWrapper>
        <Title>{pool.poolName}</Title>
        <ButtonWrapper>
          <ModeSelector
            options={
              chainId === 5
                ? ['Increase liquidity', 'Unlock liquidity', 'History']
                : ['Increase liquidity', 'Unlock liquidity']
            }
            activeNum={activeNum}
            setActiveNum={setActiveNum}
          />
        </ButtonWrapper>
      </TitleWrapper>
      <Row>
        <Card padding="24px">
          <Box padding={24}>
            {getBoard()}
            {getError()}
          </Box>
        </Card>
        <Column>
          <Card padding="16px">
            <Box padding={16}>
              <SubTitleWrapper>
                <SubTitle>pool settings</SubTitle>
              </SubTitleWrapper>
              <SettingWrapper>
                <SettingItem>
                  <SettingLabel>bonding curve</SettingLabel>
                  <SettingValue>{YOMI_CURVE}</SettingValue>
                </SettingItem>
                <SettingItem>
                  <SettingLabel>spot price</SettingLabel>
                  <SettingValue>{spotPrice}</SettingValue>
                </SettingItem>
                <SettingItem>
                  <SettingLabel>volatility</SettingLabel>
                  <SettingValue>{volatilit}</SettingValue>
                </SettingItem>
                <SettingItem>
                  <SettingLabel>divergence</SettingLabel>
                  <SettingValue>{divergence}</SettingValue>
                </SettingItem>
              </SettingWrapper>
            </Box>
          </Card>
          <Card padding="16px">
            <Box padding={16}>
              <SubTitleWrapper>
                <SubTitle>Unbilled compensation</SubTitle>
              </SubTitleWrapper>
              <DollarsWrapper>
                <Dollars>$</Dollars>
                <Dollars>{userFee}</Dollars>
              </DollarsWrapper>
            </Box>
          </Card>
          {getButton()}
        </Column>
      </Row>
    </Root>
  )
}

const Item = styled('div')({})

const Root = styled('div')({
  width: '870px',
})

const Pool = styled('div')({
  fontSize: '24px',
})

const TitleWrapper = styled('div')({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
})
const SubTitleWrapper = styled('div')({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
})

const Title = styled('div')({
  fontSize: '36px',
})

const Row = styled('div')({
  display: 'flex',
  gap: '12px',
})
const Column = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
})

const Box = styled('div')((p: { padding: number }) => ({
  width: `calc(429px - ${p.padding * 2}px)`, // (870 - 12) / 2
}))

const Container = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  alignContent: 'start',
  gap: '16px 8px',
  height: '324px',
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

const ButtonWrapper = styled('div')({
  display: 'flex',
  gap: '8px',
})

const SubTitle = styled('div')({
  fontSize: '16px',
  fontWeight: 700,
})

const Dollars = styled('div')({
  fontSize: '36px',
})
const DollarsWrapper = styled('div')({
  display: 'flex',
  gap: '16px',
})

const SettingWrapper = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '17px 20px',
})
const SettingItem = styled('div')({
  background: Color.base_white,
  borderRadius: '12px',
  width: 'calc(50% - 10px)',
  padding: '12px',
})

const SettingLabel = styled('div')({
  fontSize: '12px',
  marginBottom: '4px',
})
const SettingValue = styled('div')({
  fontSize: '16px',
  fontWeight: 700,
})

const Table = styled('div')({
  height: '400px',
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

const TableHeader = styled('div')({
  display: 'flex',
  gap: '8px',
  marginBottom: '16px',
})
const TableRow = styled('div')((p: { color: string }) => ({
  display: 'flex',
  gap: '8px',
  background: p.color,
  padding: '4px',
}))
const TableHeaderItem = styled('div')((p: { width: string }) => ({
  width: p.width,
  fontSize: '10px',
  fontWeight: 600,
}))
const TableItem = styled('div')((p: { width: string }) => ({
  width: p.width,
  fontSize: '14px',
  fontWeight: 400,
}))

const Error = styled('div')({
  height: '70px',
  marginTop: '12px',
  display: 'flex',
  alignItems: 'flex-end',
})

const ErrorText = styled('div')({
  fontSize: '16px',
  color: Color.error,
})
