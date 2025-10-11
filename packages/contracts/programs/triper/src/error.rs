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
}
