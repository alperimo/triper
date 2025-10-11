// Match Computation State
// Tracks MPC computation requests and results

use anchor_lang::prelude::*;

#[account]
pub struct MatchComputation {
    /// First trip (initiator)
    pub trip_a: Pubkey,
    
    /// Second trip (matched against)
    pub trip_b: Pubkey,
    
    /// Computation status
    pub status: ComputationStatus,
    
    /// Match score result (0-100)
    /// Only set after computation completes
    pub match_score: Option<u8>,
    
    /// Route similarity score component
    pub route_score: Option<u8>,
    
    /// Date overlap score component
    pub date_score: Option<u8>,
    
    /// Interest match score component
    pub interest_score: Option<u8>,
    
    /// Computation request timestamp
    pub requested_at: i64,
    
    /// Computation completion timestamp
    pub completed_at: Option<i64>,
    
    /// Bump seed
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ComputationStatus {
    /// Computation requested but not started
    Pending,
    
    /// Currently being computed in MXE
    Computing,
    
    /// Computation completed successfully
    Completed,
    
    /// Computation failed
    Failed,
}

impl MatchComputation {
    pub const LEN: usize = 8 + // discriminator
        32 + // trip_a
        32 + // trip_b
        1 + // status
        2 + // match_score (Option<u8>)
        2 + // route_score
        2 + // date_score
        2 + // interest_score
        8 + // requested_at
        9 + // completed_at (Option<i64>)
        1; // bump
}
