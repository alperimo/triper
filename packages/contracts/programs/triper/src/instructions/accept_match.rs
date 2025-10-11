use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::state::{Match, MatchStatus, Trip};

#[derive(Accounts)]
pub struct AcceptMatch<'info> {
    #[account(
        mut,
        constraint = match_account.status == MatchStatus::Pending @ ErrorCode::InvalidMatchStatus
    )]
    pub match_account: Account<'info, Match>,
    
    /// Trip account to verify ownership
    #[account(
        constraint = trip.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub trip: Account<'info, Trip>,
    
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<AcceptMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let user_key = ctx.accounts.user.key();
    
    // Check if user is one of the trip owners
    if user_key == ctx.accounts.trip.owner && ctx.accounts.trip.key() == match_account.trip_a {
        match_account.trip_a_accepted = true;
    } else if user_key == ctx.accounts.trip.owner && ctx.accounts.trip.key() == match_account.trip_b {
        match_account.trip_b_accepted = true;
    } else {
        return Err(ErrorCode::Unauthorized.into());
    }
    
    // If both parties accepted, update status to Mutual
    if match_account.trip_a_accepted && match_account.trip_b_accepted {
        match_account.status = MatchStatus::Mutual;
        msg!("🎉 Match mutually accepted! Encrypted trip details will be revealed via Arcium MXE.");
    } else {
        msg!("✓ Match accepted by one party. Waiting for the other party.");
    }
    
    Ok(())
}
