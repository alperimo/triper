// Triper - Privacy-Preserving Travel Companion Matching
// Public on-chain program (non-sensitive data only)

use anchor_lang::prelude::*;

// Declare modules
pub mod instructions;
pub mod state;
pub mod error;

// Re-export for convenience
pub use instructions::*;
pub use state::*;
pub use error::*;

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

    /// Record a match (called by backend after MXE computation)
    pub fn record_match(
        ctx: Context<RecordMatch>,
        match_score: u8,
    ) -> Result<()> {
        instructions::record_match::handler(ctx, match_score)
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
