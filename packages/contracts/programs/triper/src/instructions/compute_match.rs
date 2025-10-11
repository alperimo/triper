// Confidential match computation instruction
// This runs via Arcium MXE - encrypted data never leaves the network

use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ComputeMatch<'info> {
    /// Trip A account (contains route hash)
    #[account(mut)]
    pub trip_a: Account<'info, Trip>,
    
    /// Trip B account (contains route hash)
    #[account(mut)]
    pub trip_b: Account<'info, Trip>,
    
    /// Match account to store computation result
    #[account(
        init,
        payer = requester,
        space = 8 + Match::SIZE,
        seeds = [
            b"match",
            trip_a.key().as_ref(),
            trip_b.key().as_ref()
        ],
        bump
    )]
    pub match_account: Account<'info, Match>,
    
    /// User requesting the match computation
    #[account(mut)]
    pub requester: Signer<'info>,
    
    /// System program for account creation
    pub system_program: Program<'info, System>,
}

// Note: The actual handler logic is in lib.rs marked with #[confidential]
// This struct only defines the on-chain accounts needed for the instruction
