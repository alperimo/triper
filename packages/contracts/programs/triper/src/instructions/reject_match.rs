use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::state::{Match, MatchStatus, Trip};

#[derive(Accounts)]
pub struct RejectMatch<'info> {
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

pub fn handler(ctx: Context<RejectMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let trip_key = ctx.accounts.trip.key();
    
    // Check if user owns one of the trips in the match
    require!(
        trip_key == match_account.trip_a || trip_key == match_account.trip_b,
        ErrorCode::Unauthorized
    );
    
    // Update status to Rejected
    match_account.status = MatchStatus::Rejected;
    
    msg!("✗ Match rejected by user {}", ctx.accounts.user.key());
    
    Ok(())
}
