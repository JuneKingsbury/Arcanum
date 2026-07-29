import { COLONIST_CONFIG, THOUGHTS, WEAPONS, ARMORS, HELMETS, TOOLS, ARTIFACTS, POTIONS, BUILDINGS, RESOURCES, IMPASSABLE_STRUCTURES, WORK_CONFIG, QUALITY_TIERS, TAMED_ANIMALS, MAGIC_STUDY_CONFIG, SPELL_TOMES, SPELLS, MAGIC_SKILLS, COMBAT_VISUALS } from '../core/config.js';
import { completeTame, attemptDangerousTame } from './taming.js';
import { getPedestalEffect } from '../systems/artifacts.js';
import { getEquippedItems, getEquipmentStat, addThought, recalcMaxMana } from './colonist.js';
import { getHarvestYield } from '../systems/farming.js';

function applyQuality(item, colonist, ...statKeys) {
    const skill = colonist.skills.crafting || 1;
    const chances = QUALITY_TIERS.map(t => Math.max(0, t.baseChance + t.perSkill * skill));
    const total = chances.reduce((s, c) => s + c, 0);
    let roll = Math.random() * total;
    let tier = QUALITY_TIERS[1];
    for (let i = 0; i < QUALITY_TIERS.length; i++) {
        roll -= chances[i];
        if (roll <= 0) { tier = QUALITY_TIERS[i]; break; }
    }
    if (tier.key === 'normal') return;
    item.quality = tier.key;
    item.name = `${tier.prefix} ${item.name}`;
    for (const stat of statKeys) {
        if (item[stat]) item[stat] = Math.round(item[stat] * tier.multiplier * 100) / 100;
    }
}

function applyThought(colonist, thoughtKey, tick) {
    const t = THOUGHTS[thoughtKey];
    if (t) addThought(colonist, t.text, t.moodEffect, t.duration, tick);
}

function autoAssignNewBed(game, x, y) {
    let nearest = null, bestDist = Infinity;
    for (const c of game.colonists) {
        if (c.hp <= 0 || c.golem || c.assignedBed) continue;
        const d = Math.abs(c.x - x) + Math.abs(c.y - y);
        if (d < bestDist) { bestDist = d; nearest = c; }
    }
    if (nearest) nearest.assignedBed = { x, y };
}

function advanceTomeStudy(colonist, game, rate) {
    if (!colonist.equippedTome) return;
    const tomeKey = colonist.equippedTome;
    const tomeDef = SPELL_TOMES[tomeKey];
    if (!tomeDef) return;
    const spellDef = SPELLS[tomeDef.spell];
    if (!spellDef) return;
    if (colonist.knownSpells.includes(tomeDef.spell)) return;

    const school = spellDef.school;
    const currentLevel = colonist.magicSkills[school] || 0;
    if (currentLevel < tomeDef.minSchoolLevel) return;

    if (!colonist.tomeProgress) colonist.tomeProgress = {};
    if (!colonist.tomeProgress[tomeKey]) colonist.tomeProgress[tomeKey] = 0;
    const progressAmount = rate !== undefined ? rate : MAGIC_STUDY_CONFIG.studyTicksPerProgress;
    colonist.tomeProgress[tomeKey] += progressAmount;

    if (!colonist._magicXpAccumulator) colonist._magicXpAccumulator = {};
    if (!colonist._magicXpAccumulator[school]) colonist._magicXpAccumulator[school] = 0;
    colonist._magicXpAccumulator[school] += MAGIC_STUDY_CONFIG.xpPerStudyTick;
    if (colonist._magicXpAccumulator[school] >= 1.0) {
        colonist._magicXpAccumulator[school] -= 1.0;
        colonist.magicSkills[school] = Math.min(10, colonist.magicSkills[school] + 1);
        recalcMaxMana(colonist);
        game.notifications.push({ text: `${colonist.name}'s ${MAGIC_SKILLS[school].name} increased to ${colonist.magicSkills[school]}`, tick: game.tick, type: 'success' });
    }

    if (colonist.tomeProgress[tomeKey] >= tomeDef.learningWork) {
        colonist.knownSpells.push(tomeDef.spell);
        colonist.equippedTome = null;
        delete colonist.tomeProgress[tomeKey];
        applyThought(colonist, 'learned_spell', game.tick);
        game.notifications.push({ text: `${colonist.name} learned ${spellDef.name}!`, tick: game.tick, type: 'success' });
    }
}

