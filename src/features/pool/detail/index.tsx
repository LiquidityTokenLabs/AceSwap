import { Dispatch, FC, useEffect, useState } from 'react'
import { Component } from './Component'
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import { Nft } from '../../../domains/Nft'
import { useQuery } from '@apollo/client'
import GET_TRANSFERS from '../../../graphql/subgraph'
import YOMISWAP_POOL_ABI from '../../../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'
import { ethers } from 'ethers'
import { Network, Alchemy } from 'alchemy-sdk'
import { round } from '../../../utils/Format'
import {
  AMEDAMA_IMG,
  TOKEN_721_ABI,
  YOMI_ASTAR_CONTRACT,
  YOMI_ASTAR_POOL,
  YOMI_CHAIN,
} from '../../../utils/Config'
import { Pool } from '../../../domains/Pool'
import { History } from '../../../domains/History'
import { converHex2Dec } from '../../../utils/Format'
import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'
type Props = {
  id: string
  pool: Pool
  setToast: Dispatch<ToastProps>
}

export const DetailBoard: FC<Props> = ({ pool, setToast }) => {
  const { loading, error, data } = useQuery(GET_TRANSFERS)
  const [eventList, setEventList] = useState<History[]>([])

  const [buyNum, setBuyNum] = useState('')
  const [sellNum, setSellNum] = useState('')
  const [userFee, setUserFee] = useState('')
  const [spotPrice, setSpotPrice] = useState<number>(0)
  const [delta, setDelta] = useState(0)
  // const poolName = 'Clone X'

  const Web3Api = useMoralisWeb3Api()
  const { user, isAuthenticated } = useMoralis()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [activeNum, setActiveNum] = useState<number>(0)

  const [chainId, setChainId] = useState(0)
  const [address, setAddress] = useState('')

  const poolAddress = YOMI_ASTAR_POOL
  const contractAddress = YOMI_ASTAR_CONTRACT

  useEffect(() => {
    if (isAuthenticated && !!user) {
      const addr = user.get('ethAddress')
      setAddress(addr)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (activeNum === 0) {
      fetchMyNFT()
    } else {
      fetchPoolNFT()
    }
    fetchPoolInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, activeNum])

  useEffect(() => {
    checkChain()
  }, [address])

  const checkChain = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tmpInfo = await provider.ready
    const tmpChainId = tmpInfo.chainId
    setChainId(tmpChainId)
  }

  const fetchMyNFT = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      YOMI_ASTAR_POOL,
      YOMISWAP_POOL_ABI.abi,
      signer
    )

    const addr = user.get('ethAddress')

    const nftContract = new ethers.Contract(
      contractAddress,
      TOKEN_721_ABI,
      signer
    )

    const tmpSpotPrice = await contract.spotPrice()
    const tp = Number(ethers.utils.formatEther(tmpSpotPrice.toString()))
    setSpotPrice(tp)

    const tmpDelta = await contract.delta()
    const d = Number(ethers.utils.formatEther(tmpDelta.toString()))
    setDelta(d)

    const ids = await nftContract.getAllHeldIds(addr)

    const res: Nft[] = []
    for (let i = 0; i < ids.length; i++) {
      const nft: Nft = {
        id: ids[i].toString(),
        amount: tp,
        collection: ids[i].toString(),
        name: ids[i].toString(),
        src: AMEDAMA_IMG,
        isActive: false,
      }
      res.push(nft)
    }
    setNfts(res)
  }
  const fetchPoolNFT = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      YOMI_ASTAR_POOL,
      YOMISWAP_POOL_ABI.abi,
      signer
    )

    const tmpSpotPrice = await contract.spotPrice()
    const sp = Number(ethers.utils.formatEther(tmpSpotPrice.toString()))
    setSpotPrice(sp)

    const tmpDelta = await contract.delta()
    const d = Number(ethers.utils.formatEther(tmpDelta.toString()))
    setDelta(d)

    const bn = await contract.buyNum()
    const buyNum = Number(bn.toString())

    const addr = user.get('ethAddress')

    const nftContract = new ethers.Contract(
      contractAddress,
      TOKEN_721_ABI,
      signer
    )

    const ids = await nftContract.getAllHeldIds(poolAddress)

    const res: Nft[] = []
    for (let i = 0; i < ids.length; i++) {
      const nft: Nft = {
        id: ids[i].toString(),
        amount: sp,
        collection: ids[i].toString(),
        name: ids[i].toString(),
        src: AMEDAMA_IMG,
        isActive: false,
      }
      res.push(nft)
    }
    setNfts(res)
  }

  const fetchPoolInfo = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      poolAddress,
      YOMISWAP_POOL_ABI.abi,
      signer
    )
    const tmpSpotPrice = await contract.spotPrice()
    const tmpBuyNum = await contract.buyNum()
    const tmpSellNum = await contract.sellNum()
    const tmpUserFee = await contract.getUserFee(user?.get('ethAddress'))
    const tmpDelta = await contract.delta()
    setSpotPrice(Number(ethers.utils.formatEther(tmpSpotPrice.toString())))
    setBuyNum(tmpBuyNum)
    setSellNum(tmpSellNum)
    setDelta(Number(ethers.utils.formatEther(tmpDelta.toString())))
    setUserFee(ethers.utils.formatEther(tmpUserFee.toString()))
  }

  useEffect(() => {
    if (!loading && !error && data) {
      const d = data.accountToStakes
        .map((e: any) => {
          const res: History = {
            id: converHex2Dec(e.id),
            type: e.type,
            address: e.address,
            tokenIds: e.tokenIds,
          }
          return res
        })
        .sort((a: History, b: History) => {
          return a.id - b.id
        })
      setEventList(d)
    }
  }, [loading, error, data])

  return (
    <Component
      pool={pool}
      price={spotPrice}
      items={nfts}
      activeNum={activeNum}
      history={eventList}
      setActiveNum={setActiveNum}
      userFee={round(Number(userFee), 5).toString()}
      chainId={chainId}
      setToast={setToast}
    />
  )
}
