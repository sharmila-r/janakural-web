export const COLLECTIONS = {
  USERS: 'janakural_users',
  ISSUES: 'janakural_issues',
  ISSUE_HISTORY: 'janakural_issue_history',
  STATES: 'janakural_states',
  CATEGORIES: 'janakural_categories',
  ANALYTICS: 'janakural_analytics',
  NOTIFICATIONS: 'janakural_notifications',
} as const;

export const STORAGE_PATHS = {
  ROOT: 'janakural',
  ISSUES: 'janakural/issues',
  PROFILES: 'janakural/profiles',
  TEMP: 'janakural/temp',
} as const;

export const CATEGORIES = [
  { id: 'road', name: 'சாலை பிரச்சனைகள்', nameEn: 'Road Issues', icon: '🛣️', color: 'bg-orange-100 text-orange-600' },
  { id: 'water', name: 'குடிநீர்', nameEn: 'Water Supply', icon: '💧', color: 'bg-blue-100 text-blue-600' },
  { id: 'electricity', name: 'மின்சாரம்', nameEn: 'Electricity', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'sanitation', name: 'சுகாதாரம்', nameEn: 'Sanitation', icon: '🧹', color: 'bg-green-100 text-green-600' },
  { id: 'drainage', name: 'வடிகால்', nameEn: 'Drainage', icon: '🌊', color: 'bg-purple-100 text-purple-600' },
  { id: 'streetlight', name: 'தெரு விளக்கு', nameEn: 'Street Light', icon: '💡', color: 'bg-amber-100 text-amber-600' },
];

export const getIssuePhotoPath = (issueId: string, fileName: string) =>
  `${STORAGE_PATHS.ISSUES}/${issueId}/${fileName}`;

export const getProfilePhotoPath = (userId: string, fileName: string) =>
  `${STORAGE_PATHS.PROFILES}/${userId}/${fileName}`;

// Tamil Nadu Districts
export const DISTRICTS = [
  { id: 'ariyalur', name: 'அரியலூர்', nameEn: 'Ariyalur' },
  { id: 'chengalpattu', name: 'செங்கல்பட்டு', nameEn: 'Chengalpattu' },
  { id: 'chennai', name: 'சென்னை', nameEn: 'Chennai' },
  { id: 'coimbatore', name: 'கோயம்புத்தூர்', nameEn: 'Coimbatore' },
  { id: 'cuddalore', name: 'கடலூர்', nameEn: 'Cuddalore' },
  { id: 'dharmapuri', name: 'தர்மபுரி', nameEn: 'Dharmapuri' },
  { id: 'dindigul', name: 'திண்டுக்கல்', nameEn: 'Dindigul' },
  { id: 'erode', name: 'ஈரோடு', nameEn: 'Erode' },
  { id: 'kallakurichi', name: 'கள்ளக்குறிச்சி', nameEn: 'Kallakurichi' },
  { id: 'kancheepuram', name: 'காஞ்சிபுரம்', nameEn: 'Kancheepuram' },
  { id: 'kanyakumari', name: 'கன்னியாகுமரி', nameEn: 'Kanyakumari' },
  { id: 'karur', name: 'கரூர்', nameEn: 'Karur' },
  { id: 'krishnagiri', name: 'கிருஷ்ணகிரி', nameEn: 'Krishnagiri' },
  { id: 'madurai', name: 'மதுரை', nameEn: 'Madurai' },
  { id: 'mayiladuthurai', name: 'மயிலாடுதுறை', nameEn: 'Mayiladuthurai' },
  { id: 'nagapattinam', name: 'நாகப்பட்டினம்', nameEn: 'Nagapattinam' },
  { id: 'namakkal', name: 'நாமக்கல்', nameEn: 'Namakkal' },
  { id: 'nilgiris', name: 'நீலகிரி', nameEn: 'Nilgiris' },
  { id: 'perambalur', name: 'பெரம்பலூர்', nameEn: 'Perambalur' },
  { id: 'pudukkottai', name: 'புதுக்கோட்டை', nameEn: 'Pudukkottai' },
  { id: 'ramanathapuram', name: 'ராமநாதபுரம்', nameEn: 'Ramanathapuram' },
  { id: 'ranipet', name: 'ராணிப்பேட்டை', nameEn: 'Ranipet' },
  { id: 'salem', name: 'சேலம்', nameEn: 'Salem' },
  { id: 'sivaganga', name: 'சிவகங்கை', nameEn: 'Sivaganga' },
  { id: 'tenkasi', name: 'தென்காசி', nameEn: 'Tenkasi' },
  { id: 'thanjavur', name: 'தஞ்சாவூர்', nameEn: 'Thanjavur' },
  { id: 'theni', name: 'தேனி', nameEn: 'Theni' },
  { id: 'thoothukudi', name: 'தூத்துக்குடி', nameEn: 'Thoothukudi' },
  { id: 'tiruchirappalli', name: 'திருச்சிராப்பள்ளி', nameEn: 'Tiruchirappalli' },
  { id: 'tirunelveli', name: 'திருநெல்வேலி', nameEn: 'Tirunelveli' },
  { id: 'tirupathur', name: 'திருப்பத்தூர்', nameEn: 'Tirupathur' },
  { id: 'tiruppur', name: 'திருப்பூர்', nameEn: 'Tiruppur' },
  { id: 'tiruvallur', name: 'திருவள்ளூர்', nameEn: 'Tiruvallur' },
  { id: 'tiruvannamalai', name: 'திருவண்ணாமலை', nameEn: 'Tiruvannamalai' },
  { id: 'tiruvarur', name: 'திருவாரூர்', nameEn: 'Tiruvarur' },
  { id: 'vellore', name: 'வேலூர்', nameEn: 'Vellore' },
  { id: 'viluppuram', name: 'விழுப்புரம்', nameEn: 'Viluppuram' },
  { id: 'virudhunagar', name: 'விருதுநகர்', nameEn: 'Virudhunagar' },
];

