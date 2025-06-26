// utils/walletClient.ts
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Load private key from env or secret manager
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
export const account = privateKeyToAccount(PRIVATE_KEY);

export const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});
