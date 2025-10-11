// Encrypted Trip Data Account
// Stores encrypted travel information in MXE environment

use anchor_lang::prelude::*;

#[account]
pub struct EncryptedTrip {
    /// Owner's public key (from main triper program)
    pub owner: Pubkey,
    
    /// Reference to public trip account in main program
    pub public_trip: Pubkey,
    
    /// Encrypted route waypoints
    /// Each waypoint is encrypted separately
    pub encrypted_route: Vec<Vec<u8>>,
    
    /// Encrypted travel dates (start, end)
    pub encrypted_dates: Vec<Vec<u8>>,
    
    /// Encrypted travel interests/preferences
    pub encrypted_interests: Vec<Vec<u8>>,
    
    /// Encryption nonce for decryption
    pub nonce: [u8; 32],
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Whether this trip is available for matching
    pub is_active: bool,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl EncryptedTrip {
    /// Maximum size calculation
    /// Base: 8 (discriminator)
    /// Fixed: 32 (owner) + 32 (public_trip) + 32 (nonce) + 8 (created_at) + 1 (is_active) + 1 (bump) = 106
    /// Variable: encrypted_route (max 10 waypoints * 200 bytes) + encrypted_dates (2 * 100 bytes) + encrypted_interests (5 * 100 bytes)
    /// Total: 8 + 106 + 2000 + 200 + 500 = 2814 bytes
    pub const MAX_SIZE: usize = 3000; // Round up for safety
}
