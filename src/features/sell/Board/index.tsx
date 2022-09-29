import { Dispatch, FC } from 'react'
import { Component } from './Component'

import { useEffect, useState } from 'react'
import { useMoralis } from 'react-moralis'
import { Nft } from '../../../domains/Nft'
import YOMISWAP_POOL_ABI from '../../../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'
import { ethers } from 'ethers'
import {
  AMEDAMA_IMG,
  YOMI_ASTAR_POOL,
  YOMI_ASTAR_CONTRACT,
  TOKEN_721_ABI,
} from '../../../utils/Config'
import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'
type Props = {
  setToast: Dispatch<ToastProps>
}

export const SellBoard: FC<Props> = ({ setToast }) => {
  const { user, isAuthenticated } = useMoralis()
  const [nfts, setNfts] = useState<Nft[]>([])

  const [spotPrice, setSpotPrice] = useState<number>(0)
  const [delta, setDelta] = useState(0)

  const [chainId, setChainId] = useState(0)
  const [address, setAddress] = useState('')
  const [sellNum, setSellNum] = useState(0)

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

    const tmpSellNum = await contract.sellNum()
    const sn = Number(tmpSellNum.toString())
    console.log({ sn })
    setSellNum(sn)

    const ids = await nftContract.getAllHeldIds(addr)
    console.log({ ids })

    const res: Nft[] = []
    for (let i = 0; i < ids.length; i++) {
      const nft: Nft = {
        id: ids[i].toString(),
        amount: tp - 2 * d,
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
    if (chainId === 592) {
      fetchPoolInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    checkChain()
  }, [address])

  return (
    <Component
      title="Sell"
      items={nfts}
      delta={delta}
      chainId={chainId}
      sellNum={sellNum}
      setToast={setToast}
    />
  )
}
