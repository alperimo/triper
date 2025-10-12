use anchor_lang::prelude::*;
use crate::state::Trip;

#[derive(Accounts)]
#[instruction(route_hash: [u8; 32])]
pub struct CreateTrip<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Trip::INIT_SPACE,
        seeds = [b"trip", user.key().as_ref(), route_hash.as_ref()],
        bump
    )]
    pub trip: Account<'info, Trip>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateTrip>,
    route_hash: [u8; 32]
) -> Result<()> {
    let trip = &mut ctx.accounts.trip;
    
    trip.owner = ctx.accounts.user.key();
    trip.route_hash = route_hash;
    trip.created_at = Clock::get()?.unix_timestamp;
    trip.is_active = true;
    trip.computation_count = 0;
    trip.bump = ctx.bumps.trip;
    
    msg!("Trip created: {}", trip.key());
    msg!("Route hash: {:?}", route_hash);
    msg!("Encrypted trip data will be processed via Arcium MXE");
    
    Ok(())
}
