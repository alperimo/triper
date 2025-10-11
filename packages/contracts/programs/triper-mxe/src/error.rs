// Error codes for MXE program
use anchor_lang::prelude::*;

#[error_code]
pub enum MxeError {
    #[msg("Trip is not active for matching")]
    TripNotActive,
    
    #[msg("Computation already in progress")]
    ComputationInProgress,
    
    #[msg("Computation not completed yet")]
    ComputationNotComplete,
    
    #[msg("Unauthorized to access trip data")]
    Unauthorized,
    
    #[msg("Match not mutual - both parties must accept")]
    NotMutualMatch,
    
    #[msg("Invalid encrypted data format")]
    InvalidEncryptedData,
    
    #[msg("Decryption failed")]
    DecryptionFailed,
}
