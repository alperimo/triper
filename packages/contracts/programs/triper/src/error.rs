use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid match status for this operation")]
    InvalidMatchStatus,
    
    #[msg("User not authorized for this operation")]
    Unauthorized,
    
    #[msg("Trip is not active")]
    TripNotActive,
    
    #[msg("UserProfile is not active")]
    UserProfileNotActive,
    
    #[msg("User not authorized to access this resource")]
    UnauthorizedAccess,
    
    #[msg("Invalid MXE account reference")]
    InvalidMxeAccount,
    
    #[msg("MPC computation failed or was aborted")]
    ComputationFailed,
    
    #[msg("Cluster not set")]
    ClusterNotSet,
    
    #[msg("Encrypted data exceeds 2048 bytes")]
    EncryptedDataTooLarge,
    
    #[msg("End date must be after start date")]
    InvalidDateRange,
    
    #[msg("Cannot match trip with itself")]
    SameTripMatch,
    
    #[msg("Match quota exceeded")]
    QuotaExceeded,
    
    #[msg("Insufficient funds for match computation")]
    InsufficientFunds,
    
    #[msg("Invalid score value (must be 0-100)")]
    InvalidScore,
}

