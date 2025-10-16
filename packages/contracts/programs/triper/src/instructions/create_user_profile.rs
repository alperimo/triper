// Create User Profile Instruction
// Initializes a new user profile with encrypted preferences

use anchor_lang::prelude::*;
use crate::state::UserProfile;
use crate::error::ErrorCode;
use crate::events::UserProfileCreated;

#[derive(Accounts)]
pub struct CreateUserProfile<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_user_profile_handler(
    ctx: Context<CreateUserProfile>,
    encrypted_data: Vec<u8>,
    public_key: [u8; 32],
) -> Result<()> {
    require!(
        encrypted_data.len() <= 512,
        ErrorCode::EncryptedDataTooLarge
    );
    
    let user_profile = &mut ctx.accounts.user_profile;
    let clock = Clock::get()?;
    
    user_profile.owner = ctx.accounts.user.key();
    user_profile.encrypted_data = encrypted_data;
    user_profile.public_key = public_key;
    user_profile.created_at = clock.unix_timestamp;
    user_profile.updated_at = clock.unix_timestamp;
    user_profile.trip_count = 0;
    user_profile.total_matches = 0;
    user_profile.is_active = true;
    user_profile.bump = ctx.bumps.user_profile;
    
    emit!(UserProfileCreated {
        user_profile: user_profile.key(),
        owner: user_profile.owner,
        created_at: user_profile.created_at,
    });
    
    msg!("User profile created: {}", user_profile.key());
    
    Ok(())
}
