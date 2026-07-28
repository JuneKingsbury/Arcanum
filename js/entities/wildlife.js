import { CONFIG, ANIMALS, SEASON_EFFECTS, WILDLIFE_CONFIG } from '../core/config.js';
import { isPassableForAnimals } from '../world/map.js';
import { manhattanDist } from '../world/pathfinding.js';
import { colonistTakeDamage } from './colonist.js';
import { moveEntity } from '../systems/movement-lerp.js';
import { createWildAnimal } from './entity-factory.js';

export function updateWildlife(game) {
    maybeSpawnAnimal(game);
    syncAnimalTasks(game);

    for (let i = game.entities.length - 1; i >= 0; i--) {
        const animal = game.entities[i];
        if (animal.category !== 'animal' || animal.tamed) continue;
        if (animal.hp <= 0) {
            const def = ANIMALS[animal.type];
            if (def) {
                const yield_ = { meat: def.meatYield };
                if (def.hideYield) yield_.hides = def.hideYield;
                game.resources.add(yield_);
            }
            game.entities.splice(i, 1);
            continue;
        }
        updateAnimal(animal, game);
    }
}

function maybeSpawnAnimal(game) {
    const spawnRate = SEASON_EFFECTS[game.weather.season].animalSpawnRate;
    if (Math.random() > spawnRate) return;
    const wildCount = game.entities.filter(e => e.category === 'animal' && !e.tamed).length;
    if (wildCount >= WILDLIFE_CONFIG.maxCount) return;

    const edge = getRandomEdge();
    const type = pickAnimalType(game);
    if (!type) return;
    if (ANIMALS[type].hostile && CONFIG.PEACEFUL_MODE) return;

    const animal = createWildAnimal(type, edge.x, edge.y);
    game.entities.push(animal);
}

const _spawnTable = (() => {
    const entries = [];
    let total = 0;
    for (const [type, def] of Object.entries(ANIMALS)) {
        if (def.spawnWeight > 0 && !def.spawnCondition) {
            total += def.spawnWeight;
            entries.push({ type, cumulative: total });
        }
    }
    return { entries, total };
})();

function pickAnimalType(game) {
    if (!CONFIG.PEACEFUL_MODE && (game.weather.season === 'winter' || game.timeOfDay / CONFIG.TICKS_PER_DAY > WILDLIFE_CONFIG.wolfNightThreshold)) {
        if (Math.random() < 0.3) return 'wolf';
    }
    const roll = Math.random() * _spawnTable.total;
    for (const entry of _spawnTable.entries) {
        if (roll < entry.cumulative) return entry.type;
    }
    return _spawnTable.entries[0]?.type || 'rabbit';
}

function getRandomEdge() {
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: return { x: Math.floor(Math.random() * CONFIG.MAP_WIDTH), y: 0 };
        case 1: return { x: CONFIG.MAP_WIDTH - 1, y: Math.floor(Math.random() * CONFIG.MAP_HEIGHT) };
        case 2: return { x: Math.floor(Math.random() * CONFIG.MAP_WIDTH), y: CONFIG.MAP_HEIGHT - 1 };
        case 3: return { x: 0, y: Math.floor(Math.random() * CONFIG.MAP_HEIGHT) };
    }
}

function updateAnimal(animal, game) {
    animal.moveCooldown -= animal.speed;
    if (animal.moveCooldown > 0) return;
    animal.moveCooldown = 1;

    const def = ANIMALS[animal.type];

    if (def.tameable && isBeingTamed(animal, game)) return;

    const dur = CONFIG.TICK_RATE / (animal.speed * game.speed);
    if (def.hostile) {
        updateHostileAnimal(animal, def, game, dur);
    } else {
        updatePassiveAnimal(animal, def, game, dur);
    }

    if (animal.x < 0 || animal.x >= CONFIG.MAP_WIDTH || animal.y < 0 || animal.y >= CONFIG.MAP_HEIGHT) {
        animal.hp = 0;
    }
}

