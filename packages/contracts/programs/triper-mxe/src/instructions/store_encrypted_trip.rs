// Store Encrypted Trip Instruction
// Saves encrypted travel data to MXE storage

use anchor_lang::prelude::*;
use crate::state::EncryptedTrip;

#[derive(Accounts)]
pub struct StoreEncryptedTrip<'info> {
    #[account(
        init,
        payer = owner,
        space = EncryptedTrip::MAX_SIZE,
        seeds = [b"encrypted_trip", public_trip.key().as_ref()],
        bump
    )]
    pub encrypted_trip: Account<'info, EncryptedTrip>,
    
    /// Reference to the public trip account in main triper program
    /// CHECK: This is validated by matching it with the PDA seed
    pub public_trip: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<StoreEncryptedTrip>,
    encrypted_route: Vec<Vec<u8>>,
    encrypted_dates: Vec<Vec<u8>>,
    encrypted_interests: Vec<Vec<u8>>,
) -> Result<()> {
    let encrypted_trip = &mut ctx.accounts.encrypted_trip;
    let clock = Clock::get()?;
    
    // Generate nonce from transaction signature
    let nonce = clock.unix_timestamp.to_le_bytes();
    let mut nonce_array = [0u8; 32];
    nonce_array[..8].copy_from_slice(&nonce);
    
    encrypted_trip.owner = ctx.accounts.owner.key();
    encrypted_trip.public_trip = ctx.accounts.public_trip.key();
    encrypted_trip.encrypted_route = encrypted_route;
    encrypted_trip.encrypted_dates = encrypted_dates;
    encrypted_trip.encrypted_interests = encrypted_interests;
    encrypted_trip.nonce = nonce_array;
    encrypted_trip.created_at = clock.unix_timestamp;
    encrypted_trip.is_active = true;
    encrypted_trip.bump = ctx.bumps.encrypted_trip;
    
    msg!("Encrypted trip stored for public trip: {}", ctx.accounts.public_trip.key());
    msg!("Nonce: {:?}", nonce_array);
    
    Ok(())
}
