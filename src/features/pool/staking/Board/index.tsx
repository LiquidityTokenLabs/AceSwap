import { Dispatch, FC, useEffect, useState } from 'react'
import { Component } from './Component'
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import { Nft } from '../../../../domains/Nft'
import { ethers } from 'ethers'

import { Props as ToastProps } from '../../../../components/atoms/Toast/Toast'
import {
  POOL_ADDRESS,
  TOKEN_721_ABI,
  AMEDAMA_IMG,
  CONTRACT_ADDRESS,
} from '../../../../utils/Config'
import POOL_ABI from '../../../../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'

type Props = {
  setToast: Dispatch<ToastProps>
}

export const AutoStakingBoard: FC<Props> = ({ setToast }) => {
  const { user, isAuthenticated } = useMoralis()
  const [nfts, setNfts] = useState<Nft[]>([])

  const [chainId, setChainId] = useState(0)
  const [address, setAddress] = useState('')

  const [spotPrice, setSpotPrice] = useState<number>(0)
  const [delta, setDelta] = useState(0)

  const checkChain = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tmpInfo = await provider.ready
    const tmpChainId = tmpInfo.chainId
    setChainId(tmpChainId)
  }

  const fetchNFT = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      POOL_ADDRESS,
      POOL_ABI.abi,
      signer
    )

    const addr = user.get('ethAddress')
    const contractAddress = CONTRACT_ADDRESS

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

  useEffect(() => {
    if (isAuthenticated && !!user) {
      const addr = user.get('ethAddress')
      setAddress(addr)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    console.log(chainId)
    if (chainId === 592) {
      fetchNFT()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    checkChain()
  }, [address])

  return (
    <Component
      title="Auto Staking"
      items={nfts}
      chainId={chainId}
      setToast={setToast}
    />
  )
}
