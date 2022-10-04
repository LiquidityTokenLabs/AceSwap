import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Header } from '../src/components/organisms/Header/Header'
import { MoralisProvider } from 'react-moralis'
import styled from '@emotion/styled'
import Image from 'next/image'
import { keyframes } from '@emotion/react'
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
import { useState } from 'react'
import { Toast, Props as ToastProps } from '../src/components/atoms/Toast/Toast'
import { Color } from '../src/utils/Color'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'https://api.studio.thegraph.com/query/34004/aceswap/v0.0.8',
})

function MyApp({ Component, pageProps }: AppProps) {
  const [networkId, setNetworkId] = useState(5)
  const [toastProps, setToastProps] = useState<ToastProps>({} as ToastProps)
  return (
    <MoralisProvider
      serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || ''}
      appId={process.env.NEXT_PUBLIC_APP_ID || ''}>
      <Header setNetworkId={setNetworkId} />
      <Context>
        <ApolloProvider client={client}>
          <Component
            {...pageProps}
            networkId={networkId}
            setToast={setToastProps}
          />
        </ApolloProvider>
      </Context>
      <CloudWrapper></CloudWrapper>
      <Toast {...toastProps} />
    </MoralisProvider>
  )
}

export default MyApp

const CloudWrapper = styled('div')({
  position: 'absolute',
  width: '100vw',
  height: '100vh',
  top: 0,
  left: 0,
  zIndex: -1,
  background: Color.base_white,
  overflow: 'hidden',
})

const BlueAnimation = keyframes({
  '0%': {
    transform: 'translate(5px, 5px)',
  },
  '50%': {
    transform: 'translate(10px, 15px)',
  },
  '100%': {
    transform: 'translate(5px, 5px)',
  },
})

const BlueCloud = styled('div')({
  position: 'absolute',
  bottom: 0,
  right: 0,
  transition: 'all 1s',
  animation: `${BlueAnimation} 7s ease infinite`,
})

const PinkAnimation = keyframes({
  '0%': {
    transform: 'translate(0px, 0px)',
  },
  '50%': {
    transform: 'translate(-15px, -10px)',
  },
  '100%': {
    transform: 'translate(0px, 0px)',
  },
})
const PinkCloud = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  animation: `${PinkAnimation} 6s ease infinite`,
})

const WhiteAnimation = keyframes({
  '0%': {
    transform: 'translate(5px, 5px)',
  },
  '50%': {
    transform: 'translate(-20px, 30px)',
  },
  '100%': {
    transform: 'translate(5px, 5px)',
  },
})
const WhiteCloud = styled('div')({
  position: 'absolute',
  bottom: -0,
  left: 0,
  animation: `${WhiteAnimation} 10s ease infinite`,
})

const YellowAnimation = keyframes({
  '0%': {
    transform: 'translate(0px, 0px)',
  },
  '50%': {
    transform: 'translate(10px, 15px)',
  },
  '100%': {
    transform: 'translate(0px, 0px)',
  },
})
const YellowCloud = styled('div')({
  position: 'absolute',
  bottom: 200,
  right: 0,
  animation: `${YellowAnimation} 8s ease infinite`,
})

const Context = styled('div')({
  position: 'absolute',
  top: 120,
  left: '50%',
  transform: 'translateX(-50%)',
})
