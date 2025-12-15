// Vendor image mappings
// Maps vendor IDs to their corresponding image assets

const vendorImages = {
    // Padel
    'smash_padel_clifton': require('../assets/images/smashpadel.png'),
    'ace_padel_dha': require('../assets/images/AcePadel.png'),
    'golden_court_dha': require('../assets/images/goldencourt.png'),

    // Cricket
    'pitch_perfect_dha': require('../assets/images/pitchperfect.png'),
    'clifton_cricket_nets': require('../assets/images/cliftoncricket.png'),

    // Pickleball
    'pickle_pod_dha': require('../assets/images/picklepod.png'),
    'dink_masters_clifton': require('../assets/images/dinkmaster.png'),
    'rally_point_gulshan': require('../assets/images/rallypoint.png'),

    // Futsal
    'elite_futsal_clifton': require('../assets/images/elitefutsal.png'),
    'goal_zone_gulshan': require('../assets/images/goalzone.png'),
    'urban_futsal_bahria': require('../assets/images/urbanfutsal.png'),
};

// Default fallback image for vendors without specific images
const defaultVendorImage = require('../assets/images/smashpadel.png');

/**
 * Get the image for a vendor by their ID
 * @param vendorId - The vendor's unique identifier
 * @returns The image asset
 */
export const getVendorImage = (vendorId: string) => {
    return vendorImages[vendorId as keyof typeof vendorImages] || defaultVendorImage;
};

export default vendorImages;
