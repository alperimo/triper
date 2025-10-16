use anchor_lang::prelude::*;

/// User Profile - Stores encrypted user preferences and interests
/// Privacy-first: All personal data is encrypted
/// 
/// What's encrypted:
/// - interests: [bool; 32] - Interest tags (hiking, food, etc.)
/// - display_name: String - Optional display name
/// - bio: String - Optional bio
/// - travel_style: u8 - Travel style preference
/// 
/// Seeds: [b"user_profile", user.key()]
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    /// Owner's public key
    pub owner: Pubkey,
    
    /// Encrypted user data (interests, preferences, bio)
    /// Contains: interests[], display_name, bio, travel_style
    /// Format: x25519 + RescueCipher encrypted UserData struct
    #[max_len(512)]
    pub encrypted_data: Vec<u8>,
    
    /// Public key for MPC (x25519)
    pub public_key: [u8; 32],
    
    /// Profile creation timestamp
    pub created_at: i64,
    
    /// Last update timestamp
    pub updated_at: i64,
    
    /// Total number of trips created
    pub trip_count: u32,
    
    /// Total number of matches found
    pub total_matches: u32,
    
    /// Whether profile is active
    pub is_active: bool,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl UserProfile {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        4 + 512 + // encrypted_data (Vec prefix + max size)
        32 + // public_key
        8 +  // created_at
        8 +  // updated_at
        4 +  // trip_count
        4 +  // total_matches
        1 +  // is_active
        1;   // bump
}
