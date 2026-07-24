import { BUILDINGS, TERRAIN, RESOURCES, ANIMALS, GOLEM_TYPES, CROPS, COMBAT_VISUALS } from '../core/config.js';

const CANVAS_SIZES = [8, 16, 32, 64, 128];
const STORAGE_PREFIX = 'convocation_skin_editor_';
const CHECKERBOARD_LIGHT = '#3a3a3a';
const CHECKERBOARD_DARK = '#2a2a2a';
const MIN_ZOOM = 2;
const MAX_ZOOM = 64;

const ENTITY_SPECIALS = [
    { key: 'colonist_drafted', char: '@', color: '#ff4444', desc: 'Colonist in combat mode' },
    { key: 'golem', char: 'G', color: '#cc8833', desc: 'Default golem sprite' },
    { key: 'farmer_golem', char: 'G', color: '#55aa33', desc: 'Farmer Golem' },
    { key: 'miner_golem', char: 'G', color: '#888888', desc: 'Miner Golem' },
    { key: 'combat_golem', char: 'G', color: '#cc4444', desc: 'Combat Golem' },
    { key: 'hauler_golem', char: 'G', color: '#bbaa55', desc: 'Hauler Golem' },
    { key: 'raider', char: 'R', color: '#ff3333', desc: 'Enemy raider' },
    { key: 'wave_enemy', char: 'E', color: '#ff2222', desc: 'Void nexus wave enemy' },
];

const VARIANT_COLORS = ['#ffff00', '#00ffff', '#00ff00', '#ff88ff', '#ffaa00', '#88ffaa', '#ff8888', '#aaaaff'];

const EFFECT_ITEMS = [
    { key: 'fire', char: '^', color: '#ff4400', desc: 'Tile on fire' },
    { key: 'portal', char: 'Ø', color: '#ff55ff', desc: 'Void nexus portal' },
    { key: 'snow', char: '*', color: '#ffffff', desc: 'Snow overlay (winter grass)' },
    { key: 'rally', char: '⚑', color: '#ff4444', desc: 'Draft rally point' },
    { key: 'hit', char: '!', color: '#ffff00', desc: 'Melee hit / combat strike' },
    { key: 'damage_taken', char: '!', color: '#ff3333', desc: 'Colonist takes damage' },
    { key: 'structure_damage', char: '!', color: '#ff8800', desc: 'Structure being attacked' },
    { key: 'turret_shot', char: '*', color: '#ff4444', desc: 'Turret/sentinel shot projectile' },
    { key: 'spell_heal', char: '+', color: '#44ff44', desc: 'Healing spell effect' },
    { key: 'spell_buff', char: '>', color: '#88ffff', desc: 'Buff spell effect' },
    { key: 'spell_shield', char: 'O', color: '#4488ff', desc: 'Shield spell effect' },
    { key: 'spell_teleport', char: '@', color: '#33ccff', desc: 'Teleport spell effect' },
    { key: 'spell_growth', char: '%', color: '#44ff44', desc: 'Growth spell effect' },
    { key: 'spell_terraform', char: '.', color: '#88ff88', desc: 'Terraform spell effect' },
    { key: 'spell_divination', char: '?', color: '#ccaaff', desc: 'Divination spell effect' },
];

let editorInstance = null;

export function launchSkinEditor() {
    document.getElementById('start-screen').style.display = 'none';
    if (!editorInstance) {
        editorInstance = new SkinEditor();
    }
    editorInstance.show();
}

class SkinEditor {
    constructor() {
        this.canvasSize = 16;
        this.pixels = new Uint8ClampedArray(16 * 16 * 4);
        this.activeObject = null;
        this.skinName = 'my_skin';
        this.tool = 'draw';
        this.color = { r: 255, g: 255, b: 255, a: 255 };
        this.recentColors = [];
        this.showGrid = true;
        this.hoveredPixel = null;
        this.savedSprites = {};
        this.categoryFilter = 'Buildings';
        this.colonistVariants = 3;
        this.clipboard = null;
        this._undoStack = [];
        this._redoStack = [];
        this._maxUndo = 50;
        this._strokeSnapshot = null;
        this.zoom = 16;
        this.panX = 0;
        this.panY = 0;

        this._mouseDown = false;
        this._middleDown = false;
        this._lastDragPos = null;
        this._animFrame = null;

        this._buildDOM();
        this._bindEvents();
        this._loadSkinData();
    }

    show() {
        this.container.style.display = 'flex';
        requestAnimationFrame(() => {
            this._recalcZoom();
            if (!this._animFrame) this._startLoop();
        });
    }

    hide() {
        this.container.style.display = 'none';
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
    }

