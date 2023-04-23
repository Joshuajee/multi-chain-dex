import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiConfig, createClient, configureChains, goerli } from 'wagmi'
import { bscTestnet, polygonMumbai } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { chains, provider, webSocketProvider } = configureChains(
  [polygonMumbai, goerli, bscTestnet],
  [
    alchemyProvider({ apiKey: String(process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_KEY)}),
    alchemyProvider({ apiKey: String(process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_KEY)}),
    alchemyProvider({ apiKey: String(process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_KEY)}), 
    publicProvider()],
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
        qrcode: true,
        projectId: "Project X"
      },
    }),
  ],
  provider,
  webSocketProvider,
})

export default function App({ Component, pageProps }: AppProps) {

  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
      <ToastContainer autoClose={3000} hideProgressBar={true} position="bottom-right" />
    </WagmiConfig> 
  )
}
