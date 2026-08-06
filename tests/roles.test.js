// Guards initEntityRoles — the role-state initializer that the Phase-2a
// ensureEntityRoles helper will wrap. Entities carry a `roles` array (behavior
// definitions); initEntityRoles calls each role handler's init() to populate
// per-role mutable state in `roleState`, skipping any role already present so
// accumulated state survives a re-init.
import { describe, it, expect } from 'vitest';
import { initEntityRoles } from '../js/entities/roles.js';

describe('initEntityRoles', () => {
    it('runs each role handler init to populate roleState', () => {
        // The production handler seeds { cooldown: produceRate || 80 }.
        const entity = { roles: [{ type: 'production', produceRate: 50 }] };
        initEntityRoles(entity);
        expect(entity.roleState.production).toEqual({ cooldown: 50 });
    });

    it('defaults produceRate when the role omits it', () => {
        const entity = { roles: [{ type: 'production' }] };
        initEntityRoles(entity);
        expect(entity.roleState.production.cooldown).toBe(80);
    });

    it('does not re-init a role whose state already exists', () => {
        const entity = {
            roles: [{ type: 'production', produceRate: 50 }],
            roleState: { production: { cooldown: 3 } },   // mid-countdown
        };
        initEntityRoles(entity);
        expect(entity.roleState.production.cooldown).toBe(3);   // preserved, not reset to 50
    });

    it('creates an empty roleState and handles an entity with no roles', () => {
        const entity = { roles: [] };
        expect(() => initEntityRoles(entity)).not.toThrow();
        expect(entity.roleState).toEqual({});
    });

    it('ignores roles with no matching handler without throwing', () => {
        const entity = { roles: [{ type: 'not_a_real_role' }] };
        expect(() => initEntityRoles(entity)).not.toThrow();
        expect(entity.roleState).toEqual({});
    });
});