    _buildDOM() {
        this.container = document.getElementById('skin-editor');
        this.container.innerHTML = '';

        const toolbar = document.createElement('div');
        toolbar.id = 'se-toolbar';
        toolbar.innerHTML = `
            <button id="se-back">← Back</button>
            <span class="bp-sep"></span>
            <label>Skin: <input type="text" id="se-skin-name" value="${this.skinName}" placeholder="my_skin" maxlength="30"></label>
            <span class="bp-sep"></span>
            <label>Size:
                <select id="se-canvas-size">
                    ${CANVAS_SIZES.map(s => `<option value="${s}" ${s === this.canvasSize ? 'selected' : ''}>${s}x${s}</option>`).join('')}
                </select>
            </label>
            <span class="bp-sep"></span>
            <button id="se-tool-draw" class="se-tool active" data-tool="draw" title="Draw (1)">Draw</button>
            <button id="se-tool-erase" class="se-tool" data-tool="erase" title="Erase (2)">Erase</button>
            <button id="se-tool-fill" class="se-tool" data-tool="fill" title="Fill (3)">Fill</button>
            <button id="se-tool-pick" class="se-tool" data-tool="pick" title="Pick Color (4)">Pick</button>
            <span class="bp-sep"></span>
            <button id="se-toggle-grid" class="se-tool active" title="Toggle Grid (G)">Grid</button>
            <span class="bp-sep"></span>
            <button id="se-zoom-in" title="Zoom In (+)">+</button>
            <button id="se-zoom-out" title="Zoom Out (-)">-</button>
            <button id="se-zoom-reset" title="Reset Zoom (0)">Fit</button>
            <span class="bp-sep"></span>
            <button id="se-undo" title="Undo (Ctrl+Z)">Undo</button>
            <button id="se-redo" title="Redo (Ctrl+Y)">Redo</button>
            <button id="se-copy" title="Copy sprite to clipboard (C)">Copy</button>
            <button id="se-paste" title="Paste sprite from clipboard (V)">Paste</button>
            <span class="bp-sep"></span>
            <button id="se-clear">Clear</button>
            <button id="se-save">Save PNG</button>
            <button id="se-export-skin" title="Download skin as .zip file">Export .zip</button>
            <button id="se-import-zip" title="Import a .skin.zip to edit">Import .zip</button>
            <span class="bp-sep"></span>
            <select id="se-load-skin"><option value="">Load Skin...</option></select>
            <input type="file" id="se-import-file" accept=".zip" style="display:none">
        `;
        this.container.appendChild(toolbar);

        const workspace = document.createElement('div');
        workspace.id = 'se-workspace';

        const canvasArea = document.createElement('div');
        canvasArea.id = 'se-canvas-area';

        const canvasWrap = document.createElement('div');
        canvasWrap.id = 'se-canvas-wrap';
        const canvas = document.createElement('canvas');
        canvas.id = 'se-canvas';
        canvasWrap.appendChild(canvas);
        canvasArea.appendChild(canvasWrap);

        const previewArea = document.createElement('div');
        previewArea.id = 'se-preview-area';
        previewArea.innerHTML = `
            <div class="se-preview-label">Preview</div>
            <canvas id="se-preview-canvas"></canvas>
            <div id="se-active-object">No object selected</div>
        `;
        canvasArea.appendChild(previewArea);

        const statusBar = document.createElement('div');
        statusBar.id = 'se-status';
        statusBar.textContent = 'x: 0, y: 0';
        canvasArea.appendChild(statusBar);
        workspace.appendChild(canvasArea);

        const sidebar = document.createElement('div');
        sidebar.id = 'se-sidebar';
        sidebar.innerHTML = `
            <div class="bp-section">
                <div class="bp-section-title">Color</div>
                <div id="se-color-section">
                    <div class="se-color-row">
                        <input type="color" id="se-color-picker" value="#ffffff">
                        <input type="text" id="se-color-hex" value="#ffffff" maxlength="7" style="width:70px">
                    </div>
                    <div class="se-color-row">
                        <label>Opacity: <span id="se-alpha-val">255</span></label>
                        <input type="range" id="se-alpha-slider" min="0" max="255" value="255" style="width:100%">
                    </div>
                    <div id="se-current-color" title="Current color"></div>
                    <div id="se-recent-colors"></div>
                </div>
            </div>
            <div class="bp-section">
                <div class="bp-section-title">Objects</div>
                <div id="se-category-filter"></div>
                <div id="se-palette"></div>
            </div>
            <div class="bp-section">
                <div class="bp-section-title">Saved Sprites</div>
                <div id="se-saved-list"></div>
            </div>
        `;
        workspace.appendChild(sidebar);
        this.container.appendChild(workspace);

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.previewCanvas = document.getElementById('se-preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        this._buildCategoryFilter();
        this._buildPalette();
        this._refreshSavedList();
        this._refreshLoadDropdown();
        this._updateCurrentColor();
    }

    _buildCategoryFilter() {
        const categories = ['Buildings', 'Terrain', 'Resources', 'Entities', 'Floors', 'Farms', 'Effects'];
        const container = document.getElementById('se-category-filter');
        container.innerHTML = categories.map(c =>
            `<button class="bp-cat${c === this.categoryFilter ? ' active' : ''}" data-cat="${c}">${c}</button>`
        ).join('');
    }

    _buildPalette() {
        const palette = document.getElementById('se-palette');
        let items = [];

        switch (this.categoryFilter) {
            case 'Buildings':
                for (const [key, def] of Object.entries(BUILDINGS)) {
                    if (def.structureType === 'floor') continue;
                    items.push({ key, char: def.char, color: def.color, desc: def.description || key, category: 'buildings' });
                }
                break;
            case 'Terrain':
                for (const [key, def] of Object.entries(TERRAIN)) {
                    items.push({ key, char: def.char, color: def.color, desc: key, category: 'terrain' });
                }
                break;
            case 'Resources':
                for (const [key, def] of Object.entries(RESOURCES)) {
                    items.push({ key, char: def.char, color: def.color, desc: key, category: 'resources' });
                    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
                        if (def[season + 'Color']) {
                            items.push({ key: key + '_' + season, char: def.char, color: def[season + 'Color'], desc: `${key} (${season})`, category: 'resources' });
                        }
                    }
                }
                break;
            case 'Entities':
                for (let i = 1; i <= this.colonistVariants; i++) {
                    const color = VARIANT_COLORS[(i - 1) % VARIANT_COLORS.length];
                    items.push({ key: `colonist_${i}`, char: '@', color, desc: `Colonist variant ${i}`, category: 'entities', isVariant: i > 1 });
                }
                items.push({ key: '__add_variant__', char: '+', color: '#888888', desc: 'Add another colonist variant', category: 'entities', isAction: true });
                for (const e of ENTITY_SPECIALS) {
                    items.push({ key: e.key, char: e.char, color: e.color, desc: e.desc, category: 'entities' });
                }
                for (const [key, def] of Object.entries(ANIMALS)) {
                    items.push({ key, char: def.char, color: def.color, desc: key, category: 'entities' });
                }
                break;
            case 'Floors':
                for (const [key, def] of Object.entries(BUILDINGS)) {
                    if (def.structureType !== 'floor') continue;
                    items.push({ key, char: def.char, color: def.color, desc: def.description || key, category: 'floors' });
                }
                break;
            case 'Farms':
                items.push({ key: 'farm_empty', char: '=', color: '#8b6b3a', desc: 'Empty farm plot (generic)', category: 'farms' });
                items.push({ key: 'farm_growing', char: '%', color: '#55aa33', desc: 'Growing crop (generic)', category: 'farms' });
                items.push({ key: 'farm_ready', char: '*', color: '#ffdd00', desc: 'Ready to harvest (generic)', category: 'farms' });
                for (const [key, def] of Object.entries(CROPS)) {
                    items.push({ key: key + '_growing', char: def.char, color: def.color, desc: key + ' (growing)', category: 'farms' });
                    items.push({ key: key + '_ready', char: def.readyChar, color: def.color, desc: key + ' (ready)', category: 'farms' });
                }
                break;
            case 'Effects':
                for (const e of EFFECT_ITEMS) {
                    items.push({ key: e.key, char: e.char, color: e.color, desc: e.desc, category: 'effects' });
                }
                break;
        }

        let html = '';
        for (const item of items) {
            if (item.isAction) {
                html += `<div class="bp-palette-item se-add-variant" data-action="add-variant" title="${item.desc}">
                    <span style="color:${item.color}">${item.char}</span> Add colonist variant
                </div>`;
                continue;
            }
            const active = this.activeObject && this.activeObject.key === item.key && this.activeObject.category === item.category ? ' active' : '';
            const hasSaved = this.savedSprites[`${item.category}:${item.key}`] ? ' <span class="se-saved-badge">✓</span>' : '';
            const removeBtn = item.isVariant ? ` <span class="se-remove-variant" data-variant-key="${item.key}" title="Remove variant">✕</span>` : '';
            html += `<div class="bp-palette-item${active}" data-key="${item.key}" data-category="${item.category}" title="${item.desc}">
                <span style="color:${item.color}">${item.char}</span> ${item.key.replace(/_/g, ' ')}${hasSaved}${removeBtn}
            </div>`;
        }
        palette.innerHTML = html;
    }

