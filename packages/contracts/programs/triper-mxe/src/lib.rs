// Triper MXE - Confidential Travel Matching Program
// Handles encrypted data storage and MPC-based matching computations

use anchor_lang::prelude::*;

// Declare modules
pub mod state;
pub mod instructions;
pub mod utils;
pub mod error;

// Re-exports
pub use state::*;
pub use instructions::*;
pub use error::*;

declare_id!("DXXjZXXGXh93RNoqsGMzrFJ2otJwQu4r7fxx68JMRPrW");

#[program]
pub mod triper_mxe {
    use super::*;

    /// Store encrypted trip data
    /// This instruction stores encrypted route, dates, and interests
    /// Data is encrypted client-side using Arcium SDK before submission
    pub fn store_encrypted_trip(
        ctx: Context<StoreEncryptedTrip>,
        encrypted_route: Vec<Vec<u8>>,
        encrypted_dates: Vec<Vec<u8>>,
        encrypted_interests: Vec<Vec<u8>>,
    ) -> Result<()> {
        instructions::store_encrypted_trip::handler(
            ctx,
            encrypted_route,
            encrypted_dates,
            encrypted_interests,
        )
    }

    /// Submit match computation request
    /// This triggers MPC computation to calculate match score
    /// Runs on encrypted data without revealing it
    pub fn compute_match(
        ctx: Context<ComputeMatch>,
        trip_b: Pubkey,
    ) -> Result<()> {
        instructions::compute_match::handler(ctx, trip_b)
    }

    /// Decrypt trip data for mutual matches
    /// Only callable when both parties have accepted the match
    pub fn reveal_for_mutual(
        ctx: Context<RevealForMutual>,
    ) -> Result<()> {
        instructions::reveal_for_mutual::handler(ctx)
    }
}
