import { CONFIG, SUMMON_TYPES } from '../core/config.js';
import { manhattanDist } from '../world/pathfinding.js';
import { isPassable } from '../world/map.js';
import { moveEntity } from '../systems/movement-lerp.js';

let nextSummonId = 1;

export function syncSummonIdCounter(summons) {
    const maxId = summons.reduce((max, s) => Math.max(max, s.id || 0), 0);
    if (maxId >= nextSummonId) nextSummonId = maxId + 1;
}

export function createSummon(summonType, x, y, ownerId, game) {
    const def = SUMMON_TYPES[summonType];
    const summon = {
        id: nextSummonId++,
        type: summonType,
        x, y,
        hp: def.hp,
        maxHp: def.hp,
        damage: def.damage,
        speed: def.speed,
        char: def.char,
        color: def.color,
        ownerId,
        expiresAt: game.tick + def.duration,
        moveCooldown: 0,
        guardState: 'patrolling',
    };
    emitSparkles(game, x, y, def.color);
    return summon;
}

export function updateSummons(game) {
    if (!game.summons || game.summons.length === 0) return;

    for (let i = game.summons.length - 1; i >= 0; i--) {
        const summon = game.summons[i];
        if (game.tick >= summon.expiresAt || summon.hp <= 0) {
            emitSparkles(game, summon.x, summon.y, summon.color);
            game.summons.splice(i, 1);
            continue;
        }
        updateSummonAI(summon, game);
    }
}

function updateSummonAI(summon, game) {
    const def = SUMMON_TYPES[summon.type];

    summon.moveCooldown -= summon.speed;
    if (summon.moveCooldown > 0) return;
    summon.moveCooldown = 1;

    const dur = CONFIG.TICK_RATE / (summon.speed * game.speed);

    const hostiles = [
        ...game.raiders.filter(r => r.hp > 0),
        ...(game.waves && game.waves.enemies ? game.waves.enemies.filter(e => e.hp > 0) : []),
        ...game.wildlife.filter(w => w.hostile && w.hp > 0),
    ];

    if (summon.hp < def.hp * 0.2) {
        summon.guardState = 'retreating';
        const owner = game.colonists.find(c => c.id === summon.ownerId && c.hp > 0);
        if (owner) moveToward(summon, owner, game.map, dur);
        return;
    }

    let target = null;
    let minDist = def.guardRadius;
    for (const h of hostiles) {
        const d = manhattanDist(summon.x, summon.y, h.x, h.y);
        if (d < minDist) { minDist = d; target = h; }
    }

    if (target) {
        summon.guardState = 'engaging';
        const dist = manhattanDist(summon.x, summon.y, target.x, target.y);
        if (dist <= 1) {
            target.hp -= summon.damage;
            game.combatEffects.push({ x: target.x, y: target.y, char: '!', color: summon.color, ttl: 2 });
        } else {
            moveToward(summon, target, game.map, dur);
        }
    } else {
        summon.guardState = 'patrolling';
        const owner = game.colonists.find(c => c.id === summon.ownerId && c.hp > 0);
        if (owner) {
            const dist = manhattanDist(summon.x, summon.y, owner.x, owner.y);
            if (dist > def.patrolRadius) {
                moveToward(summon, owner, game.map, dur);
            } else if (Math.random() < 0.1) {
                randomMoveNear(summon, owner, game.map, dur, def.patrolRadius);
            }
        }
    }
}

function moveToward(entity, target, map, dur) {
    const dx = Math.sign(target.x - entity.x);
    const dy = Math.sign(target.y - entity.y);
    if (Math.random() < 0.5 && dx !== 0) {
        if (isPassable(map, entity.x + dx, entity.y)) { moveEntity(entity, entity.x + dx, entity.y, dur); return; }
    }
    if (dy !== 0) {
        if (isPassable(map, entity.x, entity.y + dy)) { moveEntity(entity, entity.x, entity.y + dy, dur); return; }
    }
    if (dx !== 0) {
        if (isPassable(map, entity.x + dx, entity.y)) { moveEntity(entity, entity.x + dx, entity.y, dur); }
    }
}

function randomMoveNear(entity, anchor, map, dur, radius) {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const dir = dirs[Math.floor(Math.random() * 4)];
    const nx = entity.x + dir[0];
    const ny = entity.y + dir[1];
    if (nx < 0 || nx >= CONFIG.MAP_WIDTH || ny < 0 || ny >= CONFIG.MAP_HEIGHT) return;
    if (manhattanDist(nx, ny, anchor.x, anchor.y) <= radius && isPassable(map, nx, ny)) {
        moveEntity(entity, nx, ny, dur);
    }
}

function emitSparkles(game, x, y, color) {
    const chars = ['*', '✦', '·'];
    for (let i = 0; i < 3; i++) {
        const ox = x + Math.floor(Math.random() * 3) - 1;
        const oy = y + Math.floor(Math.random() * 3) - 1;
        game.combatEffects.push({
            x: ox, y: oy,
            char: chars[Math.floor(Math.random() * chars.length)],
            color,
            ttl: 3 + Math.floor(Math.random() * 3),
        });
    }
}
