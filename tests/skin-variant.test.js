// Guards SkinManager.resolveColonistVariant — the single place the appearance
// precedence rule lives. Colonists store their look decoupled from spawn order:
// an explicit per-pack choice wins, else a stable random seed mapped into the
// pack's range, else legacy id-ordering (old saves predate skinSeed).
//
// resolveColonistVariant is pure (no DOM), so we construct a SkinManager and set
// its variant count / active pack directly rather than loading real sprites.
import { describe, it, expect, beforeEach } from 'vitest';
import { SkinManager } from '../js/ui/skin-manager.js';

describe('SkinManager.resolveColonistVariant', () => {
    let sm;
    beforeEach(() => {
        sm = new SkinManager();
        sm._activeSkin = 'fantasy';
        sm._colonistVariantCount = 4;
    });

    it('returns 0 when the active pack has no variants', () => {
        sm._colonistVariantCount = 0;
        expect(sm.resolveColonistVariant(1, 123, { fantasy: 2 })).toBe(0);
    });

    it('honors an explicit per-pack choice over seed and id', () => {
        expect(sm.resolveColonistVariant(1, 999, { fantasy: 3 })).toBe(3);
    });

    it('only applies a choice made for the ACTIVE pack', () => {
        // A choice stored for a different pack must not leak into this one; it
        // falls through to the seed instead.
        expect(sm.resolveColonistVariant(1, 5, { otherPack: 2 })).toBe((5 % 4) + 1);
    });

    it('clamps an explicit choice that exceeds the current pack size', () => {
        // A pack swapped for one with fewer variants: choice 7 wraps into 1..4.
        // ((7-1) % 4) + 1 = 3.
        expect(sm.resolveColonistVariant(1, 0, { fantasy: 7 })).toBe(3);
    });

    it('falls back to the seed (decoupled from id) when no choice is set', () => {
        // seed 6 % 4 + 1 = 3 — independent of the colonist id passed in.
        expect(sm.resolveColonistVariant(1, 6, {})).toBe(3);
        expect(sm.resolveColonistVariant(999, 6, {})).toBe(3);
    });

    it('falls back to legacy id-ordering when there is no seed (old saves)', () => {
        // skinSeed undefined -> ((id-1) % count) + 1, the pre-feature behavior.
        expect(sm.resolveColonistVariant(1, undefined, {})).toBe(1);
        expect(sm.resolveColonistVariant(5, undefined, {})).toBe((5 - 1) % 4 + 1); // 2
    });

    it('treats a null skinVariants map as no choice', () => {
        expect(sm.resolveColonistVariant(1, 6, null)).toBe(3);
        expect(sm.resolveColonistVariant(1, undefined, undefined)).toBe(1);
    });
});