    _bindEvents() {
        document.getElementById('se-back').addEventListener('click', () => this._goBack());
        document.getElementById('se-clear').addEventListener('click', () => this._clearCanvas());
        document.getElementById('se-save').addEventListener('click', () => this._savePNG());
        document.getElementById('se-export-skin').addEventListener('click', () => this._exportToSkinsFolder());
        document.getElementById('se-import-zip').addEventListener('click', () => document.getElementById('se-import-file').click());
        document.getElementById('se-import-file').addEventListener('change', (e) => this._importZip(e));
        document.getElementById('se-toggle-grid').addEventListener('click', () => this._toggleGrid());
        document.getElementById('se-undo').addEventListener('click', () => this._undo());
        document.getElementById('se-redo').addEventListener('click', () => this._redo());
        document.getElementById('se-copy').addEventListener('click', () => this._copySprite());
        document.getElementById('se-paste').addEventListener('click', () => this._pasteSprite());
        document.getElementById('se-zoom-in').addEventListener('click', () => this._zoomIn());
        document.getElementById('se-zoom-out').addEventListener('click', () => this._zoomOut());
        document.getElementById('se-zoom-reset').addEventListener('click', () => this._resetZoom());

        document.getElementById('se-skin-name').addEventListener('change', (e) => {
            this.skinName = e.target.value.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
            e.target.value = this.skinName;
            this.savedSprites = {};
            this._loadSkinData();
            this._refreshSavedList();
            this._buildPalette();
        });

        document.getElementById('se-canvas-size').addEventListener('change', (e) => {
            this._setCanvasSize(parseInt(e.target.value));
        });

        document.getElementById('se-load-skin').addEventListener('change', (e) => {
            if (e.target.value) this._loadSkinByName(e.target.value);
            e.target.value = '';
        });

        // Tools
        this.container.querySelectorAll('.se-tool[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => this._setTool(btn.dataset.tool));
        });

        // Category filter
        document.getElementById('se-category-filter').addEventListener('click', (e) => {
            const btn = e.target.closest('.bp-cat');
            if (!btn) return;
            this.categoryFilter = btn.dataset.cat;
            document.querySelectorAll('#se-category-filter .bp-cat').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this._buildPalette();
        });

