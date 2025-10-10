'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';
import { useUserStore } from '@/lib/store/user';

export function WalletButton() {
  const { publicKey, connected } = useWallet();
  const { setPublicKey, setConnected, disconnect } = useUserStore();
  
  useEffect(() => {
    if (connected && publicKey) {
      setPublicKey(publicKey.toBase58());
    } else {
      disconnect();
    }
  }, [connected, publicKey, setPublicKey, disconnect]);
  
  return (
    <WalletMultiButton className="!bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 !rounded-lg !px-6 !py-2 !text-sm !font-medium transition-all" />
  );
}
