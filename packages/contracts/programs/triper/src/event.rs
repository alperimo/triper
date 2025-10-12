use anchor_lang::prelude::*;

#[event]
pub struct MatchComputedEvent {
    pub computation_account: Pubkey,
    pub route_score: u8,
    pub date_score: u8,
    pub interest_score: u8,
    pub total_score: u8,
}