function syncAnimalTasks(game) {
    for (const task of game.taskQueue.getAll()) {
        if (task.type !== 'hunt' && task.type !== 'tame') continue;
        const animal = game.entities.find(a => a.id === task.targetAnimalId && a.category === 'animal');
        if (!animal || animal.hp <= 0) {
            game.taskQueue.remove(task.id);
        } else if (task.x !== animal.x || task.y !== animal.y) {
            game.taskQueue.updatePosition(task.id, animal.x, animal.y);
        }
    }
}

function isBeingTamed(animal, game) {
    return game.taskQueue.getAll().some(t => t.type === 'tame' && t.targetAnimalId === animal.id);
}

function updatePassiveAnimal(animal, def, game, dur) {
    if (isBeingTamed(animal, game)) return;

    const nearestColonist = findNearestColonist(animal, game);
    if (nearestColonist && manhattanDist(animal.x, animal.y, nearestColonist.x, nearestColonist.y) <= def.fleeRange) {
        fleeFrom(animal, nearestColonist, game.map, dur);
        return;
    }

    if (Math.random() < WILDLIFE_CONFIG.passiveMoveChance) {
        randomMove(animal, game.map, dur);
    }
}

function updateHostileAnimal(animal, def, game, dur) {
    const nearestColonist = findNearestColonist(animal, game);
    if (!nearestColonist) {
        randomMove(animal, game.map, dur);
        return;
    }

    const dist = manhattanDist(animal.x, animal.y, nearestColonist.x, nearestColonist.y);

    if (dist <= 1) {
        colonistTakeDamage(nearestColonist, def.damage, game, animal);
    } else if (dist <= def.aggroRange) {
        moveToward(animal, nearestColonist, game.map, dur);
    } else {
        if (Math.random() < WILDLIFE_CONFIG.hostileIdleMoveChance) randomMove(animal, game.map, dur);
    }
}

function findNearestColonist(animal, game) {
    if (game.spatial) {
        return game.spatial.colonists.findNearest(animal.x, animal.y, WILDLIFE_CONFIG.animalSearchRadius, null);
    }
    let nearest = null;
    let minDist = Infinity;
    for (const c of game.colonists) {
        if (c.hp <= 0) continue;
        const dist = manhattanDist(animal.x, animal.y, c.x, c.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = c;
        }
    }
    return nearest;
}

function fleeFrom(animal, threat, map, dur) {
    const dx = Math.sign(animal.x - threat.x);
    const dy = Math.sign(animal.y - threat.y);
    const nx = animal.x + dx;
    const ny = animal.y + dy;
    if (isPassableForAnimals(map, nx, ny)) {
        moveEntity(animal, nx, ny, dur);
    } else {
        randomMove(animal, map, dur);
    }
}

function moveToward(animal, target, map, dur) {
    const dx = Math.sign(target.x - animal.x);
    const dy = Math.sign(target.y - animal.y);
    if (Math.random() < 0.5 && dx !== 0) {
        const nx = animal.x + dx;
        if (isPassableForAnimals(map, nx, animal.y)) { moveEntity(animal, nx, animal.y, dur); return; }
    }
    if (dy !== 0) {
        const ny = animal.y + dy;
        if (isPassableForAnimals(map, animal.x, ny)) { moveEntity(animal, animal.x, ny, dur); return; }
    }
    if (dx !== 0) {
        const nx = animal.x + dx;
        if (isPassableForAnimals(map, nx, animal.y)) { moveEntity(animal, nx, animal.y, dur); }
    }
}

function randomMove(animal, map, dur) {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const dir = dirs[Math.floor(Math.random() * 4)];
    const nx = animal.x + dir[0], ny = animal.y + dir[1];
    if (isPassableForAnimals(map, nx, ny)) {
        moveEntity(animal, nx, ny, dur);
    }
}

export function designateHunt(game, animalId) {
    const animal = game.entities.find(a => a.id === animalId && a.category === 'animal' && !a.tamed);
    if (!animal) return false;

    game.taskQueue.add({
        type: 'hunt',
        skillRequired: 'animals',
        x: animal.x,
        y: animal.y,
        workAmount: 1,
        targetAnimalId: animalId,
    });
    return true;
}
