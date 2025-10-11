use anchor_lang::prelude::*;

/// Match record - Stores match status and detailed scores
/// Computation happens via Arcium MXE confidential circuit
#[account]
pub struct Match {
    /// First trip public key
    pub trip_a: Pubkey,
    
    /// Second trip public key
    pub trip_b: Pubkey,
    
    /// Total match score (0-100)
    pub total_score: u8,
    
    /// Route similarity score (0-100)
    pub route_score: u8,
    
    /// Date overlap score (0-100)
    pub date_score: u8,
    
    /// Interest similarity score (0-100)
    pub interest_score: u8,
    
    /// Match status
    pub status: MatchStatus,
    
    /// Whether trip_a owner accepted
    pub trip_a_accepted: bool,
    
    /// Whether trip_b owner accepted
    pub trip_b_accepted: bool,
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Arcium computation ID (for tracking MXE execution)
    pub computation_id: [u8; 32],
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl Match {
    pub const LEN: usize = 8 + // discriminator
        32 + // trip_a
        32 + // trip_b
        1 +  // total_score
        1 +  // route_score
        1 +  // date_score
        1 +  // interest_score
        1 +  // status (enum)
        1 +  // trip_a_accepted
        1 +  // trip_b_accepted
        8 +  // created_at
        32 + // computation_id
        1;   // bump
    
    // Alias for compatibility
    pub const SIZE: usize = Self::LEN;
}

// Alias for backward compatibility
pub type MatchRecord = Match;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MatchStatus {
    Pending,
    Mutual,
    Rejected,
}
