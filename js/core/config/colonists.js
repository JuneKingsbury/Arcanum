export const SKILLS = {
    building: { name: 'Building', baseLevel: [2, 5], biasBonus: 3, description: 'Construction, mining, chopping, and repairs' },
    farming:  { name: 'Farming', baseLevel: [2, 5], biasBonus: 3, description: 'Planting and harvesting crops' },
    crafting: { name: 'Crafting', baseLevel: [2, 5], biasBonus: 3, description: 'Crafting items at workbenches' },
    cooking:  { name: 'Cooking', baseLevel: [2, 5], biasBonus: 3, description: 'Cooking meals at cauldrons' },
    animals:  { name: 'Animals', baseLevel: [1, 4], biasBonus: 3, description: 'Taming and handling animals' },
    research: { name: 'Research', baseLevel: [1, 3], biasBonus: 3, description: 'Studying and discovering new knowledge' },
};

export const THOUGHTS = {
    built_something:   { text: 'Built something', moodEffect: 3, duration: 100 },
    good_work:         { text: 'Good honest work', moodEffect: 2, duration: 80 },
    harvested:         { text: 'Harvested crops', moodEffect: 3, duration: 100 },
    crafted:           { text: 'Crafted something', moodEffect: 4, duration: 120 },
    cooked:            { text: 'Cooked a meal', moodEffect: 3, duration: 100 },
    tamed_animal:      { text: 'Tamed an animal', moodEffect: 6, duration: 150 },
    put_out_fire:      { text: 'Put out a fire', moodEffect: 5, duration: 150 },
    repaired:          { text: 'Repaired a structure', moodEffect: 3, duration: 100 },
    deconstructed:     { text: 'Tore something down', moodEffect: 2, duration: 80 },
    new_colonist:      { text: 'New colonist arrived', moodEffect: 5, duration: 200 },
    freezing:          { text: 'Freezing outside', moodEffect: -8, duration: 50 },
    fire_panic:        { text: 'Colony on fire!', moodEffect: -20, duration: 200 },
    crops_died:        { text: 'Crops died', moodEffect: -15, duration: 300 },
    cold_snap:         { text: 'Freezing cold snap', moodEffect: -12, duration: 300 },
    inspired:          { text: 'Feeling inspired!', moodEffect: 25, duration: 300 },
    food_spoiled:      { text: 'Food is rotting', moodEffect: -5, duration: 150 },
    learned_spell:     { text: 'Learned a new spell!', moodEffect: 8, duration: 200 },
    cast_spell:        { text: 'Cast a spell', moodEffect: 3, duration: 80 },
    tame_failed:       { text: 'Failed taming attempt!', moodEffect: -8, duration: 150 },
    wolf_retaliated:   { text: 'Wolf attacked during taming!', moodEffect: -12, duration: 200 },
};

export const TRAITS = {
    hard_worker: { name: 'Hard Worker', workSpeedMult: 1.2, description: '+20% work speed' },
    lazy: { name: 'Lazy', workSpeedMult: 0.85, idleMoodBonus: 5, description: '-15% work speed, happy when idle' },
    night_owl: { name: 'Night Owl', nightSpeedMult: 1.2, daySpeedMult: 0.9, description: '+20% at night, -10% during day' },
    early_bird: { name: 'Early Bird', daySpeedMult: 1.2, nightSpeedMult: 0.9, description: '+20% during day, -10% at night' },
    green_thumb: { name: 'Green Thumb', farmingSpeedMult: 1.3, description: '+30% farming speed' },
    iron_stomach: { name: 'Iron Stomach', hungerDecayMult: 0.5, description: 'Gets hungry half as fast' },
    socialite: { name: 'Socialite', nearOthersMoodBonus: 8, aloneMoodPenalty: -5, description: 'Happy near others, sad alone' },
    loner: { name: 'Loner', aloneMoodBonus: 8, nearOthersMoodPenalty: -5, description: 'Happy alone, stressed near others' },
    optimist: { name: 'Optimist', positiveThoughtMult: 1.5, description: 'Positive thoughts 50% stronger' },
    pessimist: { name: 'Pessimist', negativeThoughtMult: 1.5, description: 'Negative thoughts 50% stronger' },
    tough: { name: 'Tough', damageTakenMult: 0.7, description: 'Takes 30% less damage' },
    pacifist: { name: 'Pacifist', description: 'Refuses to attack enemies, only flees' },
    pyromaniac: { name: 'Pyromaniac', fireChance: 0.001, description: 'Rare chance to start fires' },
    gourmand: { name: 'Gourmand', cookedFoodMoodBonus: 8, rawFoodMoodPenalty: -12, description: 'Loves cooked food, hates raw' },
};

