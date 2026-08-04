import { HELMETS, EQUIPMENT_OVERLAY_OFFSETS } from '../core/config.js';

export class SkinManager {
    constructor() {
        this._sprites = new Map();
        this._skinNames = ['ascii'];
        this._activeSkin = 'ascii';
        this._colonistVariantCount = 0;
        this._compositeCache = new Map();
    }

    get isActive() {
        return this._activeSkin !== 'ascii' && this._sprites.size > 0;
    }

    get activeSkin() {
        return this._activeSkin;
    }

    get colonistVariantCount() {
        return this._colonistVariantCount;
    }

    getSkinNames() {
        return this._skinNames;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        const discovered = await this._discoverSkins();
        if (discovered.length > 0) {
            this._skinNames = ['ascii', ...discovered];
        } else {
            try {
                const resp = await fetch('skins/index.json');
                if (resp.ok) {
                    const names = await resp.json();
                    this._skinNames = names;
                }
            } catch (e) {
                // index.json missing or malformed — just use ascii
            }
        }
    }

    async _discoverSkins() {
        try {
            const resp = await fetch('skins/');
            if (!resp.ok) return [];
            const ct = resp.headers.get('content-type') || '';
            if (!ct.includes('text/html')) return [];
            const html = await resp.text();
            if (!html.includes('.skin.zip')) return [];
            const matches = html.match(/[a-zA-Z0-9][\w.-]*\.skin\.zip/g) || [];
            const names = [...new Set(matches.map(m => m.replace('.skin.zip', '')))];
            return names.sort();
        } catch (e) {
            return [];
        }
    }

    async switchSkin(skinName) {
        if (skinName === 'ascii') {
            this._sprites.clear();
            this._activeSkin = 'ascii';
            this._colonistVariantCount = 0;
            this._itemDataURLCache = null;
            this._compositeCache.clear();
            return;
        }
        await this._loadSkin(skinName);
        this._activeSkin = skinName;
        this._itemDataURLCache = null;
        this._compositeCache.clear();
    }

    getSprite(category, key) {
        return this._sprites.get(category + ':' + key) || null;
    }

    getItemSprite(itemKey) {
        return this._sprites.get('items:' + itemKey) || null;
    }

    getMaterialSprite(materialKey) {
        return this._sprites.get('materials:' + materialKey) || null;
    }

    getItemSpriteDataURL(itemKey) {
        if (!this._itemDataURLCache) this._itemDataURLCache = new Map();
        if (this._itemDataURLCache.has(itemKey)) return this._itemDataURLCache.get(itemKey);
        const sprite = this.getItemSprite(itemKey) || this.getMaterialSprite(itemKey);
        if (!sprite) { this._itemDataURLCache.set(itemKey, null); return null; }
        const c = document.createElement('canvas');
        c.width = sprite.width || sprite.naturalWidth || 16;
        c.height = sprite.height || sprite.naturalHeight || 16;
        const ctx = c.getContext('2d');
        ctx.drawImage(sprite, 0, 0);
        const url = c.toDataURL('image/png');
        this._itemDataURLCache.set(itemKey, url);
        return url;
    }

    getColonistSprite(colonistId, drafted, gender) {
        if (drafted) {
            if (gender) {
                const s = this._sprites.get('entities:colonist_' + gender + '_drafted');
                if (s) return s;
            }
            const s = this._sprites.get('entities:colonist_drafted');
            if (s) return s;
        }
        if (this._colonistVariantCount > 0) {
            const variant = ((colonistId - 1) % this._colonistVariantCount) + 1;
            if (gender) {
                const s = this._sprites.get('entities:colonist_' + gender + '_' + variant);
                if (s) return s;
            }
            const s = this._sprites.get('entities:colonist_' + variant);
            if (s) return s;
        }
        if (gender) {
            const s = this._sprites.get('entities:colonist_' + gender);
            if (s) return s;
        }
        return this._sprites.get('entities:colonist') || null;
    }

    getColonistSleepingSprite() {
        return this._sprites.get('entities:colonist_sleeping') || null;
    }

