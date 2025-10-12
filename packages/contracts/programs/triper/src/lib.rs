// Triper - Privacy-Preserving Travel Companion Matching
// Powered by Arcium MXE for confidential computations

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Declare modules
pub mod instructions;
pub mod state;
pub mod error;

// Re-export for convenience
pub use instructions::*;
pub use state::*;
pub use error::*;

declare_id!("Fn6rAGhjUc45tQqfgsXCdNtNC3GSfNWdjHEjpHaUJMaY");

// Computation definition offset for compute_match encrypted instruction
const COMP_DEF_OFFSET_COMPUTE_MATCH: u32 = comp_def_offset("compute_match");

#[arcium_program]
pub mod triper {
    use super::*;

    /// Create a new trip (public metadata only)
    pub fn create_trip(
        ctx: Context<CreateTrip>,
        route_hash: [u8; 32],
    ) -> Result<()> {
        instructions::create_trip::handler(ctx, route_hash)
    }

    /// Initialize the computation definition for match computation
    /// Must be called once after program deployment
    pub fn init_compute_match_comp_def(
        ctx: Context<InitComputeMatchCompDef>
    ) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    /// Queue a confidential trip matching computation
    /// Encrypted data is sent to Arcium MPC network
    pub fn queue_compute_match(
        ctx: Context<QueueComputeMatch>,
        computation_offset: u64,
        // Encrypted ciphertexts for trip data
        encrypted_trip_a: Vec<u8>,
        encrypted_trip_b: Vec<u8>,
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedBytes(encrypted_trip_a),
            Argument::EncryptedBytes(encrypted_trip_b),
        ];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ComputeMatchCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    /// Callback handler - receives encrypted match results from MPC network
    #[arcium_callback(encrypted_ix = "compute_match")]
    pub fn compute_match_callback(
        ctx: Context<ComputeMatchCallback>,
        output: ComputationOutputs<ComputeMatchOutput>,
    ) -> Result<()> {
        let result = match output {
            ComputationOutputs::Success(result) => result,
            _ => return Err(error::ErrorCode::ComputationFailed.into()),
        };

        // Emit event with encrypted scores
        emit!(MatchComputedEvent {
            trip_a: ctx.accounts.trip_a.key(),
            trip_b: ctx.accounts.trip_b.key(),
            encrypted_scores: result.field_0.ciphertexts,
            nonce: result.field_0.nonce.to_le_bytes(),
        });

        Ok(())
    }

    /// Record a match (called after decrypting scores on client)
    pub fn record_match(
        ctx: Context<RecordMatch>,
        route_score: u8,
        date_score: u8,
        interest_score: u8,
        total_score: u8,
    ) -> Result<()> {
        instructions::record_match::handler(
            ctx,
            route_score,
            date_score,
            interest_score,
            total_score,
        )
    }

    /// Accept a match
    pub fn accept_match(ctx: Context<AcceptMatch>) -> Result<()> {
        instructions::accept_match::handler(ctx)
    }

    /// Reject a match
    pub fn reject_match(ctx: Context<RejectMatch>) -> Result<()> {
        instructions::reject_match::handler(ctx)
    }

    /// Deactivate a trip
    pub fn deactivate_trip(ctx: Context<DeactivateTrip>) -> Result<()> {
        instructions::deactivate_trip::handler(ctx)
    }
}
