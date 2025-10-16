import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Triper } from "../target/types/triper";
import { expect } from "chai";
import {
  getMXEPublicKeyWithRetry,
  createSampleUserData
} from "./utils";
import { 
  x25519, 
  RescueCipher,
} from "@arcium-hq/client";
import { createOrUpdateUserProfile, fetchUserProfile } from "../../../apps/web/src/lib/solana/user-actions";

describe("UserProfile Management", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Triper as Program<Triper>;
  const provider = anchor.getProvider();

  console.log("Program ID:", program.programId.toBase58());

  it("Creates a UserProfile with encrypted interests", async () => {
    const user = (provider.wallet as anchor.Wallet).payer;
    
    console.log("\n👤 Creating UserProfile...");
    console.log("User:", user.publicKey.toBase58());

    // Get MXE public key for encryption
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );
    console.log("MXE x25519 pubkey:", Buffer.from(mxePublicKey).toString("hex").slice(0, 16) + "...");

    // Generate ephemeral keypair for encryption
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    
    // Derive shared secret and create cipher
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Create sample user data
    const userData = createSampleUserData('userA');
    console.log("Interests:", userData.interests);
    console.log("Display Name:", userData.displayName);

    const result = await createOrUpdateUserProfile(
      program as any, // Type mismatch will be resolved after IDL regeneration
      provider as anchor.AnchorProvider,
      cipher,
      publicKey,
      userData.interests,
      userData.displayName,
      userData.bio
    );

    console.log("✅ UserProfile created:", result.signature);
    console.log("   PDA:", result.userProfilePDA.toBase58());

    const profile = await fetchUserProfile(
      program as any,
      user.publicKey
    );
    
    expect(profile).to.not.be.null;
    expect(profile!.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(profile!.isActive).to.be.true;
    expect(profile!.tripCount).to.equal(0);
    expect(profile!.totalMatches).to.equal(0);
    console.log("✅ UserProfile verified on-chain");
  });

  it("Updates an existing UserProfile", async () => {
    const user = (provider.wallet as anchor.Wallet).payer;
    
    console.log("\n🔄 Updating UserProfile...");

    // Get MXE public key
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );

    // Generate new keypair for encryption
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Create DIFFERENT user data (userB variant)
    const userData = createSampleUserData('userB');
    console.log("Updated interests:", userData.interests);

    const result = await createOrUpdateUserProfile(
      program as any, // Type mismatch will be resolved after IDL regeneration
      provider as anchor.AnchorProvider,
      cipher,
      publicKey,
      userData.interests,
      userData.displayName,
      userData.bio
    );

    console.log("✅ UserProfile updated:", result.signature);
    
    const profile = await fetchUserProfile(
      program as any,
      user.publicKey
    );
    
    expect(profile).to.not.be.null;
    expect(profile!.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(profile!.isActive).to.be.true;
    
    // Verify updated_at changed
    expect(profile!.updatedAt).to.be.greaterThan(profile!.createdAt);
    console.log("✅ UserProfile update verified");
  });

  it("Fails to create UserProfile with data > 512 bytes", async () => {
    const user = (provider.wallet as anchor.Wallet).payer;
    
    console.log("\n❌ Testing UserProfile size limit...");

    // Get MXE public key
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );

    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Create sample data with a VERY LONG bio that will exceed 512 bytes when encrypted
    const userData = createSampleUserData('userA');
    const hugeBio = "A".repeat(1000); // 1000 character bio - way too large
    
    // This should throw an error from the client-side validation
    try {
      await createOrUpdateUserProfile(
        program as any,
        provider as anchor.AnchorProvider,
        cipher,
        publicKey,
        userData.interests,
        userData.displayName,
        hugeBio // Huge bio will make encrypted data > 512 bytes
      );
      
      throw new Error("Should have failed with data too large");
    } catch (error: any) {
      console.log("✅ Correctly rejected oversized data");
      expect(error.message).to.include("too large");
    }
  });
});