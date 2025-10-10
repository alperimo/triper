use anchor_lang::prelude::*;

// This is a placeholder program ID - will be updated after deployment
declare_id!("11111111111111111111111111111111");

#[program]
pub mod triper {
    use super::*;

    /// Initialize a new trip with encrypted data
    /// Route, dates, and interests are encrypted client-side before submission
    pub fn create_trip(
        ctx: Context<CreateTrip>,
        encrypted_route: Vec<u8>,      // Encrypted grid cell indices
        encrypted_dates: Vec<u8>,      // Encrypted start/end timestamps
        encrypted_interests: Vec<u8>,  // Encrypted travel style flags
        route_hash: [u8; 32],          // Hash of route for verification
    ) -> Result<()> {
        let trip = &mut ctx.accounts.trip;
        trip.owner = ctx.accounts.user.key();
        trip.encrypted_route = encrypted_route;
        trip.encrypted_dates = encrypted_dates;
        trip.encrypted_interests = encrypted_interests;
        trip.route_hash = route_hash;
        trip.created_at = Clock::get()?.unix_timestamp;
        trip.is_active = true;
        
        msg!("Trip created for user: {}", ctx.accounts.user.key());
        Ok(())
    }

    /// Request a match computation using Arcium MPC
    /// This will be called by the Arcium network to compute matches
    #[confidential]  // Arcium decorator for MPC execution
    pub fn compute_match(
        ctx: Context<ComputeMatch>,
        trip_a_route: Vec<u32>,        // Decrypted in secure enclave
        trip_a_dates: [i64; 2],
        trip_a_interests: Vec<u8>,
        trip_b_route: Vec<u32>,
        trip_b_dates: [i64; 2],
        trip_b_interests: Vec<u8>,
    ) -> Result<MatchResult> {
        // This computation happens inside Arcium's secure MPC environment
        // Neither party sees the other's unencrypted data
        
        // 1. Calculate route overlap (grid cell intersection)
        let route_score = calculate_route_overlap(&trip_a_route, &trip_b_route);
        
        // 2. Calculate date overlap
        let date_score = calculate_date_overlap(
            trip_a_dates[0], trip_a_dates[1],
            trip_b_dates[0], trip_b_dates[1]
        );
        
        // 3. Calculate interest similarity
        let interest_score = calculate_interest_similarity(&trip_a_interests, &trip_b_interests);
        
        // Weighted average: 40% route, 30% dates, 30% interests
        let total_score = (
            route_score * 40 +
            date_score * 30 +
            interest_score * 30
        ) / 100;
        
        // Only return match if score is above threshold
        let match_result = if total_score >= 50 {
            MatchResult {
                score: total_score,
                route_overlap_count: count_common_cells(&trip_a_route, &trip_b_route),
                date_overlap_days: calculate_overlap_days(trip_a_dates, trip_b_dates),
                is_match: true,
            }
        } else {
            MatchResult::no_match()
        };
        
        Ok(match_result)
    }

