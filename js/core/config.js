// ============================================================================
// GAME CONFIGURATION
// To add content: add entries to the relevant object below. The game systems
// will pick them up automatically. See RESEARCH for tech tree prerequisites.
// ============================================================================

// ----------------------------------------------------------------------------
// Global game config
// ----------------------------------------------------------------------------

// Initial game attributes like map size, tick rate, and starting items.
export const GAME_VERSION = '0.1.0';

export const CONFIG = {
    MAP_WIDTH: 256,             // world size in tiles
    MAP_HEIGHT: 256,
    VIEWPORT_WIDTH: 80,         // visible tiles (columns) on screen
    VIEWPORT_HEIGHT: 40,        // visible tiles (rows) on screen
    TICK_RATE: 200,             // ms between game ticks (lower = faster simulation)
    TICKS_PER_SEASON: 1500,     // ticks per season (5 days at 300 ticks/day)
    TICKS_PER_DAY: 300,         // ticks per in-game day (60 seconds real-time at 1x)
    START_RESOURCES: { wood: 25, stone: 15, planks: 5, food: 20, meat: 0, wheat: 0, berries: 0, corn: 0, potatoes: 0, bricks: 0, hides: 0, leather: 0, iron_ore: 0, iron: 0, runite: 0, eggs: 0, milk: 0, wool: 0, void_essence: 0 },
    PEACEFUL_MODE: false,       // disables raids and hostile animals
    GAME_SPEED: 1,              // default simulation speed multiplier
    STOCKPILE_ALERTS: { wood: 5, stone: 5, food: 5 },
};

// Day/night boundary as fraction of TICKS_PER_DAY. Used for trait speed bonuses and behavior.
export const DAY_NIGHT = { nightStart: 0.7, dayStart: 0.2 };

// Characters and colors for non-building tiles (farms, snow, entities, designations).
// These get merged with BUILDINGS chars/colors to form TILE_CHARS and TILE_COLORS.
const BASE_TILE_CHARS = {
    farm_empty: '=', farm_growing: '%', farm_ready: '*',
    snow: '*',
};

const BASE_TILE_COLORS = {
    farm_empty: '#664400', farm_growing: '#55aa22', farm_ready: '#ffdd00',
    colonist: '#ffff00', raider: '#ff3333', deer: '#bb8855', rabbit: '#ccaa88', wolf: '#666666',
    snow: '#ffffff', snowBg: '#888888', cursor: '#ffffff',
    designation_chop: '#ff8800', designation_mine: '#8888ff', designation_build: '#88ff88', designation_deconstruct: '#ff4444',
};

// To add an event: add an entry here with an 'effect' type. Data-driven effects
// are handled automatically. Supported effects:
//   'deposit'       - places resources on the map (see meteorite, windfall, forest_growth)
//   'spawn_animals' - spawns animals at map edges (see migration)
//   'mood'          - gives a random colonist a thought (see inspiration)
//   'crop_damage'   - destroys growing crops (see blight, cold_snap)
//   'custom'        - requires a handler method in events.js (wanderer, caravan, fire)
export const EVENTS = {
    wanderer: { weight: 10, minTick: 300, cooldown: 800, effect: 'custom' },
    caravan: { weight: 6, minTick: 400, cooldown: 1000, effect: 'custom' },
    fire: { weight: 4, minTick: 200, cooldown: 400, seasons: ['summer'], effect: 'custom' },
    blight: {
        weight: 8, minTick: 200, cooldown: 600, seasons: ['summer', 'autumn'],
        effect: 'crop_damage',
        chance: 0.4,
        thought: 'Crops died', moodChange: -15, moodDuration: 300,
        notification: 'Crop blight! {count} plants destroyed.',
        logMessage: 'Crop blight destroyed {count} plants', logType: 'danger',
    },
    cold_snap: {
        weight: 7, minTick: 100, cooldown: 600, seasons: ['winter'],
        effect: 'crop_damage',
        chance: 1.0,
        thought: 'Freezing cold snap', moodChange: -12, moodDuration: 300,
        notification: 'Cold snap! All outdoor crops frozen.',
        logMessage: 'Cold snap froze all outdoor crops', logType: 'danger',
    },
    windfall: {
        weight: 5, minTick: 500, cooldown: 1200,
        effect: 'deposit',
        location: 'anywhere', radius: 1, terrain: ['grass'], fillChance: 0.6,
        deposits: [{ type: 'stone', amount: [3, 5] }],
        notification: 'Mineral vein discovered! {count} new stone deposits.',
        logMessage: 'Mineral windfall: {count} new stone deposits', logType: 'event',
    },
    meteorite: {
        weight: 5, minTick: 600, cooldown: 1500,
        effect: 'deposit',
        location: 'edge', radius: 2, terrain: ['grass', 'dirt'], fillChance: 0.5,
        deposits: [
            { type: 'runite_ore', weight: 3, amount: [2, 3] },
            { type: 'stone', weight: 7, amount: [4, 7] },
        ],
        notification: 'Meteorite impact! {count} deposits found.',
        logMessage: 'Meteorite: {count} deposits at map edge', logType: 'event',
    },
    forest_growth: {
        weight: 7, minTick: 400, cooldown: 1000,
        effect: 'deposit',
        location: 'edge', radius: 3, terrain: ['grass'], fillChance: 0.55,
        deposits: [{ type: 'tree', amount: [3, 5] }],
        notification: 'Forest growth! {count} new trees appeared.',
        logMessage: 'Forest growth: {count} new trees near map edge', logType: 'event',
    },
    migration: {
        weight: 8, minTick: 300, cooldown: 800, seasons: ['autumn', 'spring'],
        effect: 'spawn_animals',
        animals: [{ type: 'deer', count: [4, 7] }],
        notification: 'Animal migration! {count} deer passing through.',
        logMessage: 'Animal migration: {count} deer passing through', logType: 'event',
    },
    inspiration: {
        weight: 12, minTick: 100, cooldown: 300,
        effect: 'mood',
        thought: 'Feeling inspired!', moodChange: 25, moodDuration: 300,
        notification: '{name} is feeling inspired!',
        logMessage: '{name} is feeling inspired!', logType: 'success',
    },
};

// Fire event tuning. Used by events.js fire spread and lifespan logic.
export const FIRE_CONFIG = {
    initialLifespan: 20,    // ticks a newly ignited tile burns
    spreadChance: 0.05,     // per-tick probability of spreading to an adjacent tile
    spreadTimerMin: 15,     // minimum lifespan for a fire that spreads
    spreadTimerMax: 25,     // maximum lifespan for a fire that spreads
};

// To add a trade: add an entry here. Caravan event auto-generates choices from this.
export const CARAVAN_TRADES = [
    { give: { wood: 5 }, receive: { food: 4 } },
    { give: { stone: 3 }, receive: { wood: 4 } },
    { give: { food: 4 }, receive: { planks: 3 } },
    { give: { food: 6 }, receive: { stone: 5 } },
    { give: { stone: 8 }, receive: { runite: 2 } },
    { give: { runite: 3, food: 5 }, receive: { tome_magic_missile: 1 } },
    { give: { runite: 3, food: 6 }, receive: { tome_heal: 1 } },
    { give: { runite: 4, food: 8 }, receive: { tome_haste: 1 } },
    { give: { void_essence: 2, runite: 3 }, receive: { tome_shield: 1 } },
    { give: { void_essence: 3, runite: 4 }, receive: { tome_warp: 1 } },
];

// Pathfinding tuning. Used by pathfinding.js and combat.js.
export const PATHFINDING_CONFIG = {
    maxNodes: 1500,              // A* node limit for colonist pathfinding
    raiderRepathInterval: 15,    // ticks before raiders recalculate their path
    raiderSearchRadius: 100,     // how far raiders scan for colonists
    breakableCostPenalty: 10,    // extra path cost for breakable structures (makes raiders prefer open routes)
};

// ----------------------------------------------------------------------------
// Colonist config
// ----------------------------------------------------------------------------

// To add a skill: add entry here. Colonists auto-get it, priority panel shows it, tasks use skillRequired.
// baseLevel: starting range [min, max]. biasBonus: added when this is the colonist's skill bias.
export const SKILLS = {
    building: { name: 'Building', baseLevel: [2, 5], biasBonus: 3, description: 'Construction, mining, chopping, and repairs' },
    farming:  { name: 'Farming', baseLevel: [2, 5], biasBonus: 3, description: 'Planting and harvesting crops' },
    crafting: { name: 'Crafting', baseLevel: [2, 5], biasBonus: 3, description: 'Crafting items at workbenches' },
    cooking:  { name: 'Cooking', baseLevel: [2, 5], biasBonus: 3, description: 'Cooking meals at cauldrons' },
    animals:  { name: 'Animals', baseLevel: [1, 4], biasBonus: 3, description: 'Taming and handling animals' },
    research: { name: 'Research', baseLevel: [1, 3], biasBonus: 3, description: 'Studying and discovering new knowledge' },
};

// To add a thought: add entry here. Used by game systems to apply mood effects.
// moodEffect: positive = good, negative = bad. duration: ticks (-1 = permanent).
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

// To add a trait: add entry here. Trait effects are checked in colonist.js updateNeeds/getWorkSpeed.
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
    pyromaniac: { name: 'Pyromaniac', fireChance: 0.001, description: 'Rare chance to start fires' },
    gourmand: { name: 'Gourmand', cookedFoodMoodBonus: 8, rawFoodMoodPenalty: -12, description: 'Loves cooked food, hates raw' },
};

// Colonist behavior tuning. Used by colonist.js for needs, mood, combat, and movement.
// Mood effects: positive = good thought, negative = bad thought. Duration in ticks.
// Thresholds: when a need drops below threshold, penalties apply.
export const COLONIST_CONFIG = {
    initialHunger: [80, 100],       // random range for new colonist hunger
    initialRest: [80, 100],         // random range for new colonist rest
    initialMood: 60,                // starting mood for new colonists
    maxHp: 100,                     // colonist hit points
    baseMood: 50,                   // neutral mood baseline before thoughts
    hungerMoodThreshold: 20,        // below this hunger level, mood penalty applies
    hungerMoodPenalty: -15,         // mood penalty when hungry
    restMoodThreshold: 20,          // below this rest level, mood penalty applies
    restMoodPenalty: -10,           // mood penalty when exhausted
    bedMoodBonus: 5,                // mood bonus for having an assigned bed
    sleepDuration: 30,              // ticks spent sleeping (without bed path)
    sleepAfterMoveDuration: 25,     // ticks sleeping after walking to bed
    restPerTick: 3,                 // rest recovered per sleep tick
    breakingWanderDuration: [30, 50], // ticks of aimless wandering when mood breaks
    wanderCooldown: [5, 15],        // tick range between idle wander attempts
    wanderChance: 0.3,              // probability of moving during wander state
    fightEngageDistance: 8,         // max distance to start fighting a hostile
    fleeHpThreshold: 20,           // flee when HP drops below this
    fleeDisengageDistance: 8,       // stop fleeing when threat is this far away
    hostileSearchRadius: 30,        // how far colonists scan for enemies
    socialRange: 3,                 // tile distance for socialite/loner trait checks
    skillWorkBonus: 0.15,           // work speed bonus per skill level (1 + skill * this)
    deconstructRecovery: 0.5,       // fraction of building cost returned on deconstruct
    combatDamageVariance: 3,        // random bonus damage range (0 to this-1)
    victoryMoodBonus: 5,            // mood bonus after killing an enemy
    victoryMoodDuration: 200,       // ticks the victory thought lasts
    cookedFoodRestore: 100,         // hunger restored by cooked food (full)
    rawFoodRestore: 35,             // hunger restored by raw foodstuff
    mealMoodBonus: 5,               // mood bonus from eating cooked food
    mealMoodDuration: 150,          // ticks the meal thought lasts
    rawFoodMoodPenalty: -4,         // mood penalty for eating raw food
    rawFoodMoodDuration: 100,       // ticks the raw food thought lasts
    starvingMoodPenalty: -20,       // mood penalty when no food available at all
    starvingMoodDuration: 100,
    sleptInRoomMoodBonus: 10,       // mood bonus for sleeping in bed inside a room
    sleptInRoomMoodDuration: 300,
    sleptInBedMoodBonus: 5,         // mood bonus for sleeping in bed (no room)
    sleptInBedMoodDuration: 200,
    sleptOnGroundMoodPenalty: -15,   // mood penalty for sleeping on the ground
    sleptOnGroundMoodDuration: 400,
    deathMoodPenalty: -40,           // mood penalty other colonists get when someone dies
    deathMoodDuration: 2000,         // how long grief lasts (ticks)
    nameColors: ['#ffff00', '#00ffff', '#00ff00'], // cycling colors for colonist names
    magicBiasChance: 0.3,           // probability a new colonist gets a magic school bias
};

// To add a magic school: add entry here. Colonists auto-get it, info panel shows it, spells reference it.
// baseLevel: starting range [min, max]. biasBonus: added when this is the colonist's magic bias.
export const MAGIC_SKILLS = {
    evocation:     { name: 'Evocation', baseLevel: [0, 0], biasBonus: 2, description: 'Ranged combat magic' },
    enchantment:   { name: 'Enchantment', baseLevel: [0, 0], biasBonus: 2, description: 'Support spells and golem animation' },
    abjuration:    { name: 'Abjuration', baseLevel: [0, 0], biasBonus: 2, description: 'Healing and protective magic' },
    conjuration:   { name: 'Conjuration', baseLevel: [0, 0], biasBonus: 2, description: 'Summoning and teleportation' },
    transmutation: { name: 'Transmutation', baseLevel: [0, 0], biasBonus: 2, description: 'Environmental and growth magic' },
    divination:    { name: 'Divination', baseLevel: [0, 0], biasBonus: 2, description: 'Predicting and influencing fate' },
};

// Mana system tuning. Max mana and regen scale with combined magic school levels.
export const MANA_CONFIG = {
    baseMana: 20,                   // every colonist starts with this max mana
    manaPerMagicLevel: 5,           // +5 max mana per combined magic school level
    baseRegen: 0.05,                // mana recovered per tick
    regenPerMagicLevel: 0.01,       // +0.01 regen per combined magic school level
    regenWhileIdle: 2.0,            // multiplier to regen when colonist is idle
    regenWhileSleeping: 3.0,        // multiplier to regen when sleeping
};

// How fast needs drain per tick. Applied every tick in colonist.js updateNeeds().
export const NEED_DECAY = {
    hunger: 0.25,               // hunger lost per tick (0-100 scale, ~400 ticks to starve)
    rest: 0.1,                  // rest lost per tick (0-100 scale, ~1000 ticks to exhaust)
};

// Mood level boundaries. Determines colonist behavior (breaking = mental break) and work speed.
export const MOOD_THRESHOLDS = {
    inspired: 75,               // above this: inspired (bonus speed)
    content: 40,                // above this: content (normal speed)
    stressed: 20,               // above this: stressed (reduced speed)
    breaking: 0,                // at or below: mental break (stops working, wanders)
};

// Work speed multipliers applied based on mood level. Used in colonist.js getWorkSpeed().
export const MOOD_SPEED_MULT = {
    inspired: 1.2,
    content: 1.0,
    stressed: 0.7,
    breaking: 0,                // can't work during mental break
};

export const COLONIST_NAMES = [
    'Ada', 'Bob', 'Cal', 'Dee', 'Eve', 'Finn', 'Gail', 'Hank',
    'Iris', 'Jake', 'Kit', 'Lena', 'Max', 'Nora', 'Otto', 'Pia',
    'Davis', 'Morgan', 'Hugh', 'Matt', 'Sam', 'Paul', 'Jim', 'Mia',
    'Quinn', 'Rex', 'Sage', 'Tara', 'Uma', 'Vex', 'Wren', 'Xia',
    'Perry', 'Harper', 'Jules', 'Kris', 'Liam', 'Noah', 'Owen',
];

// Task work amounts and miscellaneous work tuning. Used by farming, building, research, crafting, taming.
export const WORK_CONFIG = {
    plantWork: 5,                // ticks to plant a crop
    harvestWork: 8,              // ticks to harvest a crop
    researchWork: 25,            // ticks per research task cycle at research desk
    deconstructWork: 10,         // ticks to deconstruct a building
    tameWork: 20,                // ticks to tame an animal
    dangerousTameWork: 30,       // ticks to tame a dangerous animal (wolves)
    tameSkillChanceBonus: 0.06,  // +6% tame success per animals skill level
    poweredWorkbenchDivisor: 2,  // enchanting table divides craft time by this
    alchemyFoodBonus: 2,         // extra food per cook_meal when alchemy researched
    wealthPerWeapon: 10,         // wealth value added per weapon in stockpile (affects raid scaling)
    penWanderRadius: 3,          // max tiles a tamed animal wanders from its pen
    tamedMoveChance: 0.1,        // probability per tick a tamed animal moves
    guardPatrolRadius: 6,        // how far a guarding colonist patrols from their post
    guardEngageRadius: 10,       // how far they'll chase a threat before returning
    guardReturnThreshold: 12,    // distance at which they abandon chase and return to post
};

