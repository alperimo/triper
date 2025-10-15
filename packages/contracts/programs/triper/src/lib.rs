// Triper - Privacy-Preserving Travel Companion Matching
// Powered by Arcium MXE for confidential computations

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Declare modules
pub mod instructions;
pub mod state;
pub mod error;
pub mod events;

// Re-export for convenience
pub use instructions::*;
pub use state::*;
pub use error::*;
pub use events::*;

declare_id!("Fn6rAGhjUc45tQqfgsXCdNtNC3GSfNWdjHEjpHaUJMaY");

// Computation definition offset for compute_trip_match encrypted instruction
const COMP_DEF_OFFSET_COMPUTE_TRIP_MATCH: u32 = comp_def_offset("compute_trip_match");

#[arcium_program]
pub mod triper {
    use super::*;

    // Accept a match
    pub fn accept_match(ctx: Context<AcceptMatch>) -> Result<()> {
        instructions::accept_match_handler(ctx)
    }

    /// Create a new trip with encrypted data
    pub fn create_trip(
        ctx: Context<CreateTrip>,
        destination_grid_hash: [u8; 32],
        start_date: i64,
        end_date: i64,
        encrypted_data: Vec<u8>,
        public_key: [u8; 32],
    ) -> Result<()> {
        instructions::create_trip_handler(
            ctx,
            destination_grid_hash,
            start_date,
            end_date,
            encrypted_data,
            public_key,
        )
    }

    /// Initiate a match computation between two trips
    /// Creates MatchRecord in Pending status
    pub fn initiate_match(ctx: Context<InitiateMatch>) -> Result<()> {
        instructions::initiate_match_handler(ctx)
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
        ciphertext_a_bytes: Vec<u8>,
        ciphertext_b_bytes: Vec<u8>,
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        
        // Build arguments similar to hello-world example
        // Ciphertext from RescueCipher is serialized as bytes
        // We need to split into 32-byte chunks for EncryptedU8 arguments
        
        let mut args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
        ];
        
        // Split ciphertext_a into 32-byte chunks
        for chunk in ciphertext_a_bytes.chunks(32) {
            if chunk.len() == 32 {
                let mut field = [0u8; 32];
                field.copy_from_slice(chunk);
                args.push(Argument::EncryptedU8(field));
            }
        }
        
        // Split ciphertext_b into 32-byte chunks
        for chunk in ciphertext_b_bytes.chunks(32) {
            if chunk.len() == 32 {
                let mut field = [0u8; 32];
                field.copy_from_slice(chunk);
                args.push(Argument::EncryptedU8(field));
            }
        }

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ComputeTripMatchCallback::callback_ix(&[])],
        )?;
        
        msg!("Queued MPC computation for match record: {}", ctx.accounts.match_record.key());
        msg!("Trip A: {} bytes ({} encrypted fields)", ciphertext_a_bytes.len(), ciphertext_a_bytes.len() / 32);
        msg!("Trip B: {} bytes ({} encrypted fields)", ciphertext_b_bytes.len(), ciphertext_b_bytes.len() / 32);
        
        Ok(())
    }

    /// Callback handler - receives match results from MPC network
    /// Updates MatchRecord with computed scores
    #[arcium_callback(encrypted_ix = "compute_trip_match")]
    pub fn compute_trip_match_callback(
        ctx: Context<ComputeTripMatchCallback>,
        output: ComputationOutputs<ComputeTripMatchOutput>,
    ) -> Result<()> {
        let scores = match output {
            ComputationOutputs::Success(ComputeTripMatchOutput { field_0 }) => field_0,
            _ => return Err(error::ErrorCode::ComputationFailed.into()),
        };

        let match_record = &mut ctx.accounts.match_record;
        
        // Update MatchRecord with MPC computation results
        match_record.route_score = scores.field_0;
        match_record.date_score = scores.field_1;
        match_record.interest_score = scores.field_2;
        match_record.total_score = scores.field_3;
        match_record.status = state::MatchStatus::Completed;
        
        // Emit event for frontend notification
        emit!(MatchComputedEvent {
            computation_account: ctx.accounts.computation_account.key(),
            route_score: scores.field_0,
            date_score: scores.field_1,
            interest_score: scores.field_2,
            total_score: scores.field_3,
        });
        
        msg!("Match computation completed via Arcium MPC");
        msg!("Match record {} updated with scores:", match_record.key());
        msg!("  Route: {}/100", scores.field_0);
        msg!("  Dates: {}/100", scores.field_1);
        msg!("  Interests: {}/100", scores.field_2);
        msg!("  Total: {}/100", scores.field_3);

        Ok(())
    }

    /// Deactivate a trip
    pub fn deactivate_trip(ctx: Context<DeactivateTrip>) -> Result<()> {
        instructions::deactivate_trip_handler(ctx)
    }

    /// Reject a match
    pub fn reject_match(ctx: Context<RejectMatch>) -> Result<()> {
        instructions::reject_match_handler(ctx)
    }
}
