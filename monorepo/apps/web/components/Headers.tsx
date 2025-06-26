import React from 'react';
import { NavigationMenuDemo } from "./navbar.js";
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Avatar } from '@coinbase/onchainkit/identity';
import { ConnectAndSIWE } from "./ConnectandSIWE.js";
const Header = ({ 
  NavigationComponent = <NavigationMenuDemo/>, 
  WalletComponent = <ConnectAndSIWE/>, 
  address = "0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9",
  AvatarComponent = <Avatar address={"0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9"} />,
 
}) => {
    
  // Default navigation fallback
  const DefaultNavigation = () => (
    <nav className="hidden md:flex items-center space-x-6">
      <a href="#marketplace" className="text-white/70 hover:text-white transition-colors">Marketplace</a>
      <a href="#agents" className="text-white/70 hover:text-white transition-colors">AI Agents</a>
      <a href="#builder" className="text-white/70 hover:text-white transition-colors">Builder</a>
      <a href="#docs" className="text-white/70 hover:text-white transition-colors">Docs</a>
    </nav>
  );

  // Default wallet connect fallback
  const DefaultWallet = () => (
    <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300">
      Connect Wallet
    </button>
  );

  // Default avatar fallback
  const DefaultAvatar = ({ address="0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9" }) => (
    address ? (
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-semibold">
          {address.slice(0, 2).toUpperCase()}
        </span>
      </div>
    ) : null
  );

  return (
    <header className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center space-x-4">
        <h1 className="text-5xl lg:text-6xl xl:text-5xl 2xl:text-5xl font-black leading-[1.1] tracking-tight text-pink-200"> 
        AgentMesh
          </h1>
        </div>
      
        {/* Navigation and Wallet */}
        <div className="flex items-center space-x-6">
          {/* Navigation Component */}
          {/* <div className="navigation-container">
            {NavigationComponent ? NavigationComponent : <DefaultNavigation />}
          </div> */}
          
          {/* Wallet Connect Component */}
          <div className="wallet-container">
            {WalletComponent ? WalletComponent : <DefaultWallet />}
          </div>

          {/* Avatar Component */}
          {(AvatarComponent || address) && (
            <div className="avatar-container">
              {AvatarComponent ? AvatarComponent : <DefaultAvatar address={address} />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;