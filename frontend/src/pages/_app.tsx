import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiConfig, createClient, configureChains, goerli, sepolia } from 'wagmi'
import { avalancheFuji, bscTestnet, polygonMumbai } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { chains, provider, webSocketProvider } = configureChains(
  [polygonMumbai, avalancheFuji, bscTestnet],
  [
    publicProvider()
  ],
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

  console.log(String(process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_RPC))

  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
      <ToastContainer autoClose={3000} hideProgressBar={true} position="bottom-right" />
    </WagmiConfig> 
  )
}
