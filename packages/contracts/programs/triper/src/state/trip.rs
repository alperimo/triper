use anchor_lang::prelude::*;

/// Public trip metadata - NO SENSITIVE DATA
/// All sensitive data (encrypted route, dates, interests) is stored in triper-mxe program
#[account]
pub struct Trip {
    /// Owner's public key
    pub owner: Pubkey,
    
    /// Reference to the MXE account that holds encrypted trip data
    pub mxe_data_account: Pubkey,
    
    /// Hash of the route for verification (non-sensitive)
    pub route_hash: [u8; 32],
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Whether trip is active for matching
    pub is_active: bool,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Trip {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // mxe_data_account
        32 + // route_hash
        8 +  // created_at
        1 +  // is_active
        1;   // bump
}
