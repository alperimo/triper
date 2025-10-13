// Encrypted Trip Matching Instructions
// These functions run off-chain on Arcium's MPC network
//
// IMPORTANT: Arcium MPC has strict limitations:
// - NO Vec, NO dynamic allocations
// - NO break/return statements  
// - CONSTANT loop bounds only
// - LIMITED floating point operations (no floor, ceil, etc.)
// - Simple arithmetic and conditionals only
//
// For production, we use integer arithmetic and fixed-size arrays

use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;
    
    // Maximum waypoints per route (fixed size for MPC compatibility)
    const MAX_WAYPOINTS: usize = 20;
    
    // Maximum interest tags
    const MAX_INTERESTS: usize = 32;
    
    /// Trip data structure matching what's encrypted in Trip.encrypted_data
    /// This is what the client encrypts and stores on-chain
    pub struct TripData {
        // H3 cells at level 7 (~5km² resolution)
        // Each waypoint is represented as a u64 H3 index
        waypoints: [u64; MAX_WAYPOINTS],
        waypoint_count: u8,
        
        // Trip timing (Unix timestamps)
        start_date: i64,
        end_date: i64,
        
        // Interest tags as boolean flags (up to 32 categories)
        // interests[0] = hiking, interests[1] = food, etc.
        interests: [bool; MAX_INTERESTS],
    }
    
    /// Compute route similarity using H3 cell Jaccard index
    /// Returns percentage similarity (0-100)
    /// 
    /// Algorithm: Jaccard = |A ∩ B| / |A ∪ B|
    /// - Count matching H3 cells between routes
    /// - Divide by total unique cells
    fn compute_route_similarity(
        waypoints_a: &[u64; MAX_WAYPOINTS], 
        count_a: u8,
        waypoints_b: &[u64; MAX_WAYPOINTS], 
        count_b: u8
    ) -> u8 {
        // Handle empty routes (can't use return in MPC)
        let has_waypoints = count_a > 0 && count_b > 0;
        
        // Count overlapping H3 cells (Jaccard similarity)
        let mut intersection_count = 0u32;
        let mut visited = [false; MAX_WAYPOINTS];
        
        // Must use constant loop bounds in MPC
        for i in 0..MAX_WAYPOINTS {
            let is_valid_b = (i as u8) < count_b;
            if is_valid_b {
                let cell_b = waypoints_b[i];
                
                for j in 0..MAX_WAYPOINTS {
                    let is_valid_a = (j as u8) < count_a;
                    let matches = is_valid_a && !visited[j] && waypoints_a[j] == cell_b;
                    
                    if matches {
                        intersection_count += 1;
                        visited[j] = true;
                        // In MPC we can't break, so we continue but skip further checks
                    }
                }
            }
        }
        
        // Jaccard = |A ∩ B| / |A ∪ B|
        // |A ∪ B| = |A| + |B| - |A ∩ B|
        let union_count = (count_a as u32) + (count_b as u32) - intersection_count;
        let union_nonzero = if union_count == 0 { 1 } else { union_count };
        
        // Return Jaccard index as percentage (0-100)
        let jaccard_percentage = (intersection_count * 100) / union_nonzero;
        let clamped = if jaccard_percentage > 100 { 100 } else { jaccard_percentage };
        
        // If no waypoints, return 0, otherwise return calculated score
        if has_waypoints {
            clamped as u8
        } else {
            0
        }
    }
    
    /// Compute date overlap as percentage
    /// Returns 0-100 based on how much the date ranges overlap
    fn compute_date_overlap(
        start_a: i64,
        end_a: i64,
        start_b: i64,
        end_b: i64,
    ) -> u8 {
        let overlap_start = if start_a > start_b { start_a } else { start_b };
        let overlap_end = if end_a < end_b { end_a } else { end_b };
        
        // No early returns allowed in MPC - use conditional expressions
        let has_overlap = overlap_end >= overlap_start;
        
        let overlap_duration = if has_overlap {
            overlap_end - overlap_start
        } else {
            0
        };
        
        let duration_a = end_a - start_a;
        let duration_b = end_b - start_b;
        let avg_duration = (duration_a + duration_b) / 2;
        
        let avg_duration_nonzero = if avg_duration == 0 { 1 } else { avg_duration };
        
        let percentage = (overlap_duration * 100) / avg_duration_nonzero;
        let clamped = if percentage > 100 { 100 } else { percentage };
        
        clamped as u8
    }
    
    /// Compute interest similarity using Jaccard index on boolean flags
    /// interests are represented as boolean arrays where true = user has that interest
    fn compute_interest_similarity(interests_a: &[bool; 32], interests_b: &[bool; 32]) -> u8 {
        let mut common_count = 0u32;
        let mut total_count = 0u32;
        
        for i in 0..32 {
            if interests_a[i] && interests_b[i] {
                common_count += 1;
                total_count += 1;
            } else if interests_a[i] || interests_b[i] {
                total_count += 1;
            }
        }
        
        // No interests specified by either party - use conditional instead of return
        let total_nonzero = if total_count == 0 { 1 } else { total_count };
        let score = if total_count == 0 {
            100
        } else {
            ((common_count * 100) / total_nonzero) as u8
        };
        
        score
    }
    
    /// Main encrypted instruction: compute trip match score
    /// This runs on Arcium's MPC network - data never decrypted
    ///
    /// Takes two encrypted trip datasets and computes compatibility scores:
    /// - Route similarity (H3 cell Jaccard for privacy)
    /// - Date overlap
    /// - Interest alignment
    ///
    /// Returns (route_score, date_score, interest_score, total_score) all 0-100
    #[instruction]
    pub fn compute_trip_match(
        trip_a_ctxt: Enc<Shared, TripData>,
        trip_b_ctxt: Enc<Shared, TripData>,
    ) -> (u8, u8, u8, u8) {
        let trip_a = trip_a_ctxt.to_arcis();
        let trip_b = trip_b_ctxt.to_arcis();
        
        // All computations happen in MPC - fully encrypted!
        let route_score = compute_route_similarity(
            &trip_a.waypoints,
            trip_a.waypoint_count,
            &trip_b.waypoints,
            trip_b.waypoint_count
        );
        
        let date_score = compute_date_overlap(
            trip_a.start_date,
            trip_a.end_date,
            trip_b.start_date,
            trip_b.end_date
        );
        
        let interest_score = compute_interest_similarity(
            &trip_a.interests,
            &trip_b.interests
        );
        
        // Weighted average: 40% route, 35% dates, 25% interests
        let total_score = (
            (route_score as u32 * 40) + 
            (date_score as u32 * 35) + 
            (interest_score as u32 * 25)
        ) / 100;
        
        // Return all scores revealed (not encrypted)
        // The individual trip data remains encrypted - only scores are revealed
        (
            route_score.reveal(),
            date_score.reveal(),
            interest_score.reveal(),
            (total_score as u8).reveal()
        )
    }
}

