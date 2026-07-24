export class SkinManager {
    constructor() {
        this._sprites = new Map();
        this._skinNames = ['ascii'];
        this._activeSkin = 'ascii';
        this._colonistVariantCount = 0;
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
            return;
        }
        await this._loadSkin(skinName);
        this._activeSkin = skinName;
    }

    getSprite(category, key) {
        return this._sprites.get(category + ':' + key) || null;
    }

    getColonistSprite(colonistId, drafted) {
        if (drafted) {
            const s = this._sprites.get('entities:colonist_drafted');
            if (s) return s;
        }
        if (this._colonistVariantCount > 0) {
            const variant = (colonistId % this._colonistVariantCount) + 1;
            const s = this._sprites.get('entities:colonist_' + variant);
            if (s) return s;
        }
        return this._sprites.get('entities:colonist') || null;
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
