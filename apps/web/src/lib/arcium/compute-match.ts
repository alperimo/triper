/**
 * Arcium MPC Computation - Trip Matching
 * ENCRYPTED transaction that sends ciphertexts to Arcium MPC network
 * 
 * Security: Trip data NEVER leaves encrypted form
 * - Client encrypts with x25519 + RescueCipher
 * - Arcium MPC processes encrypted data
 * - Only match scores are revealed (not trip details)
 */

import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { 
  getComputationAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getArciumEnv,
} from '@arcium-hq/client';
import type { Triper } from '../anchor/types';
import { initializeEncryption, encryptTripData, type TripData } from './encryption';

/**
 * Compute trip match using Arcium MPC
 * 
 * @param program - Anchor program instance
 * @param provider - Anchor provider
 * @param tripA - First trip data (will be encrypted)
 * @param tripB - Second trip data (will be encrypted)
 * @returns Computation offset (used to track result)
 */
export async function computeTripMatch(
  program: Program<Triper>,
  provider: AnchorProvider,
  tripA: TripData,
  tripB: TripData
): Promise<{
  computationOffset: BN;
  signature: string;
}> {
  // 1. Initialize encryption context
  const encryptionContext = await initializeEncryption(
    provider,
    program.programId
  );
  
  // 2. Encrypt both trips with the same nonce for this computation
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  
  const encryptedA = encryptTripData(encryptionContext, tripA, nonce);
  const encryptedB = encryptTripData(encryptionContext, tripB, nonce);
  
  // 3. Generate computation offset (unique ID for this computation)
  const computationOffset = new BN(Date.now()).mul(new BN(Math.floor(Math.random() * 1000000)));
  
  // 4. Derive all required Arcium accounts
  const arciumEnv = getArciumEnv();
  const computationAccount = getComputationAccAddress(
    program.programId,
    computationOffset
  );
  
  const compDefOffset = Buffer.from(getCompDefAccOffset('compute_trip_match'));
  const compDefAccount = getCompDefAccAddress(
    program.programId,
    compDefOffset.readUInt32LE()
  );
  
  // 5. Prepare ciphertexts (take first 32 bytes from each)
  const ciphertextA = new Array(32).fill(0);
  const ciphertextB = new Array(32).fill(0);
  
  // RescueCipher outputs array of number arrays - flatten and take first 32
  for (let i = 0; i < Math.min(32, encryptedA.ciphertext[0].length); i++) {
    ciphertextA[i] = encryptedA.ciphertext[0][i];
    ciphertextB[i] = encryptedB.ciphertext[0][i];
  }
  
  // 6. Convert nonce to u128
  const nonceU128 = new BN(0);
  for (let i = 0; i < 16; i++) {
    nonceU128.ior(new BN(nonce[i]).shln(i * 8));
  }
  
  // 7. Get signer PDA
  const [signPdaAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('SignerAccount')],
    program.programId
  );
  
  // 8. Submit encrypted computation to Arcium MPC network
  const signature = await program.methods
    .computeTripMatch(
      computationOffset,
      ciphertextA as any,
      ciphertextB as any,
      Array.from(encryptionContext.publicKey) as any,
      nonceU128
    )
    .accountsPartial({
      payer: provider.wallet.publicKey,
      signPdaAccount,
      mxeAccount: getMXEAccAddress(program.programId),
      mempoolAccount: getMempoolAccAddress(program.programId),
      executingPool: getExecutingPoolAccAddress(program.programId),
      computationAccount,
      compDefAccount,
      clusterAccount: arciumEnv.arciumClusterPubkey
    })
    .rpc({ skipPreflight: false, commitment: 'confirmed' });
  
  console.log('🔐 Encrypted computation submitted to Arcium MPC');
  console.log('  Computation Offset:', computationOffset.toString());
  console.log('  Transaction:', signature);
  
  return {
    computationOffset,
    signature,
  };
}

/**
 * Check computation status
 * Returns null if not yet finalized
 */
export async function getComputationStatus(
  provider: AnchorProvider,
  programId: PublicKey,
  computationOffset: BN
): Promise<{
  isFinalized: boolean;
  result?: any;
} | null> {
  try {
    const computationAccount = getComputationAccAddress(programId, computationOffset);
    const accountInfo = await provider.connection.getAccountInfo(computationAccount);
    
    if (!accountInfo) {
      return null;
    }
    
    // Parse account data to check status
    // This depends on the Arcium computation account structure
    return {
      isFinalized: true, // Simplified - need actual parsing
      result: null,
    };
  } catch (error) {
    console.error('Error checking computation status:', error);
    return null;
  }
}
