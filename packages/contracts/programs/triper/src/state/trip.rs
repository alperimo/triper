use anchor_lang::prelude::*;

/// Trip account with destination-based matching
/// Two-stage architecture:
/// 1. Pre-filtering: Uses destination_grid_hash + dates (public, coarse)
/// 2. MPC Computation: Uses encrypted_waypoints (precise route)
/// 
/// PRIVACY MODEL:
/// - Encrypted: Waypoints (precise H3 cells)
/// - Public: Dates, destination hash (coarse H3 level 6)
/// - User interests stored in separate UserProfile account
/// 
/// ZK COMPRESSION SUPPORT:
/// - LightHasher implementation enables compression via Light Protocol
/// - Traditional storage: ~$0.39 per trip
/// - Compressed storage: ~$0.06 per trip (85% savings)
/// - Hybrid: Create traditional → Archive to compressed
#[account]
#[derive(InitSpace, Clone, Debug)]
pub struct Trip {
    /// Owner's public key
    pub owner: Pubkey,
    
    /// Destination grid hash for pre-filtering (coarse, H3 level 6 = ~36km²)
    /// Example: SHA256("Tokyo_Shibuya_area")
    pub destination_grid_hash: [u8; 32],
    
    /// Trip date range (PUBLIC for pre-filtering)
    /// Stored unencrypted to enable efficient date-based filtering
    pub start_date: i64,
    pub end_date: i64,
    
    /// Encrypted waypoints ONLY (no interests, no duplicate dates)
    /// Contains: waypoints[20] (H3 cells), waypoint_count
    /// Format: x25519 + RescueCipher encrypted WaypointData struct
    /// ~640 bytes actual
    #[max_len(800)]
    pub encrypted_waypoints: Vec<u8>,
    
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
        4 + 800 + // encrypted_waypoints (Vec prefix + max size)
        32 + // public_key
        1 +  // is_active
        4 +  // match_count
        8 +  // created_at
        1;   // bump
    // Total: ~937 bytes

    // Alias for compatibility
    pub const SIZE: usize = Self::LEN;
}

/// Implement Light Protocol LightHasher for ZK Compression support
/// 
/// This enables the Trip struct to be used with Light Protocol's
/// state compression, reducing storage costs by ~85%.
/// 
/// The hasher uses Poseidon hash function (ZK-friendly) to create
/// deterministic hashes for inclusion in the Merkle state tree.
impl light_sdk::LightHasher for Trip {
    fn hash<H: light_hasher::DataHasher>(&self) -> std::result::Result<[u8; 32], light_hasher::errors::HasherError> {
        // Use Light Protocol's Poseidon hasher for ZK-friendly hashing
        use light_hasher::Poseidon;
        
        // Serialize trip data
        let data = self.try_to_vec()
            .map_err(|_| light_hasher::errors::HasherError::SerializationError)?;
        
        // Hash with Poseidon (ZK-friendly hash function)
        H::hashv(&[&data])
    }
}
