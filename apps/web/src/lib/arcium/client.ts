// Arcium SDK Client Wrapper
// Integrates with @arcium-hq/client for encrypted computation

import { 
  getArciumEnv,
  x25519,
  getMXEPublicKey,
  RescueCipher,
  awaitComputationFinalization,
  getMXEAccAddress,
  getMempoolAccAddress,
  getComputationAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getExecutingPoolAccAddress,
} from '@arcium-hq/client';
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { randomBytes } from 'crypto';

export class ArciumClient {
  private provider: anchor.AnchorProvider | null = null;
  private cipher: RescueCipher | null = null;
  private privateKey: Uint8Array | null = null;
  private publicKey: Uint8Array | null = null;
  private mxePublicKey: Uint8Array | null = null;
  private programId: PublicKey;

  constructor(programId?: string) {
    // Use environment variable or provided program ID
    this.programId = programId 
      ? new PublicKey(programId)
      : new PublicKey(process.env.NEXT_PUBLIC_MXE_PROGRAM_ID || '11111111111111111111111111111111');
  }

  /**
   * Initialize the Arcium client with encryption setup
   */
  async initialize(connection?: Connection, wallet?: any): Promise<void> {
    try {
      // Setup Anchor provider
      const conn = connection || new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      if (wallet) {
        this.provider = new anchor.AnchorProvider(
          conn,
          wallet,
          { commitment: 'confirmed' }
        );
      }

      // Generate client keypair for encryption
      this.privateKey = x25519.utils.randomPrivateKey();
      this.publicKey = x25519.getPublicKey(this.privateKey);

      // Get MXE public key if provider is available
      if (this.provider) {
        this.mxePublicKey = await getMXEPublicKey(this.provider, this.programId);
        
        if (this.mxePublicKey) {
          // Compute shared secret and initialize cipher
          const sharedSecret = x25519.getSharedSecret(this.privateKey, this.mxePublicKey);
          this.cipher = new RescueCipher(sharedSecret);
          console.log('Arcium client initialized with encryption');
        }
      }

      console.log('Arcium client initialized');
    } catch (error) {
      console.error('Failed to initialize Arcium client:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using Rescue cipher
   */
  encryptData(plaintext: bigint[], nonce?: Uint8Array): {
    ciphertext: number[][];
    nonce: Uint8Array;
  } {
    if (!this.cipher) {
      throw new Error('Cipher not initialized. Call initialize() first.');
    }

    const nonceBytes = nonce || randomBytes(16);
    const ciphertext = this.cipher.encrypt(plaintext, nonceBytes);

    return {
      ciphertext,
      nonce: nonceBytes,
    };
  }

  /**
   * Decrypt data using Rescue cipher
   */
  decryptData(ciphertext: number[][], nonce: Uint8Array): bigint[] {
    if (!this.cipher) {
      throw new Error('Cipher not initialized. Call initialize() first.');
    }

    return this.cipher.decrypt(ciphertext, nonce);
  }

  /**
   * Submit encrypted trip data to Arcium network
   */
  async submitEncryptedTrip(
    tripId: string,
    encryptedRoute: Uint8Array,
    encryptedDates: Uint8Array,
    encryptedInterests: Uint8Array
  ): Promise<string> {
    // For now, return a mock transaction ID
    // TODO: Implement actual program submission when MXE program is deployed
    console.log('Submitting encrypted trip to Arcium:', tripId);
    
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');
    return `arcium_trip_${computationOffset.toString()}`;
  }

  /**
   * Request match computation via MPC
   */
  async requestMatchComputation(
    tripAId: string,
    tripBId: string
  ): Promise<string> {
    console.log('Requesting MPC match computation:', { tripAId, tripBId });
    
    // Generate computation offset
    const computationOffset = new anchor.BN(randomBytes(8), 'hex');
    
    // TODO: Submit to actual MXE program when deployed
    // const sig = await program.methods
    //   .computeMatch(computationOffset, tripAId, tripBId, ...)
    //   .accounts({ ... })
    //   .rpc();
    
    return `mpc_comp_${computationOffset.toString()}`;
  }

  /**
   * Get match computation result
   */
  async getMatchResult(computationId: string): Promise<{
    matchScore: number;
    routeOverlap: number;
    dateOverlap: number;
    interestSimilarity: number;
  }> {
    console.log('Fetching match result:', computationId);
    
    // TODO: Await finalization and decrypt result
    // if (this.provider) {
    //   await awaitComputationFinalization(
    //     this.provider,
    //     computationOffset,
    //     this.programId,
    //     'confirmed'
    //   );
    // }
    
    // Placeholder: Return mock result
    return {
      matchScore: 75,
      routeOverlap: 60,
      dateOverlap: 14,
      interestSimilarity: 0.8,
    };
  }

  /**
   * Decrypt match details after mutual consent
   */
  async decryptMatchDetails(
    matchId: string,
    userPrivateKey: Uint8Array
  ): Promise<{
    route: Array<{ lat: number; lng: number }>;
    dates: { start: Date; end: Date };
    interests: string[];
  }> {
    console.log('Decrypting match details:', matchId);
    
    // TODO: Fetch encrypted data and decrypt using cipher
    
    // Placeholder: Return mock decrypted data
    return {
      route: [
        { lat: 52.52, lng: 13.4 },
        { lat: 50.08, lng: 14.43 },
      ],
      dates: {
        start: new Date('2025-11-01'),
        end: new Date('2025-11-15'),
      },
      interests: ['hiking', 'photography', 'food'],
    };
  }

  /**
   * Get Arcium account addresses (PDAs)
   */
  getAccountAddresses() {
    return {
      mxe: getMXEAccAddress(this.programId),
      mempool: getMempoolAccAddress(this.programId),
      executingPool: getExecutingPoolAccAddress(this.programId),
    };
  }

  /**
   * Get computation account address for a given offset
   */
  getComputationAddress(offset: anchor.BN): PublicKey {
    return getComputationAccAddress(this.programId, offset);
  }

  /**
   * Get computation definition address for a computation name
   */
  getCompDefAddress(compName: string): PublicKey {
    const offset = getCompDefAccOffset(compName);
    return getCompDefAccAddress(
      this.programId,
      Buffer.from(offset).readUInt32LE()
    );
  }

  /**
   * Get client public key (for encryption)
   */
  getPublicKey(): Uint8Array | null {
    return this.publicKey;
  }
}

// Singleton instance
let arciumClient: ArciumClient | null = null;

export function getArciumClient(programId?: string): ArciumClient {
  if (!arciumClient) {
    arciumClient = new ArciumClient(programId);
  }
  return arciumClient;
}

// Export Arcium environment helper
export { getArciumEnv };
