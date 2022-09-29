import { Dispatch, FC, useEffect, useState } from 'react'
import { Component } from './Component'
import { Pool } from '../../../domains/Pool'
import { YOMI_ASTAR_POOL, YOMI_SAMPLE_NAME } from '../../../utils/Config'
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import { ethers } from 'ethers'
import YOMISWAP_POOL_ABI from '../../../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'
import Web3Api from 'moralis-v1/types/generated/web3Api'
import { Props as ToastProps } from '../../../components/atoms/Toast/Toast'

type Props = {
  setToast: Dispatch<ToastProps>
}

declare global {
  interface Window {
    ethereum: any
  }
}
export const PoolBoard: FC<Props> = ({ setToast }) => {
  const { isAuthenticated, user } = useMoralis()

  const Web3Api = useMoralisWeb3Api()
  const [pools, setPools] = useState<Pool[]>([])
  const [userInitBuyNum, setuserInitBuyNum] = useState(0)
  const [chainId, setChainId] = useState(0)
  const [address, setAddress] = useState('')

  const checkChain = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tmpInfo = await provider.ready
    const tmpChainId = tmpInfo.chainId
    setChainId(tmpChainId)
  }

  useEffect(() => {
    if (isAuthenticated && !!user) {
      const addr = user.get('ethAddress')
      setAddress(addr)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    // fetchPoolInfo()
    if (chainId === 592) {
      getInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    checkChain()
  }, [address])

  useEffect(() => {}, [])

  const getInfo = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(
      YOMI_ASTAR_POOL,
      YOMISWAP_POOL_ABI.abi,
      signer
    )

    const id = await contract.collectionAddress()
    const ubn = await contract.getUserInitBuyNum(user.get('ethAddress'))
    const curve = 'Linear'

    const n = Number(ubn.toString())

    const tmpDelta = await contract.delta()
    const d = ethers.utils.formatEther(tmpDelta.toString())

    setuserInitBuyNum(n)

    const p: Pool = {
      id: id,
      curveType: curve,
      volatility: d, // ethers.utils.formatEther(delta.toNumber()),
      divergence: d, // ethers.utils.formatEther(delta.toNumber()),
      poolName: YOMI_SAMPLE_NAME, //data.name,
      poolCount: n,
    }
    setPools([p])
  }
  return (
    <Component
      title=""
      pools={userInitBuyNum === 0 ? [] : pools}
      setToast={setToast}
    />
  )
}
