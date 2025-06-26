"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
} from "wagmi";
import { cbWalletConnector } from "../app/wagmi";

export function ConnectAndSIWE() {
  const [isConnecting, setIsConnecting] = useState(false);

  const account = useAccount();
  const { disconnect } = useDisconnect();

  const { connect } = useConnect({
    mutation: {
      onSuccess: () => {
        setIsConnecting(false);
      },
      onError: () => {
        setIsConnecting(false);
      },
    },
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connect({ connector: cbWalletConnector });
  };

  const handleDisconnect = () => {
    disconnect();
    setIsConnecting(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account.isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-4 py-3 bg-pink-400 text-white rounded-lg hover:bg-pink-300 disabled:bg-pink-300 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div 
      onClick={handleDisconnect}
      className="bg-green-50 p-4 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors group max-w-md"
    >
      
       
          
          <span className="text-sm font-medium text-green-700">Connected</span>
        
       
     
    </div>
  );
}