use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid match status for this operation")]
    InvalidMatchStatus,
    
    #[msg("User not authorized for this operation")]
    Unauthorized,
    
    #[msg("Trip is not active")]
    TripNotActive,
    
    #[msg("Invalid MXE account reference")]
    InvalidMxeAccount,
    
    #[msg("MPC computation failed or was aborted")]
    ComputationFailed,
}

#[event]
pub struct MatchComputedEvent {
    pub trip_a: Pubkey,
    pub trip_b: Pubkey,
    pub encrypted_scores: Vec<[u8; 32]>,
    pub nonce: [u8; 16],
}
