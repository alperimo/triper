use anchor_lang::prelude::*;
use crate::state::{MatchRecord, MatchStatus, Trip};

#[derive(Accounts)]
pub struct RecordMatch<'info> {
    #[account(
        mut,
        seeds = [b"match", trip_a.key().as_ref(), trip_b.key().as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, MatchRecord>,
    
    #[account(
        mut,
        constraint = trip_a.is_active
    )]
    pub trip_a: Account<'info, Trip>,
    
    #[account(
        mut,
        constraint = trip_b.is_active
    )]
    pub trip_b: Account<'info, Trip>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn record_match_handler(
    ctx: Context<RecordMatch>,
    route_score: u8,
    date_score: u8,
    interest_score: u8,
    total_score: u8,
) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    
    // Store detailed scores from MXE computation
    match_account.total_score = total_score;
    match_account.route_score = route_score;
    match_account.date_score = date_score;
    match_account.interest_score = interest_score;
    match_account.status = MatchStatus::Pending;
    
    // Increment computation counters
    ctx.accounts.trip_a.match_count += 1;
    ctx.accounts.trip_b.match_count += 1;
    
    msg!("Match computation completed via Arcium MXE");
    msg!("Trip A: {} <-> Trip B: {}", match_account.trip_a, match_account.trip_b);
    msg!("Total Score: {}/100", total_score);
    msg!("  Route: {}/100", route_score);
    msg!("  Dates: {}/100", date_score);
    msg!("  Interests: {}/100", interest_score);
    
    Ok(())
}
