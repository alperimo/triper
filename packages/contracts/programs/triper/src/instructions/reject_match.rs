use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::state::{MatchRecord, MatchStatus};

#[derive(Accounts)]
pub struct RejectMatch<'info> {
    #[account(
        mut,
        constraint = match_record.status == MatchStatus::Pending @ ErrorCode::InvalidMatchStatus
    )]
    pub match_record: Account<'info, MatchRecord>,
    
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<RejectMatch>) -> Result<()> {
    let match_record = &mut ctx.accounts.match_record;
    let user_key = ctx.accounts.user.key();
    
    // Check if user is one of the trip owners
    require!(
        user_key == match_record.trip_a || user_key == match_record.trip_b,
        ErrorCode::Unauthorized
    );
    
    // Update status to Rejected
    match_record.status = MatchStatus::Rejected;
    
    msg!("Match rejected by user {}", user_key);
    
    Ok(())
}