// Panchayat Unions by District (sample - add more as needed)
export const PANCHAYAT_UNIONS: Record<string, { id: string; name: string; nameEn: string }[]> = {
  chennai: [
    { id: 'chennai_central', name: 'சென்னை மத்திய', nameEn: 'Chennai Central' },
  ],
  coimbatore: [
    { id: 'coimbatore_north', name: 'கோயம்புத்தூர் வடக்கு', nameEn: 'Coimbatore North' },
    { id: 'coimbatore_south', name: 'கோயம்புத்தூர் தெற்கு', nameEn: 'Coimbatore South' },
    { id: 'sulur', name: 'சூலூர்', nameEn: 'Sulur' },
    { id: 'annur', name: 'அன்னூர்', nameEn: 'Annur' },
    { id: 'karamadai', name: 'கரமடை', nameEn: 'Karamadai' },
    { id: 'mettupalayam', name: 'மேட்டுப்பாளையம்', nameEn: 'Mettupalayam' },
    { id: 'pollachi', name: 'பொள்ளாச்சி', nameEn: 'Pollachi' },
    { id: 'kinathukadavu', name: 'கிணத்துக்கடவு', nameEn: 'Kinathukadavu' },
    { id: 'madukkarai', name: 'மடுக்கரை', nameEn: 'Madukkarai' },
    { id: 'thondamuthur', name: 'தொண்டாமுத்தூர்', nameEn: 'Thondamuthur' },
    { id: 'perur', name: 'பேரூர்', nameEn: 'Perur' },
    { id: 'sarcarsamakulam', name: 'சர்க்கார்சாமக்குளம்', nameEn: 'Sarcarsamakulam' },
  ],
  madurai: [
    { id: 'madurai_east', name: 'மதுரை கிழக்கு', nameEn: 'Madurai East' },
    { id: 'madurai_west', name: 'மதுரை மேற்கு', nameEn: 'Madurai West' },
    { id: 'thiruparankundram', name: 'திருப்பரங்குன்றம்', nameEn: 'Thiruparankundram' },
    { id: 'melur', name: 'மேலூர்', nameEn: 'Melur' },
    { id: 'vadipatti', name: 'வாடிப்பட்டி', nameEn: 'Vadipatti' },
    { id: 'usilampatti', name: 'உசிலம்பட்டி', nameEn: 'Usilampatti' },
    { id: 'peraiyur', name: 'பெரையூர்', nameEn: 'Peraiyur' },
    { id: 'thirumangalam', name: 'திருமங்கலம்', nameEn: 'Thirumangalam' },
    { id: 'kallikudi', name: 'கள்ளிக்குடி', nameEn: 'Kallikudi' },
    { id: 'sedapatti', name: 'சேடப்பட்டி', nameEn: 'Sedapatti' },
    { id: 'kottampatti', name: 'கொட்டம்பட்டி', nameEn: 'Kottampatti' },
    { id: 'alanganallur', name: 'அலங்காநல்லூர்', nameEn: 'Alanganallur' },
  ],
  tiruchirappalli: [
    { id: 'trichy_west', name: 'திருச்சி மேற்கு', nameEn: 'Trichy West' },
    { id: 'trichy_east', name: 'திருச்சி கிழக்கு', nameEn: 'Trichy East' },
    { id: 'srirangam', name: 'ஸ்ரீரங்கம்', nameEn: 'Srirangam' },
    { id: 'lalgudi', name: 'லால்குடி', nameEn: 'Lalgudi' },
    { id: 'pullambadi', name: 'புல்லம்பாடி', nameEn: 'Pullambadi' },
    { id: 'musiri', name: 'முசிறி', nameEn: 'Musiri' },
    { id: 'thottiyam', name: 'தொட்டியம்', nameEn: 'Thottiyam' },
    { id: 'thuraiyur', name: 'துறையூர்', nameEn: 'Thuraiyur' },
    { id: 'manachanallur', name: 'மணச்சநல்லூர்', nameEn: 'Manachanallur' },
    { id: 'manikandam', name: 'மணிகண்டம்', nameEn: 'Manikandam' },
    { id: 'andanallur', name: 'ஆண்டநல்லூர்', nameEn: 'Andanallur' },
    { id: 'marungapuri', name: 'மருங்காபுரி', nameEn: 'Marungapuri' },
  ],
  // Add a generic fallback for other districts
  default: [
    { id: 'block_1', name: 'வட்டம் 1', nameEn: 'Block 1' },
    { id: 'block_2', name: 'வட்டம் 2', nameEn: 'Block 2' },
    { id: 'block_3', name: 'வட்டம் 3', nameEn: 'Block 3' },
  ],
};

// Get panchayat unions for a district
export const getPanchayatUnions = (districtId: string) => {
  return PANCHAYAT_UNIONS[districtId] || PANCHAYAT_UNIONS.default;
};
