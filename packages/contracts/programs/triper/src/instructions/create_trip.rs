use anchor_lang::prelude::*;
use crate::state::Trip;

#[derive(Accounts)]
pub struct CreateTrip<'info> {
    #[account(
        init,
        payer = user,
        space = Trip::LEN,
        seeds = [b"trip", user.key().as_ref(), mxe_data_account.key().as_ref()],
        bump
    )]
    pub trip: Account<'info, Trip>,
    
    /// CHECK: This is the MXE account from triper-mxe program that stores encrypted data
    pub mxe_data_account: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateTrip>,
    route_hash: [u8; 32],
) -> Result<()> {
    let trip = &mut ctx.accounts.trip;
    
    trip.owner = ctx.accounts.user.key();
    trip.mxe_data_account = ctx.accounts.mxe_data_account.key();
    trip.route_hash = route_hash;
    trip.created_at = Clock::get()?.unix_timestamp;
    trip.is_active = true;
    trip.bump = ctx.bumps.trip;
    
    msg!("Trip created: {}", trip.key());
    msg!("MXE data account: {}", trip.mxe_data_account);
    
    Ok(())
}
