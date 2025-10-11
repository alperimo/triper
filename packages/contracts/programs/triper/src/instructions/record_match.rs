use anchor_lang::prelude::*;
use crate::state::{Match, MatchStatus, Trip};
use crate::confidential::MatchResult;

#[derive(Accounts)]
pub struct RecordMatch<'info> {
    #[account(
        mut,
        seeds = [b"match", trip_a.key().as_ref(), trip_b.key().as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, Match>,
    
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

pub fn handler(
    ctx: Context<RecordMatch>,
    match_result: MatchResult,
    computation_id: [u8; 32],
) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    
    // Store detailed scores from MXE computation
    match_account.total_score = match_result.total_score;
    match_account.route_score = match_result.route_score;
    match_account.date_score = match_result.date_score;
    match_account.interest_score = match_result.interest_score;
    match_account.computation_id = computation_id;
    match_account.status = MatchStatus::Pending;
    
    // Increment computation counters
    ctx.accounts.trip_a.computation_count += 1;
    ctx.accounts.trip_b.computation_count += 1;
    
    msg!("Match computation completed via Arcium MXE");
    msg!("Trip A: {} <-> Trip B: {}", match_account.trip_a, match_account.trip_b);
    msg!("Total Score: {}/100", match_result.total_score);
    msg!("  Route: {}/100", match_result.route_score);
    msg!("  Dates: {}/100", match_result.date_score);
    msg!("  Interests: {}/100", match_result.interest_score);
    msg!("Computation ID: {:?}", computation_id);
    
    Ok(())
}
