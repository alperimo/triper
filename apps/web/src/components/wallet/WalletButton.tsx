'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/lib/store/user';

export function WalletButton() {
  const { publicKey, connected } = useWallet();
  const { setPublicKey, setConnected, disconnect } = useUserStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (connected && publicKey) {
      setPublicKey(publicKey.toBase58());
    } else {
      disconnect();
    }
  }, [connected, publicKey, setPublicKey, disconnect]);
  
  // Prevent hydration mismatch by only rendering on client
  if (!mounted) {
    return (
      <div className="relative z-50">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg px-6 py-2 text-sm font-medium">
          Select Wallet
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative z-50">
      <WalletMultiButton className="!bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 !rounded-lg !px-6 !py-2 !text-sm !font-medium transition-all" />
    </div>
  );
}