export function completeTask(colonist, task, game) {
    switch (task.type) {
        case 'build': {
            const tile = game.map[task.y][task.x];
            const bDef = BUILDINGS[task.buildType];
            if (bDef && bDef.structureType === 'floor') {
                tile.floor = task.buildType;
            } else {
                tile.structure = task.buildType;
                tile.passable = !IMPASSABLE_STRUCTURES.has(task.buildType);
            }
            tile.designation = null;
            if (game.mapIndex) game.mapIndex.addStructure(task.x, task.y, task.buildType);
            if (task.buildType === 'bed') autoAssignNewBed(game, task.x, task.y);
            game.roomsDirty = true;
            if (game.waves && game.waves.active) game.waves.invalidatePathPreview();
            applyThought(colonist, 'built_something', game.tick);
            game.story.checkMilestone('first_building_placed', game);
            game.combatEffects.push({ x: task.x, y: task.y, char: COMBAT_VISUALS.buildCompleteChar, color: COMBAT_VISUALS.buildCompleteColor, ttl: COMBAT_VISUALS.buildCompleteTtl });
            break;
        }
        case 'chop':
        case 'mine': {
            const tile = game.map[task.y][task.x];
            if (tile.resource) {
                const rDef = RESOURCES[tile.resource.type];
                if (rDef) {
                    const output = {};
                    for (const [res, amt] of Object.entries(rDef.yield)) {
                        output[res] = rDef.perAmount ? tile.resource.amount * amt : amt;
                    }
                    game.resources.add(output);
                }
                tile.resource = null;
                if (task.type === 'mine') {
                    tile.terrain = 'dirt';
                    tile.passable = true;
                    game.combatEffects.push({ x: task.x, y: task.y, char: COMBAT_VISUALS.mineDustChar, color: COMBAT_VISUALS.mineDustColor, ttl: COMBAT_VISUALS.mineDustTtl });
                }
            }
            tile.designation = null;
            applyThought(colonist, 'good_work', game.tick);
            break;
        }
        case 'plant': {
            const tile = game.map[task.y][task.x];
            if (tile.zone) {
                tile.zone.state = 'growing';
                tile.zone.growth = 0;
            }
            break;
        }
        case 'harvest': {
            const tile = game.map[task.y][task.x];
            if (tile.zone) {
                const crop = tile.zone.crop;
                const yields = {};
                yields[crop] = getHarvestYield(game, crop);
                game.resources.add(yields);
                tile.zone.state = 'empty';
                tile.zone.growth = 0;
                applyThought(colonist, 'harvested', game.tick);
                game.combatEffects.push({ x: task.x, y: task.y, char: COMBAT_VISUALS.harvestChar, color: COMBAT_VISUALS.harvestColor, ttl: COMBAT_VISUALS.harvestTtl });
            }
            break;
        }
        case 'craft': {
            if (task.recipe) {
                const output = task.recipe.output;
                let handled = false;
                for (const key of Object.keys(output)) {
                    if (WEAPONS[key]) {
                        const item = { ...WEAPONS[key], key };
                        applyQuality(item, colonist, 'damage');
                        game.resources.addWeapon(item);
                        handled = true;
                    } else if (ARMORS[key]) {
                        const item = { ...ARMORS[key], key };
                        applyQuality(item, colonist, 'damageReduction');
                        game.resources.addArmor(item);
                        handled = true;
                    } else if (HELMETS[key]) {
                        const item = { ...HELMETS[key], key };
                        applyQuality(item, colonist, 'damageReduction');
                        game.resources.addHelmet(item);
                        handled = true;
                    } else if (TOOLS[key]) {
                        const item = { ...TOOLS[key], key };
                        applyQuality(item, colonist, 'miningSpeed', 'choppingSpeed', 'farmingSpeed', 'craftingSpeed');
                        game.resources.addTool(item);
                        handled = true;
                    } else if (ARTIFACTS[key]) {
                        game.resources.addArtifact({ ...ARTIFACTS[key], key });
                        handled = true;
                    } else if (POTIONS[key]) {
                        game.resources.addPotion({ ...POTIONS[key], type: key });
                        handled = true;
                    } else if (SPELL_TOMES[key]) {
                        game.resources.addTome({ ...SPELL_TOMES[key], key });
                        handled = true;
                    }
                }
                if (!handled) {
                    game.resources.add(output);
                }
                applyThought(colonist, 'crafted', game.tick);
                game.combatEffects.push({ x: colonist.x, y: colonist.y, char: COMBAT_VISUALS.craftCompleteChar, color: COMBAT_VISUALS.craftCompleteColor, ttl: COMBAT_VISUALS.craftCompleteTtl });
            }
            break;
        }
        case 'cook': {
            if (task.recipe) {
                const output = { ...task.recipe.output };
                let handled = false;
                for (const key of Object.keys(output)) {
                    if (POTIONS[key]) {
                        game.resources.addPotion({ ...POTIONS[key], type: key });
                        handled = true;
                    }
                }
                if (!handled) {
                    if (output.food && game.research.isResearched('alchemy')) {
                        output.food += WORK_CONFIG.alchemyFoodBonus;
                    }
                    const cookBonus = getPedestalEffect(game, 'cookingBonusFood');
                    if (output.food && cookBonus > 0) output.food += cookBonus;
                    game.resources.add(output);
                }
                applyThought(colonist, 'cooked', game.tick);
            }
            break;
        }
        case 'hunt': {
            if (task.targetAnimalId) {
                const animal = game.entities.find(a => a.id === task.targetAnimalId && a.category === 'animal' && !a.tamed);
                if (animal && animal.hp > 0) {
                    colonist.huntTargetId = task.targetAnimalId;
                    colonist.state = 'hunting';
                    colonist.currentTaskId = null;
                    colonist.workProgress = 0;
                    game.taskQueue.complete(task.id);
                    return;
                }
            }
            break;
        }
        case 'extinguish': {
            const tile = game.map[task.y][task.x];
            tile.onFire = false;
            tile.fireTimer = 0;
            if (game.mapIndex) game.mapIndex.removeFire(task.x, task.y);
            applyThought(colonist, 'put_out_fire', game.tick);
            break;
        }
        case 'research': {
            let researchPts = colonist.skills.research + 2;
            const researchMult = getEquipmentStat(colonist, 'researchSpeed');
            if (researchMult > 0) researchPts = Math.floor(researchPts * researchMult);
            const completedKey = game.research.addProgress(researchPts);
            if (completedKey) {
                const name = completedKey.replace(/_/g, ' ');
                game.notifications.push({ text: `Research complete: ${name}!`, tick: game.tick, type: 'success' });
                game.eventLog.add(game, `Research unlocked: ${name}`, 'success', null);
                game.story.checkMilestone(`research_${completedKey}`, game);
                game.combatEffects.push({ x: colonist.x, y: colonist.y, char: COMBAT_VISUALS.researchCompleteChar, color: COMBAT_VISUALS.researchCompleteColor, ttl: COMBAT_VISUALS.researchCompleteTtl });
            }
            let tomeRate = game.research.activeResearch
                ? MAGIC_STUDY_CONFIG.studyTicksPerProgress
                : MAGIC_STUDY_CONFIG.tomeStudyBonus;
            const tomeSpeedMult = getEquipmentStat(colonist, 'tomeStudySpeed');
            if (tomeSpeedMult > 0) tomeRate *= tomeSpeedMult;
            advanceTomeStudy(colonist, game, tomeRate);
            break;
        }
        case 'tame': {
            if (task.targetAnimalId) {
                const wildAnimal = game.entities.find(a => a.id === task.targetAnimalId && a.category === 'animal' && !a.tamed);
                const tamedDef = wildAnimal ? TAMED_ANIMALS[wildAnimal.type] : null;
                if (tamedDef && tamedDef.dangerousTame) {
                    const result = attemptDangerousTame(game, colonist, task.targetAnimalId);
                    if (result === 'success') {
                        applyThought(colonist, 'tamed_animal', game.tick);
                    }
                } else {
                    if (completeTame(game, task.targetAnimalId)) {
                        applyThought(colonist, 'tamed_animal', game.tick);
                    }
                }
            }
            break;
        }
        case 'repair': {
            const tile = game.map[task.y][task.x];
            if (tile.structure && tile.structureHp !== undefined) {
                tile.structureHp = undefined;
                applyThought(colonist, 'repaired', game.tick);
            }
            break;
        }
        case 'repair_artifact': {
            if (task.colonistId) {
                const target = game.getColonist(task.colonistId);
                if (target && target.artifactBroken) {
                    target.artifactBroken = false;
                    target._repairQueued = false;
                    const artName = target.artifact?.name || 'artifact';
                    game.eventLog.add(game, `${artName} repaired at the anvil`, 'success', null);
                }
            }
            if (game.resources.stockpile.runite >= 1) {
                game.resources.stockpile.runite -= 1;
            }
            applyThought(colonist, 'crafted', game.tick);
            break;
        }
        case 'deconstruct': {
            const tile = game.map[task.y][task.x];
            const target = tile.structure || tile.floor;
            if (target) {
                const def = BUILDINGS[target];
                if (def) {
                    const partial = {};
                    for (const [res, amt] of Object.entries(def.cost)) {
                        partial[res] = Math.ceil(amt * COLONIST_CONFIG.deconstructRecovery);
                    }
                    game.resources.add(partial);
                }
                if (tile.structure) {
                    if (game.mapIndex) game.mapIndex.removeStructure(task.x, task.y, tile.structure);
                    tile.structure = null;
                    tile.passable = true;
                } else {
                    if (game.mapIndex) game.mapIndex.removeStructure(task.x, task.y, tile.floor);
                    tile.floor = null;
                }
                tile.designation = null;
                game.roomsDirty = true;
                applyThought(colonist, 'deconstructed', game.tick);
            }
            break;
        }
    }

    game.taskQueue.complete(task.id);
    colonist.currentTaskId = null;
    colonist.state = 'idle';
    colonist.workProgress = 0;
}
