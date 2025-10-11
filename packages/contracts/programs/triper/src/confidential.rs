// Confidential Trip Matching Circuit
// Uses Arcis framework for MPC computations

use arcis::prelude::*;
use anchor_lang::prelude::*;

/// Result of match computation (returned from MPC)
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MatchResult {
    pub route_score: u8,      // 0-100
    pub date_score: u8,        // 0-100  
    pub interest_score: u8,    // 0-100
    pub total_score: u8,       // Weighted average
}

/// Grid cell representation for privacy-preserving location matching
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GridCell {
    pub x: i32,  // Grid X coordinate
    pub y: i32,  // Grid Y coordinate  
}

/// Convert latitude/longitude to grid cell (10km resolution)
/// This provides k-anonymity by grouping nearby locations
pub fn coords_to_grid_cell(lat: f64, lng: f64, cell_size_meters: u32) -> GridCell {
    // Earth radius in meters
    const EARTH_RADIUS: f64 = 6_371_000.0;
    
    // Convert to radians
    let lat_rad = lat.to_radians();
    let lng_rad = lng.to_radians();
    
    // Calculate grid cell size in degrees (approximately)
    let cell_size_deg = (cell_size_meters as f64) / EARTH_RADIUS * (180.0 / std::f64::consts::PI);
    
    GridCell {
        x: (lng / cell_size_deg).floor() as i32,
        y: (lat / cell_size_deg).floor() as i32,
    }
}

/// Confidential route matching using grid-based comparison
/// Runs via MPC - actual coordinates never revealed
#[confidential]
pub fn compute_route_similarity(
    route_a: Vec<(f64, f64)>,  // [(lat, lng), ...]
    route_b: Vec<(f64, f64)>,
    grid_size: u32,            // Grid cell size in meters (e.g., 10000 for 10km)
) -> u8 {
    // Convert routes to grid cells
    let cells_a: Vec<GridCell> = route_a
        .iter()
        .map(|(lat, lng)| coords_to_grid_cell(*lat, *lng, grid_size))
        .collect();
    
    let cells_b: Vec<GridCell> = route_b
        .iter()
        .map(|(lat, lng)| coords_to_grid_cell(*lat, *lng, grid_size))
        .collect();
    
    // Count overlapping cells (Jaccard similarity)
    let mut overlap_count = 0;
    let mut visited = vec![false; cells_a.len()];
    
    for cell_b in &cells_b {
        for (i, cell_a) in cells_a.iter().enumerate() {
            if !visited[i] && cell_a == cell_b {
                overlap_count += 1;
                visited[i] = true;
                break;
            }
        }
    }
    
    // Calculate unique cells
    let unique_cells = cells_a.len() + cells_b.len() - overlap_count;
    
    if unique_cells == 0 {
        return 0;
    }
    
    // Jaccard similarity: intersection / union
    ((overlap_count * 100) / unique_cells) as u8
}

/// Confidential date overlap calculation
/// Returns percentage of overlap relative to average trip duration
#[confidential]
pub fn compute_date_overlap(
    start_a: i64,  // Unix timestamp
    end_a: i64,
    start_b: i64,
    end_b: i64,
) -> u8 {
    // Calculate overlap period
    let overlap_start = start_a.max(start_b);
    let overlap_end = end_a.min(end_b);
    
    // No overlap
    if overlap_end < overlap_start {
        return 0;
    }
    
    // Calculate overlap in seconds
    let overlap_duration = overlap_end - overlap_start;
    
    // Calculate average trip duration
    let duration_a = end_a - start_a;
    let duration_b = end_b - start_b;
    let avg_duration = (duration_a + duration_b) / 2;
    
    if avg_duration == 0 {
        return 0;
    }
    
    // Return overlap as percentage of average duration (capped at 100)
    ((overlap_duration * 100) / avg_duration).min(100) as u8
}

/// Confidential interest similarity calculation
/// Uses Jaccard similarity on interest sets
#[confidential]
pub fn compute_interest_similarity(
    interests_a: Vec<u32>,  // Interest IDs (e.g., [1=hiking, 2=food, 3=photography])
    interests_b: Vec<u32>,
) -> u8 {
    if interests_a.is_empty() && interests_b.is_empty() {
        return 100; // Both have no preferences
    }
    
    if interests_a.is_empty() || interests_b.is_empty() {
        return 0; // One has no preferences
    }
    
    // Count common interests
    let mut common_count = 0;
    let mut counted = vec![false; interests_a.len()];
    
    for interest_b in &interests_b {
        for (i, interest_a) in interests_a.iter().enumerate() {
            if !counted[i] && interest_a == interest_b {
                common_count += 1;
                counted[i] = true;
                break;
            }
        }
    }
    
    // Calculate total unique interests
    let total_unique = interests_a.len() + interests_b.len() - common_count;
    
    // Jaccard similarity: intersection / union
    ((common_count * 100) / total_unique) as u8
}

/// Main confidential matching function
/// Combines all matching criteria with weighted scoring
#[confidential]
pub fn compute_trip_match(
    // Trip A data
    route_a: Vec<(f64, f64)>,
    dates_a: (i64, i64),  // (start, end)
    interests_a: Vec<u32>,
    
    // Trip B data  
    route_b: Vec<(f64, f64)>,
    dates_b: (i64, i64),
    interests_b: Vec<u32>,
    
    // Configuration
    grid_size: u32,  // Privacy parameter: larger = more privacy, less precision
) -> MatchResult {
    // Compute individual scores via MPC
    let route_score = compute_route_similarity(route_a, route_b, grid_size);
    let date_score = compute_date_overlap(dates_a.0, dates_a.1, dates_b.0, dates_b.1);
    let interest_score = compute_interest_similarity(interests_a, interests_b);
    
    // Weighted average: 40% route, 35% dates, 25% interests
    let total_score = ((route_score as u32 * 40) + 
                      (date_score as u32 * 35) + 
                      (interest_score as u32 * 25)) / 100;
    
    MatchResult {
        route_score,
        date_score,
        interest_score,
        total_score: total_score as u8,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_grid_cell_conversion() {
        // Berlin coordinates
        let berlin = coords_to_grid_cell(52.52, 13.40, 10_000);
        
        // Nearby location (should be same cell)
        let berlin_nearby = coords_to_grid_cell(52.525, 13.405, 10_000);
        
        assert_eq!(berlin, berlin_nearby, "Nearby locations should map to same grid cell");
    }
    
    #[test]
    fn test_date_overlap() {
        // Trip A: Jan 1-10
        // Trip B: Jan 5-15
        // Overlap: 5 days
        let overlap = compute_date_overlap(
            1704067200, // Jan 1, 2024
            1704844800, // Jan 10, 2024
            1704412800, // Jan 5, 2024
            1705190400, // Jan 15, 2024
        );
        
        // Expected: 5 days overlap / 10 days average ≈ 50%
        assert!(overlap >= 45 && overlap <= 55, "Expected ~50% overlap, got {}", overlap);
    }
    
    #[test]
    fn test_interest_similarity() {
        let interests_a = vec![1, 2, 3]; // hiking, food, photography
        let interests_b = vec![2, 3, 4]; // food, photography, adventure
        
        // 2 common out of 4 total unique = 50%
        let similarity = compute_interest_similarity(interests_a, interests_b);
        assert_eq!(similarity, 50);
    }
}
