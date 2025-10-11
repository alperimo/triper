use anchor_lang::prelude::*;

/// Public trip metadata - NO SENSITIVE DATA
/// Sensitive data (route, dates, interests) is encrypted and processed via Arcium MXE
#[account]
pub struct Trip {
    /// Owner's public key
    pub owner: Pubkey,
    
    /// Hash of the route for verification (non-sensitive)
    pub route_hash: [u8; 32],
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Whether trip is active for matching
    pub is_active: bool,
    
    /// Number of match computations performed
    /// Used to track Arcium MXE usage
    pub computation_count: u32,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Trip {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // route_hash
        8 +  // created_at
        1 +  // is_active
        4 +  // computation_count
        1;   // bump
    
    // Alias for compatibility
    pub const SIZE: usize = Self::LEN;
}