// Spell tome study tuning. Used by colonist.js when studying at a research desk with a tome equipped.
export const MAGIC_STUDY_CONFIG = {
    studyTicksPerProgress: 1,       // tome learning progress gained per study tick
    xpPerStudyTick: 0.05,           // magic school XP gained per study tick (level-up at 1.0 per level)
    xpPerCast: 0.02,                // magic school XP gained per successful spell cast
    researchPointsWhileStudying: 1, // research points still generated per study cycle while learning a tome
};

// Task reachability. When all colonists fail to path to a task this many times, auto-cancel it.
export const TASK_CONFIG = {
    unreachableFailThreshold: 3, // unique colonist failures before a task is deemed unreachable
    unreachableCheckInterval: 60, // ticks between reachability re-checks (avoids spam)
};

export const QUALITY_TIERS = [
    { key: 'poor', prefix: 'Crude', multiplier: 0.85, color: '#888888', baseChance: 0.20, perSkill: -0.03 },
    { key: 'normal', prefix: '', multiplier: 1.00, color: '#cccccc', baseChance: 0.60, perSkill: 0 },
    { key: 'fine', prefix: 'Fine', multiplier: 1.10, color: '#44cc44', baseChance: 0.15, perSkill: 0.02 },
    { key: 'superior', prefix: 'Superior', multiplier: 1.20, color: '#4488ff', baseChance: 0.05, perSkill: 0.01 },
];

export const SALVAGE_RATE = 0.5;

// Maps task types to the equipment stat property that provides a speed bonus.
// Used by colonist.js getEquipmentWorkBonus() to avoid hardcoded if/else chains.
export const TASK_SPEED_STATS = {
    mine: 'miningSpeed',
    chop: 'choppingSpeed',
    plant: 'farmingSpeed',
    harvest: 'farmingSpeed',
    craft: 'craftingSpeed',
    cook: 'craftingSpeed',
};

// ----------------------------------------------------------------------------
// Building & Crafting config
// ----------------------------------------------------------------------------

// To add a building: add an entry here. The game will pick it up automatically.
// Fields: char, color, cost, work, and optionally: hp, research, power, description.
// structureType: 'wall' | 'floor' | 'door' | 'furniture'. Drives room detection and placement mode.
// passable: { colonist, animal, enemy } — who can walk through. Defaults to all-true for furniture/floor.
// breakable: true if enemies will attack it when pathfinding. bg: background color for floor tiles.
// Power sub-object: { generates } or { consumes, radius?, warmRadius?, damage?, range? }
export const BUILD_CATEGORIES = ['Walls & Floors', 'Furniture', 'Production', 'Defense', 'Arcane'];

export const BUILDINGS = {
    wood_wall:         { char: '█', color: '#aa7744', cost: { wood: 2 }, work: 12, hp: 50, structureType: 'wall', category: 'Walls & Floors', passable: { colonist: false, animal: false, enemy: false }, breakable: true, description: 'Blocks movement. Forms rooms when enclosing an area with doors.' },
    stone_wall:        { char: '█', color: '#666666', cost: { stone: 2 }, work: 16, hp: 70, structureType: 'wall', category: 'Walls & Floors', passable: { colonist: false, animal: false, enemy: false }, breakable: true, description: 'Blocks movement. Forms rooms when enclosing an area with doors.' },
    brick_wall:        { char: '█', color: '#b2463c', cost: { bricks: 2 }, work: 20, hp: 90, structureType: 'wall', category: 'Walls & Floors', passable: { colonist: false, animal: false, enemy: false }, breakable: true, description: 'Blocks movement. Forms rooms when enclosing an area with doors.' },
    fence:             { char: '|', color: '#886644', cost: { wood: 1 }, work: 5, hp: 20, structureType: 'wall', category: 'Walls & Floors', passable: { colonist: false, animal: false, enemy: false }, breakable: true, description: 'Blocks movement like a wall but lighter to build.' },
    door:              { char: '+', color: '#cc9955', cost: { wood: 3 }, work: 15, hp: 30, structureType: 'door', category: 'Walls & Floors', passable: { colonist: true, animal: false, enemy: false }, breakable: true, description: 'Allows colonist passage. Blocks enemies. Room boundary.' },
    wood_floor:        { char: '·', color: '#aa7744', bg: '#3d2a14', cost: { wood: 1 }, work: 6, structureType: 'floor', category: 'Walls & Floors', description: 'Cosmetic flooring. Makes rooms nicer.' },
    stone_floor:       { char: '·', color: '#666666', bg: '#2a2a2a', cost: { stone: 1 }, work: 6, structureType: 'floor', category: 'Walls & Floors', description: 'Cosmetic flooring. Makes rooms nicer.' },
    brick_floor:       { char: '·', color: '#b2463c', bg: '#3a1a18', cost: { bricks: 1 }, work: 6, structureType: 'floor', category: 'Walls & Floors', description: 'Cosmetic flooring. Makes rooms nicer.' },
    torch:             { char: 'i', color: '#ffcc00', cost: { wood: 1 }, work: 4, structureType: 'furniture', category: 'Furniture', dragPlace: true, lightRadius: 5, description: 'Light source. Provides warmth in winter.' },
    bed:               { char: 'B', color: '#8855aa', cost: { wood: 5 }, work: 25, structureType: 'furniture', category: 'Furniture', description: 'Colonists sleep here. Assign for a mood bonus.' },
    food_chest:        { char: 'S', color: '#997744', cost: { planks: 4, stone: 2 }, work: 25, structureType: 'furniture', category: 'Furniture', description: 'Preserves food — reduces spoilage by 15% per chest (stacks up to 60%).' },
    workbench:         { char: 'C', color: '#bb8833', cost: { wood: 5, stone: 2 }, work: 30, structureType: 'furniture', category: 'Production', description: 'Required for crafting recipes (planks, weapons, bricks).' },
    cauldron:          { char: 'F', color: '#ff6633', cost: { stone: 3, wood: 1 }, work: 18, structureType: 'furniture', category: 'Production', description: 'Required for cooking meals from raw food and crops.' },
    research_desk:     { char: 'R', color: '#44aaff', cost: { wood: 5, stone: 3, planks: 2 }, work: 40, structureType: 'furniture', category: 'Production', description: 'Colonists study here to generate research points.' },
    beast_circle:      { char: 'A', color: '#9cf642', cost: { wood: 6 }, work: 28, structureType: 'furniture', category: 'Production', research: 'beast_binding', description: 'Required for binding creatures. Bound animals produce resources.' },
    void_nexus:        { char: 'V', color: '#9933ff', cost: { runite: 5, stone: 6, planks: 4 }, work: 60, structureType: 'furniture', category: 'Defense', passable: { colonist: false, animal: false, enemy: false }, research: 'void_summoning', maxCount: 1, description: 'Start wave defense here. Defend it from enemies to earn void essence.' },
    arcane_sentinel:   { char: 'X', color: '#ff4444', cost: { stone: 5, planks: 3 }, work: 50, structureType: 'furniture', category: 'Defense', passable: { colonist: false, animal: false, enemy: false }, research: 'warding', power: { consumes: 3, damage: 12, range: 4 }, description: 'Auto-attacks enemies in range 4, 12 dmg. Consumes 3 mana.' },
    void_wall:         { char: '▓', color: '#6622aa', cost: { stone: 3, void_essence: 3 }, work: 15, hp: 120, structureType: 'wall', category: 'Walls & Floors', passable: { colonist: false, animal: false, enemy: false }, breakable: true, research: 'void_forging', description: 'Reinforced wall (120 HP). Blocks enemies.' },
    void_turret:       { char: 'Y', color: '#aa33ff', cost: { stone: 5, planks: 3, void_essence: 6 }, work: 55, structureType: 'furniture', category: 'Defense', passable: { colonist: false, animal: false, enemy: false }, research: 'void_forging', power: { consumes: 5, damage: 20, range: 5 }, description: 'Auto-attacks enemies in range 5, 20 dmg. Consumes 5 mana.' },
    void_door:         { char: '▒', color: '#7733bb', cost: { stone: 3, planks: 2, void_essence: 4 }, work: 20, hp: 80, structureType: 'door', category: 'Walls & Floors', passable: { colonist: true, animal: false, enemy: false }, breakable: true, research: 'void_forging', description: 'Reinforced door (80 HP). Colonists pass through, enemies must break it.' },
    mana_crystal:      { char: 'W', color: '#aa44ff', cost: { wood: 8, stone: 4 }, work: 45, structureType: 'furniture', category: 'Arcane', passable: { colonist: false, animal: false, enemy: false }, research: 'ley_channeling', maxCount: 4, maxCountBonusKey: 'manaCrystalBonus', power: { generates: 10 }, description: 'Generates 10 mana for powering magical buildings. Limit: 4 (upgradeable).' },
    glowstone:         { char: 'L', color: '#ffff88', cost: { planks: 2, stone: 1 }, work: 14, structureType: 'furniture', category: 'Furniture', lightRadius: 10, research: 'luminance', power: { consumes: 2, radius: 5 }, description: 'Mana-powered light, radius 5. Consumes 2 mana.' },
    enchanting_table:  { char: 'P', color: '#bb88ff', cost: { planks: 4, stone: 3 }, work: 35, structureType: 'furniture', category: 'Production', research: 'arcane_infusion', power: { consumes: 4, speedMult: 2.0 }, description: '2x crafting speed. Consumes 4 mana.' },
    ember_ward:        { char: 'H', color: '#ff8844', cost: { stone: 4, planks: 2 }, work: 28, structureType: 'furniture', category: 'Arcane', research: 'ember_magic', power: { consumes: 3, warmRadius: 4 }, description: 'Warms nearby tiles (radius 4) in winter. Consumes 3 mana.' },
    ice_box:           { char: 'I', color: '#88ccff', cost: { runite: 2, stone: 4, planks: 2, void_essence: 2 }, work: 40, structureType: 'furniture', category: 'Furniture', research: 'alchemy', power: { consumes: 1 }, description: 'Magically chills food — reduces spoilage by 40%. Consumes 1 mana.' },
    rift_gate:         { char: 'Ω', color: '#33ccff', cost: { runite: 4, stone: 6, planks: 4, void_essence: 8 }, work: 60, structureType: 'furniture', category: 'Arcane', passable: { colonist: false, animal: false, enemy: false }, research: 'planar_rift', maxCount: 1, power: { consumes: 6 }, description: 'Send exploration parties to other realms. Consumes 6 mana.' },
    golem_forge:       { char: 'Ğ', color: '#cc8833', cost: { stone: 8, runite: 4, planks: 4 }, work: 50, structureType: 'furniture', category: 'Production', research: 'golem_craft', description: 'Animate stone golems. Click to craft.' },
    forge_core:        { char: '⚒', color: '#ff8844', cost: { stone: 6, runite: 3, planks: 3 }, work: 40, structureType: 'furniture', category: 'Arcane', research: 'masterwork', description: 'Core of the Great Forge. Surround with walls + door to activate (2.5x equipment crafting).' },
    ritual_core:       { char: '◎', color: '#aa44ff', cost: { runite: 5, void_essence: 3, planks: 4 }, work: 50, structureType: 'furniture', category: 'Arcane', research: 'advanced_arcana', description: 'Core of the Ritual Circle. Place altars around it to activate (-30% spell cooldowns).' },
    artifact_pedestal: { char: '◆', color: '#ccaa44', cost: { stone: 8, runite: 2 }, work: 35, structureType: 'furniture', category: 'Arcane', research: 'arcane_infusion', description: 'Place an artifact to project its effect in a radius. Mana cost varies by artifact.' },
    anvil:             { char: '⌂', color: '#999999', cost: { stone: 10, planks: 4 }, work: 30, structureType: 'furniture', category: 'Production', research: 'runeforging', description: 'Repair broken artifacts and equipment.' },
};

// Auto-derived from BUILDINGS (terrain chars/colors + building chars/colors merged)
export const TILE_CHARS = { ...BASE_TILE_CHARS, ...Object.fromEntries(Object.entries(BUILDINGS).map(([k, v]) => [k, v.char])) };
export const TILE_COLORS = { ...BASE_TILE_COLORS, ...Object.fromEntries(Object.entries(BUILDINGS).map(([k, v]) => [k, v.color])) };

// Auto-derived passability/behavior sets from BUILDINGS metadata.
// Structures impassable to colonists (passable.colonist === false)
export const IMPASSABLE_STRUCTURES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.passable && !b.passable.colonist).map(([k]) => k)
);
// Structures that block enemies (passable.enemy === false)
export const ENEMY_BLOCKED_STRUCTURES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.passable && !b.passable.enemy).map(([k]) => k)
);
// Structures that enemies will attack to break through
export const BREAKABLE_STRUCTURES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.breakable).map(([k]) => k)
);
// Walls and fences — used for room detection
export const WALL_STRUCTURES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.structureType === 'wall').map(([k]) => k)
);
// Doors — used for room detection boundaries
export const DOOR_STRUCTURES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.structureType === 'door').map(([k]) => k)
);
// Drag-placeable types (walls, floors, doors, plus anything with dragPlace: true)
export const DRAG_BUILD_TYPES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.structureType === 'wall' || b.structureType === 'floor' || b.structureType === 'door' || b.dragPlace).map(([k]) => k)
);
// Single-place types (furniture that isn't drag-placeable)
export const SINGLE_PLACE_TYPES = new Set(
    Object.entries(BUILDINGS).filter(([, b]) => b.structureType === 'furniture' && !b.dragPlace).map(([k]) => k)
);

export const COMPLEX_STRUCTURES = {
    great_forge: {
        name: 'Great Forge',
        research: 'masterwork',
        coreBuild: 'forge_core',
        layout: [
            { dx: -1, dy: -1, req: 'wall' }, { dx: 0, dy: -1, req: 'wall' }, { dx: 1, dy: -1, req: 'wall' },
            { dx: -1, dy: 0, req: 'wall' },  { dx: 1, dy: 0, req: 'wall' },
            { dx: -1, dy: 1, req: 'wall' },  { dx: 0, dy: 1, req: 'door' },  { dx: 1, dy: 1, req: 'wall' },
        ],
        effect: { craftSpeedMult: 2.5, craftCategory: 'Equipment' },
        description: '3x3 enclosed room with Forge Core at center. Walls on all sides, door on one. 2.5x equipment crafting speed.',
    },
    ritual_circle: {
        name: 'Ritual Circle',
        research: 'advanced_arcana',
        coreBuild: 'ritual_core',
        layout: [
            { dx: 0, dy: -2, req: 'wall' },
            { dx: -1, dy: -1, req: 'wall' }, { dx: 1, dy: -1, req: 'wall' },
            { dx: -2, dy: 0, req: 'wall' }, { dx: 2, dy: 0, req: 'wall' },
            { dx: -1, dy: 1, req: 'wall' }, { dx: 1, dy: 1, req: 'wall' },
            { dx: 0, dy: 2, req: 'wall' },
        ],
        effect: { spellCooldownMult: 0.7, radius: 6 },
        description: 'Diamond pattern (5x5) with Ritual Core at center. Walls at cardinal + diagonal positions. Reduces spell cooldowns by 30% in radius 6.',
    },
};

// To add a recipe: add entry here. Set 'research' field to gate behind tech.
// Station must exist as a buildable structure. Equipment outputs auto-detected from WEAPONS/ARMORS/TOOLS.
export const RECIPE_CATEGORIES = ['Materials', 'Equipment', 'Tools', 'Artifacts', 'Repair', 'Food & Potions', 'Tomes'];

