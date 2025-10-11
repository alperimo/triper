use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::state::{MatchRecord, MatchStatus};

#[derive(Accounts)]
pub struct AcceptMatch<'info> {
    #[account(
        mut,
        constraint = match_record.status == MatchStatus::Pending @ ErrorCode::InvalidMatchStatus
    )]
    pub match_record: Account<'info, MatchRecord>,
    
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<AcceptMatch>) -> Result<()> {
    let match_record = &mut ctx.accounts.match_record;
    let user_key = ctx.accounts.user.key();
    
    // Check if user is one of the trip owners
    if user_key == match_record.trip_a {
        match_record.trip_a_accepted = true;
    } else if user_key == match_record.trip_b {
        match_record.trip_b_accepted = true;
    } else {
        return Err(ErrorCode::Unauthorized.into());
    }
    
    // If both parties accepted, update status to Mutual
    if match_record.trip_a_accepted && match_record.trip_b_accepted {
        match_record.status = MatchStatus::Mutual;
        msg!("Match mutually accepted! Both parties can now see trip details.");
    } else {
        msg!("Match accepted by one party. Waiting for the other party.");
    }
    
    Ok(())
}
