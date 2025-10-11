use anchor_lang::prelude::*;

/// Match record - Stores match status and consent
/// Actual match computation happens in triper-mxe program
#[account]
pub struct MatchRecord {
    /// First trip public key
    pub trip_a: Pubkey,
    
    /// Second trip public key
    pub trip_b: Pubkey,
    
    /// Match score (0-100)
    pub match_score: u8,
    
    /// Match status
    pub status: MatchStatus,
    
    /// Whether trip_a owner accepted
    pub trip_a_accepted: bool,
    
    /// Whether trip_b owner accepted
    pub trip_b_accepted: bool,
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl MatchRecord {
    pub const LEN: usize = 8 + // discriminator
        32 + // trip_a
        32 + // trip_b
        1 +  // match_score
        1 +  // status (enum)
        1 +  // trip_a_accepted
        1 +  // trip_b_accepted
        8 +  // created_at
        1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MatchStatus {
    Pending,
    Mutual,
    Rejected,
}
