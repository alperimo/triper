use anchor_lang::prelude::*;
use light_sdk::{
    account::LightAccount,
    address::v1::derive_address,
    cpi::{v1::CpiAccounts, CpiSigner, v1::LightSystemProgramCpi, InvokeLightSystemProgram},
    derive_light_cpi_signer,
    instruction::{PackedAddressTreeInfo, ValidityProof},
    LightHasher,
};
use crate::state::Trip;
use crate::error::ErrorCode;
use crate::events::TripCompressed;

// Derive CPI signer for Light Protocol
pub const LIGHT_CPI_SIGNER: CpiSigner = 
    derive_light_cpi_signer!("Fn6rAGhjUc45tQqfgsXCdNtNC3GSfNWdjHEjpHaUJMaY");

/// Compress a trip account from traditional to compressed state
/// 
/// PROCESS:
/// 1. Reads data from traditional Anchor Trip account
/// 2. Creates new compressed account in Light Protocol state tree
/// 3. Closes traditional account (refunds rent ~$0.39)
/// 
/// COST:
/// - Traditional rent refunded: +$0.39
/// - Compression tx: -$0.02
/// - Compressed storage: -$0.06
/// - NET SAVINGS: $0.31 per trip
/// 
/// AFTER COMPRESSION:
/// - Fetched via Light RPC: lightRpc.getCompressedAccount()
/// - Can be updated: LightAccount::new_mut() (if needed)
/// - Can be closed: LightAccount::new_close()
/// - Arcium encryption preserved
pub fn compress_trip_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CompressTrip<'info>>,
    proof: ValidityProof,
    address_tree_info: PackedAddressTreeInfo,
    output_state_tree_index: u8,
) -> Result<()> {
    let trip = &ctx.accounts.trip;
    
    // Security: Only owner can compress their trip
    require!(
        trip.owner == ctx.accounts.owner.key(),
        ErrorCode::Unauthorized
    );
    
    msg!("🗜️  Compressing trip: {}", ctx.accounts.trip.key());
    msg!("  Owner: {}", trip.owner);
    msg!("  Active: {}", trip.is_active);
    msg!("  Destination: {:?}", &trip.destination_grid_hash[..8]);
    
    // Setup Light Protocol CPI accounts
    let light_cpi_accounts = CpiAccounts::new(
        ctx.accounts.owner.as_ref(),
        ctx.remaining_accounts,
        LIGHT_CPI_SIGNER,
    );
    
    // Derive deterministic address for compressed account
    // Using trip PDA as seed ensures we can find it later
    let (address, address_seed) = derive_address(
        &[b"trip", ctx.accounts.trip.key().as_ref()],
        &address_tree_info
            .get_tree_pubkey(&light_cpi_accounts)
            .map_err(|_| ErrorCode::InvalidMxeAccount)?,
        &crate::ID,
    );
    
    msg!("  Compressed address: {}", address);
    
    // Create new address params for Light Protocol
    let new_address_params = address_tree_info.into_new_address_params_packed(address_seed);
    
    // Create compressed account using LightAccount
    // This wraps our Trip data in Light Protocol's compressed format
    let mut compressed_trip = LightAccount::<'_, Trip>::new_init(
        &crate::ID,
        Some(address),
        output_state_tree_index,
    );
    
    // Copy all trip data to compressed account
    compressed_trip.owner = trip.owner;
    compressed_trip.destination_grid_hash = trip.destination_grid_hash;
    compressed_trip.start_date = trip.start_date;
    compressed_trip.end_date = trip.end_date;
    compressed_trip.encrypted_waypoints = trip.encrypted_waypoints.clone();
    compressed_trip.public_key = trip.public_key;
    compressed_trip.is_active = trip.is_active;
    compressed_trip.match_count = trip.match_count;
    compressed_trip.created_at = trip.created_at;
    compressed_trip.bump = trip.bump;
    
    msg!("  Copied {} bytes to compressed account", 
        trip.encrypted_waypoints.len());
    
    // Invoke Light System Program to create compressed account
    LightSystemProgramCpi::new_cpi(LIGHT_CPI_SIGNER, proof)
        .with_light_account(compressed_trip)?
        .with_new_addresses(&[new_address_params])
        .invoke(light_cpi_accounts)?;
    
    msg!("✅ Compressed account created in state tree");
    msg!("  Savings: $0.31 (rent refunded + compressed storage)");
    
    // Get rent refunded amount
    // Trip account size: 8 (discriminator) + Trip::INIT_SPACE
    let rent = Rent::get()?;
    let trip_space = 8 + std::mem::size_of::<Trip>();
    let rent_refunded = rent.minimum_balance(trip_space);
    
    // Emit event for frontend to track address mapping
    emit!(TripCompressed {
        traditional_pda: ctx.accounts.trip.key(),
        compressed_address: address,
        owner: trip.owner,
        start_date: trip.start_date,
        rent_refunded,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!("📡 Event emitted: TripCompressed");
    msg!("  Traditional PDA: {}", ctx.accounts.trip.key());
    msg!("  Compressed address: {}", address);
    msg!("  Rent refunded: {} lamports", rent_refunded);
    
    // Traditional account is closed by `close = owner` constraint
    // Rent is automatically refunded to owner
    
    Ok(())
}

#[derive(Accounts)]
pub struct CompressTrip<'info> {
    /// Trip account to compress (will be closed and refunded)
    #[account(
        mut,
        close = owner,
        has_one = owner @ ErrorCode::Unauthorized
    )]
    pub trip: Account<'info, Trip>,
    
    /// Trip owner (must sign transaction, receives rent refund)
    #[account(mut)]
    pub owner: Signer<'info>,
    
    // Light Protocol accounts passed as remaining_accounts:
    // - light_system_program: Light Protocol system program
    // - merkle_tree: State tree for compressed accounts  
    // - nullifier_queue: Queue for spent account nullifiers
    // - address_queue: Queue for new compressed account addresses
    // - cpi_context: Context account for cross-program invocations
    // 
    // These are accessed via ctx.remaining_accounts in CpiAccounts::new()
}