export const COLONIST_CONFIG = {
    initialHunger: [80, 100],
    initialRest: [80, 100],
    initialMood: 60,
    maxHp: 100,
    baseMood: 50,
    hungerMoodThreshold: 20,
    hungerMoodPenalty: -15,
    restMoodThreshold: 20,
    restMoodPenalty: -10,
    bedMoodBonus: 5,
    sleepDuration: 30,
    sleepAfterMoveDuration: 25,
    restPerTick: 3,
    breakingWanderDuration: [30, 50],
    wanderCooldown: [5, 15],
    wanderChance: 0.3,
    fightEngageDistance: 8,
    fleeHpThreshold: 20,
    fleeDisengageDistance: 8,
    hostileSearchRadius: 30,
    socialRange: 3,
    skillWorkBonus: 0.15,
    deconstructRecovery: 0.5,
    baseAttackCooldown: 3,
    combatDamageVariance: 3,
    victoryMoodBonus: 5,
    victoryMoodDuration: 200,
    cookedFoodRestore: 100,
    rawFoodRestore: 35,
    mealMoodBonus: 5,
    mealMoodDuration: 150,
    rawFoodMoodPenalty: -4,
    rawFoodMoodDuration: 100,
    starvingMoodPenalty: -20,
    starvingMoodDuration: 100,
    sleptInRoomMoodBonus: 10,
    sleptInRoomMoodDuration: 300,
    sleptInBedMoodBonus: 5,
    sleptInBedMoodDuration: 200,
    sleptOnGroundMoodPenalty: -15,
    sleptOnGroundMoodDuration: 400,
    deathMoodPenalty: -40,
    deathMoodDuration: 2000,
    nameColors: ['#ff3300', '#00ff00', '#00ffff', '#ffff00', '#a600ff', '#ababab'],
    magicBiasChance: 0.3,
    baseHealthRegen: 0.03,
    healthRegenWhileIdle: 2.0,
    healthRegenWhileSleeping: 3.0,
    skillMaxLevel: 10,
    skillXpPerTask: 1,
    skillXpToLevel: 4,
    skillXpScalePerLevel: 2,
};

export const GENDERS = ['man', 'woman', 'nonbinary'];

export const COLONIST_NAMES = {
    man: [
        'Bob', 'Cal', 'Finn', 'Hank', 'Jake', 'Max', 'Otto',
        'Davis', 'Hugh', 'Matt', 'Paul', 'Jim', 'Rex', 'Liam', 'Noah', 'Owen',
    ],
    woman: [
        'Ada', 'Dee', 'Eve', 'Gail', 'Iris', 'Lena', 'Nora', 'Pia',
        'Mia', 'Tara', 'Uma', 'Xia', 'Wren', 'Faye', 'Opal', 'Ruth',
    ],
    nonbinary: [
        'Kit', 'Quinn', 'Sage', 'Vex', 'Morgan', 'Sam',
        'Perry', 'Harper', 'Jules', 'Kris', 'Ash', 'Rowan', 'Ember', 'Lux',
    ],
};

export const NEED_DECAY = {
    hunger: 0.25,
    rest: 0.1,
};

