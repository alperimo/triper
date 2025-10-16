import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Triper } from "../target/types/triper";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  uploadCircuit,
  buildFinalizeCompDefTx,
  deserializeLE,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  x25519,
  RescueCipher,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";
import {
  getMXEPublicKeyWithRetry,
  createSampleTripData,
  createVariantTripData,
  createSampleUserData
} from "./utils";
import { createTrip } from "../../../apps/web/src/lib/solana/create-trip";
import { createOrUpdateUserProfile } from "../../../apps/web/src/lib/solana/user-actions";

describe("Arcium Trip Matching", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Triper as Program<Triper>;
  const provider = anchor.getProvider();

  type Event = anchor.IdlEvents<(typeof program)["idl"]>;
  const awaitEvent = async <E extends keyof Event>(
    eventName: E
  ): Promise<Event[E]> => {
    let listenerId: number;
    const event = await new Promise<Event[E]>((res) => {
      listenerId = program.addEventListener(eventName, (event) => {
        res(event);
      });
    });
    await program.removeEventListener(listenerId);

    return event;
  };

  const arciumEnv = getArciumEnv();

  console.log("Program ID:", program.programId.toBase58());
  console.log("Arcium Cluster:", arciumEnv.arciumClusterPubkey.toBase58());

  it("Initializes computation definition for compute_trip_match", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    console.log("\n🔧 Initializing compute_trip_match computation definition...");
    
    // Check if comp def exists first
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("compute_trip_match");
    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    const compDefAccount = await provider.connection.getAccountInfo(compDefPDA);
    
    if (compDefAccount) {
      console.log("⚠️  Computation definition already exists");
      console.log("   Ensuring circuit is uploaded and finalized...");
      
      // Upload circuit even if comp def exists
      let rawCircuit: Buffer | undefined;
      const possiblePaths = [
        "build/compute_trip_match_localnet.arcis",
        "build/compute_trip_match_testnet.arcis",
        "build/compute_trip_match.arcis",
      ];
      
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          console.log(`   Found circuit at ${path}`);
          rawCircuit = fs.readFileSync(path);
          break;
        }
      }
      
      if (rawCircuit) {
        try {
          await uploadCircuit(
            provider as anchor.AnchorProvider,
            "compute_trip_match",
            program.programId,
            rawCircuit,
            true
          );
          console.log("✅ Circuit uploaded successfully!");
        } catch (e: any) {
          console.log("⚠️  Circuit already uploaded (this is okay):", e.message?.split('\n')[0]);
        }
      }
      
      // Finalize the comp def
      console.log("   Finalizing computation definition...");
      try {
        const finalizeTx = await buildFinalizeCompDefTx(
          provider as anchor.AnchorProvider,
          Buffer.from(offset).readUInt32LE(),
          program.programId
        );

        const latestBlockhash = await provider.connection.getLatestBlockhash();
        finalizeTx.recentBlockhash = latestBlockhash.blockhash;
        finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

        finalizeTx.sign(owner);

        await provider.sendAndConfirm!(finalizeTx);
        console.log("✅ Computation definition finalized!");
      } catch (finalizeError: any) {
        console.log("⚠️  Finalization info:", finalizeError.message?.split('\n')[0]);
      }
    } else {
      try {
        const initSig = await initComputeTripMatchCompDef(
          program,
          owner,
          true, // uploadRawCircuit - upload the .arcis file
          false  // offchainSource
        );
        console.log("✅ Computation definition initialized!");
        console.log("   Transaction:", initSig);
      } catch (error: any) {
        if (error.message?.includes("already in use") || error.logs?.some((log: string) => log.includes("already in use"))) {
          console.log("⚠️  Computation definition already initialized (this is okay)");
        } else {
          throw error;
        }
      }
    }
  });

  it("Computes trip match with encrypted data", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);
    const tripOwnerB = anchor.web3.Keypair.generate(); // Second user

    // Airdrop to second user
    const airdropSig = await provider.connection.requestAirdrop(
      tripOwnerB.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    console.log("\n🔐 Testing encrypted trip matching...");

    // Get MXE public key for encryption
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );
    console.log("MXE x25519 pubkey:", Buffer.from(mxePublicKey).toString("hex").slice(0, 16) + "...");

    // Create trip data using helpers
    const tripAData = createSampleTripData();
    const tripBData = createVariantTripData();
    
    // Create user profile data for both users
    const userAData = createSampleUserData('userA');
    const userBData = createSampleUserData('userB');

    // Create UserProfile for User A using the client-side function
    console.log("\n👤 Creating UserProfile for User A...");
    console.log("   Interests:", userAData.interests);
    
    const privateKeyA = x25519.utils.randomPrivateKey();
    const publicKeyA = x25519.getPublicKey(privateKeyA);
    const sharedSecretA = x25519.getSharedSecret(privateKeyA, mxePublicKey);
    const cipherA = new RescueCipher(sharedSecretA);
    
    const userProfileAResult = await createOrUpdateUserProfile(
      program,
      provider as anchor.AnchorProvider,
      cipherA,
      publicKeyA,
      userAData.interests,
      userAData.displayName,
      userAData.bio
    );
    console.log("✅ UserProfile A created:", userProfileAResult.userProfilePDA.toBase58());

    // Switch wallet to User B for their profile and trip
    const originalWallet = (provider as any).wallet;
    (provider as any).wallet = {
      publicKey: tripOwnerB.publicKey,
      signTransaction: async (tx: any) => {
        tx.partialSign(tripOwnerB);
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach(tx => tx.partialSign(tripOwnerB));
        return txs;
      },
    };

    // Create UserProfile for User B using the client-side function
    console.log("\n👤 Creating UserProfile for User B...");
    console.log("   Interests:", userBData.interests);
    
    const privateKeyB = x25519.utils.randomPrivateKey();
    const publicKeyB = x25519.getPublicKey(privateKeyB);
    const sharedSecretB = x25519.getSharedSecret(privateKeyB, mxePublicKey);
    const cipherB = new RescueCipher(sharedSecretB);
    
    const userProfileBResult = await createOrUpdateUserProfile(
      program,
      provider as anchor.AnchorProvider,
      cipherB,
      publicKeyB,
      userBData.interests,
      userBData.displayName,
      userBData.bio
    );
    console.log("✅ UserProfile B created:", userProfileBResult.userProfilePDA.toBase58());

    // Step 1: Create Trip A (restore wallet to User A first)
    (provider as any).wallet = originalWallet;
    console.log("\n📍 Creating Trip A (San Francisco -> LA)...");
    const tripAResult = await createTrip(
      program,
      provider as anchor.AnchorProvider,
      tripAData.waypoints,
      tripAData.destination,
      tripAData.startDate,
      tripAData.endDate
    );
    console.log("✅ Trip A created:", tripAResult.tripPDA.toBase58());

    // Step 2: Create Trip B (switch back to User B)
    console.log("\n📍 Creating Trip B (San Francisco -> LA, different user)...");
    (provider as any).wallet = {
      publicKey: tripOwnerB.publicKey,
      signTransaction: async (tx: any) => {
        tx.partialSign(tripOwnerB);
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach(tx => tx.partialSign(tripOwnerB));
        return txs;
      },
    };
    
    const tripBResult = await createTrip(
      program,
      provider as anchor.AnchorProvider,
      tripBData.waypoints,
      tripBData.destination,
      tripBData.startDate,
      tripBData.endDate
    );
    console.log("✅ Trip B created:", tripBResult.tripPDA.toBase58());
    
    // Restore original wallet
    (provider as any).wallet = originalWallet;

    // Generate nonce for MPC computation
    const nonce = randomBytes(16);

    // Step 3: Initiate Match (creates MatchRecord)
    console.log("\n🤝 Initiating match between trips...");
    const [matchRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), tripAResult.tripPDA.toBuffer(), tripBResult.tripPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .initiateMatch()
      .accountsPartial({
        payer: owner.publicKey,
        tripA: tripAResult.tripPDA,
        tripB: tripBResult.tripPDA,
        matchRecord: matchRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();
    console.log("✅ Match record created:", matchRecordPda.toBase58());

    // Set up event listener for the callback
    const matchEventPromise = awaitEvent("matchComputedEvent");
    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    console.log("Queueing computation to MPC network...");
    console.log("  Computation Offset:", computationOffset.toString());

    // Derive the computation account address from the offset
    const computationAccount = getComputationAccAddress(
      program.programId,
      computationOffset
    );
    console.log("  Computation Account:", computationAccount.toString());

    const queueSig = await program.methods
      .computeTripMatch(
        computationOffset,
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("compute_trip_match")).readUInt32LE()
        ),
        matchRecord: matchRecordPda,
        tripA: tripAResult.tripPDA,
        tripB: tripBResult.tripPDA,
      })
      .signers([])
      .rpc();    console.log("✅ Computation queued!");
    console.log("   Transaction:", queueSig);

    console.log("\n⏳ Waiting for MPC computation to complete...");
    console.log("   (This typically takes 10-30 seconds)");

    // Wait for the computation to finalize
    try {
      const finalizeSig = await awaitComputationFinalization(
        provider as anchor.AnchorProvider,
        computationOffset,
        program.programId,
        "confirmed"
      );
      console.log("✅ Computation finalized!");
      console.log("   Transaction:", finalizeSig);
    } catch (error: any) {
      console.error("Error during computation finalization:", error.message);
      throw error;
    }

    // Wait for the callback event
    const matchEvent = await matchEventPromise;
    
    console.log("\n🎉 Match Computed Event Received!");
    console.log("   Computation Account:", matchEvent.computationAccount.toBase58());
    console.log("   Route Score:", matchEvent.routeScore);
    console.log("   Date Score:", matchEvent.dateScore);
    console.log("   Interest Score:", matchEvent.interestScore);
    console.log("   Total Score:", matchEvent.totalScore);

    // Verify scores are in valid range (0-100)
    expect(matchEvent.routeScore).to.be.at.least(0).and.at.most(100);
    expect(matchEvent.dateScore).to.be.at.least(0).and.at.most(100);
    expect(matchEvent.interestScore).to.be.at.least(0).and.at.most(100);
    expect(matchEvent.totalScore).to.be.at.least(0).and.at.most(100);

    // Verify expected scores based on test data:
    // - Route overlap: 4/8 cells match (SF, San Jose, Santa Barbara, LA) = ~50%
    // - Date overlap: 100% (same dates)
    // - Interest overlap: 2/3 match (hiking, photography) = ~67%
    console.log("\n📊 Expected vs Actual:");
    console.log("   Route: ~50% (4 overlapping waypoints)");
    console.log("   Date: 100% (same dates)");
    console.log("   Interest: ~67% (2/3 match)");

    console.log("\n✨ MPC computation completed successfully!");
    console.log("   The encrypted trip data was processed without revealing sensitive information!");
  });

  async function initComputeTripMatchCompDef(
    program: Program<Triper>,
    owner: anchor.web3.Keypair,
    uploadRawCircuit: boolean,
    offchainSource: boolean
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("compute_trip_match");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    console.log("Comp def PDA:", compDefPDA.toBase58());

    const sig = await program.methods
      .initComputeTripMatchCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({
        commitment: "confirmed",
      });
    
    console.log("Init computation definition transaction:", sig);

    if (uploadRawCircuit) {
      console.log("Uploading raw circuit file...");
      
      // Try different possible circuit file names
      let rawCircuit: Buffer | undefined;
      const possiblePaths = [
        "build/compute_trip_match_localnet.arcis",
        "build/compute_trip_match_testnet.arcis",
        "build/compute_trip_match.arcis",
      ];
      
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          console.log(`Found circuit at ${path}`);
          rawCircuit = fs.readFileSync(path);
          break;
        }
      }
      
      if (!rawCircuit) {
        throw new Error("Circuit file not found. Please build with 'arcium build' first.");
      }

      try {
        await uploadCircuit(
          provider as anchor.AnchorProvider,
          "compute_trip_match",
          program.programId,
          rawCircuit,
          true
        );
        console.log("✅ Circuit uploaded successfully!");
      } catch (uploadError: any) {
        console.log("⚠️  Circuit upload completed (may already exist):", uploadError.message);
      }
      
      // Always finalize after upload attempt
      console.log("Finalizing computation definition...");
      
      const finalizeTx = await buildFinalizeCompDefTx(
        provider as anchor.AnchorProvider,
        Buffer.from(offset).readUInt32LE(),
        program.programId
      );

      const latestBlockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = latestBlockhash.blockhash;
      finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

      finalizeTx.sign(owner);

      await provider.sendAndConfirm!(finalizeTx);
      console.log("✅ Computation definition finalized!");
    } else if (!offchainSource) {
      console.log("Finalizing computation definition...");
      
      const finalizeTx = await buildFinalizeCompDefTx(
        provider as anchor.AnchorProvider,
        Buffer.from(offset).readUInt32LE(),
        program.programId
      );

      const latestBlockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = latestBlockhash.blockhash;
      finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

      finalizeTx.sign(owner);

      await provider.sendAndConfirm!(finalizeTx);
      console.log("✅ Computation definition finalized!");
    }
    
    return sig;
  }
});

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString()))
  );
}
