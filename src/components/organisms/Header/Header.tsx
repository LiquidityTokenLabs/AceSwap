import styled from '@emotion/styled'
import { Dispatch, FC, useEffect, useState } from 'react'
import { ModeSelector } from '../../molecules/ModeSelector/ModeSelector'
import { Button } from '../../atoms/Button/Button'
import { Color } from '../../../utils/Color'
import { DropDown } from '../../atoms/DropDown/DropDown'
import {
  FaBook,
  FaEllipsisH,
  FaGithub,
  FaTwitter,
  FaUserAlt,
} from 'react-icons/fa'
import { BsBox } from 'react-icons/bs'
import { MdLogout, MdTranslate } from 'react-icons/md'
import Router, { useRouter } from 'next/router'
import { useMoralis } from 'react-moralis'
import { Menu } from '../../molecules/Menu/Menu'
import { MenuItem } from '../../../domains/MenuItem'
import { ethers } from 'ethers'
import {
  getNetworkConfByChainId,
  getNetworkInfoByChainId,
  CONTRACT_ADDRESS,
  ASTAR_ID,
} from '../../../utils/Config'
import { converDec2Hex } from '../../../utils/Format'
import { NetworkSwitcher } from '../../molecules/NetworkSwitcher/NetworkSwitcher'

type Props = {
  setNetworkId: Dispatch<number>
}

export const Header: FC<Props> = ({ setNetworkId }) => {
  const [activeNum, setActiveNum] = useState(0)
  const [address, setAddress] = useState('')
  const router = useRouter()
  const showInfo = address.substring(0, 6) + '...' + address.slice(-4)
  const { authenticate, isAuthenticated, user, logout } = useMoralis()
  const [chainId, setChainId] = useState(0)
  const [chainName, setChainName] = useState('')
  const [chainSrc, setChainSrc] = useState('')
  const [isOpenMenu, setIsOpenMenu] = useState(false)

  const menuItems: MenuItem[] = [
    {
      label: 'Account',
      available: false,
      type: 'BUTTON',
      icon: <FaUserAlt />,
      clickHandler: () => {
        console.log('to account page')
      },
    },
    {
      label: 'Twitter',
      available: true,
      type: 'LINK',
      linkInfo: {
        href: 'https://twitter.com/_AceSwap',
        locale: router.locale || '',
        isOutside: true,
      },
      icon: <FaTwitter />,
    },
    {
      label: 'Mint',
      available: true,
      type: 'BUTTON',
      icon: <BsBox />,
      clickHandler: async () => {
        const contractAddress = CONTRACT_ADDRESS
        if (!user) return
        const addr = user.get('ethAddress')
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          contractAddress,
          ['function mint() public'],
          signer
        )
        await contract.mint({
          gasLimit: '3000000',
        })
      },
    },
    {
      label: 'Logout',
      available: true,
      type: 'BUTTON',
      icon: <MdLogout />,
      clickHandler: () => {
        logout()
        router.reload()
      },
    },
  ]

  const checkChain = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tmpInfo = await provider.ready
    const tmpChainId = tmpInfo.chainId

    if (tmpChainId === ASTAR_ID) {
      setChainName('Astar')
      setChainSrc('/icons/astar.png')
      setChainId(tmpChainId)
    } else {
      setChainName('ERR')
    }
  }

  const changeGoerli = async (id: number) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: converDec2Hex(id),
          },
        ],
      })
    } catch (Exeption) {}
  }

  const addChain = async (id: number) => {
    try {
      const networkInfo = getNetworkInfoByChainId(id)
      const params = {
        chainId: converDec2Hex(id),
        ...networkInfo,
      }
      console.log({ params })
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      })
    } catch (Exeption) {}
  }

  const doChainChange = async (id: number) => {
    if (id === 5) {
      await changeGoerli(id)
    } else {
      await addChain(id)
    }
    setNetworkId(id)
    const conf = getNetworkConfByChainId(id)
    setChainName(conf?.chainName || '')
    setChainSrc(conf?.src || '')
    router.reload()
  }

  useEffect(() => {
    checkChain()
  }, [address])

  useEffect(() => {
    if (activeNum === 0) Router.push('/buy')
    if (activeNum === 1) Router.push('/sell')
    if (activeNum === 2) Router.push('/pool')
  }, [activeNum])

  useEffect(() => {
    if (isAuthenticated && !!user) {
      const addr = user.get('ethAddress')
      setAddress(addr)
    }
  }, [isAuthenticated, user])

  const connectWallet = async () => {
    if (!isAuthenticated) {
      authenticate()
    }
  }

  const networkSelectorMouseOver = () => {
    setIsOpenMenu(true)
  }
  const networkSelectorMouseLeave = () => {
    setIsOpenMenu(false)
  }

  const changeNetwork = (id: number) => {
    doChainChange(id)
  }

  return (
    <SHeader>
      <LeftNav>
        <Name>AceSwap</Name>
      </LeftNav>
      <Nav>
        <ModeSelector
          options={['Buy', 'Sell', 'Pool']}
          activeNum={activeNum}
          setActiveNum={setActiveNum}
        />
      </Nav>
      <RightNav>
        <NetworkSwitcher
          chainName={chainName}
          changeAstar={() => addChain(ASTAR_ID)}
        />
        {address !== '' ? (
          <Address>{showInfo}</Address>
        ) : (
          <ButtonWrapper>
            <Button
              label={'Connect wallet'}
              margin="12px 16px"
              color={Color.pure_white}
              fontColor={Color.blue}
              isFloat={false}
              onClick={connectWallet}
            />
          </ButtonWrapper>
        )}
        <Menu
          icon={
            <IconWrapper>
              <FaEllipsisH size="20px" />
            </IconWrapper>
          }
          menuItems={menuItems}
        />
      </RightNav>
    </SHeader>
  )
}

const SHeader = styled('header')({
  width: '100vw',
  height: '76px',

  position: 'fixed',
  top: 0,

  zIndex: 10,
})

const Nav = styled('div')({
  position: 'absolute',
  left: '50%',
  top: '14px',
  transform: 'translate(-50%, 0)',
})

const RightNav = styled('div')({
  position: 'absolute',
  right: '16px',
  top: '14px',
  marginRight: '16px',
  display: 'flex',
  gap: '8px',
})
const LeftNav = styled('div')({
  position: 'absolute',
  left: '16px',
  top: '14px',
  height: '48px',
  marginLeft: '16px',
  display: 'flex',
  gap: '8px',
})

const IconWrapper = styled('div')({
  background: Color.pure_white,
  borderRadius: '100px',
  width: '50px',
  height: '50px',

  display: 'grid',
  justifyItems: 'center',
  alignItems: 'center',
  border: `1px solid ${Color.blue}`,
  color: Color.blue,

  // boxShadow:
  //   'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',

  boxSizing: 'border-box',
})

const Address = styled('div')({
  background: Color.pure_white,
  color: Color.blue,
  borderRadius: '100px',
  height: '50px',
  padding: '12px 16px',
  border: `1px solid ${Color.blue}`,
  // boxShadow:
  //   'rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 4%) 0px 4px 8px, rgb(0 0 0 / 4%) 0px 16px 24px, rgb(0 0 0 / 1%) 0px 24px 32px',
})

const ButtonWrapper = styled('div')({
  height: '50px',
})

const Name = styled('p')({
  color: Color.blue,
  fontSize: '24px',
  height: '48px',
  lineHeight: '48px',
})
