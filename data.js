// data.js - Game data for officers and related assets

const officerTypes = [
    { image: 'officer-red.png', color: 'red', specialties: ['engineering', 'security', 'tactical', 'communications'] },
    { image: 'officer-gold.png', color: 'gold', specialties: ['command', 'navigation', 'pilot', 'operations'] },
    { image: 'officer-blue.png', color: 'blue', specialties: ['science', 'medical'] }
];
const ranks = ['Cadet', 'Ensign', 'Lieutenant', 'Lt. Commander', 'Commander', 'Captain'];
const names = [
    // Western
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    // East Asian
    'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Lin', 'Sun', 'Ma', 'Zhu', 'Hu',
    // South Asian
    'Singh', 'Kumar', 'Patel', 'Sharma', 'Reddy', 'Nair', 'Das', 'Khan', 'Mehta', 'Chopra', 'Joshi', 'Gupta',
    // African
    'Okafor', 'Abebe', 'Mensah', 'Ndlovu', 'Diallo', 'Kamau', 'Chukwu', 'Mwangi', 'Adebayo', 'Nkosi',
    // Middle Eastern
    'Haddad', 'Fahad', 'Yousef', 'Nasser', 'Suleiman', 'Barakat', 'Farouk', 'Jabari', 'Khalil',
    // Eastern European
    'Ivanov', 'Kowalski', 'Nowak', 'Popov', 'Horvat', 'Nagy', 'Petrov', 'Novak', 'Stoica',
    // Nordic
    'Larsen', 'Johansen', 'Olsen', 'Andersson', 'Virtanen', 'Nielsen', 'Berg', 'Hansen',
    // Hispanic/Latino
    'Santos', 'Silva', 'Torres', 'Ramirez', 'Castro', 'Morales', 'Vargas', 'Mendoza',
    // Indigenous/Other
    'Begay', 'Yazzie', 'Kaya', 'Tala', 'Aponi', 'Onida', 'Chaska', 'Tadita',
    // Sci-fi/Creative
    'Tark', 'Zyra', 'Voss', 'Ryn', 'Jex', 'Kira', 'Soren', 'Mira', 'Dax', 'Nova', 'Orin', 'Vela', 'Rook', 'Lira', 'Juno', 'Kael', 'Zane', 'Nyx', 'Rhea', 'Sable', 'Talon', 'Vega', 'Quill', 'Rune', 'Sable', 'Thane', 'Xan', 'Yara', 'Zarek', 'Zara', 'Ziv', 'Astra', 'Bryn', 'Cai', 'Dara', 'Eira', 'Fenn', 'Galen', 'Hale', 'Iris', 'Jace', 'Kato', 'Lira', 'Mira', 'Nash', 'Orrin', 'Pax', 'Quin', 'Riven', 'Sage', 'Tess', 'Vale', 'Wren', 'Xara', 'Yule', 'Zeph'
];

function getRandomSpecialty(officerType) {
    if (!officerType || !officerType.specialties || officerType.specialties.length === 0) {
        return '';
    }

    const specialtyIndex = Math.floor(Math.random() * officerType.specialties.length);
    return officerType.specialties[specialtyIndex];
}
