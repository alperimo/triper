use anchor_lang::prelude::*;

/// Trip account with destination-based matching
/// Two-stage architecture:
/// 1. Pre-filtering: Uses destination_grid_hash + dates (public, coarse)
/// 2. MPC Computation: Uses encrypted_data (precise waypoints)
#[account]
#[derive(InitSpace)]
pub struct Trip {
    /// Owner's public key
    pub owner: Pubkey,
    
    /// Destination grid hash for pre-filtering (coarse, H3 level 6 = ~36km²)
    /// Example: SHA256("Tokyo_Shibuya_area")
    pub destination_grid_hash: [u8; 32],
    
    /// Trip date range (public for pre-filtering)
    pub start_date: i64,
    pub end_date: i64,
    
    /// Encrypted trip data for MPC computation
    /// Contains: precise waypoints[], interests[], preferences
    /// Format: x25519 + RescueCipher encrypted TripData struct
    #[max_len(2048)]
    pub encrypted_data: Vec<u8>,
    
    /// Public key for MPC (x25519)
    pub public_key: [u8; 32],
    
    /// Whether trip is active for matching
    pub is_active: bool,
    
    /// Number of match computations performed
    pub match_count: u32,
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Trip {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // destination_grid_hash
        8 +  // start_date
        8 +  // end_date
        4 + 2048 + // encrypted_data (Vec prefix + max size)
        32 + // public_key
        1 +  // is_active
        4 +  // match_count
        8 +  // created_at
        1;   // bump
    
    // Alias for compatibility
    pub const SIZE: usize = Self::LEN;
}

