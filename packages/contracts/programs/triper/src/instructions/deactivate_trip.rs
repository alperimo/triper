// Deactivate Trip Instruction
// Soft-delete a trip (owner only)

use anchor_lang::prelude::*;
use crate::state::Trip;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct DeactivateTrip<'info> {
    #[account(
        mut,
        constraint = trip.owner == user.key() @ ErrorCode::Unauthorized,
        constraint = trip.is_active @ ErrorCode::TripNotActive
    )]
    pub trip: Account<'info, Trip>,
    
    pub user: Signer<'info>,
}

pub fn deactivate_trip_handler(ctx: Context<DeactivateTrip>) -> Result<()> {
    let trip = &mut ctx.accounts.trip;
    
    trip.is_active = false;
    
    msg!("Trip deactivated: {}", trip.key());
    
    Ok(())
}
