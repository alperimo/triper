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
      <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 cursor-pointer">
        Select Wallet
      </button>
    );
  }
  
  return (
    <WalletMultiButton className="!inline-flex !items-center !gap-2 !rounded-full !border !border-gray-200 !px-6 !py-3 !text-sm !font-semibold !text-gray-700 !bg-white hover:!border-gray-300 hover:!bg-gray-50 active:!bg-gray-100 !transition-all !shadow-none" />
  );
}