    getCompositedColonistSprite(colonistId, drafted, armorKey, helmetKey, gender, weaponKey, toolKey) {
        if (!armorKey && !helmetKey && !weaponKey && !toolKey) return this.getColonistSprite(colonistId, drafted, gender);

        const cacheKey = `${colonistId}:${drafted}:${armorKey || ''}:${helmetKey || ''}:${gender || ''}:${weaponKey || ''}:${toolKey || ''}`;
        if (this._compositeCache.has(cacheKey)) return this._compositeCache.get(cacheKey);

        const base = this.getColonistSprite(colonistId, drafted, gender);
        if (!base) return null;

        const armorSprite = armorKey ? this._sprites.get('equipment_worn:' + armorKey) : null;
        const helmetSprite = helmetKey ? this._sprites.get('equipment_worn:' + helmetKey) : null;
        const weaponSprite = weaponKey ? this._sprites.get('equipment_worn:' + weaponKey) : null;
        const toolSprite = toolKey ? this._sprites.get('equipment_worn:' + toolKey) : null;

        if (!armorSprite && !helmetSprite && !weaponSprite && !toolSprite) {
            this._compositeCache.set(cacheKey, base);
            return base;
        }

        const cw = base.width || base.naturalWidth || 16;
        const ch = base.height || base.naturalHeight || 16;
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(base, 0, 0, cw, ch);
        if (armorSprite) {
            const offX = Math.floor(cw * (EQUIPMENT_OVERLAY_OFFSETS.armor.offsetX || 0));
            const offY = Math.floor(ch * (EQUIPMENT_OVERLAY_OFFSETS.armor.offsetY || 0));
            ctx.drawImage(armorSprite, offX, offY, cw, ch);
        }
        if (helmetSprite) {
            const offX = Math.floor(cw * (EQUIPMENT_OVERLAY_OFFSETS.helmet.offsetX || 0));
            const offY = Math.floor(ch * (EQUIPMENT_OVERLAY_OFFSETS.helmet.offsetY || 0));
            ctx.drawImage(helmetSprite, offX, offY, cw, ch);
        }
        if (weaponSprite) {
            const offX = Math.floor(cw * (EQUIPMENT_OVERLAY_OFFSETS.weapon.offsetX || 0));
            const offY = Math.floor(ch * (EQUIPMENT_OVERLAY_OFFSETS.weapon.offsetY || 0));
            ctx.drawImage(weaponSprite, offX, offY, cw, ch);
        }
        if (toolSprite) {
            const offX = Math.floor(cw * (EQUIPMENT_OVERLAY_OFFSETS.tool.offsetX || 0));
            const offY = Math.floor(ch * (EQUIPMENT_OVERLAY_OFFSETS.tool.offsetY || 0));
            ctx.drawImage(toolSprite, offX, offY, cw, ch);
        }

        this._compositeCache.set(cacheKey, canvas);
        return canvas;
    }

    invalidateComposite(colonistId) {
        for (const key of this._compositeCache.keys()) {
            if (key.startsWith(colonistId + ':')) {
                this._compositeCache.delete(key);
            }
        }
    }

    async _loadSkin(skinName) {
        this._sprites.clear();
        this._colonistVariantCount = 0;

        const loaded = await this._tryLoadFromZip(skinName) || await this._tryLoadFromFolder(skinName);
        if (!loaded) return;

        let count = 0;
        while (this._sprites.has('entities:colonist_' + (count + 1))) {
            count++;
        }
        this._colonistVariantCount = count;
    }

    async _tryLoadFromZip(skinName) {
        if (typeof JSZip === 'undefined') return false;
        try {
            const resp = await fetch(`skins/${skinName}.skin.zip`);
            if (!resp.ok) return false;
            const buf = await resp.arrayBuffer();
            const zip = await JSZip.loadAsync(buf);

            const manifestFile = zip.file('manifest.json');
            if (!manifestFile) return false;
            const manifest = JSON.parse(await manifestFile.async('string'));

            const loadPromises = [];
            for (const [category, keys] of Object.entries(manifest.sprites || {})) {
                for (const key of keys) {
                    const file = zip.file(`${category}/${key}.png`);
                    if (!file) continue;
                    loadPromises.push(
                        file.async('blob').then(blob => {
                            const url = URL.createObjectURL(blob);
                            return this._loadImage(url).then(img => {
                                URL.revokeObjectURL(url);
                                if (img) this._sprites.set(category + ':' + key, img);
                            });
                        })
                    );
                }
            }
            await Promise.all(loadPromises);
            return true;
        } catch (e) {
            return false;
        }
    }

    async _tryLoadFromFolder(skinName) {
        const basePath = `skins/${skinName}`;
        let manifest;
        try {
            const resp = await fetch(`${basePath}/manifest.json`);
            if (!resp.ok) return false;
            manifest = await resp.json();
        } catch (e) {
            return false;
        }

        const loadPromises = [];
        for (const [category, keys] of Object.entries(manifest.sprites || {})) {
            for (const key of keys) {
                const path = `${basePath}/${category}/${key}.png`;
                loadPromises.push(this._loadImage(path).then(img => {
                    if (img) this._sprites.set(category + ':' + key, img);
                }));
            }
        }
        await Promise.all(loadPromises);
        return true;
    }

    _loadImage(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }
}
