import type { NextPage } from 'next'
import styled from '@emotion/styled'

import { useRouter } from 'next/router'
import { DetailBoard } from '../../src/features/pool/detail'
import { Pool } from '../../src/domains/Pool'
import { Dispatch, useEffect, useState } from 'react'
import { POOL_ADDRESS, NFT_NAME } from '../../src/utils/Config'
import POOL_ABI from '../../artifacts/contracts/YomiSwap.sol/YomiSwap.json'
import { ethers } from 'ethers'
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import { Props as ToastProps } from '../../src/components/atoms/Toast/Toast'

declare global {
  interface Window {
    ethereum: any
  }
}
type Props = {
  setToast: Dispatch<ToastProps>
}

const Detail: NextPage<Props> = ({ setToast }) => {
  const router = useRouter()
  const { user, isAuthenticated } = useMoralis()
  const Web3Api = useMoralisWeb3Api()
  const { id } = router.query
  const [pool, setPool] = useState<Pool>({} as Pool)

  const [chainId, setChainId] = useState(0)
  const [address, setAddress] = useState('')

  const poolAddress = POOL_ADDRESS

  const pageId = poolAddress // id

  useEffect(() => {
    if (isAuthenticated && !!user) {
      const addr = user.get('ethAddress')
      setAddress(addr)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    checkChain()
  }, [address])

  const checkChain = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tmpInfo = await provider.ready
    const tmpChainId = tmpInfo.chainId
    setChainId(tmpChainId)
  }

  useEffect(() => {
    if (chainId === 5 || chainId === 420) {
      getInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  const getInfo = async () => {
    if (!user) return
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(pageId, POOL_ABI.abi, signer)

    const delta = await contract.delta()
    const ubn = await contract.getUserInitBuyNum(user.get('ethAddress'))
    const curve = 'Linear'
    const collection = await contract.collectionAddress()

    // const options: {
    //   chain: any
    //   address: any
    //   token_id: any
    // } = await {
    //   address: collection,
    //   token_id: '1',
    //   chain: chainName,
    // }

    // const data = await Web3Api.token.getTokenIdMetadata(options)

    const p: Pool = {
      id: pageId,
      curveType: curve,
      volatility: delta,
      divergence: delta,
      poolName: NFT_NAME, //data.name,
      poolCount: 0,
    }
    setPool(p)
  }

  return (
    <Root>
      <Contents>
        <DetailBoard id={id as string} pool={pool} setToast={setToast} />
      </Contents>
    </Root>
  )
}

export default Detail

const Root = styled('div')({
  // marginTop: '76px',
})

const Contents = styled('div')({
  // paddingTop: '44px',
  display: 'grid',
  justifyItems: 'center',
})
