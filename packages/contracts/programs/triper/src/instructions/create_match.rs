// Create Match Instruction
// Creates a match record with score from MXE computation
// Called by backend after MXE computes the match

use anchor_lang::prelude::*;
use crate::state::{MatchRecord, MatchStatus, Trip};
use crate::error::TriperError;

#[derive(Accounts)]
#[instruction(match_id: [u8; 32])]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MatchRecord::INIT_SPACE,
        seeds = [b"match", match_id.as_ref()],
        bump
    )]
    pub match_record: Account<'info, MatchRecord>,
    
    #[account(
        constraint = trip_a.is_active @ TriperError::TripNotActive
    )]
    pub trip_a: Account<'info, Trip>,
    
    #[account(
        constraint = trip_b.is_active @ TriperError::TripNotActive
    )]
    pub trip_b: Account<'info, Trip>,
    
    #[account(mut)]
    pub authority: Signer<'info>, // Backend authority (TODO: add proper auth)
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateMatch>,
    match_id: [u8; 32],
    match_score: u8,
) -> Result<()> {
    require!(match_score <= 100, TriperError::InvalidMatchScore);
    
    let match_record = &mut ctx.accounts.match_record;
    let clock = Clock::get()?;
    
    match_record.id = match_id;
    match_record.trip_a = ctx.accounts.trip_a.key();
    match_record.trip_b = ctx.accounts.trip_b.key();
    match_record.trip_a_owner = ctx.accounts.trip_a.owner;
    match_record.trip_b_owner = ctx.accounts.trip_b.owner;
    match_record.match_score = match_score;
    match_record.user_a_accepted = false;
    match_record.user_b_accepted = false;
    match_record.status = MatchStatus::Pending;
    match_record.created_at = clock.unix_timestamp;
    match_record.bump = ctx.bumps.match_record;
    
    msg!("Match created: {:?}, score: {}", match_id, match_score);
    
    Ok(())
}