export const MOOD_THRESHOLDS = {
    inspired: 75,
    content: 40,
    stressed: 20,
    breaking: 0,
};

export const MOOD_SPEED_MULT = {
    inspired: 1.2,
    content: 1.0,
    stressed: 0.7,
    breaking: 0,
};

export const WORK_CONFIG = {
    plantWork: 5,
    harvestWork: 8,
    researchWork: 25,
    deconstructWork: 10,
    tameWork: 20,
    dangerousTameWork: 30,
    tameSkillChanceBonus: 0.06,
    poweredWorkbenchDivisor: 2,
    alchemyFoodBonus: 2,
    wealthPerWeapon: 10,
    guardPatrolRadius: 6,
    guardEngageRadius: 10,
    guardReturnThreshold: 12,
};

export const MAGIC_STUDY_CONFIG = {
    studyTicksPerProgress: 1,
    tomeStudyBonus: 2,
    xpPerStudyTick: 0.05,
    xpPerCast: 0.02,
    magicXpToLevel: 0.5,
    magicXpScalePerLevel: 0.15,
};

export const TASK_CONFIG = {
    unreachableFailThreshold: 3,
    unreachableCheckInterval: 60,
};

export const QUALITY_TIERS = [
    { key: 'poor', prefix: 'Crude', multiplier: 0.85, color: '#888888', baseChance: 0.20, perSkill: -0.03 },
    { key: 'normal', prefix: '', multiplier: 1.00, color: '#cccccc', baseChance: 0.60, perSkill: 0 },
    { key: 'fine', prefix: 'Fine', multiplier: 1.10, color: '#44cc44', baseChance: 0.15, perSkill: 0.02 },
    { key: 'superior', prefix: 'Superior', multiplier: 1.20, color: '#4488ff', baseChance: 0.05, perSkill: 0.01 },
];

export const ROOM_QUALITY_TIERS = [
    { key: 'bare', name: 'Bare room', minScore: 0, moodEffect: 10, duration: 300 },
    { key: 'cozy', name: 'Cozy bedroom', minScore: 20, moodEffect: 14, duration: 350 },
    { key: 'comfortable', name: 'Comfortable bedroom', minScore: 40, moodEffect: 18, duration: 400 },
    { key: 'luxurious', name: 'Luxurious bedroom', minScore: 60, moodEffect: 22, duration: 450 },
    { key: 'opulent', name: 'Opulent quarters', minScore: 80, moodEffect: 26, duration: 500 },
];

export const WORKSHOP_QUALITY_TIERS = [
    { key: 'makeshift', name: 'Makeshift', minScore: 0, speedMult: 1.0, qualityBonus: 0 },
    { key: 'functional', name: 'Functional', minScore: 25, speedMult: 1.1, qualityBonus: 0 },
    { key: 'professional', name: 'Professional', minScore: 50, speedMult: 1.15, qualityBonus: 1 },
    { key: 'master', name: 'Master', minScore: 70, speedMult: 1.2, qualityBonus: 2 },
    { key: 'legendary', name: 'Legendary', minScore: 90, speedMult: 1.25, qualityBonus: 3 },
];

export const STATION_GROUPS = {
    anvil: 'Smithy',
    cauldron: 'Kitchen',
    alchemy_table: 'Kitchen',
    workbench: 'Workshop',
    enchanting_table: 'Workshop',
    scriptorium: 'Scriptorium',
    research_desk: 'Laboratory',
};

export const FLOOR_QUALITY_VALUES = {
    wood_floor: 15,
    stone_floor: 20,
    brick_floor: 25,
};

export const SALVAGE_RATE = 0.5;

export const TASK_SPEED_STATS = {
    mine: 'miningSpeed',
    chop: 'choppingSpeed',
    plant: 'farmingSpeed',
    harvest: 'farmingSpeed',
    craft: 'craftingSpeed',
    cook: 'cookingSpeed',
    build: 'buildSpeed',
    research: 'researchSpeed',
};
