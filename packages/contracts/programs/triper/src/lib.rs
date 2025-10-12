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

// Computation definition offset for compute_trip_match encrypted instruction
const COMP_DEF_OFFSET_COMPUTE_TRIP_MATCH: u32 = comp_def_offset("compute_trip_match");

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
    pub fn init_compute_trip_match_comp_def(
        ctx: Context<InitComputeTripMatchCompDef>
    ) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    /// Queue a confidential trip matching computation
    /// Encrypted data is sent to Arcium MPC network
    pub fn compute_trip_match(
        ctx: Context<ComputeTripMatch>,
        computation_offset: u64,
        ciphertext_a: [u8; 32],
        ciphertext_b: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(ciphertext_a),
            Argument::EncryptedU8(ciphertext_b),
        ];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ComputeTripMatchCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    /// Callback handler - receives match results from MPC network
    #[arcium_callback(encrypted_ix = "compute_trip_match")]
    pub fn compute_trip_match_callback(
        ctx: Context<ComputeTripMatchCallback>,
        output: ComputationOutputs<ComputeTripMatchOutput>,
    ) -> Result<()> {
        let scores = match output {
            ComputationOutputs::Success(scores) => scores,
            _ => return Err(error::ErrorCode::ComputationFailed.into()),
        };

        // Emit event with match scores
        emit!(MatchComputedEvent {
            computation_account: ctx.accounts.computation_account.key(),
            route_score: scores.field_0,
            date_score: scores.field_1,
            interest_score: scores.field_2,
            total_score: scores.field_3,
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
