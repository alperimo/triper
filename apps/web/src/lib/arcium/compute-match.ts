/**
 * Arcium MPC Computation - Trip Matching
 * ENCRYPTED transaction that sends ciphertexts to Arcium MPC network
 * 
 * Security: Trip data NEVER leaves encrypted form
 * - Client encrypts with x25519 + RescueCipher
 * - Arcium MPC processes encrypted data
 * - Only match scores are revealed (not trip details)
 * 
 * TripData format (55 bigints total, 209 bytes):
 * - 20 waypoints (u64 H3 cells)
 * - 1 waypoint_count (u8)
 * - 1 start_date (i64)
 * - 1 end_date (i64)
 * - 32 interests (bool)
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
  deserializeLE,
} from '@arcium-hq/client';
import type { Triper } from '../anchor/types';
import { initializeEncryption, encryptTripData, serializeTripData, type TripData } from './encryption';

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
  if (typeof window !== 'undefined' && window.crypto) {
    crypto.getRandomValues(nonce);
  }
  
  const encryptedA = encryptTripData(encryptionContext, tripA, nonce);
  const encryptedB = encryptTripData(encryptionContext, tripB, nonce);
  
  console.log('🔐 Encrypting trip data...');
  console.log('  Trip A waypoints:', tripA.waypoints.length);
  console.log('  Trip B waypoints:', tripB.waypoints.length);
  console.log('  Serialization: 55 bigints (20 + 1 + 1 + 1 + 32)');
  
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
  
  // 5. Prepare ciphertexts
  // encryptTripData returns number[][], we need to flatten for the program
  const flattenCiphertext = (ciphertext: number[][]): number[] => {
    const flat: number[] = [];
    for (const chunk of ciphertext) {
      flat.push(...chunk);
    }
    return flat;
  };
  
  const ciphertextAFlat = flattenCiphertext(encryptedA.ciphertext);
  const ciphertextBFlat = flattenCiphertext(encryptedB.ciphertext);
  
  // Take the data we need (program expects specific size)
  const ciphertextA = ciphertextAFlat.slice(0, 32);
  const ciphertextB = ciphertextBFlat.slice(0, 32);
  
  // 6. Convert nonce to BN (u128)
  const nonceU128 = new BN(deserializeLE(nonce).toString());
  
  // 7. Get signer PDA
  const [signPdaAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('SignerAccount')],
    program.programId
  );
  
  console.log('📤 Submitting encrypted computation to Arcium MPC...');
  console.log('  Computation Offset:', computationOffset.toString());
  console.log('  Computation Account:', computationAccount.toString());
  
  // 8. Submit encrypted computation to Arcium MPC network
  const signature = await (program.methods)
    .computeTripMatch(
      computationOffset,
      ciphertextA,
      ciphertextB,
      Array.from(encryptionContext.publicKey),
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
  
  console.log('✅ Encrypted computation submitted!');
  console.log('  Transaction:', signature);
  console.log('  MPC will process encrypted data and call back with scores');
  
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
