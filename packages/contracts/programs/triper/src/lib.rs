// Triper - Privacy-Preserving Travel Companion Matching
// Powered by Arcium MXE for confidential computations

use anchor_lang::prelude::*;
use arcis::prelude::*;

// Declare modules
pub mod instructions;
pub mod state;
pub mod error;
pub mod confidential;

// Re-export for convenience
pub use instructions::*;
pub use state::*;
pub use error::*;
pub use confidential::*;

declare_id!("Fn6rAGhjUc45tQqfgsXCdNtNC3GSfNWdjHEjpHaUJMaY");

#[program]
pub mod triper {
    use super::*;

    /// Create a new trip (public metadata only)
    pub fn create_trip(
        ctx: Context<CreateTrip>,
        route_hash: [u8; 32],
    ) -> Result<()> {
        instructions::create_trip::handler(ctx, route_hash)
    }

    /// Confidential trip matching computation
    /// Runs via Arcium MXE - data never decrypted
    #[confidential]
    pub fn compute_match(
        ctx: Context<ComputeMatch>,
        // Trip A (encrypted)
        route_a: Vec<(f64, f64)>,
        dates_a: (i64, i64),
        interests_a: Vec<u32>,
        // Trip B (encrypted)
        route_b: Vec<(f64, f64)>,
        dates_b: (i64, i64),
        interests_b: Vec<u32>,
        // Config
        grid_size: u32,
    ) -> Result<MatchResult> {
        // This entire computation runs via MPC!
        let result = confidential::compute_trip_match(
            route_a,
            dates_a,
            interests_a,
            route_b,
            dates_b,
            interests_b,
            grid_size,
        );
        
        Ok(result)
    }

    /// Record a match (called after MXE computation completes)
    pub fn record_match(
        ctx: Context<RecordMatch>,
        match_result: MatchResult,
        computation_id: [u8; 32],
    ) -> Result<()> {
        instructions::record_match::handler(ctx, match_result, computation_id)
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
