use anchor_lang::prelude::*;
use crate::state::{MatchRecord, MatchStatus, Trip};

#[derive(Accounts)]
pub struct RecordMatch<'info> {
    #[account(
        init,
        payer = payer,
        space = MatchRecord::LEN,
        seeds = [b"match", trip_a.key().as_ref(), trip_b.key().as_ref()],
        bump
    )]
    pub match_record: Account<'info, MatchRecord>,
    
    #[account(constraint = trip_a.is_active)]
    pub trip_a: Account<'info, Trip>,
    
    #[account(constraint = trip_b.is_active)]
    pub trip_b: Account<'info, Trip>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RecordMatch>,
    match_score: u8,
) -> Result<()> {
    let match_record = &mut ctx.accounts.match_record;
    
    match_record.trip_a = ctx.accounts.trip_a.key();
    match_record.trip_b = ctx.accounts.trip_b.key();
    match_record.match_score = match_score;
    match_record.status = MatchStatus::Pending;
    match_record.trip_a_accepted = false;
    match_record.trip_b_accepted = false;
    match_record.created_at = Clock::get()?.unix_timestamp;
    match_record.bump = ctx.bumps.match_record;
    
    msg!("Match recorded: {} <-> {}", match_record.trip_a, match_record.trip_b);
    msg!("Score: {}", match_score);
    
    Ok(())
}
