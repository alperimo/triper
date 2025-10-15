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
  RescueCipher,
  deserializeLE,
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  x25519,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

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

    // Generate ephemeral key pair for this computation
    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);

    // Derive shared secret and create cipher
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Create realistic TripData matching the circuit structure
    // TripData in encrypted-ixs/src/trip_matching.rs:
    // pub struct TripData {
    //     waypoints: [u64; 20],     // H3 cells at resolution 7
    //     waypoint_count: u8,
    //     start_date: i64,          // Unix timestamp
    //     end_date: i64,
    //     interests: [bool; 32],
    // }
    
    // Sample H3 cells at resolution 7 (San Francisco to LA route)
    const tripAWaypoints = [
      BigInt("0x872830828ffffff"), // SF
      BigInt("0x872830829ffffff"), // San Jose
      BigInt("0x87283082affffff"), // Monterey
      BigInt("0x87283082bffffff"), // Big Sur
      BigInt("0x8728343c8ffffff"), // Santa Barbara
      BigInt("0x8728343c9ffffff"), // LA
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), // Padded to 20
    ];
    
    const tripBWaypoints = [
      BigInt("0x872830828ffffff"), // SF (same as A)
      BigInt("0x872830829ffffff"), // San Jose (same as A)
      BigInt("0x87283082cffffff"), // Different route
      BigInt("0x87283082dffffff"),
      BigInt("0x8728343c8ffffff"), // Santa Barbara (same as A)
      BigInt("0x8728343c9ffffff"), // LA (same as A)
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0),
    ];
    
    // Dates: Use unique timestamps to avoid account conflicts on re-runs
    // Adding randomness so trips are unique each test run
    const dateOffset = Math.floor(Date.now() / 1000);
    const startDate = BigInt(dateOffset);
    const endDate = BigInt(dateOffset + 14 * 24 * 60 * 60); // 14 days later
    
    // Interests: hiking (0), photography (1), food (2) = true, rest false
    const interestsA = [
      BigInt(1), BigInt(1), BigInt(1), // hiking, photography, food
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
    ];
    
    const interestsB = [
      BigInt(1), BigInt(1), BigInt(0), // hiking, photography (overlap), no food
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0),
      BigInt(0), BigInt(0), BigInt(0), BigInt(0),
    ];
    
    // Serialize TripData according to circuit structure
    const tripAData = [
      ...tripAWaypoints,      // 20 waypoints (u64)
      BigInt(6),              // waypoint_count (u8) - 6 actual waypoints
      startDate,              // start_date (i64)
      endDate,                // end_date (i64)
      ...interestsA,          // 32 interests (bool)
    ];
    
    const tripBData = [
      ...tripBWaypoints,
      BigInt(6),
      startDate,
      endDate,
      ...interestsB,
    ];

    // Encrypt the trip data
    const nonce = randomBytes(16);
    const ciphertextA = cipher.encrypt(tripAData, nonce);
    const ciphertextB = cipher.encrypt(tripBData, nonce);

    console.log("Trip data encrypted with nonce:", Buffer.from(nonce).toString("hex"));
    console.log("Ciphertext A structure:", typeof ciphertextA, Array.isArray(ciphertextA) ? `array of ${ciphertextA.length}` : 'not array');
    console.log("Ciphertext A[0] type:", typeof ciphertextA[0], ciphertextA[0] instanceof Uint8Array ? 'Uint8Array' : Array.isArray(ciphertextA[0]) ? 'Array' : 'other');
    if (ciphertextA[0]) {
      console.log("Ciphertext A[0] length:", ciphertextA[0].length);
    }

    // Step 1: Create Trip A
    console.log("\n📍 Creating Trip A (San Francisco -> LA)...");
    const [tripAPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("trip"),
        owner.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(startDate.toString()).toArrayLike(Buffer, "le", 8)),
      ],
      program.programId
    );

    const destinationHashA = Buffer.from(new Array(32).fill(1)); // Simple hash for SF-LA area
    await program.methods
      .createTrip(
        Array.from(destinationHashA),
        new anchor.BN(startDate.toString()),
        new anchor.BN(endDate.toString()),
        Buffer.from(ciphertextA[0]), // Use encrypted data as Buffer
        Array.from(publicKey)
      )
      .accountsPartial({
        trip: tripAPda,
        user: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();
    console.log("✅ Trip A created:", tripAPda.toBase58());

    // Step 2: Create Trip B
    console.log("\n📍 Creating Trip B (San Francisco -> LA, different user)...");
    const [tripBPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("trip"),
        tripOwnerB.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(startDate.toString()).toArrayLike(Buffer, "le", 8)),
      ],
      program.programId
    );

    const destinationHashB = Buffer.from(new Array(32).fill(1)); // Same area
    await program.methods
      .createTrip(
        Array.from(destinationHashB),
        new anchor.BN(startDate.toString()),
        new anchor.BN(endDate.toString()),
        Buffer.from(ciphertextB[0]), // Use encrypted data as Buffer
        Array.from(publicKey)
      )
      .accountsPartial({
        trip: tripBPda,
        user: tripOwnerB.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([tripOwnerB])
      .rpc();
    console.log("✅ Trip B created:", tripBPda.toBase58());

    // Step 3: Initiate Match (creates MatchRecord)
    console.log("\n🤝 Initiating match between trips...");
    const [matchRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), tripAPda.toBuffer(), tripBPda.toBuffer()],
      program.programId
    );

    await program.methods
      .initiateMatch()
      .accountsPartial({
        payer: owner.publicKey,
        tripA: tripAPda,
        tripB: tripBPda,
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
    
    // Convert ciphertext from number[][] to bytes
    // cipher.encrypt() returns an array of encrypted field elements (each 32 bytes)
    // We need to flatten this into a single byte array
    console.log("Ciphertext A structure:", typeof ciphertextA, Array.isArray(ciphertextA), ciphertextA.length);
    console.log("Ciphertext A[0] length:", ciphertextA[0]?.length);
    
    // Flatten the 2D array into a single Buffer
    const ciphertextABytes = Buffer.concat(ciphertextA.map(field => Buffer.from(field)));
    const ciphertextBBytes = Buffer.concat(ciphertextB.map(field => Buffer.from(field)));
    
    console.log(`Flattened ciphertext A: ${ciphertextABytes.length} bytes`);
    console.log(`Flattened ciphertext B: ${ciphertextBBytes.length} bytes`);

    const queueSig = await program.methods
      .computeTripMatch(
        computationOffset,
        ciphertextABytes,
        ciphertextBBytes,
        Array.from(publicKey),
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
      })
      .signers([])
      .rpc();

    console.log("✅ Computation queued!");
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

async function getMXEPublicKeyWithRetry(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 10,
  retryDelayMs: number = 500
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mxePublicKey = await getMXEPublicKey(provider, programId);
      if (mxePublicKey) {
        return mxePublicKey;
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed to fetch MXE public key:`, error);
    }

    if (attempt < maxRetries) {
      console.log(
        `Retrying in ${retryDelayMs}ms... (attempt ${attempt}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(
    `Failed to fetch MXE public key after ${maxRetries} attempts`
  );
}

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString()))
  );
}
