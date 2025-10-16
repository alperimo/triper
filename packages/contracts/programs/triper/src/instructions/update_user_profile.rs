// Update User Profile Instruction
// Updates encrypted user preferences

use anchor_lang::prelude::*;
use crate::state::UserProfile;
use crate::error::ErrorCode;
use crate::events::UserProfileUpdated;

#[derive(Accounts)]
pub struct UpdateUserProfile<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.owner == user.key() @ ErrorCode::Unauthorized,
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    pub user: Signer<'info>,
}

pub fn update_user_profile_handler(
    ctx: Context<UpdateUserProfile>,
    encrypted_data: Vec<u8>,
    public_key: [u8; 32],
) -> Result<()> {
    require!(
        encrypted_data.len() <= 512,
        ErrorCode::EncryptedDataTooLarge
    );
    
    let user_profile = &mut ctx.accounts.user_profile;
    let clock = Clock::get()?;
    
    user_profile.encrypted_data = encrypted_data;
    user_profile.public_key = public_key;
    user_profile.updated_at = clock.unix_timestamp;
    
    emit!(UserProfileUpdated {
        user_profile: user_profile.key(),
        owner: user_profile.owner,
        updated_at: user_profile.updated_at,
    });
    
    msg!("User profile updated: {}", user_profile.key());
    
    Ok(())
}
