import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiConfig, createClient, configureChains, goerli, sepolia } from 'wagmi'
import { avalancheFuji, bscTestnet, celoAlfajores, polygonMumbai } from 'wagmi/chains'
import { useEffect } from 'react'
import { publicProvider } from 'wagmi/providers/public'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { chains, provider, webSocketProvider } = configureChains(
  [polygonMumbai, avalancheFuji, celoAlfajores],
  [publicProvider()],
)

 
const client = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: 'Metamask',
        shimDisconnect: true,
      },
    }),
    // new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Project X',
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "Project X"
      },
    }),
  ],
  provider,
  webSocketProvider,
})

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    import("@lottiefiles/lottie-player");
  }, [])

  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
      <ToastContainer autoClose={3000} hideProgressBar={true} position="bottom-right" />
    </WagmiConfig> 
  )
}
