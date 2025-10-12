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
    pub computation_account: Pubkey,
    pub route_score: u8,
    pub date_score: u8,
    pub interest_score: u8,
    pub total_score: u8,
}