export const RECIPES = {
    craft_planks: { input: { wood: 2 }, output: { planks: 3 }, skill: 'crafting', ticks: 10, station: 'workbench', category: 'Materials' },
    craft_bricks: { input: { stone: 2 }, output: { bricks: 3 }, skill: 'crafting', ticks: 12, station: 'workbench', category: 'Materials' },
    tan_leather: { input: { hides: 2 }, output: { leather: 2 }, skill: 'crafting', ticks: 10, station: 'workbench', category: 'Materials' },
    smelt_iron: { input: { iron_ore: 2 }, output: { iron: 2 }, skill: 'crafting', ticks: 12, station: 'workbench', category: 'Materials' },
    craft_stone_spear: { input: { stone: 2, wood: 1 }, output: { stone_spear: 1 }, skill: 'crafting', ticks: 12, station: 'workbench', category: 'Equipment' },
    craft_wooden_club: { input: { wood: 2, planks: 1 }, output: { wooden_club: 1 }, skill: 'crafting', ticks: 15, station: 'workbench', category: 'Equipment' },
    craft_hatchet: { input: { planks: 2, stone: 1 }, output: { hatchet: 1 }, skill: 'crafting', ticks: 16, station: 'workbench', category: 'Equipment' },
    craft_iron_sword: { input: { iron: 2, planks: 1 }, output: { iron_sword: 1 }, skill: 'crafting', ticks: 20, station: 'workbench', category: 'Equipment' },
    craft_iron_mace: { input: { iron: 3, planks: 1 }, output: { iron_mace: 1 }, skill: 'crafting', ticks: 24, station: 'workbench', research: 'runecraft', category: 'Equipment' },
    craft_etched_axe: { input: { stone: 2, planks: 1 }, output: { etched_axe: 1 }, skill: 'crafting', ticks: 22, station: 'workbench', research: 'runecraft', category: 'Equipment' },
    craft_enchanted_glaive: { input: { iron: 2, runite: 1, planks: 2 }, output: { enchanted_glaive: 1 }, skill: 'crafting', ticks: 38, station: 'workbench', research: 'mana_weaving', category: 'Equipment' },
    craft_runic_blade: { input: { runite: 2, planks: 1 }, output: { runic_blade: 1 }, skill: 'crafting', ticks: 40, station: 'workbench', research: 'runeforging', category: 'Equipment' },
    craft_runic_greatsword: { input: { runite: 4, iron: 2, planks: 2 }, output: { runic_greatsword: 1 }, skill: 'crafting', ticks: 50, station: 'workbench', research: 'masterwork', category: 'Equipment' },
    craft_void_dagger: { input: { void_essence: 3, runite: 1 }, output: { void_dagger: 1 }, skill: 'crafting', ticks: 45, station: 'workbench', research: 'advanced_arcana', category: 'Equipment' },
    craft_void_blade: { input: { void_essence: 6, runite: 2, planks: 1 }, output: { void_blade: 1 }, skill: 'crafting', ticks: 60, station: 'workbench', research: 'void_forging', category: 'Equipment' },
    craft_iron_brigandine: { input: { iron: 2 }, output: { iron_brigandine: 1 }, skill: 'crafting', ticks: 14, station: 'workbench', category: 'Equipment' },
    craft_leather_vest: { input: { leather: 3 }, output: { leather_vest: 1 }, skill: 'crafting', ticks: 18, station: 'workbench', category: 'Equipment' },
    craft_iron_chainmail: { input: { iron: 4, leather: 2 }, output: { iron_chainmail: 1 }, skill: 'crafting', ticks: 30, station: 'workbench', category: 'Equipment' },
    craft_mana_weave_robe: { input: { runite: 2, leather: 2, iron: 1 }, output: { mana_weave_robe: 1 }, skill: 'crafting', ticks: 40, station: 'workbench', research: 'mana_weaving', category: 'Equipment' },
    craft_runic_plate: { input: { runite: 3, iron: 2, leather: 1 }, output: { runic_plate: 1 }, skill: 'crafting', ticks: 45, station: 'workbench', research: 'runeforging', category: 'Equipment' },
    craft_void_armor: { input: { void_essence: 5, bricks: 2, planks: 1 }, output: { void_armor: 1 }, skill: 'crafting', ticks: 55, station: 'workbench', research: 'void_forging', category: 'Equipment' },
    // Helmets
    craft_leather_cap: { input: { leather: 2 }, output: { leather_cap: 1 }, skill: 'crafting', ticks: 12, station: 'workbench', category: 'Equipment' },
    craft_iron_helmet: { input: { iron: 3 }, output: { iron_helmet: 1 }, skill: 'crafting', ticks: 18, station: 'workbench', category: 'Equipment' },
    craft_runic_helm: { input: { runite: 2, iron: 1 }, output: { runic_helm: 1 }, skill: 'crafting', ticks: 35, station: 'workbench', research: 'runeforging', category: 'Equipment' },
    craft_void_crown: { input: { void_essence: 4, runite: 1 }, output: { void_crown: 1 }, skill: 'crafting', ticks: 50, station: 'workbench', research: 'void_forging', category: 'Equipment' },
    // Pickaxes
    craft_stone_pickaxe: { input: { stone: 2, planks: 1 }, output: { stone_pickaxe: 1 }, skill: 'crafting', ticks: 14, station: 'workbench', category: 'Tools' },
    craft_iron_pickaxe: { input: { iron: 2, planks: 1 }, output: { iron_pickaxe: 1 }, skill: 'crafting', ticks: 20, station: 'workbench', category: 'Tools' },
    craft_runic_pickaxe: { input: { runite: 2, planks: 1 }, output: { runic_pickaxe: 1 }, skill: 'crafting', ticks: 35, station: 'workbench', research: 'runeforging', category: 'Tools' },
    // Axes
    craft_stone_axe: { input: { stone: 2, planks: 1 }, output: { stone_axe: 1 }, skill: 'crafting', ticks: 14, station: 'workbench', category: 'Tools' },
    craft_iron_axe: { input: { iron: 2, planks: 1 }, output: { iron_axe: 1 }, skill: 'crafting', ticks: 20, station: 'workbench', category: 'Tools' },
    craft_runic_axe: { input: { runite: 2, planks: 1 }, output: { runic_axe: 1 }, skill: 'crafting', ticks: 35, station: 'workbench', research: 'runeforging', category: 'Tools' },
    // Sickles
    craft_stone_sickle: { input: { stone: 1, planks: 1 }, output: { stone_sickle: 1 }, skill: 'crafting', ticks: 12, station: 'workbench', category: 'Tools' },
    craft_iron_sickle: { input: { iron: 1, planks: 1 }, output: { iron_sickle: 1 }, skill: 'crafting', ticks: 18, station: 'workbench', category: 'Tools' },
    craft_runic_sickle: { input: { runite: 1, planks: 1 }, output: { runic_sickle: 1 }, skill: 'crafting', ticks: 30, station: 'workbench', research: 'runeforging', category: 'Tools' },
    // Hammers (crafting speed)
    craft_stone_hammer: { input: { stone: 2, planks: 1 }, output: { stone_hammer: 1 }, skill: 'crafting', ticks: 14, station: 'workbench', category: 'Tools' },
    craft_iron_hammer: { input: { iron: 2, planks: 1 }, output: { iron_hammer: 1 }, skill: 'crafting', ticks: 20, station: 'workbench', category: 'Tools' },
    craft_runic_hammer: { input: { runite: 2, planks: 1 }, output: { runic_hammer: 1 }, skill: 'crafting', ticks: 35, station: 'workbench', research: 'runeforging', category: 'Tools' },
    // Mattocks (multi-purpose)
    craft_stone_mattock: { input: { stone: 3, planks: 2 }, output: { stone_mattock: 1 }, skill: 'crafting', ticks: 18, station: 'workbench', category: 'Tools' },
    craft_iron_mattock: { input: { iron: 3, planks: 2 }, output: { iron_mattock: 1 }, skill: 'crafting', ticks: 26, station: 'workbench', category: 'Tools' },
    craft_runic_mattock: { input: { runite: 3, planks: 2 }, output: { runic_mattock: 1 }, skill: 'crafting', ticks: 40, station: 'workbench', research: 'runeforging', category: 'Tools' },
    craft_wooden_wand: { input: { wood: 3, planks: 1 }, output: { wooden_wand: 1 }, skill: 'crafting', ticks: 12, station: 'workbench', research: 'arcane_studies', category: 'Equipment' },
    craft_crystal_staff: { input: { stone: 3, planks: 2, runite: 1 }, output: { crystal_staff: 1 }, skill: 'crafting', ticks: 28, station: 'workbench', research: 'arcane_studies', category: 'Equipment' },
    craft_runic_wand: { input: { runite: 2, planks: 2 }, output: { runic_wand: 1 }, skill: 'crafting', ticks: 35, station: 'workbench', research: 'advanced_arcana', category: 'Equipment' },
    craft_void_staff: { input: { void_essence: 5, runite: 2, planks: 2 }, output: { void_staff: 1 }, skill: 'crafting', ticks: 55, station: 'workbench', research: 'advanced_arcana', category: 'Equipment' },
    craft_boots_of_haste: { input: { void_essence: 3, planks: 2, runite: 1 }, output: { boots_of_haste: 1 }, skill: 'crafting', ticks: 55, station: 'workbench', research: 'void_forging', category: 'Artifacts' },
    craft_ward_of_the_sentinel: { input: { void_essence: 4, runite: 3, stone: 2 }, output: { ward_of_the_sentinel: 1 }, skill: 'crafting', ticks: 65, station: 'workbench', research: 'void_forging', category: 'Artifacts' },
    craft_drum_of_rallying: { input: { wood: 6, runite: 2, planks: 3 }, output: { drum_of_rallying: 1 }, skill: 'crafting', ticks: 45, station: 'workbench', research: 'runeforging', category: 'Artifacts' },
    repair_artifact: { input: { runite: 1 }, output: {}, skill: 'crafting', ticks: 40, station: 'anvil', category: 'Repair', special: 'repair' },
    brew_health_potion: { input: { berries: 3, wheat: 1 }, output: { health_potion: 1 }, skill: 'cooking', ticks: 16, station: 'cauldron', research: 'alchemy', category: 'Food & Potions' },
    brew_speed_potion: { input: { corn: 2, potatoes: 2, berries: 1 }, output: { speed_potion: 1 }, skill: 'cooking', ticks: 20, station: 'cauldron', research: 'alchemy', category: 'Food & Potions' },
    cook_meal: { input: { foodstuffs: 5 }, output: { food: 4 }, skill: 'cooking', ticks: 8, station: 'cauldron', category: 'Food & Potions' },
    craft_tome_spark: { input: { planks: 2, stone: 1 }, output: { tome_spark: 1 }, skill: 'crafting', ticks: 12, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_mend: { input: { planks: 2, berries: 2 }, output: { tome_mend: 1 }, skill: 'crafting', ticks: 12, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_quicken: { input: { planks: 2, stone: 1 }, output: { tome_quicken: 1 }, skill: 'crafting', ticks: 12, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_phase_step: { input: { planks: 2, stone: 1 }, output: { tome_phase_step: 1 }, skill: 'crafting', ticks: 12, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_nurture: { input: { planks: 2, wheat: 2 }, output: { tome_nurture: 1 }, skill: 'crafting', ticks: 12, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_magic_missile: { input: { planks: 3, runite: 1 }, output: { tome_magic_missile: 1 }, skill: 'crafting', ticks: 30, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_heal: { input: { planks: 3, runite: 1, berries: 2 }, output: { tome_heal: 1 }, skill: 'crafting', ticks: 32, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_haste: { input: { planks: 4, runite: 2 }, output: { tome_haste: 1 }, skill: 'crafting', ticks: 38, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_warp: { input: { planks: 4, runite: 2, void_essence: 1 }, output: { tome_warp: 1 }, skill: 'crafting', ticks: 38, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_fireball: { input: { planks: 5, runite: 3, void_essence: 2 }, output: { tome_fireball: 1 }, skill: 'crafting', ticks: 50, station: 'enchanting_table', research: 'advanced_arcana', category: 'Tomes' },
    craft_tome_shield: { input: { planks: 4, runite: 3, stone: 3 }, output: { tome_shield: 1 }, skill: 'crafting', ticks: 45, station: 'enchanting_table', research: 'advanced_arcana', category: 'Tomes' },
    craft_tome_summon_familiar: { input: { planks: 5, runite: 3, void_essence: 3 }, output: { tome_summon_familiar: 1 }, skill: 'crafting', ticks: 55, station: 'enchanting_table', research: 'advanced_arcana', category: 'Tomes' },
    craft_tome_circle_of_growth: { input: { planks: 4, runite: 2, wheat: 3 }, output: { tome_circle_of_growth: 1 }, skill: 'crafting', ticks: 40, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_level_field: { input: { planks: 5, runite: 4, void_essence: 3 }, output: { tome_level_field: 1 }, skill: 'crafting', ticks: 60, station: 'enchanting_table', research: 'advanced_arcana', category: 'Tomes' },
    craft_tome_foresight: { input: { planks: 2, berries: 1 }, output: { tome_foresight: 1 }, skill: 'crafting', ticks: 12, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_fair_winds: { input: { planks: 3, runite: 1 }, output: { tome_fair_winds: 1 }, skill: 'crafting', ticks: 20, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_merchants_omen: { input: { planks: 4, runite: 2 }, output: { tome_merchants_omen: 1 }, skill: 'crafting', ticks: 25, station: 'enchanting_table', research: 'arcane_studies', category: 'Tomes' },
    craft_tome_ward_of_calamity: { input: { planks: 5, runite: 3, void_essence: 2 }, output: { tome_ward_of_calamity: 1 }, skill: 'crafting', ticks: 50, station: 'enchanting_table', research: 'advanced_arcana', category: 'Tomes' },
    craft_tome_fortunate_discovery: { input: { planks: 5, runite: 4, void_essence: 3 }, output: { tome_fortunate_discovery: 1 }, skill: 'crafting', ticks: 60, station: 'enchanting_table', research: 'advanced_arcana', category: 'Tomes' },
};

// To add a weapon: add entry here + a recipe with output: { <key>: 1 }. Auto-detected on craft.
// Optional stat bonuses: miningSpeed, choppingSpeed, farmingSpeed (multipliers applied during those tasks).
export const WEAPONS = {
    fists: { name: 'Fists', damage: 5 },
    stone_spear: { name: 'Stone Spear', damage: 8 },
    wooden_club: { name: 'Wooden Club', damage: 10 },
    hatchet: { name: 'Hatchet', damage: 12, choppingSpeed: 1.2 },
    iron_sword: { name: 'Iron Sword', damage: 14 },
    etched_axe: { name: 'Etched Axe', damage: 15 },
    iron_mace: { name: 'Iron Mace', damage: 16, miningSpeed: 1.2 },
    enchanted_glaive: { name: 'Enchanted Glaive', damage: 18, spellDamageBonus: 0.25 },
    void_dagger: { name: 'Void Dagger', damage: 20, spellDamageBonus: 0.35 },
    runic_blade: { name: 'Runic Blade', damage: 22 },
    runic_greatsword: { name: 'Runic Greatsword', damage: 26 },
    wooden_wand: { name: 'Wooden Wand', damage: 3, spellDamageBonus: 0.3 },
    crystal_staff: { name: 'Crystal Staff', damage: 8, spellDamageBonus: 0.2 },
    runic_wand: { name: 'Runic Wand', damage: 5, spellDamageBonus: 0.5 },
    void_staff: { name: 'Void Staff', damage: 12, spellDamageBonus: 0.4 },
    void_blade: { name: 'Void Blade', damage: 30 },
};

// To add armor: add entry here + a recipe with output: { <key>: 1 }. Auto-detected on craft.
export const ARMORS = {
    iron_brigandine: { name: 'Iron Brigandine', damageReduction: 0.08 },
    leather_vest: { name: 'Leather Vest', damageReduction: 0.10 },
    mana_weave_robe: { name: 'Mana-Weave Robe', damageReduction: 0.15, spellDamageBonus: 0.15 },
    iron_chainmail: { name: 'Iron Chainmail', damageReduction: 0.18 },
    runic_plate: { name: 'Runic Plate', damageReduction: 0.24 },
    void_armor: { name: 'Void Armor', damageReduction: 0.3 },
};

// To add a helmet: add entry here + a recipe with output: { <key>: 1 }. Auto-detected on craft.
// Helmet DR stacks multiplicatively with body armor DR.
export const HELMETS = {
    leather_cap: { name: 'Leather Cap', damageReduction: 0.05 },
    iron_helmet: { name: 'Iron Helmet', damageReduction: 0.10 },
    runic_helm: { name: 'Runic Helm', damageReduction: 0.14 },
    void_crown: { name: 'Void Crown', damageReduction: 0.18, spellDamageBonus: 0.10 },
};

// To add a tool: add entry here + a recipe with output: { <key>: 1 }. Equipped in a separate slot from weapons.
// Stat bonuses stack with weapon bonuses. moveSpeedBonus: reduces move cooldown (fraction, e.g. 0.3 = 30% faster).
export const TOOLS = {
    // Pickaxes — mining specialist
    stone_pickaxe: { name: 'Stone Pickaxe', miningSpeed: 1.25 },
    iron_pickaxe: { name: 'Iron Pickaxe', miningSpeed: 1.45 },
    runic_pickaxe: { name: 'Runic Pickaxe', miningSpeed: 1.7 },
    // Axes — chopping specialist
    stone_axe: { name: 'Stone Axe', choppingSpeed: 1.25 },
    iron_axe: { name: 'Iron Axe', choppingSpeed: 1.45 },
    runic_axe: { name: 'Runic Axe', choppingSpeed: 1.7 },
    // Sickles — farming specialist
    stone_sickle: { name: 'Stone Sickle', farmingSpeed: 1.25 },
    iron_sickle: { name: 'Iron Sickle', farmingSpeed: 1.45 },
    runic_sickle: { name: 'Runic Sickle', farmingSpeed: 1.7 },
    // Hammers — crafting speed specialist
    stone_hammer: { name: 'Stone Hammer', craftingSpeed: 1.25 },
    iron_hammer: { name: 'Iron Hammer', craftingSpeed: 1.45 },
    runic_hammer: { name: 'Runic Hammer', craftingSpeed: 1.7 },
    // Mattocks — multi-purpose (mining + chopping, weaker than specialists)
    stone_mattock: { name: 'Stone Mattock', miningSpeed: 1.15, choppingSpeed: 1.15 },
    iron_mattock: { name: 'Iron Mattock', miningSpeed: 1.3, choppingSpeed: 1.3 },
    runic_mattock: { name: 'Runic Mattock', miningSpeed: 1.5, choppingSpeed: 1.5 },
};

// To add an artifact: add entry here + a recipe with output: { <key>: 1 }. Equipped in a dedicated artifact slot.
// Artifacts are magical items with unique effects. Stat bonuses stack with weapon/tool bonuses.
// Effect fields (all optional, data-driven — runtime reads these generically):
//   moveSpeedBonus: flat addition to move speed (equipped)
//   workSpeedBonus: flat addition to work speed multiplier (equipped)
//   pedestal: { radius, manaCost, ...effects } — placed on pedestal building, applies in radius
//     radius: number (Manhattan distance) or 'global' (colony-wide, no distance check)
//     effects: blightImmunity, workSpeedBonus, damageBonusMult, lightRadius, skillGrowthBonus,
//              wandererChanceMult, cookingBonusFood, tradeMarkupMult
//   combat: { targetPriority, autoReviveHp, damageReduction } — applies during raids + waves (equipped)
//   expedition: { lootMult, trapDamageMult, rareEncounterMult, partyDamageMult, durationMult, targetPriority, autoReviveHp, damageReduction }
//   durability: { max, breakOnUse } — item breaks after triggered N times, needs anvil repair
//   consumable: true — destroyed after one use
export const ARTIFACTS = {
    boots_of_haste: { name: 'Boots of Haste', moveSpeedBonus: 0.3 },
    seedkeepers_locket: {
        name: "Seedkeeper's Locket",
        pedestal: { radius: 5, manaCost: 1, blightImmunity: true },
        expedition: { trapDamageMult: 0.7 },
    },
    hourglass_of_diligence: {
        name: 'Hourglass of Diligence',
        workSpeedBonus: 0.25,
        pedestal: { radius: 4, manaCost: 2, workSpeedBonus: 0.15 },
    },
    lodestone_of_prosperity: {
        name: 'Lodestone of Prosperity',
        pedestal: { radius: 'global', manaCost: 2, wandererChanceMult: 1.5 },
    },
    cornucopia_charm: {
        name: 'Cornucopia Charm',
        pedestal: { radius: 'global', manaCost: 1, cookingBonusFood: 1 },
    },
    compass_of_greed: {
        name: 'Compass of Greed',
        expedition: { lootMult: 1.5, trapDamageMult: 1.2 },
    },
    voidwalkers_lantern: {
        name: "Voidwalker's Lantern",
        expedition: { rareEncounterMult: 2.0 },
        pedestal: { radius: 6, manaCost: 2, lightRadius: 4 },
    },
    map_fragment: {
        name: 'Map Fragment',
        consumable: true,
        expedition: { durationMult: 0.7 },
    },
    ward_of_the_sentinel: {
        name: 'Ward of the Sentinel',
        combat: { autoReviveHp: 0.5 },
        expedition: { autoReviveHp: 0.5 },
        durability: { max: 1, breakOnUse: true },
    },
    drum_of_rallying: {
        name: 'Drum of Rallying',
        pedestal: { radius: 8, manaCost: 3, damageBonusMult: 1.15 },
        expedition: { partyDamageMult: 1.15 },
    },
    cloak_of_shadows: {
        name: 'Cloak of Shadows',
        combat: { targetPriority: -10 },
        expedition: { targetPriority: -10 },
    },
    aegis_of_the_vanguard: {
        name: 'Aegis of the Vanguard',
        combat: { targetPriority: 10, damageReduction: 0.3 },
        expedition: { targetPriority: 10, damageReduction: 0.3 },
    },
    hagglers_coin: {
        name: "Haggler's Coin",
        pedestal: { radius: 'global', manaCost: 1, tradeMarkupMult: 0.85 },
    },
    tome_of_shared_wisdom: {
        name: 'Tome of Shared Wisdom',
        pedestal: { radius: 5, manaCost: 2, skillGrowthBonus: 0.1 },
    },
};

// To add a potion: add entry here + a recipe. Colonists auto-use potions from stockpile when conditions are met.
// trigger: condition function name (checked in colonist update). cooldown: min ticks between uses per colonist.
// effect: what happens on use. duration: for timed effects, how long they last.
export const POTIONS = {
    health_potion: {
        name: 'Health Potion',
        trigger: 'lowHealth',         // used when HP < hpThreshold
        hpThreshold: 0.4,             // fraction of maxHp
        effect: 'heal',
        healAmount: 50,               // HP restored
        cooldown: 200,                // ticks between uses
    },
    speed_potion: {
        name: 'Speed Potion',
        trigger: 'hasTask',           // used when colonist has a task and is moving/working
        effect: 'speed',
        moveSpeedBonus: 0.5,          // 50% faster movement
        workSpeedBonus: 1.3,          // 30% faster work
        duration: 100,                // ticks the effect lasts
        cooldown: 400,                // ticks between uses
    },
};

// ASCII display characters for item categories. Used in inventory/equipment/craft displays when no skin sprite is active.
// Each category maps to { char, color }. Individual items can override with their own 'char' and 'charColor' fields.
export const ITEM_CHARS = {
    weapon: { char: '/', color: '#cccccc' },
    armor: { char: '[', color: '#6688cc' },
    helmet: { char: '^', color: '#7799cc' },
    tool: { char: '\\', color: '#bb8844' },
    artifact: { char: '*', color: '#cc44ff' },
    potion: { char: '!', color: '#44cc44' },
    tome: { char: '~', color: '#4488ff' },
};

// Raw food ingredients usable in cooking. Add new ones here rather than in resources.js.
export const FOODSTUFFS = ['wheat', 'berries', 'corn', 'potatoes', 'meat', 'eggs', 'milk'];

// Food spoilage system. Percentage of stockpile lost per decay interval, modulated by item type,
// season, and storage buildings. Cooking uses fast-rotting food first (sorted by decayMultipliers).
export const FOOD_DECAY_CONFIG = {
    decayInterval: 50,
    baseDecayRate: 0.02,
    decayMultipliers: {
        milk: 2.5,
        berries: 2.0,
        meat: 1.8,
        eggs: 1.5,
        potatoes: 0.7,
        corn: 0.6,
        wheat: 0.5,
        food: 0.3,
    },
    seasonDecayMult: {
        spring: 1.0,
        summer: 1.5,
        autumn: 1.0,
        winter: 0.5,
    },
    foodChestReduction: 0.15,
    foodChestMaxReduction: 0.6,
    iceBoxReduction: 0.4,
    maxTotalReduction: 0.9,
};

// To add a crop: add entry here, it auto-appears in zone mode. Set 'research' to gate behind tech.
export const CROPS = {
    wheat: { growthTicks: 200, harvestYield: 3, seasons: ['spring', 'summer', 'autumn'], char: '%', readyChar: '⌂', color: '#ccaa00' },
    berries: { growthTicks: 150, harvestYield: 2, seasons: ['spring', 'summer', 'autumn'], char: '♣', readyChar: '●', color: '#cc44aa' },
    corn: { growthTicks: 250, harvestYield: 4, seasons: ['summer'], char: '↑', readyChar: '⌠', color: '#ffcc00', research: 'druidcraft' },
    potatoes: { growthTicks: 180, harvestYield: 3, seasons: ['spring', 'autumn', 'winter'], char: '~', readyChar: '◘', color: '#aa7744', research: 'druidcraft' },
};

// ----------------------------------------------------------------------------
// Spells & Research config
// ----------------------------------------------------------------------------

// To add a spell: add entry here. castType determines auto vs player-targeted behavior.
// Triggers (for auto-cast): 'inCombat', 'hasTask', 'lowHealth', 'allyLowHealth', 'always'.
// castType: 'auto' = colonist decides when to cast. 'targeted' = player clicks map tile.
export const SPELLS = {
    spark: {
        name: 'Spark',
        school: 'evocation',
        minLevel: 0,
        manaCost: 4,
        cooldown: 25,
        castType: 'auto',
        trigger: 'inCombat',
        effect: 'ranged_damage',
        damage: 6,
        range: 4,
        projectileColor: '#ffaa33',
        projectileChar: '.',
    },
    mend: {
        name: 'Mend',
        school: 'abjuration',
        minLevel: 0,
        manaCost: 5,
        cooldown: 60,
        castType: 'auto',
        trigger: 'lowHealth',
        effect: 'heal',
        healAmount: 8,
        targetSelf: true,
    },
    quicken: {
        name: 'Quicken',
        school: 'enchantment',
        minLevel: 0,
        manaCost: 6,
        cooldown: 80,
        castType: 'auto',
        trigger: 'hasTask',
        effect: 'buff_speed',
        moveSpeedBonus: 0,
        workSpeedBonus: 1.2,
        duration: 40,
    },
    phase_step: {
        name: 'Phase Step',
        school: 'conjuration',
        minLevel: 0,
        manaCost: 6,
        cooldown: 50,
        castType: 'auto',
        trigger: 'inCombat',
        effect: 'buff_speed',
        moveSpeedBonus: 2,
        workSpeedBonus: 1.0,
        duration: 20,
    },
    nurture: {
        name: 'Nurture',
        school: 'transmutation',
        minLevel: 0,
        manaCost: 8,
        cooldown: 200,
        castType: 'targeted',
        effect: 'boost_crops',
        range: 5,
        radius: 1,
        growthMult: 1.5,
        duration: 100,
    },
    magic_missile: {
        name: 'Magic Missile',
        school: 'evocation',
        minLevel: 1,
        manaCost: 8,
        cooldown: 30,
        castType: 'auto',
        trigger: 'inCombat',
        effect: 'ranged_damage',
        damage: 15,
        range: 6,
        projectileColor: '#ff44ff',
        projectileChar: '*',
    },
    fireball: {
        name: 'Fireball',
        school: 'evocation',
        minLevel: 3,
        manaCost: 18,
        cooldown: 60,
        castType: 'auto',
        trigger: 'inCombat',
        effect: 'ranged_damage_aoe',
        damage: 12,
        range: 7,
        radius: 2,
        projectileColor: '#ff6600',
        projectileChar: '●',
    },
    haste: {
        name: 'Haste',
        school: 'enchantment',
        minLevel: 2,
        manaCost: 12,
        cooldown: 200,
        castType: 'auto',
        trigger: 'hasTask',
        effect: 'buff_speed',
        moveSpeedBonus: 0.4,
        workSpeedBonus: 1.2,
        duration: 80,
        idleExclude: true,
    },
    heal: {
        name: 'Heal',
        school: 'abjuration',
        minLevel: 1,
        manaCost: 10,
        cooldown: 60,
        castType: 'auto',
        trigger: 'lowHealth',
        hpThreshold: 0.5,
        effect: 'heal',
        healAmount: 30,
        targetSelf: true,
    },
    shield: {
        name: 'Shield',
        school: 'abjuration',
        minLevel: 3,
        manaCost: 15,
        cooldown: 150,
        castType: 'auto',
        trigger: 'inCombat',
        effect: 'buff_defense',
        damageReduction: 0.3,
        duration: 60,
    },
    warp: {
        name: 'Warp',
        school: 'conjuration',
        minLevel: 2,
        manaCost: 15,
        cooldown: 100,
        castType: 'targeted',
        effect: 'teleport',
        range: 20,
    },
    summon_familiar: {
        name: 'Summon Familiar',
        school: 'conjuration',
        minLevel: 3,
        manaCost: 25,
        cooldown: 400,
        castType: 'auto',
        trigger: 'inCombat',
        effect: 'summon',
        summonHp: 40,
        summonDamage: 8,
        summonDuration: 80,
        summonChar: 'f',
        summonColor: '#9966ff',
    },
    circle_of_growth: {
        name: 'Circle of Growth',
        school: 'transmutation',
        minLevel: 2,
        manaCost: 20,
        cooldown: 400,
        castType: 'targeted',
        effect: 'boost_crops',
        range: 10,
        radius: 3,
        growthMult: 2.0,
        duration: 200,
    },
    level_field: {
        name: 'Level Field',
        school: 'transmutation',
        minLevel: 4,
        manaCost: 30,
        cooldown: 600,
        castType: 'targeted',
        effect: 'terraform',
        range: 8,
        radius: 3,
        targetTerrain: 'grass',
    },
    foresight: {
        name: 'Foresight',
        school: 'divination',
        minLevel: 0,
        manaCost: 6,
        cooldown: 300,
        castType: 'auto',
        trigger: 'always',
        effect: 'divination_modifier',
        modifiers: { raidDelay: 200 },
        duration: 300,
    },
    fair_winds: {
        name: 'Fair Winds',
        school: 'divination',
        minLevel: 1,
        manaCost: 10,
        cooldown: 400,
        castType: 'auto',
        trigger: 'always',
        effect: 'divination_modifier',
        modifiers: { weatherBias: 'clear' },
        duration: 200,
    },
    merchants_omen: {
        name: "Merchant's Omen",
        school: 'divination',
        minLevel: 2,
        manaCost: 15,
        cooldown: 600,
        castType: 'auto',
        trigger: 'always',
        effect: 'divination_modifier',
        modifiers: { eventBoost: 'caravan', eventMult: 3.0 },
        duration: 400,
    },
    ward_of_calamity: {
        name: 'Ward of Calamity',
        school: 'divination',
        minLevel: 3,
        manaCost: 20,
        cooldown: 800,
        castType: 'auto',
        trigger: 'always',
        effect: 'divination_modifier',
        modifiers: { suppressEvents: ['blight', 'cold_snap', 'fire'] },
        duration: 500,
    },
    fortunate_discovery: {
        name: 'Fortunate Discovery',
        school: 'divination',
        minLevel: 4,
        manaCost: 25,
        cooldown: 1000,
        castType: 'auto',
        trigger: 'always',
        effect: 'divination_modifier',
        modifiers: { eventBoost: 'meteorite', eventMult: 5.0 },
        duration: 600,
    },
};

// To add a spell tome: add entry here + a recipe or loot source. Colonists study tomes at research desks.
// learningWork: ticks of study required. minSchoolLevel: minimum magic school level to begin studying.
export const SPELL_TOMES = {
    tome_spark: { name: 'Tome: Spark', spell: 'spark', learningWork: 60, minSchoolLevel: 0 },
    tome_mend: { name: 'Tome: Mend', spell: 'mend', learningWork: 60, minSchoolLevel: 0 },
    tome_quicken: { name: 'Tome: Quicken', spell: 'quicken', learningWork: 60, minSchoolLevel: 0 },
    tome_phase_step: { name: 'Tome: Phase Step', spell: 'phase_step', learningWork: 60, minSchoolLevel: 0 },
    tome_nurture: { name: 'Tome: Nurture', spell: 'nurture', learningWork: 60, minSchoolLevel: 0 },
    tome_magic_missile: { name: 'Tome: Magic Missile', spell: 'magic_missile', learningWork: 150, minSchoolLevel: 1 },
    tome_fireball: { name: 'Tome: Fireball', spell: 'fireball', learningWork: 350, minSchoolLevel: 3 },
    tome_haste: { name: 'Tome: Haste', spell: 'haste', learningWork: 280, minSchoolLevel: 2 },
    tome_heal: { name: 'Tome: Heal', spell: 'heal', learningWork: 180, minSchoolLevel: 1 },
    tome_shield: { name: 'Tome: Shield', spell: 'shield', learningWork: 320, minSchoolLevel: 3 },
    tome_warp: { name: 'Tome: Warp', spell: 'warp', learningWork: 230, minSchoolLevel: 2 },
    tome_summon_familiar: { name: 'Tome: Summon Familiar', spell: 'summon_familiar', learningWork: 380, minSchoolLevel: 3 },
    tome_circle_of_growth: { name: 'Tome: Circle of Growth', spell: 'circle_of_growth', learningWork: 240, minSchoolLevel: 2 },
    tome_level_field: { name: 'Tome: Level Field', spell: 'level_field', learningWork: 440, minSchoolLevel: 4 },
    tome_foresight: { name: 'Tome: Foresight', spell: 'foresight', learningWork: 60, minSchoolLevel: 0 },
    tome_fair_winds: { name: 'Tome: Fair Winds', spell: 'fair_winds', learningWork: 150, minSchoolLevel: 1 },
    tome_merchants_omen: { name: "Tome: Merchant's Omen", spell: 'merchants_omen', learningWork: 240, minSchoolLevel: 2 },
    tome_ward_of_calamity: { name: 'Tome: Ward of Calamity', spell: 'ward_of_calamity', learningWork: 350, minSchoolLevel: 3 },
    tome_fortunate_discovery: { name: 'Tome: Fortunate Discovery', spell: 'fortunate_discovery', learningWork: 440, minSchoolLevel: 4 },
};

// To add research: add entry here with requires:[] for prerequisites.
// Buildings, recipes, and crops gate themselves via their own 'research' field — no need to list them here.
// The 'unlocks' object is auto-derived below from those fields.
export const RESEARCH_TABS = [
    { key: 'foundations', name: 'Foundations & Nature' },
    { key: 'arcane', name: 'Arcane & Mana' },
    { key: 'crafting', name: 'Crafting & Lore' },
    { key: 'void', name: 'Void & Exploration' },
];

export const RESEARCH = {
    runecraft: { name: 'Runecraft', cost: 50, requires: [], tab: 'foundations', description: 'Etch runes into stone weapons' },
    druidcraft: { name: 'Druidcraft', cost: 80, requires: [], tab: 'foundations', description: 'Unlock corn and potatoes' },
    alchemy: { name: 'Alchemy', cost: 60, requires: [], tab: 'foundations', description: 'Cooking produces +2 bonus food per meal' },
    beast_binding: { name: 'Beast Binding', cost: 140, requires: ['druidcraft'], tab: 'foundations', description: 'Bind and pen creatures' },
    verdant_growth: { name: 'Verdant Growth', cost: 250, requires: ['beast_binding', 'alchemy'], tab: 'foundations', description: 'Grow rare herbs for potent brews' },
    ley_channeling: { name: 'Ley Channeling', cost: 180, requires: ['runecraft'], tab: 'arcane', description: 'Tap leylines for mana' },
    luminance: { name: 'Luminance', cost: 100, requires: ['ley_channeling'], tab: 'arcane', description: 'Mana-powered light' },
    brilliance: { name: 'Brilliance', cost: 260, requires: ['luminance'], tab: 'arcane', description: 'Radiant beacon lights large areas' },
    ember_magic: { name: 'Ember Magic', cost: 120, requires: ['ley_channeling'], tab: 'arcane', description: 'Warmth wards for winter' },
    arcane_infusion: { name: 'Arcane Infusion', cost: 280, requires: ['ley_channeling'], tab: 'arcane', description: 'Faster enchanted crafting' },
    mana_weaving: { name: 'Mana Weaving', cost: 350, requires: ['arcane_infusion'], tab: 'arcane', description: 'Weave mana into protective garb' },
    pyroclasm: { name: 'Pyroclasm', cost: 400, requires: ['ember_magic', 'warding'], tab: 'arcane', description: 'Fire ward incinerates nearby foes' },
    arcane_studies: { name: 'Arcane Studies', cost: 90, requires: ['runecraft'], tab: 'crafting', description: 'Study and craft basic spell tomes' },
    advanced_arcana: { name: 'Advanced Arcana', cost: 300, requires: ['arcane_studies', 'arcane_infusion'], tab: 'crafting', description: 'Craft advanced spell tomes' },
    runeforging: { name: 'Runeforging', cost: 200, requires: ['runecraft'], tab: 'crafting', description: 'Forge runic weapons' },
    masterwork: { name: 'Masterwork', cost: 450, requires: ['runeforging', 'arcane_infusion'], tab: 'crafting', description: 'Forge legendary enchanted weapons' },
    golem_craft: { name: 'Golem Craft', cost: 420, requires: ['arcane_infusion', 'void_forging'], tab: 'crafting', description: 'Animate stone golems to serve as tireless workers' },
    warding: { name: 'Warding', cost: 150, requires: ['runecraft'], tab: 'void', description: 'Conjure defensive wards' },
    void_summoning: { name: 'Void Summoning', cost: 300, requires: ['ley_channeling', 'warding'], tab: 'void', description: 'Open portals to summon waves of enemies' },
    void_forging: { name: 'Void Forging', cost: 380, requires: ['void_summoning', 'runeforging'], tab: 'void', description: 'Forge void essence into powerful gear' },
    planar_rift: { name: 'Planar Rift', cost: 400, requires: ['void_summoning', 'ley_channeling'], tab: 'void', description: 'Open stable rifts for exploration expeditions' },
    deep_delving: { name: 'Deep Delving', cost: 550, requires: ['planar_rift'], tab: 'void', description: 'Access deeper, more dangerous realms' },
};

// Auto-derive unlocks from the 'research' field on buildings, recipes, and crops.
for (const [key, tech] of Object.entries(RESEARCH)) {
    tech.unlocks = { buildings: [], recipes: [], crops: [] };
}
for (const [name, b] of Object.entries(BUILDINGS)) {
    if (b.research && RESEARCH[b.research]) RESEARCH[b.research].unlocks.buildings.push(name);
}
for (const [name, r] of Object.entries(RECIPES)) {
    if (r.research && RESEARCH[r.research]) RESEARCH[r.research].unlocks.recipes.push(name);
}
for (const [name, c] of Object.entries(CROPS)) {
    if (c.research && RESEARCH[c.research]) RESEARCH[c.research].unlocks.crops.push(name);
}

// ----------------------------------------------------------------------------
// Wildlife & Raider config
// ----------------------------------------------------------------------------

// To add an animal: add entry here. Spawning, rendering, hunting, and taming handled automatically.
// tameable: true enables taming. tamed sub-object: what the animal produces once tamed.
// speed: movement rate (lower = slower). fleeRange/aggroRange: detection distance for behavior.
export const ANIMALS = {
    deer:    { char: 'd', color: '#bb8855', hp: 40, speed: 0.5, hostile: false, meatYield: 3, hideYield: 2, fleeRange: 5, spawnWeight: 20 },
    rabbit:  { char: 'r', color: '#ccaa88', hp: 10, speed: 0.7, hostile: false, meatYield: 1, fleeRange: 4, spawnWeight: 20 },
    wolf:    { char: 'w', color: '#555555', hp: 60, speed: 0.6, hostile: true, meatYield: 2, hideYield: 1, damage: 8, aggroRange: 6, spawnWeight: 0, spawnCondition: 'hostileNight', tameable: true, tamed: { guardAnimal: true, guardRadius: 8, guardDamage: 8, foodToTame: 6, dangerousTame: true, baseTameChance: 0.40, retaliationDamage: 12 } },
    chicken: { char: 'c', color: '#ddaa44', hp: 15, speed: 0.4, hostile: false, meatYield: 1, fleeRange: 3, spawnWeight: 10, tameable: true, tamed: { produces: 'eggs', produceRate: 80, produceAmount: 1, foodToTame: 2 } },
    cow:     { char: 'C', color: '#aa7744', hp: 80, speed: 0.3, hostile: false, meatYield: 4, hideYield: 3, fleeRange: 4, spawnWeight: 15, tameable: true, tamed: { produces: 'milk', produceRate: 100, produceAmount: 2, foodToTame: 4 } },
    sheep:   { char: 's', color: '#cccccc', hp: 40, speed: 0.35, hostile: false, meatYield: 2, fleeRange: 4, spawnWeight: 15, tameable: true, tamed: { produces: 'wool', produceRate: 120, produceAmount: 1, foodToTame: 3 } },
    okapi:   { char: 'O', color: '#b3562e', hp: 100, speed: 0.8, hostile: false, meatYield: 5, hideYield: 3, fleeRange: 4, spawnWeight: 5, tameable: true, tamed: { packAnimal: true, expeditionSpeedBonus: 0.25, foodToTame: 5 } },
    tapir:   { char: 't', color: '#f2e6e6', hp: 60, speed: 0.25, hostile: false, meatYield: 4, hideYield: 2, fleeRange: 4, spawnWeight: 5, tameable: true, tamed: { happinessAura: true, auraRadius: 4, auraMoodBonus: 5, foodToTame: 3 } },
};

// Wildlife spawning and behavior. Used by wildlife.js.
export const WILDLIFE_CONFIG = {
    maxCount: 15,                // max wild animals on map at once
    passiveMoveChance: 0.3,      // chance per tick a passive animal moves randomly
    hostileIdleMoveChance: 0.2,  // chance per tick a hostile animal moves when no target nearby
    animalSearchRadius: 20,      // how far animals scan for colonists (flee/aggro)
    wolfNightThreshold: 0.75,    // fraction of day after which wolves can spawn (evening)
};

// Auto-derived from ANIMALS entries with tameable: true
export const TAMED_ANIMALS = Object.fromEntries(
    Object.entries(ANIMALS).filter(([, a]) => a.tameable).map(([k, a]) => [k, { char: a.char, color: a.color, hp: a.hp, ...a.tamed }])
);

export const GOLEM_TYPES = {
    farmer_golem:  { name: 'Farmer Golem', char: 'G', color: '#55aa33', hp: 150, speed: 0.3, specialty: 'farming', skillLevel: 6, cost: { stone: 10, runite: 3, void_essence: 2 }, craftTicks: 80 },
    miner_golem:   { name: 'Miner Golem', char: 'G', color: '#888888', hp: 180, speed: 0.25, specialty: 'building', skillLevel: 6, cost: { stone: 12, runite: 4, void_essence: 2 }, craftTicks: 90 },
    combat_golem:  { name: 'Combat Golem', char: 'G', color: '#cc4444', hp: 250, speed: 0.35, specialty: 'combat', damage: 20, cost: { stone: 15, runite: 5, void_essence: 4 }, craftTicks: 110 },
    hauler_golem:  { name: 'Hauler Golem', char: 'G', color: '#bbaa55', hp: 120, speed: 0.5, specialty: 'hauling', skillLevel: 8, cost: { stone: 8, runite: 2, void_essence: 1 }, craftTicks: 65 },
};

// Raid system tuning. Used by combat.js. Raiders spawn at map edges and attack colonists.
export const RAID_CONFIG = {
    firstRaidTick: 3000,         // earliest tick a raid can happen (~1 season in)
    minInterval: 1500,           // minimum ticks between raids
    maxInterval: 4000,           // maximum ticks between raids
    baseRaiders: 1,              // minimum raiders per raid
    wealthScaling: 0.003,        // extra raiders = wealth * this * timeFactor
    timeScalingPeak: 18000,      // ticks to reach full raid strength (3 years)
    raiderHp: 50,                // hit points per raider
    raiderDamage: 5,             // base damage per hit (+ weapon bonus)
    raiderSpeed: 0.35,           // movement speed (lower = slower)
    fleeHpFraction: 0.3,         // individual raiders flee when their HP drops below this fraction
    routThreshold: 0.65,         // group rout when 65% of raiders are dead or fleeing
    timeout: 600,                // ticks after which remaining raiders flee (safety valve)
};

// Trade values for bartering system. Used by events.js caravan trades.
export const TRADE_VALUES = {
    wood: 1, stone: 1.5, planks: 2.5, food: 1.2, bricks: 3,
    hides: 1.5, leather: 3, iron_ore: 2, iron: 4,
    runite: 6, void_essence: 10, meat: 0.8, wheat: 0.6, berries: 0.5,
    corn: 0.7, potatoes: 0.6, eggs: 1.5, milk: 2, wool: 2.5,
};
export const TRADER_MARKUP = 1.4;
export const TRADER_DISCOUNT = 0.7;

export const TRADER_EXCLUSIVE_ITEMS = {
    amulet_of_fortune: { type: 'artifact', name: 'Amulet of Fortune', xpBonus: 0.2, tradeValue: 40 },
    enchanted_blade: { type: 'weapon', name: 'Enchanted Blade', damage: 18, spellDamageBonus: 0.15, tradeValue: 50 },
    wanderers_cloak: { type: 'armor', name: "Wanderer's Cloak", damageReduction: 0.15, moveSpeedBonus: 0.2, tradeValue: 45 },
    merchants_ring: { type: 'artifact', name: "Merchant's Ring", tradeBonus: 0.1, tradeValue: 35 },
    seedkeepers_locket: { type: 'artifact', name: "Seedkeeper's Locket", tradeValue: 55 },
    hourglass_of_diligence: { type: 'artifact', name: 'Hourglass of Diligence', tradeValue: 50 },
    lodestone_of_prosperity: { type: 'artifact', name: 'Lodestone of Prosperity', tradeValue: 45 },
    hagglers_coin: { type: 'artifact', name: "Haggler's Coin", tradeValue: 40 },
    aegis_of_the_vanguard: { type: 'artifact', name: 'Aegis of the Vanguard', tradeValue: 60 },
    crystal_capacitor: { type: 'consumable', name: 'Crystal Capacitor', tradeValue: 65, char: '◆', charColor: '#aa44ff', description: 'Use to permanently increase your mana crystal limit by 1.' },
};

// ----------------------------------------------------------------------------
// Nexus & Exploration config
// ----------------------------------------------------------------------------

// Exploration / realms. Used by exploration.js.
export const REALMS = {
    crystal_caves: {
        name: 'Crystal Caves', difficulty: 1,
        chain: 'crystal', chainOrder: 1,
        duration: [220, 380], encounters: 3,
        vis: { wall: 'stone_wall', floor: 'stone_floor' },
        loot: [
            { resource: 'stone', weight: 40, amount: [5, 12] },
            { resource: 'runite', weight: 30, amount: [2, 5] },
            { resource: 'void_essence', weight: 10, amount: [1, 3] },
            { artifact: 'map_fragment', weight: 3 },
        ],
        enemies: { hp: [40, 60], damage: [5, 8], count: [2, 4] },
        events: {
            ambient: [
                '{name} marvels at crystalline formations pulsing with light.',
                'The cave walls hum with resonant energy.',
                '{name} traces veins of glowing runite through the rock.',
                'Luminescent fungi illuminate a side passage.',
                'A crystal chime echoes from deep below.',
            ],
            discoveries: [
                '{name} cracks open a geode — raw runite inside!',
                '{name} finds a vein of pure crystal ore.',
                'A collapsed mining cart still holds usable stone.',
            ],
            traps: [
                'A crystal shard explodes near {name}!',
                '{name} slips on smooth crystal — hard landing!',
                'Unstable ceiling crystals rain down on {name}!',
            ],
            rare: [
                { chance: 0.05, text: '{name} discovers a resonating crystal chamber — bonus runite!', loot: { resource: 'runite', amount: [3, 6] } },
                { chance: 0.03, text: '{name} finds an ancient dwarven cache!', loot: { resource: 'stone', amount: [8, 15] } },
                { chance: 0.02, text: '{name} finds a strange compass embedded in crystal — it pulses with greed!', loot: { artifact: 'compass_of_greed' } },
            ],
        },
    },
    crystal_mines: {
        name: 'Crystal Mines', difficulty: 2,
        chain: 'crystal', chainOrder: 2,
        duration: [350, 550], encounters: 4,
        vis: { wall: 'stone_wall', floor: 'stone_floor' },
        requiresRealm: 'crystal_caves',
        loot: [
            { resource: 'runite', weight: 35, amount: [4, 9] },
            { resource: 'stone', weight: 25, amount: [6, 14] },
            { resource: 'void_essence', weight: 15, amount: [2, 5] },
            { artifact: 'drum_of_rallying', weight: 3 },
        ],
        enemies: { hp: [70, 110], damage: [7, 12], count: [3, 5] },
        events: {
            ambient: [
                '{name} hears the echoing clink of ancient pickaxes.',
                'The mineshaft vibrates with deep seismic rumbling.',
                '{name} passes collapsed tunnels sealed by crystal growth.',
                'Rail tracks rusted shut stretch deeper into the dark.',
                'Luminescent veins pulse in time with an unseen heartbeat.',
                '{name} finds old miner graffiti scratched into the wall.',
            ],
            discoveries: [
                '{name} breaks through a sealed chamber — pristine runite!',
                'An abandoned mine cart still holds a rich payload.',
                '{name} digs into a pocket of concentrated crystal ore.',
            ],
            traps: [
                'A ceiling collapse rains rubble on {name}!',
                '{name} triggers a tripwire — a pickaxe swings from the wall!',
                'Unstable ground gives way beneath {name}!',
                'A pressurized gas pocket bursts near {name}!',
            ],
            rare: [
                { chance: 0.04, text: '{name} finds a deep runite motherload!', loot: { resource: 'runite', amount: [6, 12] } },
                { chance: 0.03, text: '{name} discovers a crystallized void pocket deep underground!', loot: { resource: 'void_essence', amount: [4, 8] } },
                { chance: 0.015, text: '{name} unearths an ancient mining golem core — still humming with power!', loot: { artifact: 'boots_of_haste' } },
                { chance: 0.015, text: '{name} pries a ward stone from a sealed vault door!', loot: { artifact: 'ward_of_the_sentinel' } },
            ],
        },
    },
    verdant_depths: {
        name: 'Verdant Depths', difficulty: 1,
        chain: 'verdant', chainOrder: 1,
        duration: [150, 280], encounters: 2,
        vis: { wall: 'wood_wall', floor: 'wood_floor' },
        loot: [
            { resource: 'wood', weight: 50, amount: [8, 15] },
            { resource: 'wheat', weight: 20, amount: [5, 10] },
            { resource: 'berries', weight: 20, amount: [4, 8] },
            { artifact: 'map_fragment', weight: 3 },
        ],
        enemies: { hp: [30, 50], damage: [4, 6], count: [1, 3] },
        events: {
            ambient: [
                '{name} pushes through thick vine curtains.',
                'Bioluminescent flowers line the path.',
                '{name} hears birdsong from an impossible direction.',
                'Giant mushrooms tower overhead, releasing spores.',
                'A stream of crystal-clear water crosses the trail.',
            ],
            discoveries: [
                '{name} finds a grove bursting with ripe fruit.',
                'Fallen timber lies ready for harvest.',
                '{name} discovers a hidden garden still bearing crops.',
            ],
            traps: [
                'A thorny vine snaps around {name}\'s leg!',
                '{name} stumbles into a pitcher plant — acid burns!',
                'Toxic pollen bursts from a flower near {name}!',
            ],
            rare: [
                { chance: 0.06, text: '{name} discovers a fertile seed cache — rare crops!', loot: { resource: 'potatoes', amount: [6, 10] } },
                { chance: 0.04, text: '{name} finds a druid\'s abandoned herb stash!', loot: { resource: 'berries', amount: [8, 12] } },
                { chance: 0.02, text: '{name} finds a golden charm shaped like a cornucopia!', loot: { artifact: 'cornucopia_charm' } },
            ],
        },
    },
    shadow_realm: {
        name: 'Shadow Realm', difficulty: 3,
        chain: 'shadow', chainOrder: 1,
        duration: [400, 650], encounters: 5,
        vis: { wall: 'void_wall', floor: 'stone_floor' },
        loot: [
            { resource: 'void_essence', weight: 40, amount: [3, 7] },
            { resource: 'runite', weight: 25, amount: [3, 6] },
            { artifact: 'map_fragment', weight: 3 },
        ],
        enemies: { hp: [80, 120], damage: [8, 14], count: [3, 6] },
        research: 'deep_delving',
        events: {
            ambient: [
                'Reality flickers — {name} sees double for a moment.',
                'Whispers from nowhere fill {name}\'s ears.',
                'The shadows themselves seem to breathe.',
                '{name} feels the void pulling at their mana.',
                'A rift in space opens briefly, showing another world.',
                'The ground shifts underfoot — nothing is solid here.',
            ],
            discoveries: [
                '{name} finds crystallized void essence on a dead creature.',
                'A pocket dimension collapses, dropping its contents.',
                '{name} absorbs residual energy from a fading rift.',
            ],
            traps: [
                'A void tendril lashes out at {name}!',
                '{name} steps through a spatial fold — disorienting impact!',
                'Shadow claws rake at {name} from the darkness!',
                'A gravity inversion slams {name} into the ceiling!',
            ],
            rare: [
                { chance: 0.04, text: '{name} absorbs a collapsing void crystal — pure essence!', loot: { resource: 'void_essence', amount: [4, 8] } },
                { chance: 0.02, text: '{name} finds a sealed void reliquary!', loot: { resource: 'void_essence', amount: [6, 10] } },
                { chance: 0.015, text: '{name} pulls a glowing lantern from the void — it never goes dark!', loot: { artifact: 'voidwalkers_lantern' } },
                { chance: 0.015, text: '{name} wraps themselves in living shadow — a cloak of concealment!', loot: { artifact: 'cloak_of_shadows' } },
                { chance: 0.02, text: '{name} finds a pulsing crystal device that hums with containment magic!', loot: { item: 'crystal_capacitor' } },
            ],
        },
    },
    arcane_library: {
        name: 'Arcane Library', difficulty: 2,
        chain: 'arcane', chainOrder: 1,
        duration: [180, 320], encounters: 2,
        vis: { wall: 'stone_wall', floor: 'wood_floor' },
        loot: [
            { resource: 'tome_magic_missile', weight: 20, amount: [1, 1] },
            { resource: 'tome_heal', weight: 20, amount: [1, 1] },
            { resource: 'tome_haste', weight: 15, amount: [1, 1] },
            { resource: 'tome_warp', weight: 15, amount: [1, 1] },
            { resource: 'tome_circle_of_growth', weight: 10, amount: [1, 1] },
            { resource: 'runite', weight: 20, amount: [2, 4] },
            { artifact: 'map_fragment', weight: 3 },
        ],
        enemies: { hp: [30, 50], damage: [4, 7], count: [1, 3] },
        research: 'arcane_studies',
        events: {
            ambient: [
                '{name} reads a passage from a floating book.',
                'Spectral librarians drift silently between shelves.',
                '{name} feels arcane knowledge pressing at the edges of their mind.',
                'A book flies off its shelf as the party passes.',
                'The smell of ancient parchment fills the air.',
                '{name} spots equations writing themselves on a chalkboard.',
            ],
            discoveries: [
                '{name} finds a scroll hidden between two heavy tomes.',
                'A secret shelf clicks open, revealing stored materials.',
                '{name} deciphers a map leading to a hidden alcove.',
            ],
            traps: [
                'A warded book shocks {name} upon touch!',
                '{name} triggers a glyph on the floor — arcane blast!',
                'An animated tome attacks {name} with paper cuts!',
            ],
            rare: [
                { chance: 0.05, text: '{name} discovers a sealed headmaster\'s vault — rare tome inside!', loot: { resource: 'tome_magic_missile', amount: [1, 1] } },
                { chance: 0.04, text: '{name} finds a cache of enchanting runite!', loot: { resource: 'runite', amount: [3, 5] } },
                { chance: 0.015, text: '{name} finds a glowing codex that shares its knowledge with all who stand near!', loot: { artifact: 'tome_of_shared_wisdom' } },
                { chance: 0.02, text: '{name} discovers a crystalline apparatus in a forgotten research alcove — it amplifies mana storage!', loot: { item: 'crystal_capacitor' } },
            ],
        },
    },
    crystal_depths: {
        name: 'Crystal Depths', difficulty: 3,
        chain: 'crystal', chainOrder: 3,
        duration: [500, 750], encounters: 6,
        vis: { wall: 'stone_wall', floor: 'stone_floor' },
        requiresRealm: 'crystal_mines',
        loot: [
            { resource: 'runite', weight: 40, amount: [6, 14] },
            { resource: 'void_essence', weight: 25, amount: [3, 7] },
            { resource: 'stone', weight: 15, amount: [8, 18] },
            { artifact: 'ward_of_the_sentinel', weight: 3 },
        ],
        enemies: { hp: [100, 160], damage: [11, 17], count: [4, 7] },
        events: {
            ambient: [
                '{name} feels immense pressure from the rock above.',
                'Crystals here grow in impossible spirals, defying gravity.',
                '{name} passes through a chamber lit entirely by runite veins.',
                'The air is thick with mineral dust that sparkles in torchlight.',
                'A low vibration pulses through the stone — something massive shifts below.',
                '{name} notices the crystals here are warm to the touch.',
            ],
            discoveries: [
                '{name} cracks open a massive geode — a motherlode of runite!',
                'A sealed dwarven vault still holds its treasures.',
                '{name} finds a vein of crystal so pure it hums with energy.',
            ],
            traps: [
                'A crystal stalactite shatters and rains razor shards on {name}!',
                '{name} triggers a pressure plate — the walls begin closing!',
                'Superheated steam vents from a crack, scalding {name}!',
                'The floor collapses into a crystal-lined sinkhole beneath {name}!',
            ],
            rare: [
                { chance: 0.04, text: '{name} discovers the legendary Crystal Heart — a massive runite formation!', loot: { resource: 'runite', amount: [10, 18] } },
                { chance: 0.03, text: '{name} finds a sealed primordial chamber full of void-infused crystal!', loot: { resource: 'void_essence', amount: [6, 12] } },
                { chance: 0.015, text: '{name} pries a shimmering gem from the deepest wall — it pulses with protective energy!', loot: { artifact: 'crystal_aegis' } },
                { chance: 0.01, text: '{name} uncovers an ancient crystalline forge still burning with arcane fire!', loot: { artifact: 'runite_hammer' } },
            ],
        },
    },
    fungal_hollows: {
        name: 'Fungal Hollows', difficulty: 2,
        chain: 'verdant', chainOrder: 2,
        duration: [280, 450], encounters: 4,
        vis: { wall: 'wood_wall', floor: 'wood_floor' },
        requiresRealm: 'verdant_depths',
        loot: [
            { resource: 'wood', weight: 35, amount: [10, 20] },
            { resource: 'berries', weight: 25, amount: [6, 12] },
            { resource: 'potatoes', weight: 20, amount: [5, 10] },
            { artifact: 'cornucopia_charm', weight: 3 },
        ],
        enemies: { hp: [55, 85], damage: [6, 10], count: [2, 5] },
        events: {
            ambient: [
                '{name} ducks under a canopy of phosphorescent mushroom caps.',
                'Spore clouds drift lazily through the cavern.',
                '{name} hears the squelch of something moving in the mycelium.',
                'Bioluminescent tendrils pulse in waves along the walls.',
                'The air is warm and humid, thick with the scent of decay and growth.',
                '{name} notices mushrooms growing visibly before their eyes.',
            ],
            discoveries: [
                '{name} finds a cluster of edible fungi — enormous and ripe.',
                'A fallen log teems with harvestable growth.',
                '{name} discovers a fungal garden tended by some long-gone cultivator.',
            ],
            traps: [
                'A puffball mushroom explodes in {name}\'s face — choking spores!',
                '{name} steps on a cap that snaps shut like a jaw!',
                'Acidic sap drips from above onto {name}!',
                'A vine whips out from the fungal mass, striking {name}!',
            ],
            rare: [
                { chance: 0.05, text: '{name} discovers a grove of giant truffles — incredibly valuable!', loot: { resource: 'potatoes', amount: [8, 14] } },
                { chance: 0.04, text: '{name} finds a cache of preserved seeds in a hollow tree!', loot: { resource: 'wheat', amount: [10, 16] } },
                { chance: 0.02, text: '{name} finds a living staff of intertwined roots that still grows!', loot: { artifact: 'staff_of_regrowth' } },
                { chance: 0.015, text: '{name} discovers a symbiotic fungal crown that enhances the mind!', loot: { artifact: 'mycelium_crown' } },
            ],
        },
    },
    primeval_canopy: {
        name: 'Primeval Canopy', difficulty: 3,
        chain: 'verdant', chainOrder: 3,
        duration: [400, 600], encounters: 5,
        vis: { wall: 'wood_wall', floor: 'wood_floor' },
        requiresRealm: 'fungal_hollows',
        loot: [
            { resource: 'wood', weight: 30, amount: [12, 24] },
            { resource: 'berries', weight: 20, amount: [8, 16] },
            { resource: 'potatoes', weight: 15, amount: [6, 12] },
            { resource: 'void_essence', weight: 10, amount: [2, 5] },
            { artifact: 'staff_of_regrowth', weight: 3 },
        ],
        enemies: { hp: [80, 130], damage: [9, 14], count: [3, 6] },
        events: {
            ambient: [
                '{name} climbs through roots thicker than castle walls.',
                'The canopy above blocks all sky — only bioluminescence lights the way.',
                '{name} hears the call of creatures that haven\'t existed for millennia.',
                'Ancient bark carvings depict a civilization built among these branches.',
                'A waterfall cascades from somewhere impossibly high above.',
                '{name} feels the forest watching them with a patient intelligence.',
            ],
            discoveries: [
                '{name} finds a treehouse larder still stocked with preserved fruit.',
                'A massive seed pod cracks open, revealing usable materials.',
                '{name} discovers a natural spring with restorative waters.',
            ],
            traps: [
                'A carnivorous flower snaps its petals around {name}!',
                '{name} disturbs a wasp nest the size of a cart!',
                'The branch beneath {name} snaps — long fall!',
                'Paralytic pollen fills the air around {name}!',
            ],
            rare: [
                { chance: 0.04, text: '{name} discovers the World-Root — a nexus of primal nature energy!', loot: { resource: 'void_essence', amount: [5, 9] } },
                { chance: 0.03, text: '{name} harvests from the legendary Ever-Fruit tree!', loot: { resource: 'berries', amount: [12, 20] } },
                { chance: 0.015, text: '{name} bonds with a seed of the World-Tree — it grows into living armor!', loot: { artifact: 'living_bark_armor' } },
                { chance: 0.01, text: '{name} discovers an ancient druid\'s heartwood staff, still thrumming with life magic!', loot: { artifact: 'heartwood_staff' } },
            ],
        },
    },
    ancient_university: {
        name: 'Ancient University', difficulty: 3,
        chain: 'arcane', chainOrder: 2,
        duration: [320, 500], encounters: 4,
        vis: { wall: 'stone_wall', floor: 'wood_floor' },
        requiresRealm: 'arcane_library',
        research: 'arcane_studies',
        loot: [
            { resource: 'tome_magic_missile', weight: 15, amount: [1, 1] },
            { resource: 'tome_heal', weight: 15, amount: [1, 1] },
            { resource: 'tome_haste', weight: 12, amount: [1, 1] },
            { resource: 'tome_warp', weight: 12, amount: [1, 1] },
            { resource: 'tome_circle_of_growth', weight: 10, amount: [1, 1] },
            { resource: 'runite', weight: 25, amount: [3, 7] },
            { artifact: 'tome_of_shared_wisdom', weight: 3 },
        ],
        enemies: { hp: [60, 100], damage: [7, 12], count: [2, 5] },
        events: {
            ambient: [
                '{name} passes through a grand lecture hall where spectral students still sit.',
                'Enchanted chalk writes formulas endlessly across ancient blackboards.',
                '{name} feels raw magical energy crackling along the corridors.',
                'A golem proctor patrols the halls, still enforcing long-dead rules.',
                'Alchemical apparatus bubbles and steams in an abandoned laboratory wing.',
                '{name} hears a distant bell tolling class changes for no one.',
            ],
            discoveries: [
                '{name} finds a professor\'s private collection hidden behind a false wall.',
                'A sealed examination vault still contains graded manuscripts of power.',
                '{name} deciphers a master thesis containing a spell formula.',
            ],
            traps: [
                'A failed experiment reactivates as {name} passes — explosion!',
                '{name} triggers a student\'s old ward — lightning arcs!',
                'An animated suit of armor swings at {name}!',
                'A containment circle breaks, releasing stored energy at {name}!',
            ],
            rare: [
                { chance: 0.04, text: '{name} discovers the Dean\'s private vault — advanced tome inside!', loot: { resource: 'tome_haste', amount: [1, 1] } },
                { chance: 0.03, text: '{name} finds an enchanted runite cache in the alchemy wing!', loot: { resource: 'runite', amount: [5, 9] } },
                { chance: 0.02, text: '{name} finds a set of spectacles that reveal hidden truths!', loot: { artifact: 'scholars_spectacles' } },
                { chance: 0.015, text: '{name} discovers a thesis on mana crystallization with a working prototype!', loot: { item: 'crystal_capacitor' } },
            ],
        },
    },
    abandoned_laboratory: {
        name: 'Abandoned Laboratory', difficulty: 4,
        chain: 'arcane', chainOrder: 3,
        duration: [450, 680], encounters: 6,
        vis: { wall: 'stone_wall', floor: 'stone_floor' },
        requiresRealm: 'ancient_university',
        research: 'arcane_studies',
        loot: [
            { resource: 'tome_magic_missile', weight: 12, amount: [1, 1] },
            { resource: 'tome_heal', weight: 12, amount: [1, 1] },
            { resource: 'tome_haste', weight: 12, amount: [1, 1] },
            { resource: 'tome_warp', weight: 12, amount: [1, 1] },
            { resource: 'tome_circle_of_growth', weight: 12, amount: [1, 1] },
            { resource: 'runite', weight: 20, amount: [4, 9] },
            { resource: 'void_essence', weight: 15, amount: [2, 6] },
            { artifact: 'scholars_spectacles', weight: 2 },
        ],
        enemies: { hp: [90, 150], damage: [10, 16], count: [3, 6] },
        events: {
            ambient: [
                '{name} passes containment chambers — most are cracked and empty.',
                'Unstable magical fields distort the air like heat shimmer.',
                '{name} reads warning signs in a dozen languages on every door.',
                'A half-finished construct twitches as the party passes.',
                'Arcane waste pools glow an unsettling green in side chambers.',
                '{name} hears the hum of a still-running experiment deep below.',
            ],
            discoveries: [
                '{name} finds an intact experimental prototype in a sealed chamber.',
                'A researcher\'s emergency stash — hidden for a quick escape that never came.',
                '{name} recovers usable materials from a decommissioned experiment.',
            ],
            traps: [
                'A containment breach floods the corridor with raw magic — {name} is hit!',
                '{name} steps on a pressure plate — an experimental weapon fires!',
                'A mutated specimen breaks free from stasis as {name} passes!',
                'Unstable reagents combust near {name}!',
                'A temporal anomaly snaps shut on {name} — disorienting!',
            ],
            rare: [
                { chance: 0.04, text: '{name} accesses the head researcher\'s personal vault — forbidden knowledge!', loot: { resource: 'tome_circle_of_growth', amount: [1, 1] } },
                { chance: 0.03, text: '{name} finds concentrated void essence in a sealed containment jar!', loot: { resource: 'void_essence', amount: [6, 10] } },
                { chance: 0.015, text: '{name} recovers an experimental amplification gauntlet — still functional!', loot: { artifact: 'arcane_amplifier' } },
                { chance: 0.01, text: '{name} discovers the masterwork of a mad researcher — a staff that bends reality!', loot: { artifact: 'staff_of_distortion' } },
            ],
        },
    },
    void_abyss: {
        name: 'Void Abyss', difficulty: 4,
        chain: 'shadow', chainOrder: 2,
        duration: [550, 800], encounters: 6,
        vis: { wall: 'void_wall', floor: 'stone_floor' },
        requiresRealm: 'shadow_realm',
        research: 'deep_delving',
        loot: [
            { resource: 'void_essence', weight: 45, amount: [5, 10] },
            { resource: 'runite', weight: 20, amount: [4, 8] },
            { artifact: 'voidwalkers_lantern', weight: 3 },
        ],
        enemies: { hp: [120, 180], damage: [12, 18], count: [4, 7] },
        events: {
            ambient: [
                '{name} cannot tell if they are walking on ground or floating.',
                'The void here is so deep that sound ceases to propagate.',
                '{name} sees echoes of themselves from other timelines.',
                'Space folds back on itself — the party passes the same point twice.',
                'A black sun burns overhead, radiating darkness instead of light.',
                '{name} feels their thoughts being pulled apart by the emptiness.',
            ],
            discoveries: [
                '{name} collects crystallized void from a collapsed pocket dimension.',
                'The remains of another expedition float by — their supplies are intact.',
                '{name} absorbs energy from a dying rift nexus.',
            ],
            traps: [
                'A gravity well inverts — {name} slams into the ceiling then back down!',
                '{name} is caught in a temporal loop — experiencing the same pain twice!',
                'A void creature phases through {name}, draining their life force!',
                'Reality tears open beneath {name} — they barely avoid falling into nothing!',
                'An anti-magic pulse hits {name}, disrupting their defenses!',
            ],
            rare: [
                { chance: 0.04, text: '{name} finds a concentrated void crystal — pure primordial essence!', loot: { resource: 'void_essence', amount: [8, 14] } },
                { chance: 0.03, text: '{name} collects runite that has been void-tempered for aeons!', loot: { resource: 'runite', amount: [6, 12] } },
                { chance: 0.015, text: '{name} wrests a blade from the void itself — it cuts through reality!', loot: { artifact: 'void_blade' } },
                { chance: 0.01, text: '{name} discovers an orb containing a trapped dimension — incredible power!', loot: { artifact: 'dimensional_orb' } },
            ],
        },
    },
    oblivion_rift: {
        name: 'Oblivion Rift', difficulty: 5,
        chain: 'shadow', chainOrder: 3,
        duration: [700, 1000], encounters: 8,
        vis: { wall: 'void_wall', floor: 'void_wall' },
        requiresRealm: 'void_abyss',
        research: 'deep_delving',
        loot: [
            { resource: 'void_essence', weight: 50, amount: [7, 14] },
            { resource: 'runite', weight: 20, amount: [5, 10] },
            { artifact: 'cloak_of_shadows', weight: 3 },
        ],
        enemies: { hp: [160, 240], damage: [15, 22], count: [4, 8] },
        events: {
            ambient: [
                '{name} walks on platforms of solidified nothingness.',
                'The concept of direction has no meaning here — only forward.',
                '{name} sees the end of all things and looks away quickly.',
                'Reality is a thin membrane here — the party can see through it.',
                'Entities vast beyond comprehension move in the distance, unaware of the party.',
                '{name} feels time flowing backwards, forwards, and sideways simultaneously.',
            ],
            discoveries: [
                '{name} gathers void essence that has crystallized into impossible geometries.',
                'A fragment of a destroyed world drifts by — {name} salvages from it.',
                '{name} absorbs raw creation energy from the space between realities.',
            ],
            traps: [
                'An oblivion wave washes over {name} — they briefly cease to exist!',
                '{name} is caught between colliding reality fragments — crushed!',
                'A void lord notices {name} — its gaze alone causes agony!',
                'The ground unmakes itself beneath {name}!',
                'A paradox storm engulfs {name} — existing and not existing hurts!',
                '{name} is struck by a shard of broken time!',
            ],
            rare: [
                { chance: 0.04, text: '{name} finds a tear in reality leading to a void essence wellspring!', loot: { resource: 'void_essence', amount: [10, 18] } },
                { chance: 0.02, text: '{name} claims a fragment of pure oblivion — it annihilates anything it touches!', loot: { artifact: 'shard_of_oblivion' } },
                { chance: 0.01, text: '{name} binds a fraction of the void\'s power into their very soul!', loot: { artifact: 'voidheart' } },
                { chance: 0.01, text: '{name} finds armor forged from the boundary between existence and nothing!', loot: { artifact: 'armor_of_the_abyss' } },
            ],
        },
    },
};

export const EXPLORATION_CONFIG = {
    returnTimeMult: 1.3,
    retreatTicks: 200,
    encounterSpacing: 0.2,
    baseFistDamage: 5,
    combatRoundTicks: 8,
    microEventChance: 0.04,
    trapDamageRange: [5, 15],
    trapChance: 0.3,
    findItemChance: 0.3,
    ambientChance: 0.4,
};

export const EXPEDITION_DIFFICULTY = {
    1: { name: 'Normal', enemyHpMult: 1, enemyDmgMult: 1, enemyCountMult: 1, trapDmgMult: 1, lootAmountMult: 1, rareLootMult: 1, extraEncounters: 0 },
    2: { name: 'Dangerous', enemyHpMult: 1.3, enemyDmgMult: 1.2, enemyCountMult: 1.25, trapDmgMult: 1.3, lootAmountMult: 1.5, rareLootMult: 1.5, extraEncounters: 1 },
    3: { name: 'Perilous', enemyHpMult: 1.7, enemyDmgMult: 1.5, enemyCountMult: 1.5, trapDmgMult: 1.7, lootAmountMult: 2.0, rareLootMult: 2.5, extraEncounters: 2 },
    4: { name: 'Deadly', enemyHpMult: 2.2, enemyDmgMult: 1.8, enemyCountMult: 1.75, trapDmgMult: 2.0, lootAmountMult: 3.0, rareLootMult: 4.0, extraEncounters: 3 },
    5: { name: 'Suicidal', enemyHpMult: 3.0, enemyDmgMult: 2.2, enemyCountMult: 2.0, trapDmgMult: 2.5, lootAmountMult: 4.0, rareLootMult: 6.0, extraEncounters: 4 },
};

export const EXPLORATION_EVENTS = {
    ambient: [
        '{name} notices strange runes on the walls.',
        '{name} hears distant echoes ahead.',
        'The party passes through a narrow passage.',
        '{name} spots glowing crystals in the ceiling.',
        'A cold draft blows from deeper in.',
        '{name} finds old bones scattered on the ground.',
        'The air grows thick with arcane energy.',
        '{name} pauses to study an ancient mural.',
        'Water drips from the ceiling above.',
        'The path splits — the party chooses the left fork.',
        '{name} feels a strange presence watching them.',
        'Faint music drifts from somewhere ahead.',
    ],
    traps: [
        '{name} triggers a hidden spike trap!',
        'A burst of arcane fire singes {name}!',
        '{name} steps on a pressure plate — darts fly!',
        'The floor gives way under {name}!',
        '{name} walks into a magical ward — shock!',
        'Poisoned needles spring from the wall at {name}!',
    ],
    discoveries: [
        '{name} finds a small cache behind a loose stone.',
        'The party discovers an old supply stash.',
        '{name} pries a gem from a wall socket.',
        'An abandoned pack contains useful supplies.',
        '{name} spots something glinting in the rubble.',
    ],
    combatStart: [
        'Hostile creatures emerge from the darkness!',
        'The party is ambushed!',
        'Enemies block the path ahead!',
        'Shadows coalesce into hostile forms!',
    ],
    combatHit: [
        '{attacker} strikes {target} for {dmg} damage.',
        '{attacker} lands a blow on {target} ({dmg} dmg).',
        '{attacker} hits {target} hard ({dmg} dmg).',
    ],
    combatMiss: [
        '{attacker} swings at {target} but misses.',
        '{target} dodges {attacker}\'s attack.',
    ],
    combatDefeat: [
        '{name} collapses from their wounds!',
        '{name} is knocked unconscious!',
    ],
};

// Wave defense (void nexus) tuning. Used by waves.js.
export const WAVE_CONFIG = {
    baseEnemies: 4,              // enemies in wave 1
    enemiesPerWave: 2,           // additional enemies per wave after wave 1
    baseHp: 60,                  // enemy HP in wave 1
    hpPerWave: 15,               // additional HP per wave
    baseDamage: 6,               // enemy damage in wave 1
    damagePerWave: 2,            // additional damage per wave
    spawnInterval: 15,           // ticks between enemy spawns during a wave
    essencePerKill: 1,           // void essence earned per kill
    nexusHp: 200,                // starting HP of the void nexus
    nexusHpPerWave: 0,           // additional nexus HP per wave (0 = static)
    colonistCapBase: 3,          // starting colonist cap before any waves
    colonistCapScale: 2.5,       // scaling factor for cap increase per wave completed
    colonistCapMax: 12,          // maximum colonist cap
    enemySpeed: 0.45,            // wave enemy movement speed (lower = slower)
    enemyChar: 'E',              // character displayed for wave enemies
    enemyColor: '#ff2222',       // color of wave enemies
    repathInterval: 20,          // ticks before wave enemies recalculate path
    spawnDistance: { near: 25, far: 50, offsetRange: 10 }, // portal spawn distances from nexus
    maxPathNodes: 2000,          // A* node limit for wave enemy pathfinding
    bonusEssencePerWave: 2,      // multiplied by wave number for completion bonus
};

// ============================================================================
// STORY MILESTONES — SPOILER WARNING!
// The text below contains narrative spoilers for Arcanum: Rifts & Ruins.
// Do not read ahead if you want to experience the story organically in-game.
// ============================================================================

export const STORY_MILESTONES = {
    // -----------------------------------------------------------------------
    // Colony tab — narrative story beats about your colony's journey
    // -----------------------------------------------------------------------
    first_building: {
        tab: 'colony',
        title: 'First Foundation',
        trigger: 'first_building_placed',
        text: 'TODO: Write story text for placing your first building.',
        order: 1,
    },
    colony_5: {
        tab: 'colony',
        title: 'A Settlement Forms',
        trigger: 'colonist_count_5',
        text: 'TODO: Write story text for reaching 5 colonists.',
        order: 2,
    },
    colony_10: {
        tab: 'colony',
        title: 'A Thriving Community',
        trigger: 'colonist_count_10',
        text: 'TODO: Write story text for reaching 10 colonists.',
        order: 3,
    },
    first_raid_survived: {
        tab: 'colony',
        title: 'Baptism of Steel',
        trigger: 'first_raid_survived',
        text: 'TODO: Write story text for surviving your first raid.',
        order: 4,
    },
    first_mental_break: {
        tab: 'colony',
        title: 'The Breaking Point',
        trigger: 'first_mental_break',
        text: 'TODO: Write story text for first colonist mental break.',
        order: 5,
    },
    first_death: {
        tab: 'colony',
        title: 'The First Marker',
        trigger: 'first_colonist_death',
        text: 'TODO: Write story text for first colonist death.',
        order: 6,
    },
    first_tame: {
        tab: 'colony',
        title: 'Kindred Spirits',
        trigger: 'first_animal_tamed',
        text: 'TODO: Write story text for taming your first animal.',
        order: 7,
    },
    first_trade: {
        tab: 'colony',
        title: 'Commerce Begins',
        trigger: 'first_trade_completed',
        text: 'TODO: Write story text for completing your first trade.',
        order: 8,
    },
    first_spell: {
        tab: 'colony',
        title: 'The Spark of Magic',
        trigger: 'first_spell_cast',
        text: 'TODO: Write story text for casting your first spell.',
        order: 9,
    },
    first_wave_complete: {
        tab: 'colony',
        title: 'Void Triumphant',
        trigger: 'first_wave_completed',
        text: 'TODO: Write story text for completing your first void wave.',
        order: 10,
    },

    // -----------------------------------------------------------------------
    // World tab — lore and worldbuilding (research unlocks)
    // -----------------------------------------------------------------------
    research_runecraft: {
        tab: 'world',
        title: 'Runecraft',
        trigger: 'research_runecraft',
        text: 'TODO: Write lore text for runecraft research.',
        order: 1,
    },
    research_druidcraft: {
        tab: 'world',
        title: 'Druidcraft',
        trigger: 'research_druidcraft',
        text: 'TODO: Write lore text for druidcraft research.',
        order: 2,
    },
    research_beast_binding: {
        tab: 'world',
        title: 'Beast Binding',
        trigger: 'research_beast_binding',
        text: 'TODO: Write lore text for beast binding research.',
        order: 3,
    },
    research_ley_channeling: {
        tab: 'world',
        title: 'Ley Channeling',
        trigger: 'research_ley_channeling',
        text: 'TODO: Write lore text for ley channeling research.',
        order: 4,
    },
    research_arcane_studies: {
        tab: 'world',
        title: 'Arcane Studies',
        trigger: 'research_arcane_studies',
        text: 'TODO: Write lore text for arcane studies research.',
        order: 5,
    },
    research_void_summoning: {
        tab: 'world',
        title: 'Void Summoning',
        trigger: 'research_void_summoning',
        text: 'TODO: Write lore text for void summoning research.',
        order: 6,
    },
    research_planar_rift: {
        tab: 'world',
        title: 'Planar Rift',
        trigger: 'research_planar_rift',
        text: 'TODO: Write lore text for planar rift research.',
        order: 7,
    },
    research_deep_delving: {
        tab: 'world',
        title: 'Deep Delving',
        trigger: 'research_deep_delving',
        text: 'TODO: Write lore text for deep delving research.',
        order: 8,
    },
    research_golem_craft: {
        tab: 'world',
        title: 'Golem Craft',
        trigger: 'research_golem_craft',
        text: 'TODO: Write lore text for golem craft research.',
        order: 9,
    },

    // -----------------------------------------------------------------------
    // World tab — lore and worldbuilding (realm exploration)
    // -----------------------------------------------------------------------
    realm_crystal_caves: {
        tab: 'world',
        title: 'Crystal Caves',
        trigger: 'realm_crystal_caves',
        text: 'TODO: Write lore text for exploring the Crystal Caves.',
        order: 20,
    },
    realm_crystal_mines: {
        tab: 'world',
        title: 'Crystal Mines',
        trigger: 'realm_crystal_mines',
        text: 'TODO: Write lore text for exploring the Crystal Mines.',
        order: 21,
    },
    realm_crystal_depths: {
        tab: 'world',
        title: 'Crystal Depths',
        trigger: 'realm_crystal_depths',
        text: 'TODO: Write lore text for exploring the Crystal Depths.',
        order: 22,
    },
    realm_verdant_depths: {
        tab: 'world',
        title: 'Verdant Depths',
        trigger: 'realm_verdant_depths',
        text: 'TODO: Write lore text for exploring the Verdant Depths.',
        order: 23,
    },
    realm_fungal_hollows: {
        tab: 'world',
        title: 'Fungal Hollows',
        trigger: 'realm_fungal_hollows',
        text: 'TODO: Write lore text for exploring the Fungal Hollows.',
        order: 24,
    },
    realm_primeval_canopy: {
        tab: 'world',
        title: 'Primeval Canopy',
        trigger: 'realm_primeval_canopy',
        text: 'TODO: Write lore text for exploring the Primeval Canopy.',
        order: 25,
    },
    realm_arcane_library: {
        tab: 'world',
        title: 'Arcane Library',
        trigger: 'realm_arcane_library',
        text: 'TODO: Write lore text for exploring the Arcane Library.',
        order: 26,
    },
    realm_ancient_university: {
        tab: 'world',
        title: 'Ancient University',
        trigger: 'realm_ancient_university',
        text: 'TODO: Write lore text for exploring the Ancient University.',
        order: 27,
    },
    realm_abandoned_laboratory: {
        tab: 'world',
        title: 'Abandoned Laboratory',
        trigger: 'realm_abandoned_laboratory',
        text: 'TODO: Write lore text for exploring the Abandoned Laboratory.',
        order: 28,
    },
    realm_shadow_realm: {
        tab: 'world',
        title: 'Shadow Realm',
        trigger: 'realm_shadow_realm',
        text: 'TODO: Write lore text for exploring the Shadow Realm.',
        order: 29,
    },
    realm_void_abyss: {
        tab: 'world',
        title: 'Void Abyss',
        trigger: 'realm_void_abyss',
        text: 'TODO: Write lore text for exploring the Void Abyss.',
        order: 30,
    },
    realm_oblivion_rift: {
        tab: 'world',
        title: 'Oblivion Rift',
        trigger: 'realm_oblivion_rift',
        text: 'TODO: Write lore text for exploring the Oblivion Rift.',
        order: 31,
    },
};

// ----------------------------------------------------------------------------
// Game world config
// ----------------------------------------------------------------------------

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

// Per-season modifiers. cropGrowthMult: farm speed multiplier. animalSpawnRate: chance per tick.
// tempRange: [min, max] temperature displayed in UI (cosmetic, affects freezing via winter check).
export const SEASON_EFFECTS = {
    spring: { cropGrowthMult: 1.0, animalSpawnRate: 0.02, tempRange: [10, 20] },
    summer: { cropGrowthMult: 1.5, animalSpawnRate: 0.01, tempRange: [20, 35] },
    autumn: { cropGrowthMult: 0.8, animalSpawnRate: 0.03, tempRange: [5, 15] },
    winter: { cropGrowthMult: 0, animalSpawnRate: 0.005, tempRange: [-10, 5] },
};

// To add terrain: add entry here. Used by map generation, rendering, and pathfinding.
// passable: { colonist, animal, enemy }. moveCost applies to colonists only.
export const TERRAIN = {
    grass:  { char: '.', color: '#6aad44', bg: '#1a2a12', moveCost: 1, passable: { colonist: true, animal: true, enemy: true } },
    dirt:   { char: ',', color: '#bb8850', bg: '#2a1e14', moveCost: 1, passable: { colonist: true, animal: true, enemy: true } },
    sand:   { char: '∙', color: '#e0c878', bg: '#2a2618', moveCost: 1, passable: { colonist: true, animal: true, enemy: true } },
    gravel: { char: ':', color: '#a09888', bg: '#1e1c1a', moveCost: 1, passable: { colonist: true, animal: true, enemy: true } },
    rock:      { char: '#', color: '#999', bg: '#222', moveCost: 4, passable: { colonist: true, animal: false, enemy: true } },
    tall_rock: { char: '▲', color: '#777', bg: '#1a1a1a', moveCost: Infinity, passable: { colonist: false, animal: false, enemy: false } },
    water:     { char: '~', color: '#55aaff', bg: '#0a1a2e', moveCost: 3, passable: { colonist: true, animal: false, enemy: true } },
};

// To add a harvestable resource: add entry here. Rendering, gathering, and yields handled automatically.
// designation: 'chop' or 'mine'. yield: { resource: amount }. work: ticks to gather.
export const RESOURCES = {
    tree:       { char: 'T', color: '#8B6B3A', springColor: '#55cc44', summerColor: '#338822', autumnColor: '#cc8822', winterColor: '#667788', designation: 'chop', work: 12, yield: { wood: 1 }, perAmount: true },
    stone:      { char: 'o', color: '#999', designation: 'mine', work: 18, yield: { stone: 1 }, perAmount: true },
    iron_ore:   { char: 'o', color: '#cc8844', designation: 'mine', work: 20, yield: { iron_ore: 1 }, perAmount: true },
    runite_ore: { char: 'o', color: '#44cccc', designation: 'mine', work: 22, yield: { runite: 1 }, perAmount: true },
};

// To add weather: add entry here. Seasons reference weather types by key.
// growthMult: crop growth multiplier. display: shown in UI.
export const WEATHER_TYPES = {
    clear:        { display: 'Clear', growthMult: 1.0 },
    rain:         { display: 'Rain', growthMult: 1.3, extinguishesFire: true },
    thunderstorm: { display: 'Storm', growthMult: 1.0, extinguishesFire: true, fireChance: true },
    snow:         { display: 'Snow', growthMult: 0.5 },
    blizzard:     { display: 'Blizzard', growthMult: 0 },
    heatwave:     { display: 'Heat Wave', growthMult: 0.7 },
};

// Season-specific weather tables. Each entry: [weatherType, probability, durationRange].
// Evaluated in order; first match wins. Remainder = clear.
export const SEASON_WEATHER = {
    spring: [
        ['thunderstorm', 0.10, [10, 24]],
        ['rain', 0.25, [25, 64]],
    ],
    summer: [
        ['thunderstorm', 0.05, [15, 34]],
        ['rain', 0.15, [20, 49]],
        ['heatwave', 0.25, [40, 99]],
    ],
    autumn: [
        ['thunderstorm', 0.10, [10, 24]],
        ['rain', 0.25, [25, 64]],
    ],
    winter: [
        ['blizzard', 0.10, [30, 69]],
        ['snow', 0.30, [40, 99]],
    ],
};

// Map generator pipeline. Each entry runs in order during generateMap().
// name: identifier. enabled: toggle. weight/chance: probability of appearing (1.0 = always).
// params: passed to the generator function (defined in map.js).
export const MAP_GENERATORS = [
    {
        name: 'dirt_patches',
        enabled: true,
        params: {
            count: 12,          // patches per 100x80 area (scales with map size)
            radiusRange: [2, 5], // min/max patch radius
            fillChance: 0.6,    // chance per tile in radius to convert
        },
    },
    {
        name: 'rock_formations',
        enabled: true,
        params: {
            count: 6,           // formations per 100x80 area (scales with map size)
            sizeRange: [2, 4],  // min/max formation radius
            fillChance: 0.7,    // chance per tile in radius to place rock
            resourceChance: 0.5, // chance a rock tile gets a stone/iron/runite deposit
            runiteChance: 0.15, // fraction of resource tiles that are runite
            ironChance: 0.30,   // fraction of resource tiles that are iron
            stoneAmount: [3, 5], // stone deposit amount range
            ironAmount: [2, 4],  // iron deposit amount range
            runiteAmount: [2, 3], // runite deposit amount range
        },
    },
    {
        name: 'mountain_ranges',
        enabled: true,
        params: {
            chance: 0.4,         // probability a map has a mountain range
            lengthRange: [15, 40], // spine length in tiles
            widthRange: [3, 6],  // half-width of the range
            tallRockChance: 0.4, // chance of tall_rock (impassable) vs regular rock
            resourceChance: 0.3, // chance a rock tile gets deposits
            runiteChance: 0.25,  // fraction of resource tiles that are runite
            ironChance: 0.30,    // fraction of resource tiles that are iron
            stoneAmount: [3, 5],
            ironAmount: [2, 4],
            runiteAmount: [2, 4],
        },
    },
    {
        name: 'trees',
        enabled: true,
        params: {
            density: 0.12,      // chance per grass tile to spawn a tree
            amountRange: [3, 5], // wood amount per tree
        },
    },
    {
        name: 'river',
        enabled: true,
        params: {
            widthRange: [2, 3], // half-width of river (actual width = 2*w+1)
            bankChance: 0.85,   // chance of sand on tiles adjacent to water
            gravelChance: 0.5,  // chance of gravel on tiles 2 away from water
        },
    },
    {
        name: 'ruins',
        enabled: true,
        params: {
            count: 1,            // number of ruin placement attempts per map
            chance: 1,           // probability each attempt actually places a ruin
            margin: 30,          // min distance from map edge for placement
            decayChance: 0.33,   // chance each wall/door block is missing (ruined)
            floorDecayChance: 0.15, // chance each floor tile is missing
            // Blueprints: define structure layouts. Each has width, height, optional floorTerrain,
            // and a layout array of { x, y, type } entries (relative to top-left corner).
            // type must be a key from BUILDINGS. Add as many blueprints as you like.
            blueprints: [
                {
                    name: 'temple',
                    width: 9,
                    height: 7,
                    floorTerrain: 'dirt',
                    layout: (() => {
                        const l = [];
                        // Outer stone walls
                        for (let x = 0; x < 9; x++) { l.push({ x, y: 0, type: 'stone_wall' }); l.push({ x, y: 6, type: 'stone_wall' }); }
                        for (let y = 1; y < 6; y++) { l.push({ x: 0, y, type: 'stone_wall' }); l.push({ x: 8, y, type: 'stone_wall' }); }
                        // Door entrance
                        l.push({ x: 4, y: 6, type: 'door' });
                        // Stone floor interior
                        for (let y = 1; y < 6; y++) { for (let x = 1; x < 8; x++) { l.push({ x, y, type: 'stone_floor' }); } }
                        // Columns
                        l.push({ x: 2, y: 2, type: 'stone_wall' });
                        l.push({ x: 6, y: 2, type: 'stone_wall' });
                        l.push({ x: 2, y: 4, type: 'stone_wall' });
                        l.push({ x: 6, y: 4, type: 'stone_wall' });
                        return l;
                    })(),
                },
                {
                    name: 'watchtower',
                    width: 5,
                    height: 5,
                    floorTerrain: 'gravel',
                    layout: (() => {
                        const l = [];
                        // Square stone walls
                        for (let x = 0; x < 5; x++) { l.push({ x, y: 0, type: 'stone_wall' }); l.push({ x, y: 4, type: 'stone_wall' }); }
                        for (let y = 1; y < 4; y++) { l.push({ x: 0, y, type: 'stone_wall' }); l.push({ x: 4, y, type: 'stone_wall' }); }
                        // Door
                        l.push({ x: 2, y: 4, type: 'door' });
                        // Interior floor
                        for (let y = 1; y < 4; y++) { for (let x = 1; x < 4; x++) { l.push({ x, y, type: 'stone_floor' }); } }
                        return l;
                    })(),
                },
            ],
        },
    },
];

// ----------------------------------------------------------------------------
// Renderer config
// ----------------------------------------------------------------------------

// Rendering engine settings. Used by renderer.js for canvas, night overlay, and lighting.
// seasonDaylight: dawn/dusk as fraction of day (0-1). Dawn = transition to bright, dusk = transition to dark.
export const RENDER_CONFIG = {
    fontSize: 14,                // base font size in pixels
    fontHeightMult: 1.15,        // line height multiplier for tile cell height
    bgColor: '#111',             // canvas background (visible at map edges)
    cursorBg: '#444',            // background highlight under cursor
    selectionBgZone: '#2a3a2a',  // selection rectangle background in zone mode
    selectionBgBuild: '#3a2a2a', // selection rectangle background in build mode
    nightMaxDarkness: 0.55,      // maximum overlay opacity at full night (0-1)
    nightDawnDuskOffset: { duskEnd: 0.12, dawnStart: 0.10 }, // transition duration as fraction of day
    nightGradientSteps: 8,       // quantized darkness levels (higher = smoother, more fillRect calls)
    nightOverlayColor: [0, 0, 20], // RGB of night overlay tint
    lightSourceMargin: 8,        // extra tiles beyond viewport to check for light sources
    fireLightRadius: 2,          // light radius of burning tiles
    seasonDaylight: {
        summer: { dawn: 0.15, dusk: 0.75 },   // 60% daylight
        winter: { dawn: 0.25, dusk: 0.65 },   // 40% daylight
        spring: { dawn: 0.18, dusk: 0.72 },   // 54% daylight
        autumn: { dawn: 0.22, dusk: 0.68 },   // 46% daylight
        default: { dawn: 0.20, dusk: 0.70 },  // 50% daylight (fallback)
    },
    terrainDithering: true,          // enable terrain edge dithering in sprite mode
    ditherDepth: 0.3,                // fraction of tile size for dithering depth
    draftedPulsePeriod: 20,          // tick period for drafted colonist color pulse
    draftedPulseDuty: 10,            // ticks within period that pulse is "on"
    spellGlowPeriod: 16,             // tick period for active spell buff glow
    spellGlowDuty: 8,                // ticks within period that glow is "on"
    riftPulsePeriod: 20,             // tick period for rift gate active pulse
    riftPulseDuty: 10,               // ticks within period that pulse is "on"
    healthBarGreenThreshold: 0.5,    // above this % HP → green bar
    healthBarYellowThreshold: 0.25,  // above this % HP → yellow bar (below → red)
    healthBarColors: { green: '#00ff00', yellow: '#ffaa00', red: '#ff3333' },
};

// Visual effects for combat, portals, and turret shots. Used by renderer, colonist, combat, waves, power.
export const COMBAT_VISUALS = {
    hitChar: '!',                // character shown on hit
    hitColor: '#ffff00',         // color when colonist hits an enemy
    hitTtl: 2,                   // ticks the hit effect persists
    damageTakenColor: '#ff3333', // color when colonist takes damage
    nexusDamageColor: '#9933ff', // color when void nexus takes damage
    structureDamageColor: '#ff8800', // color when raiders/waves break structures
    portalChar: 'Ø',             // character for wave portals
    portalColor: '#ff55ff',      // portal foreground color
    portalBg: '#440044',         // portal background color
    portalPathColor: '#663388',  // path preview foreground
    portalPathBg: '#1a001a',     // path preview background
    shotColorArcane: '#ff4444',  // arcane sentinel shot color
    shotColorVoid: '#cc00ff',    // void turret shot color
    spellHealChar: '+',
    spellHealColor: '#44ff44',
    spellBuffChar: '>',
    spellBuffColor: '#88ffff',
    spellShieldChar: 'O',
    spellShieldColor: '#4488ff',
    spellTeleportChar: '@',
    spellTeleportColor: '#33ccff',
    spellGrowthChar: '%',
    spellGrowthColor: '#44ff44',
    spellTerraformChar: '.',
    spellTerraformColor: '#88ff88',
    spellDivinationChar: '?',
    spellDivinationColor: '#ccaaff',
    spellRangePreviewBg: '#1a0033', // background for targeting range preview tiles
};

// Colors for exploration/event log entry types. Used by ui.js _expLogColor().
export const LOG_COLORS = {
    danger: '#ff5555',
    combat: '#ff8844',
    success: '#88ff88',
    loot: '#ffcc44',
    ambient: '#777777',
    default: '#aaddff',
};
