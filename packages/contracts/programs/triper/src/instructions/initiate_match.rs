// Initiate match computation - creates MatchRecord
// User then calls compute_trip_match to queue Arcium MPC

use anchor_lang::prelude::*;
use crate::state::{Trip, MatchRecord, MatchStatus};
use crate::error::ErrorCode;

/// Initiate a match computation between two trips
/// Creates MatchRecord in Pending status
#[derive(Accounts)]
pub struct InitiateMatch<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// First trip (requester's trip)
    #[account(
        constraint = trip_a.owner == payer.key() @ ErrorCode::Unauthorized,
        mut
    )]
    pub trip_a: Account<'info, Trip>,
    
    /// Second trip (potential match)
    #[account(mut)]
    pub trip_b: Account<'info, Trip>,
    
    /// Match record PDA: [b"match", trip_a, trip_b]
    #[account(
        init,
        payer = payer,
        space = MatchRecord::LEN,
        seeds = [
            b"match",
            trip_a.key().as_ref(),
            trip_b.key().as_ref(),
        ],
        bump
    )]
    pub match_record: Account<'info, MatchRecord>,
    
    pub system_program: Program<'info, System>,
}

pub fn initiate_match_handler(
    ctx: Context<InitiateMatch>,
) -> Result<()> {
    let trip_a = &mut ctx.accounts.trip_a;
    let trip_b = &mut ctx.accounts.trip_b;
    let match_record = &mut ctx.accounts.match_record;
    
    // Validation: Can't match with yourself
    require!(
        trip_a.owner != trip_b.owner,
        ErrorCode::SameTripMatch
    );
    
    // Check user's quota
    require!(
        trip_a.match_count < 100,
        ErrorCode::QuotaExceeded
    );
    
    // Initialize match record
    match_record.trip_a = trip_a.key();
    match_record.trip_b = trip_b.key();
    match_record.total_score = 0;
    match_record.route_score = 0;
    match_record.date_score = 0;
    match_record.interest_score = 0;
    match_record.status = MatchStatus::Pending;
    match_record.trip_a_accepted = false;
    match_record.trip_b_accepted = false;
    match_record.created_at = Clock::get()?.unix_timestamp;
    match_record.computation_id = [0; 32]; // Will be set by callback
    match_record.bump = ctx.bumps.match_record;
    
    // Increment match counts
    trip_a.match_count += 1;
    trip_b.match_count += 1;
    
    msg!("Match record created: {}", match_record.key());
    msg!("Trip A: {} <-> Trip B: {}", trip_a.key(), trip_b.key());
    msg!("Next: Call compute_trip_match to queue MPC computation");
    
    Ok(())
}
