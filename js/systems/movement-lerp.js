import { CONFIG } from '../core/config.js';

export function moveEntity(entity, newX, newY, durationMs) {
    if (entity.x === newX && entity.y === newY) return;
    entity._prevX = entity.x;
    entity._prevY = entity.y;
    entity._moveStartTime = performance.now();
    entity._moveDuration = durationMs;
    entity.x = newX;
    entity.y = newY;
}

export function teleportEntity(entity, newX, newY) {
    entity._prevX = null;
    entity._prevY = null;
    entity._moveStartTime = 0;
    entity._moveDuration = 0;
    entity.x = newX;
    entity.y = newY;
}

const _pos = { x: 0, y: 0 };

export function getEntityRenderPos(entity, now) {
    if (entity._prevX == null || entity._moveDuration <= 0) {
        _pos.x = entity.x;
        _pos.y = entity.y;
        return _pos;
    }
    const elapsed = now - entity._moveStartTime;
    if (elapsed >= entity._moveDuration) {
        entity._prevX = null;
        entity._prevY = null;
        _pos.x = entity.x;
        _pos.y = entity.y;
        return _pos;
    }
    const t = elapsed / entity._moveDuration;
    const eased = t * (2 - t);
    _pos.x = entity._prevX + (entity.x - entity._prevX) * eased;
    _pos.y = entity._prevY + (entity.y - entity._prevY) * eased;
    return _pos;
}

export function isEntityMoving(entity) {
    return entity._prevX != null;
}

export function computeMoveDuration(terrainCost, moveBonus, gameSpeed) {
    let effectiveCost = Math.max(1, terrainCost);
    if (moveBonus > 0 && effectiveCost > 1) {
        effectiveCost = Math.max(1, Math.round(effectiveCost * (1 - moveBonus)));
    }
    return CONFIG.TICK_RATE * effectiveCost / gameSpeed;
}
