// Reveal For Mutual Instruction
// Allows decryption of trip details after mutual match acceptance

use anchor_lang::prelude::*;
use crate::state::EncryptedTrip;

#[derive(Accounts)]
pub struct RevealForMutual<'info> {
    #[account(mut)]
    pub encrypted_trip: Account<'info, EncryptedTrip>,
    
    /// The user requesting reveal (must be matched party)
    pub requester: Signer<'info>,
    
    // TODO: Add constraint to verify mutual match in main triper program
    // This would require CPI to check MatchRecord.status == Mutual
}

pub fn handler(
    ctx: Context<RevealForMutual>,
) -> Result<()> {
    let encrypted_trip = &ctx.accounts.encrypted_trip;
    
    // In production with full Arcium SDK:
    // 1. Verify mutual match status via CPI to main program
    // 2. Use Arcium's decryption API to reveal data
    // 3. Return decrypted route, dates, interests
    
    msg!("Revealing trip data for mutual match");
    msg!("Trip owner: {}", encrypted_trip.owner);
    msg!("Requester: {}", ctx.accounts.requester.key());
    
    // For now, just log the encrypted data (in production this would decrypt)
    msg!("Encrypted route has {} waypoints", encrypted_trip.encrypted_route.len());
    msg!("Encrypted dates: {} entries", encrypted_trip.encrypted_dates.len());
    msg!("Encrypted interests: {} entries", encrypted_trip.encrypted_interests.len());
    
    Ok(())
}
