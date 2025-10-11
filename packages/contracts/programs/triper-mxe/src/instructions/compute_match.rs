// Compute Match Instruction
// Initiates MPC computation to calculate match score

use anchor_lang::prelude::*;
use crate::state::{EncryptedTrip, MatchComputation, ComputationStatus};

#[derive(Accounts)]
pub struct ComputeMatch<'info> {
    #[account(
        init,
        payer = requester,
        space = MatchComputation::LEN,
        seeds = [
            b"match_computation",
            encrypted_trip_a.key().as_ref(),
            encrypted_trip_b.key().as_ref()
        ],
        bump
    )]
    pub match_computation: Account<'info, MatchComputation>,
    
    #[account(constraint = encrypted_trip_a.is_active)]
    pub encrypted_trip_a: Account<'info, EncryptedTrip>,
    
    #[account(constraint = encrypted_trip_b.is_active)]
    pub encrypted_trip_b: Account<'info, EncryptedTrip>,
    
    #[account(mut)]
    pub requester: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ComputeMatch>,
    _trip_b: Pubkey,
) -> Result<()> {
    let match_computation = &mut ctx.accounts.match_computation;
    let clock = Clock::get()?;
    
    match_computation.trip_a = ctx.accounts.encrypted_trip_a.key();
    match_computation.trip_b = ctx.accounts.encrypted_trip_b.key();
    match_computation.status = ComputationStatus::Pending;
    match_computation.match_score = None;
    match_computation.route_score = None;
    match_computation.date_score = None;
    match_computation.interest_score = None;
    match_computation.requested_at = clock.unix_timestamp;
    match_computation.completed_at = None;
    match_computation.bump = ctx.bumps.match_computation;
    
    msg!("Match computation requested between {} and {}", 
        ctx.accounts.encrypted_trip_a.key(),
        ctx.accounts.encrypted_trip_b.key()
    );
    
    // NOTE: In production, this would trigger an off-chain MXE computation
    // The computation would run the matching algorithm on encrypted data
    // and update this account with the results
    
    Ok(())
}
