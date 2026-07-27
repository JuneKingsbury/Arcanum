import { RECIPES, WORK_CONFIG } from '../core/config.js';

export function queueCraftingOrder(game, recipeKey) {
    const recipe = RECIPES[recipeKey];
    if (!recipe) return false;
    if (recipe.research && !game.research.isResearched(recipe.research)) return false;
    if (!game.resources.has(recipe.input)) return false;

    const stationType = recipe.station;
    const station = findAvailableStation(game, stationType);
    if (!station) return false;

    game.resources.deduct(recipe.input);

    let workAmount = recipe.ticks;
    if (stationType === 'workbench' && station.powered) {
        workAmount = Math.ceil(workAmount / WORK_CONFIG.poweredWorkbenchDivisor);
    }

    game.taskQueue.add({
        type: recipe.skill === 'cooking' ? 'cook' : 'craft',
        skillRequired: recipe.skill,
        x: station.x,
        y: station.y,
        workAmount,
        recipe,
    });

    return true;
}

function findAvailableStation(game, stationType) {
    let usePowered = stationType === 'workbench' && game.research.isResearched('arcane_infusion') && game.power.hasPower();

    if (usePowered) {
        for (let y = 0; y < game.map.length; y++) {
            for (let x = 0; x < game.map[y].length; x++) {
                if (game.map[y][x].structure === 'enchanting_table') {
                    return { x, y, powered: true };
                }
            }
        }
    }

    for (let y = 0; y < game.map.length; y++) {
        for (let x = 0; x < game.map[y].length; x++) {
            if (game.map[y][x].structure === stationType) {
                return { x, y, powered: false };
            }
        }
    }
    return null;
}

export function getAvailableRecipes(game) {
    const available = [];
    for (const [key, recipe] of Object.entries(RECIPES)) {
        if (recipe.research && !game.research.isResearched(recipe.research)) continue;
        const hasResources = game.resources.has(recipe.input);
        const hasStation = findAvailableStation(game, recipe.station) !== null;
        available.push({ key, recipe, hasResources, hasStation, canCraft: hasResources && hasStation });
    }
    return available;
}

export function updateAutoCook(game) {
    const target = game.settings.autoCookTarget || 0;
    if (target <= 0) return;

    const recipe = RECIPES.cook_meal;
    if (!recipe) return;
    if (!findAvailableStation(game, recipe.station)) return;

    const currentFood = game.resources.stockpile.food || 0;
    const pendingCookTasks = game.taskQueue.getAll().filter(t => t.type === 'cook').length;
    const expectedFood = currentFood + pendingCookTasks * recipe.output.food;

    if (expectedFood < target && game.resources.has(recipe.input)) {
        queueCraftingOrder(game, 'cook_meal');
    }
}

export function updateAutoCraft(game) {
    const targets = game.settings.craftTargets;
    if (!targets) return;

    for (const [recipeKey, config] of Object.entries(targets)) {
        if (!config.repeat && !config.target) continue;
        if (recipeKey === 'cook_meal' && game.settings.autoCookTarget > 0) continue;

        const recipe = RECIPES[recipeKey];
        if (!recipe) continue;
        if (recipe.research && !game.research.isResearched(recipe.research)) continue;
        if (!findAvailableStation(game, recipe.station)) continue;
        if (!game.resources.has(recipe.input)) continue;

        const pendingForRecipe = game.taskQueue.getAll().filter(t =>
            t.recipe && Object.keys(t.recipe.output)[0] === Object.keys(recipe.output)[0]
        ).length;

        let shouldQueue = false;
        if (config.target > 0) {
            const outputKey = Object.keys(recipe.output)[0];
            const current = game.resources.stockpile[outputKey] || 0;
            const expected = current + pendingForRecipe * (recipe.output[outputKey] || 1);
            shouldQueue = expected < config.target;
        } else if (config.repeat) {
            shouldQueue = pendingForRecipe === 0;
        }

        if (shouldQueue) queueCraftingOrder(game, recipeKey);
    }
}
