// Triper Anchor Program Client
// Wrapper for interacting with the deployed Solana program

import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import type { Triper } from './types';
import triperIdl from './triper.json';

const TRIPER_PROGRAM_ID = new PublicKey('Fn6rAGhjUc45tQqfgsXCdNtNC3GSfNWdjHEjpHaUJMaY');

export class TriperClient {
  program: Program<Triper>;
  provider: AnchorProvider;

  constructor(connection: Connection, wallet: AnchorWallet) {
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    this.program = new Program<Triper>(triperIdl as Triper, this.provider);
  }

  /**
   * Derive Trip PDA
   */
  async getTripPDA(user: PublicKey, mxeDataAccount: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('trip'),
        user.toBuffer(),
        mxeDataAccount.toBuffer(),
      ],
      TRIPER_PROGRAM_ID
    );
  }

  /**
   * Derive Match PDA
   */
  async getMatchPDA(tripA: PublicKey, tripB: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('match'),
        tripA.toBuffer(),
        tripB.toBuffer(),
      ],
      TRIPER_PROGRAM_ID
    );
  }

  /**
   * Create a new trip
   */
  async createTrip(mxeDataAccount: PublicKey, routeHash: number[]): Promise<string> {
    const user = this.provider.wallet.publicKey;
    const [tripPDA] = await this.getTripPDA(user, mxeDataAccount);

    const tx = await this.program.methods
      .createTrip(routeHash)
      .accounts({
        trip: tripPDA,
        mxeDataAccount,
        user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Record a match (backend only)
   */
  async recordMatch(
    tripA: PublicKey,
    tripB: PublicKey,
    matchScore: number
  ): Promise<string> {
    const [matchPDA] = await this.getMatchPDA(tripA, tripB);

    const tx = await this.program.methods
      .recordMatch(matchScore)
      .accounts({
        matchRecord: matchPDA,
        tripA,
        tripB,
        payer: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Accept a match
   */
  async acceptMatch(matchRecord: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .acceptMatch()
      .accounts({
        matchRecord,
        user: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Reject a match
   */
  async rejectMatch(matchRecord: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .rejectMatch()
      .accounts({
        matchRecord,
        user: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Deactivate a trip
   */
  async deactivateTrip(trip: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .deactivateTrip()
      .accounts({
        trip,
        user: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Fetch a trip account
   */
  async fetchTrip(trip: PublicKey) {
    try {
      return await this.program.account.trip.fetch(trip);
    } catch {
      return null;
    }
  }

  /**
   * Fetch a match record
   */
  async fetchMatchRecord(matchRecord: PublicKey) {
    try {
      return await this.program.account.matchRecord.fetch(matchRecord);
    } catch {
      return null;
    }
  }

  /**
   * Fetch all trips for a user
   */
  async fetchUserTrips(user: PublicKey) {
    const trips = await this.program.account.trip.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: user.toBase58(),
        },
      },
    ]);

    return trips.map((t) => t.account);
  }

  /**
   * Fetch all active matches for a trip
   */
  async fetchTripMatches(trip: PublicKey) {
    const matchesA = await this.program.account.matchRecord.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: trip.toBase58(),
        },
      },
    ]);

    const matchesB = await this.program.account.matchRecord.all([
      {
        memcmp: {
          offset: 40, // Discriminator + tripA (8 + 32)
          bytes: trip.toBase58(),
        },
      },
    ]);

    return [...matchesA, ...matchesB].map((m) => m.account);
  }
}

export { TRIPER_PROGRAM_ID };
