
import { http, createConfig, type Config } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";


export const cbWalletConnector: ReturnType<typeof coinbaseWallet> = coinbaseWallet({
  appName: "Wagmi Smart Wallet",
  preference: "smartWalletOnly",
});


export const config: Config = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [cbWalletConnector],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
});

// Optional: if you're using wagmi in multiple files
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