    /// Record a match result on-chain (encrypted)
    pub fn record_match(
        ctx: Context<RecordMatch>,
        match_score: u8,
        encrypted_match_data: Vec<u8>,
    ) -> Result<()> {
        let match_record = &mut ctx.accounts.match_record;
        match_record.trip_a = ctx.accounts.trip_a.key();
        match_record.trip_b = ctx.accounts.trip_b.key();
        match_record.match_score = match_score;
        match_record.encrypted_match_data = encrypted_match_data;
        match_record.status = MatchStatus::Pending;
        match_record.created_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    /// Accept a match (mutual consent required)
    pub fn accept_match(ctx: Context<UpdateMatch>) -> Result<()> {
        let match_record = &mut ctx.accounts.match_record;
        
        require!(
            match_record.status == MatchStatus::Pending,
            ErrorCode::InvalidMatchStatus
        );
        
        // Check if both parties accepted
        if ctx.accounts.user.key() == match_record.trip_a {
            match_record.trip_a_accepted = true;
        } else if ctx.accounts.user.key() == match_record.trip_b {
            match_record.trip_b_accepted = true;
        } else {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        // If both accepted, reveal details
        if match_record.trip_a_accepted && match_record.trip_b_accepted {
            match_record.status = MatchStatus::Mutual;
            msg!("Match accepted by both parties!");
        }
        
        Ok(())
    }
}

// ===== Account Structures =====

#[account]
pub struct Trip {
    pub owner: Pubkey,
    pub encrypted_route: Vec<u8>,
    pub encrypted_dates: Vec<u8>,
    pub encrypted_interests: Vec<u8>,
    pub route_hash: [u8; 32],
    pub created_at: i64,
    pub is_active: bool,
}

#[account]
pub struct MatchRecord {
    pub trip_a: Pubkey,
    pub trip_b: Pubkey,
    pub match_score: u8,
    pub encrypted_match_data: Vec<u8>,
    pub status: MatchStatus,
    pub trip_a_accepted: bool,
    pub trip_b_accepted: bool,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum MatchStatus {
    Pending,
    Mutual,
    Rejected,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MatchResult {
    pub score: u8,
    pub route_overlap_count: u32,
    pub date_overlap_days: u32,
    pub is_match: bool,
}

impl MatchResult {
    pub fn no_match() -> Self {
        Self {
            score: 0,
            route_overlap_count: 0,
            date_overlap_days: 0,
            is_match: false,
        }
    }
}

// ===== Context Structures =====

#[derive(Accounts)]
pub struct CreateTrip<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 512 + 256 + 256 + 32 + 8 + 1,
    )]
    pub trip: Account<'info, Trip>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ComputeMatch<'info> {
    pub trip_a: Account<'info, Trip>,
    pub trip_b: Account<'info, Trip>,
}

#[derive(Accounts)]
pub struct RecordMatch<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 1 + 512 + 1 + 1 + 1 + 8,
    )]
    pub match_record: Account<'info, MatchRecord>,
    
    pub trip_a: Account<'info, Trip>,
    pub trip_b: Account<'info, Trip>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMatch<'info> {
    #[account(mut)]
    pub match_record: Account<'info, MatchRecord>,
    
    pub user: Signer<'info>,
}

// ===== Helper Functions (MPC Environment) =====

fn calculate_route_overlap(route_a: &[u32], route_b: &[u32]) -> u8 {
    let mut common_cells = 0;
    for cell_a in route_a {
        if route_b.contains(cell_a) {
            common_cells += 1;
        }
    }
    
    let max_len = route_a.len().max(route_b.len()) as f32;
    if max_len == 0.0 {
        return 0;
    }
    
    ((common_cells as f32 / max_len) * 100.0) as u8
}

fn calculate_date_overlap(start_a: i64, end_a: i64, start_b: i64, end_b: i64) -> u8 {
    let overlap_start = start_a.max(start_b);
    let overlap_end = end_a.min(end_b);
    
    if overlap_start >= overlap_end {
        return 0; // No overlap
    }
    
    let overlap_days = (overlap_end - overlap_start) / 86400; // seconds to days
    let total_days = ((end_a - start_a) + (end_b - start_b)) / 86400;
    
    if total_days == 0 {
        return 0;
    }
    
    ((overlap_days as f32 / total_days as f32) * 100.0) as u8
}

fn calculate_interest_similarity(interests_a: &[u8], interests_b: &[u8]) -> u8 {
    let mut matching = 0;
    let len = interests_a.len().min(interests_b.len());
    
    for i in 0..len {
        if interests_a[i] == interests_b[i] && interests_a[i] == 1 {
            matching += 1;
        }
    }
    
    if len == 0 {
        return 0;
    }
    
    ((matching as f32 / len as f32) * 100.0) as u8
}

fn count_common_cells(route_a: &[u32], route_b: &[u32]) -> u32 {
    let mut count = 0;
    for cell in route_a {
        if route_b.contains(cell) {
            count += 1;
        }
    }
    count
}

fn calculate_overlap_days(dates_a: [i64; 2], dates_b: [i64; 2]) -> u32 {
    let overlap_start = dates_a[0].max(dates_b[0]);
    let overlap_end = dates_a[1].min(dates_b[1]);
    
    if overlap_start >= overlap_end {
        return 0;
    }
    
    ((overlap_end - overlap_start) / 86400) as u32
}

// ===== Error Codes =====

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid match status for this operation")]
    InvalidMatchStatus,
    
    #[msg("User not authorized for this operation")]
    Unauthorized,
}
