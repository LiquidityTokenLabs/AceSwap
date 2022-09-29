import { FC, useEffect, useState, Dispatch } from 'react'
import { Component } from './Component'
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import { Nft } from '../../../domains/Nft'
import YOMISWAP_POOL_ABI from '../../../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'
import { ethers } from 'ethers'
import {
  YOMI_ASTAR_POOL,
  AMEDAMA_IMG,
  YOMI_ASTAR_CONTRACT,
  TOKEN_721_ABI,
} from '../../../utils/Config'
import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'

type Props = {
  networkId: number
  setToast: Dispatch<ToastProps>
}

declare global {
  interface Window {
    ethereum: any
  }
}

export const BuyBoard: FC<Props> = ({ networkId, setToast }) => {
  const [nfts, setNfts] = useState<Nft[]>([])

  const [spotPrice, setSpotPrice] = useState<number>(0)
  const [delta, setDelta] = useState(0)
  const [chainId, setChainId] = useState(0)
  const [address, setAddress] = useState('')

  const { isAuthenticated, user } = useMoralis()

  const poolAddress = YOMI_ASTAR_POOL
  const contractAddress = YOMI_ASTAR_CONTRACT

  const checkChain = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tmpInfo = await provider.ready
    const tmpChainId = tmpInfo.chainId
    setChainId(tmpChainId)
  }

  const fetchPoolInfo = async () => {
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

    console.log({ addr })

    const ids = await nftContract.getAllHeldIds(poolAddress)
    console.log({ ids })

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

  useEffect(() => {
    if (isAuthenticated && !!user) {
      const addr = user.get('ethAddress')
      setAddress(addr)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    console.log(chainId)
    if (chainId === 592) {
      fetchPoolInfo()
    }
    // fetchPoolInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    checkChain()
  }, [address])

  return (
    <Component
      title="Buy"
      items={nfts}
      delta={Number(delta)}
      chainId={chainId}
      setToast={setToast}
    />
  )
}