        // Palette
        document.getElementById('se-palette').addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.se-remove-variant');
            if (removeBtn) {
                e.stopPropagation();
                this._removeVariant(removeBtn.dataset.variantKey);
                return;
            }
            const item = e.target.closest('.bp-palette-item');
            if (!item) return;
            if (item.dataset.action === 'add-variant') {
                this._addVariant();
                return;
            }
            this._selectObject(item.dataset.key, item.dataset.category);
        });

        // Color picker
        document.getElementById('se-color-picker').addEventListener('input', (e) => {
            this._setColorFromHex(e.target.value);
        });
        document.getElementById('se-color-hex').addEventListener('change', (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9a-f]{6}$/i.test(val)) {
                this._setColorFromHex(val);
            }
        });
        document.getElementById('se-alpha-slider').addEventListener('input', (e) => {
            this.color.a = parseInt(e.target.value);
            document.getElementById('se-alpha-val').textContent = this.color.a;
            this._updateCurrentColor();
        });

        // Recent colors
        document.getElementById('se-recent-colors').addEventListener('click', (e) => {
            const swatch = e.target.closest('.se-swatch');
            if (!swatch) return;
            const { r, g, b, a } = JSON.parse(swatch.dataset.color);
            this.color = { r, g, b, a };
            this._syncColorUI();
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => { this.hoveredPixel = null; this._mouseDown = false; this._middleDown = false; });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

        // Keyboard
        window.addEventListener('keydown', (e) => this._onKeyDown(e));

        // Resize
        window.addEventListener('resize', () => this._onResize());
    }

    _onMouseDown(e) {
        e.preventDefault();
        if (e.button === 1) {
            this._middleDown = true;
            this._lastDragPos = { x: e.clientX, y: e.clientY };
            return;
        }
        this._mouseDown = true;
        const pos = this._eventToPixel(e);
        if (!pos) return;

        this._strokeSnapshot = new Uint8ClampedArray(this.pixels);
        if (e.button === 2) {
            this._erasePixel(pos.x, pos.y);
        } else {
            this._applyTool(pos.x, pos.y);
        }
    }

    _onMouseMove(e) {
        if (this._middleDown) {
            const dx = e.clientX - this._lastDragPos.x;
            const dy = e.clientY - this._lastDragPos.y;
            this.panX += dx;
            this.panY += dy;
            this._lastDragPos = { x: e.clientX, y: e.clientY };
            return;
        }

        const pos = this._eventToPixel(e);
        this.hoveredPixel = pos;
        this._updateStatus(pos);

        if (this._mouseDown && pos) {
            if (e.buttons === 2) {
                this._erasePixel(pos.x, pos.y);
            } else {
                this._applyToolContinuous(pos.x, pos.y);
            }
        }
    }

    _onMouseUp(e) {
        if (e.button === 1) {
            this._middleDown = false;
            this._lastDragPos = null;
            return;
        }
        if (this._mouseDown) {
            this._mouseDown = false;
            this._pushUndo();
            this._autoSave();
        }
    }

    _onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldZoom = this.zoom;
        const delta = e.deltaY > 0 ? -1 : 1;
        let newZoom = this.zoom + delta * Math.max(1, Math.floor(this.zoom * 0.15));
        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        if (newZoom === oldZoom) return;

        const pixelX = (mouseX - this.panX) / oldZoom;
        const pixelY = (mouseY - this.panY) / oldZoom;
        this.zoom = newZoom;
        this.panX = mouseX - pixelX * newZoom;
        this.panY = mouseY - pixelY * newZoom;
    }

    _onResize() {
        const area = document.getElementById('se-canvas-wrap');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    _onKeyDown(e) {
        if (this.container.style.display === 'none') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this._undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            this._redo();
            return;
        }

        switch (e.key) {
            case '1': this._setTool('draw'); break;
            case '2': this._setTool('erase'); break;
            case '3': this._setTool('fill'); break;
            case '4': this._setTool('pick'); break;
            case 'g': case 'G': this._toggleGrid(); break;
            case 'c': case 'C': if (!e.ctrlKey && !e.metaKey) this._copySprite(); break;
            case 'v': case 'V': if (!e.ctrlKey && !e.metaKey) this._pasteSprite(); break;
            case '=': case '+': this._zoomIn(); break;
            case '-': case '_': this._zoomOut(); break;
            case '0': this._resetZoom(); break;
            case 'Escape': this._goBack(); break;
        }
    }

    _zoomIn() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const oldZoom = this.zoom;
        const newZoom = Math.min(MAX_ZOOM, this.zoom + Math.max(1, Math.floor(this.zoom * 0.25)));
        if (newZoom === oldZoom) return;
        const pixelX = (cx - this.panX) / oldZoom;
        const pixelY = (cy - this.panY) / oldZoom;
        this.zoom = newZoom;
        this.panX = cx - pixelX * newZoom;
        this.panY = cy - pixelY * newZoom;
    }

    _zoomOut() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const oldZoom = this.zoom;
        const newZoom = Math.max(MIN_ZOOM, this.zoom - Math.max(1, Math.floor(this.zoom * 0.25)));
        if (newZoom === oldZoom) return;
        const pixelX = (cx - this.panX) / oldZoom;
        const pixelY = (cy - this.panY) / oldZoom;
        this.zoom = newZoom;
        this.panX = cx - pixelX * newZoom;
        this.panY = cy - pixelY * newZoom;
    }

    _resetZoom() {
        const area = document.getElementById('se-canvas-wrap');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        const maxDim = Math.min(rect.width, rect.height) - 4;
        this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(maxDim / this.canvasSize)));
        this.panX = (rect.width - this.canvasSize * this.zoom) / 2;
        this.panY = (rect.height - this.canvasSize * this.zoom) / 2;
    }

    _eventToPixel(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left - this.panX) / this.zoom);
        const y = Math.floor((e.clientY - rect.top - this.panY) / this.zoom);
        if (x < 0 || x >= this.canvasSize || y < 0 || y >= this.canvasSize) return null;
        return { x, y };
    }

    _applyTool(x, y) {
        switch (this.tool) {
            case 'draw':
                this._setPixel(x, y, this.color.r, this.color.g, this.color.b, this.color.a);
                this._addRecentColor();
                break;
            case 'erase':
                this._erasePixel(x, y);
                break;
            case 'fill':
                this._floodFill(x, y);
                this._addRecentColor();
                break;
            case 'pick':
                this._pickColor(x, y);
                break;
        }
    }

    _applyToolContinuous(x, y) {
        if (this.tool === 'draw') {
            this._setPixel(x, y, this.color.r, this.color.g, this.color.b, this.color.a);
        } else if (this.tool === 'erase') {
            this._erasePixel(x, y);
        }
    }

    _setPixel(x, y, r, g, b, a) {
        const i = (y * this.canvasSize + x) * 4;
        this.pixels[i] = r;
        this.pixels[i + 1] = g;
        this.pixels[i + 2] = b;
        this.pixels[i + 3] = a;
    }

    _getPixel(x, y) {
        const i = (y * this.canvasSize + x) * 4;
        return { r: this.pixels[i], g: this.pixels[i + 1], b: this.pixels[i + 2], a: this.pixels[i + 3] };
    }

    _erasePixel(x, y) {
        this._setPixel(x, y, 0, 0, 0, 0);
    }

    _pickColor(x, y) {
        const { r, g, b, a } = this._getPixel(x, y);
        this.color = { r, g, b, a };
        this._syncColorUI();
        this._setTool('draw');
    }

    _floodFill(startX, startY) {
        const target = this._getPixel(startX, startY);
        const fill = { ...this.color };
        if (target.r === fill.r && target.g === fill.g && target.b === fill.b && target.a === fill.a) return;

        const size = this.canvasSize;
        const stack = [[startX, startY]];
        const visited = new Set();

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= size || y < 0 || y >= size) continue;
            const key = y * size + x;
            if (visited.has(key)) continue;
            visited.add(key);

            const px = this._getPixel(x, y);
            if (px.r !== target.r || px.g !== target.g || px.b !== target.b || px.a !== target.a) continue;

            this._setPixel(x, y, fill.r, fill.g, fill.b, fill.a);
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    _setTool(tool) {
        this.tool = tool;
        this.container.querySelectorAll('.se-tool[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    }

    _toggleGrid() {
        this.showGrid = !this.showGrid;
        document.getElementById('se-toggle-grid').classList.toggle('active', this.showGrid);
    }

    _setCanvasSize(size) {
        if (size === this.canvasSize) return;
        const oldPixels = this.pixels;
        const oldSize = this.canvasSize;
        this.canvasSize = size;
        this.pixels = new Uint8ClampedArray(size * size * 4);

        // Copy what fits from old canvas
        const copySize = Math.min(oldSize, size);
        for (let y = 0; y < copySize; y++) {
            for (let x = 0; x < copySize; x++) {
                const oldI = (y * oldSize + x) * 4;
                const newI = (y * size + x) * 4;
                this.pixels[newI] = oldPixels[oldI];
                this.pixels[newI + 1] = oldPixels[oldI + 1];
                this.pixels[newI + 2] = oldPixels[oldI + 2];
                this.pixels[newI + 3] = oldPixels[oldI + 3];
            }
        }
        this._recalcZoom();
    }

    _recalcZoom() {
        const area = document.getElementById('se-canvas-wrap');
        if (!area) return;
        const rect = area.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        const maxDim = Math.min(rect.width, rect.height) - 4;
        this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(maxDim / this.canvasSize)));
        this.panX = (rect.width - this.canvasSize * this.zoom) / 2;
        this.panY = (rect.height - this.canvasSize * this.zoom) / 2;
        this.previewCanvas.width = this.canvasSize;
        this.previewCanvas.height = this.canvasSize;
    }

    _selectObject(key, category) {
        this._autoSave();
        this._clearUndoHistory();
        this.activeObject = { key, category };
        const spriteKey = `${category}:${key}`;
        const saved = this.savedSprites[spriteKey];
        if (saved) {
            this._loadPixelsFromDataURL(saved.data, saved.size);
        } else {
            this.pixels = new Uint8ClampedArray(this.canvasSize * this.canvasSize * 4);
        }
        this._buildPalette();
        this._refreshSavedList();
        this._updateActiveObjectDisplay();
    }

    _updateActiveObjectDisplay() {
        const el = document.getElementById('se-active-object');
        if (!this.activeObject) {
            el.textContent = 'No object selected';
            return;
        }
        const { key, category } = this.activeObject;
        el.innerHTML = `<strong>${category}/${key}</strong>`;
    }

    _loadPixelsFromDataURL(dataURL, savedSize) {
        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvasSize;
            tempCanvas.height = this.canvasSize;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(img, 0, 0, this.canvasSize, this.canvasSize);
            const imageData = tempCtx.getImageData(0, 0, this.canvasSize, this.canvasSize);
            this.pixels = new Uint8ClampedArray(imageData.data);
        };
        img.src = dataURL;
    }

    // --- Color Management ---
    _setColorFromHex(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        this.color.r = r;
        this.color.g = g;
        this.color.b = b;
        this._syncColorUI();
    }

    _syncColorUI() {
        const hex = '#' + [this.color.r, this.color.g, this.color.b].map(c => c.toString(16).padStart(2, '0')).join('');
        document.getElementById('se-color-picker').value = hex;
        document.getElementById('se-color-hex').value = hex;
        document.getElementById('se-alpha-slider').value = this.color.a;
        document.getElementById('se-alpha-val').textContent = this.color.a;
        this._updateCurrentColor();
    }

    _updateCurrentColor() {
        const el = document.getElementById('se-current-color');
        if (!el) return;
        const { r, g, b, a } = this.color;
        el.style.background = `rgba(${r},${g},${b},${a / 255})`;
    }

    _addRecentColor() {
        const c = { ...this.color };
        const key = `${c.r},${c.g},${c.b},${c.a}`;
        this.recentColors = this.recentColors.filter(rc => `${rc.r},${rc.g},${rc.b},${rc.a}` !== key);
        this.recentColors.unshift(c);
        if (this.recentColors.length > 16) this.recentColors.pop();
        this._renderRecentColors();
    }

    _renderRecentColors() {
        const el = document.getElementById('se-recent-colors');
        if (!el) return;
        el.innerHTML = this.recentColors.map(c =>
            `<div class="se-swatch" data-color='${JSON.stringify(c)}' style="background:rgba(${c.r},${c.g},${c.b},${c.a / 255})" title="rgba(${c.r},${c.g},${c.b},${c.a})"></div>`
        ).join('');
    }

    // --- Rendering ---
    _startLoop() {
        const loop = () => {
            if (this.container.style.display === 'none') { this._animFrame = null; return; }
            this._render();
            this._renderPreview();
            this._animFrame = requestAnimationFrame(loop);
        };
        this._animFrame = requestAnimationFrame(loop);
    }

    _render() {
        const ctx = this.ctx;
        const size = this.canvasSize;
        const z = this.zoom;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const ox = this.panX;
        const oy = this.panY;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, cw, ch);

        // Checkerboard background within the pixel grid area
        const gridW = size * z;
        const gridH = size * z;
        ctx.save();
        ctx.beginPath();
        ctx.rect(ox, oy, gridW, gridH);
        ctx.clip();
        const checkSize = Math.max(1, Math.floor(z / 2));
        for (let y = 0; y < gridH; y += checkSize) {
            for (let x = 0; x < gridW; x += checkSize) {
                const cx = Math.floor(x / checkSize);
                const cy = Math.floor(y / checkSize);
                ctx.fillStyle = (cx + cy) % 2 === 0 ? CHECKERBOARD_LIGHT : CHECKERBOARD_DARK;
                ctx.fillRect(ox + x, oy + y, checkSize, checkSize);
            }
        }
        ctx.restore();

        // Draw pixels
        for (let py = 0; py < size; py++) {
            for (let px = 0; px < size; px++) {
                const i = (py * size + px) * 4;
                const a = this.pixels[i + 3];
                if (a === 0) continue;
                const r = this.pixels[i];
                const g = this.pixels[i + 1];
                const b = this.pixels[i + 2];
                ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
                ctx.fillRect(ox + px * z, oy + py * z, z, z);
            }
        }

        // Grid lines
        if (this.showGrid && z >= 4) {
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= size; i++) {
                ctx.moveTo(ox + i * z + 0.5, oy);
                ctx.lineTo(ox + i * z + 0.5, oy + gridH);
                ctx.moveTo(ox, oy + i * z + 0.5);
                ctx.lineTo(ox + gridW, oy + i * z + 0.5);
            }
            ctx.stroke();
        }

        // Border around the pixel grid
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox - 0.5, oy - 0.5, gridW + 1, gridH + 1);

        // Cursor highlight
        if (this.hoveredPixel) {
            const { x, y } = this.hoveredPixel;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(ox + x * z + 1, oy + y * z + 1, z - 2, z - 2);
        }
    }

    _renderPreview() {
        const ctx = this.previewCtx;
        const size = this.canvasSize;
        ctx.clearRect(0, 0, size, size);
        const imageData = new ImageData(this.pixels.slice(), size, size);
        ctx.putImageData(imageData, 0, 0);
    }

    _updateStatus(pos) {
        const el = document.getElementById('se-status');
        if (pos) {
            const px = this._getPixel(pos.x, pos.y);
            el.textContent = `x: ${pos.x}, y: ${pos.y} | rgba(${px.r}, ${px.g}, ${px.b}, ${px.a}) | Zoom: ${this.zoom}x`;
        } else {
            el.textContent = `${this.canvasSize}x${this.canvasSize} | ${this.tool} | Zoom: ${this.zoom}x | Scroll=Zoom, Middle-drag=Pan, 0=Reset`;
        }
    }

    // --- Undo/Redo ---
    _pushUndo() {
        if (!this._strokeSnapshot) return;
        let changed = false;
        for (let i = 0; i < this._strokeSnapshot.length; i++) {
            if (this._strokeSnapshot[i] !== this.pixels[i]) { changed = true; break; }
        }
        if (!changed) { this._strokeSnapshot = null; return; }
        this._undoStack.push(this._strokeSnapshot);
        if (this._undoStack.length > this._maxUndo) this._undoStack.shift();
        this._redoStack.length = 0;
        this._strokeSnapshot = null;
    }

    _pushUndoSnapshot() {
        this._undoStack.push(new Uint8ClampedArray(this.pixels));
        if (this._undoStack.length > this._maxUndo) this._undoStack.shift();
        this._redoStack.length = 0;
    }

    _undo() {
        if (this._undoStack.length === 0) return;
        this._redoStack.push(new Uint8ClampedArray(this.pixels));
        this.pixels = this._undoStack.pop();
        this._autoSave();
    }

    _redo() {
        if (this._redoStack.length === 0) return;
        this._undoStack.push(new Uint8ClampedArray(this.pixels));
        this.pixels = this._redoStack.pop();
        this._autoSave();
    }

    _clearUndoHistory() {
        this._undoStack.length = 0;
        this._redoStack.length = 0;
        this._strokeSnapshot = null;
    }

    // --- Copy/Paste ---
    _copySprite() {
        this.clipboard = {
            size: this.canvasSize,
            pixels: new Uint8ClampedArray(this.pixels)
        };
        const el = document.getElementById('se-status');
        el.textContent = 'Sprite copied to clipboard';
    }

    _pasteSprite() {
        if (!this.clipboard) {
            const el = document.getElementById('se-status');
            el.textContent = 'Nothing to paste — copy a sprite first (C)';
            return;
        }
        this._pushUndoSnapshot();
        if (this.clipboard.size !== this.canvasSize) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.clipboard.size;
            tempCanvas.height = this.clipboard.size;
            const tempCtx = tempCanvas.getContext('2d');
            const imageData = new ImageData(new Uint8ClampedArray(this.clipboard.pixels), this.clipboard.size, this.clipboard.size);
            tempCtx.putImageData(imageData, 0, 0);
            const destCanvas = document.createElement('canvas');
            destCanvas.width = this.canvasSize;
            destCanvas.height = this.canvasSize;
            const destCtx = destCanvas.getContext('2d');
            destCtx.imageSmoothingEnabled = false;
            destCtx.drawImage(tempCanvas, 0, 0, this.canvasSize, this.canvasSize);
            const destData = destCtx.getImageData(0, 0, this.canvasSize, this.canvasSize);
            this.pixels = new Uint8ClampedArray(destData.data);
        } else {
            this.pixels = new Uint8ClampedArray(this.clipboard.pixels);
        }
        this._autoSave();
        const el = document.getElementById('se-status');
        el.textContent = 'Sprite pasted from clipboard';
    }

    // --- Colonist Variants ---
    _addVariant() {
        this.colonistVariants++;
        this._persistSkinData();
        this._buildPalette();
    }

    _removeVariant(variantKey) {
        const num = parseInt(variantKey.split('_')[1]);
        if (!num || num > this.colonistVariants || this.colonistVariants <= 1) return;
        delete this.savedSprites[`entities:${variantKey}`];
        // Shift down higher variants
        for (let i = num; i < this.colonistVariants; i++) {
            const nextKey = `entities:colonist_${i + 1}`;
            const curKey = `entities:colonist_${i}`;
            if (this.savedSprites[nextKey]) {
                this.savedSprites[curKey] = this.savedSprites[nextKey];
            } else {
                delete this.savedSprites[curKey];
            }
        }
        delete this.savedSprites[`entities:colonist_${this.colonistVariants}`];
        this.colonistVariants--;
        if (this.activeObject && this.activeObject.key === variantKey) {
            this.activeObject = null;
            this.pixels = new Uint8ClampedArray(this.canvasSize * this.canvasSize * 4);
            this._updateActiveObjectDisplay();
        }
        this._persistSkinData();
        this._refreshSavedList();
        this._buildPalette();
    }

    // --- Save/Load ---
    _savePNG() {
        if (!this.activeObject) {
            alert('Select an object from the palette first.');
            return;
        }
        const { key, category } = this.activeObject;
        const size = this.canvasSize;

        // Save to localStorage
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        const imageData = new ImageData(this.pixels.slice(), size, size);
        tempCtx.putImageData(imageData, 0, 0);

        const dataURL = tempCanvas.toDataURL('image/png');
        this.savedSprites[`${category}:${key}`] = { size, data: dataURL };
        this._persistSkinData();
        this._refreshSavedList();
        this._buildPalette();

        // Trigger download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${key}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    async _exportToSkinsFolder() {
        const keys = Object.keys(this.savedSprites);
        if (keys.length === 0) {
            alert('No sprites saved yet.');
            return;
        }

        const zip = new JSZip();
        const manifest = {};

        for (const spriteKey of keys) {
            const { data } = this.savedSprites[spriteKey];
            const [category, key] = spriteKey.split(':');
            const base64 = data.split(',')[1];
            zip.file(`${category}/${key}.png`, base64, { base64: true });
            if (!manifest[category]) manifest[category] = [];
            manifest[category].push(key);
        }

        zip.file('manifest.json', JSON.stringify({ sprites: manifest, colonistVariants: this.colonistVariants }, null, 2));

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.skinName}.skin.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async _importZip(e) {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (typeof JSZip === 'undefined') {
            alert('JSZip not loaded.');
            return;
        }

        try {
            const buf = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(buf);

            const manifestFile = zip.file('manifest.json');
            if (!manifestFile) {
                alert('No manifest.json found in zip.');
                return;
            }
            const manifest = JSON.parse(await manifestFile.async('string'));

            let name = file.name.replace(/\.skin\.zip$/i, '').replace(/\.zip$/i, '');
            name = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
            this.skinName = name;
            document.getElementById('se-skin-name').value = name;
            this.savedSprites = {};

            let count = 0;
            for (const [category, keys] of Object.entries(manifest.sprites || {})) {
                for (const key of keys) {
                    const zipFile = zip.file(`${category}/${key}.png`);
                    if (!zipFile) continue;
                    const blob = await zipFile.async('blob');
                    const dataURL = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    const img = await new Promise(resolve => {
                        const i = new Image();
                        i.onload = () => resolve(i);
                        i.onerror = () => resolve(null);
                        i.src = dataURL;
                    });
                    const size = img ? img.width : this.canvasSize;
                    this.savedSprites[`${category}:${key}`] = { size, data: dataURL };
                    count++;
                }
            }

            if (manifest.colonistVariants != null) {
                this.colonistVariants = manifest.colonistVariants;
            } else {
                let v = 0;
                while (this.savedSprites[`entities:colonist_${v + 1}`]) v++;
                this.colonistVariants = Math.max(v, this.colonistVariants);
            }

            this._persistSkinData();
            this._refreshSavedList();
            this._refreshLoadDropdown();
            this._buildPalette();
            this._clearUndoHistory();

            if (this.activeObject) {
                const spriteKey = `${this.activeObject.category}:${this.activeObject.key}`;
                const saved = this.savedSprites[spriteKey];
                if (saved) {
                    this._loadPixelsFromDataURL(saved.data, saved.size);
                } else {
                    this.pixels = new Uint8ClampedArray(this.canvasSize * this.canvasSize * 4);
                }
            }

            const el = document.getElementById('se-status');
            el.textContent = `Imported ${count} sprite(s) from ${file.name}`;
        } catch (err) {
            alert('Failed to import zip: ' + err.message);
        }
    }

    _clearCanvas() {
        if (!confirm('Clear the current sprite?')) return;
        this._pushUndoSnapshot();
        this.pixels = new Uint8ClampedArray(this.canvasSize * this.canvasSize * 4);
        this._autoSave();
    }

    _autoSave() {
        if (!this.activeObject) return;
        const hasContent = this.pixels.some((v, i) => i % 4 === 3 && v > 0);
        const spriteKey = `${this.activeObject.category}:${this.activeObject.key}`;
        if (!hasContent) {
            delete this.savedSprites[spriteKey];
        } else {
            const size = this.canvasSize;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');
            const imageData = new ImageData(this.pixels.slice(), size, size);
            tempCtx.putImageData(imageData, 0, 0);
            this.savedSprites[spriteKey] = { size, data: tempCanvas.toDataURL('image/png') };
        }
        this._persistSkinData();
    }

    _persistSkinData() {
        const data = { sprites: this.savedSprites, colonistVariants: this.colonistVariants };
        localStorage.setItem(STORAGE_PREFIX + this.skinName, JSON.stringify(data));
    }

    _loadSkinData() {
        const data = localStorage.getItem(STORAGE_PREFIX + this.skinName);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.savedSprites = parsed.sprites || {};
                if (typeof parsed.colonistVariants === 'number') {
                    this.colonistVariants = parsed.colonistVariants;
                }
            } catch { /* ignore */ }
        }
    }

    _loadSkinByName(name) {
        this.skinName = name;
        document.getElementById('se-skin-name').value = name;
        this.savedSprites = {};
        this._loadSkinData();
        this._refreshSavedList();
        this._buildPalette();
        if (this.activeObject) {
            const spriteKey = `${this.activeObject.category}:${this.activeObject.key}`;
            const saved = this.savedSprites[spriteKey];
            if (saved) {
                this._loadPixelsFromDataURL(saved.data, saved.size);
            } else {
                this.pixels = new Uint8ClampedArray(this.canvasSize * this.canvasSize * 4);
            }
        }
    }

    _refreshLoadDropdown() {
        const sel = document.getElementById('se-load-skin');
        if (!sel) return;
        const skins = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                skins.push(key.slice(STORAGE_PREFIX.length));
            }
        }
        sel.innerHTML = '<option value="">Load Skin...</option>' +
            skins.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    _refreshSavedList() {
        const el = document.getElementById('se-saved-list');
        if (!el) return;
        const keys = Object.keys(this.savedSprites);
        if (keys.length === 0) {
            el.innerHTML = '<div class="bp-muted">No sprites saved yet</div>';
            return;
        }
        el.innerHTML = keys.map(k => {
            const { data } = this.savedSprites[k];
            const [cat, name] = k.split(':');
            return `<div class="se-saved-item" data-sprite-key="${k}" title="${cat}/${name}">
                <img src="${data}" class="se-saved-thumb">
                <span>${name}</span>
            </div>`;
        }).join('');

        el.querySelectorAll('.se-saved-item').forEach(item => {
            item.addEventListener('click', () => {
                const [cat, key] = item.dataset.spriteKey.split(':');
                this._selectObject(key, cat);
            });
        });
    }

    _goBack() {
        this.hide();
        document.getElementById('start-screen').style.display = '';
    }
}
