use anchor_lang::prelude::*;
use crate::state::Trip;
use crate::error::ErrorCode;
use crate::events::TripCreated;

#[derive(Accounts)]
#[instruction(destination_grid_hash: [u8; 32], start_date: i64)]
pub struct CreateTrip<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Trip::INIT_SPACE,
        seeds = [
            b"trip",
            user.key().as_ref(),
            &start_date.to_le_bytes(),
        ],
        bump
    )]
    pub trip: Account<'info, Trip>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_trip_handler(
    ctx: Context<CreateTrip>,
    destination_grid_hash: [u8; 32],
    start_date: i64,
    end_date: i64,
    encrypted_data: Vec<u8>,
    public_key: [u8; 32],
) -> Result<()> {
    require!(
        encrypted_data.len() <= 2048,
        ErrorCode::EncryptedDataTooLarge
    );
    
    require!(
        end_date > start_date,
        ErrorCode::InvalidDateRange
    );
    
    let trip = &mut ctx.accounts.trip;
    
    trip.owner = ctx.accounts.user.key();
    trip.destination_grid_hash = destination_grid_hash;
    trip.start_date = start_date;
    trip.end_date = end_date;
    trip.encrypted_data = encrypted_data;
    trip.public_key = public_key;
    trip.is_active = true;
    trip.match_count = 0;
    trip.created_at = Clock::get()?.unix_timestamp;
    trip.bump = ctx.bumps.trip;
    
    msg!("Trip created: {}", trip.key());
    msg!("Destination: {:?}", destination_grid_hash);
    msg!("Dates: {} to {}", start_date, end_date);
    msg!("Encrypted data size: {} bytes", trip.encrypted_data.len());
    
    // Emit event for off-chain indexing
    emit!(TripCreated {
        trip: trip.key(),
        owner: trip.owner,
        destination_grid_hash,
        start_date,
        end_date,
        timestamp: trip.created_at,
    });
    
    Ok(())
}

