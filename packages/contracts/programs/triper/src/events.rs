// Events for match computation flow

use anchor_lang::prelude::*;

/// Emitted when a match computation is requested
/// Off-chain MPC service listens for this event
#[event]
pub struct MatchComputationRequested {
    /// Match record PDA
    pub match_record: Pubkey,
    
    /// First trip
    pub trip_a: Pubkey,
    
    /// Second trip
    pub trip_b: Pubkey,
    
    /// Encrypted trip data A (ciphertext)
    pub encrypted_data_a: Vec<u8>,
    
    /// Encrypted trip data B (ciphertext)
    pub encrypted_data_b: Vec<u8>,
    
    /// Public key for trip A (x25519)
    pub public_key_a: [u8; 32],
    
    /// Public key for trip B (x25519)
    pub public_key_b: [u8; 32],
    
    /// User who requested the match
    pub requester: Pubkey,
    
    /// Request timestamp
    pub timestamp: i64,
}

/// Emitted when MPC computation completes and scores are stored
#[event]
pub struct MatchComputationCompleted {
    /// Match record PDA
    pub match_record: Pubkey,
    
    /// First trip
    pub trip_a: Pubkey,
    
    /// Second trip
    pub trip_b: Pubkey,
    
    /// Route similarity score (0-100)
    pub route_score: u8,
    
    /// Date overlap score (0-100)
    pub date_score: u8,
    
    /// Interest similarity score (0-100)
    pub interest_score: u8,
    
    /// Total match score (0-100)
    pub total_score: u8,
    
    /// Arcium computation ID
    pub computation_id: [u8; 32],
    
    /// Completion timestamp
    pub timestamp: i64,
}

/// Emitted when a trip is created
#[event]
pub struct TripCreated {
    /// Trip PDA
    pub trip: Pubkey,
    
    /// Trip owner
    pub owner: Pubkey,
    
    /// Destination grid hash (for pre-filtering)
    pub destination_grid_hash: [u8; 32],
    
    /// Trip start date
    pub start_date: i64,
    
    /// Trip end date
    pub end_date: i64,
    
    /// Creation timestamp
    pub timestamp: i64,
}

/// Legacy event for MPC callback (from compute_trip_match callback)
#[event]
pub struct MatchComputedEvent {
    pub computation_account: Pubkey,
    pub route_score: u8,
    pub date_score: u8,
    pub interest_score: u8,
    pub total_score: u8,
}

