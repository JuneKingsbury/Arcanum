import { SPELLS, SPELL_TOMES, RESEARCH, CONFIG, SUMMON_TYPES } from '../core/config.js';

const STORAGE_KEY = 'convocation_spell_drafts';

const SCHOOLS = ['evocation', 'abjuration', 'enchantment', 'conjuration', 'transmutation', 'divination'];
const CAST_TYPES = ['auto', 'targeted'];
const TRIGGERS = [
    { value: 'inCombat', label: 'In Combat' },
    { value: 'lowHealth', label: 'Low Health' },
    { value: 'hasTask', label: 'Has Task' },
    { value: 'always', label: 'Always' },
];
const EFFECTS = [
    { value: 'ranged_damage', label: 'Ranged Damage' },
    { value: 'ranged_damage_aoe', label: 'Ranged Damage (AoE)' },
    { value: 'heal', label: 'Heal' },
    { value: 'buff_speed', label: 'Buff Speed' },
    { value: 'buff_defense', label: 'Buff Defense' },
    { value: 'teleport', label: 'Teleport' },
    { value: 'summon', label: 'Summon' },
    { value: 'boost_crops', label: 'Boost Crops' },
    { value: 'terraform', label: 'Terraform' },
    { value: 'divination_modifier', label: 'Divination Modifier' },
];

const REFERENCE_DATA = [
    { title: 'Spell IDs', ids: Object.keys(SPELLS) },
    { title: 'Tome IDs', ids: Object.keys(SPELL_TOMES) },
    { title: 'Summon Types', ids: Object.keys(SUMMON_TYPES) },
    { title: 'Research IDs', ids: Object.keys(RESEARCH) },
    { title: 'Resource IDs', ids: Object.keys(CONFIG.START_RESOURCES) },
];

let editorInstance = null;

export function launchSpellEditor() {
    document.getElementById('start-screen').style.display = 'none';
    if (!editorInstance) {
        editorInstance = new SpellEditor();
    }
    editorInstance.show();
}

class SpellEditor {
    constructor() {
        this.batchItems = [];
        this.undoStack = [];
        this.undoIndex = -1;
        this.container = document.getElementById('spell-editor');
        this._buildDOM();
        this._bindEvents();
        this._autoRestore();
        this._updateConditionals();
        this._schedulePreview();
        this._pushUndoState();
    }

    show() { this.container.style.display = 'flex'; }
    hide() { this.container.style.display = 'none'; }

    _goBack() {
        this.hide();
        document.getElementById('start-screen').style.display = '';
    }

    _buildDOM() {
        this.container.className = 'form-editor';
        this.container.innerHTML = '';

        const toolbar = document.createElement('div');
        toolbar.className = 'fe-toolbar';
        toolbar.innerHTML = `
            <button id="sp-back">← Back</button>
            <span class="fe-sep"></span>
            <select id="sp-load-config"><option value="">Load from Config...</option></select>
            <button id="sp-duplicate">Duplicate</button>
            <span class="fe-sep"></span>
            <button id="sp-export">Export All</button>
            <button id="sp-copy">Copy Current</button>
        `;
        this.container.appendChild(toolbar);

        const configSelect = document.getElementById('sp-load-config');
        Object.entries(SPELLS).forEach(([key, def]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${def.name || key}`;
            configSelect.appendChild(opt);
        });

        const workspace = document.createElement('div');
        workspace.className = 'fe-workspace';

        const formPanel = document.createElement('div');
        formPanel.className = 'fe-form-panel';
        formPanel.id = 'sp-form';
        formPanel.innerHTML = this._buildFormHTML();

        const previewPanel = document.createElement('div');
        previewPanel.className = 'fe-preview-panel';
        previewPanel.innerHTML = `
            <div class="fe-preview-tabs">
                <button class="fe-tab-btn active" data-tab="preview">Preview</button>
                <button class="fe-tab-btn" data-tab="reference">Reference</button>
            </div>
            <div class="fe-preview-content">
                <div id="sp-char-preview" style="text-align:center;padding:16px;font-size:48px;font-family:'Courier New',monospace;background:#0a0a14;border-bottom:1px solid #333;">*</div>
                <div class="fe-preview-header">
                    <span>Live Preview</span>
                    <button id="sp-copy-preview" style="font-size:10px;padding:2px 8px;">Copy</button>
                </div>
                <div class="fe-preview-code" id="sp-preview"></div>
            </div>
            <div class="fe-reference-content" id="sp-reference"></div>
        `;

        workspace.appendChild(formPanel);
        workspace.appendChild(previewPanel);
        this.container.appendChild(workspace);
    }

    _buildFormHTML() {
        return `
            <div class="fe-section-title">Spell Info</div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Key (snake_case)</label>
                    <input type="text" id="sp-key" placeholder="frost_bolt">
                </div>
                <div class="fe-field">
                    <label>Display Name</label>
                    <input type="text" id="sp-name" placeholder="Frost Bolt">
                </div>
            </div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>School</label>
                    <select id="sp-school">
                        ${SCHOOLS.map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </div>
                <div class="fe-field">
                    <label>Min Level</label>
                    <input type="number" id="sp-minLevel" value="0" min="0" max="10">
                </div>
            </div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Mana Cost</label>
                    <input type="number" id="sp-manaCost" value="8" min="1">
                </div>
                <div class="fe-field">
                    <label>Cooldown (ticks)</label>
                    <input type="number" id="sp-cooldown" value="60" min="1">
                </div>
            </div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Cast Type</label>
                    <select id="sp-castType">
                        ${CAST_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div class="fe-field">
                    <label>Trigger (auto only)</label>
                    <select id="sp-trigger">
                        ${TRIGGERS.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="fe-section-title">Effect</div>
            <div class="fe-field">
                <label>Effect Type</label>
                <select id="sp-effect">
                    ${EFFECTS.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
                </select>
            </div>

            <div id="sp-effect-damage" class="fe-conditional visible">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Damage</label>
                        <input type="number" id="sp-damage" value="10" min="1">
                    </div>
                    <div class="fe-field">
                        <label>Range</label>
                        <input type="number" id="sp-range" value="5" min="1">
                    </div>
                </div>
                <div class="fe-row">
                    <div class="fe-field" style="flex:0 0 60px;">
                        <label>Proj Char</label>
                        <input type="text" id="sp-projChar" maxlength="2" value="*">
                    </div>
                    <div class="fe-field" style="flex:0 0 60px;">
                        <label>Proj Color</label>
                        <input type="color" id="sp-projColor" value="#ffaa33">
                    </div>
                    <div class="fe-field">
                        <label>Radius (AoE only)</label>
                        <input type="number" id="sp-radius" value="2" min="1">
                    </div>
                </div>
            </div>

            <div id="sp-effect-heal" class="fe-conditional">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Heal Amount</label>
                        <input type="number" id="sp-healAmount" value="15" min="1">
                    </div>
                    <div class="fe-field">
                        <label>HP Threshold (0-1)</label>
                        <input type="number" id="sp-hpThreshold" value="0.5" min="0" max="1" step="0.05">
                    </div>
                </div>
                <div class="fe-checkbox-row">
                    <input type="checkbox" id="sp-targetSelf" checked>
                    <label for="sp-targetSelf">Target Self</label>
                </div>
            </div>

            <div id="sp-effect-buff-speed" class="fe-conditional">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Move Speed Bonus</label>
                        <input type="number" id="sp-moveSpeedBonus" value="0.4" step="0.1">
                    </div>
                    <div class="fe-field">
                        <label>Work Speed Bonus</label>
                        <input type="number" id="sp-workSpeedBonus" value="1.2" step="0.1">
                    </div>
                </div>
                <div class="fe-field">
                    <label>Duration (ticks)</label>
                    <input type="number" id="sp-buffDuration" value="60" min="1">
                </div>
            </div>

            <div id="sp-effect-buff-defense" class="fe-conditional">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Damage Reduction (0-1)</label>
                        <input type="number" id="sp-damageReduction" value="0.3" min="0" max="1" step="0.05">
                    </div>
                    <div class="fe-field">
                        <label>Duration (ticks)</label>
                        <input type="number" id="sp-defDuration" value="60" min="1">
                    </div>
                </div>
            </div>

            <div id="sp-effect-teleport" class="fe-conditional">
                <div class="fe-field">
                    <label>Range</label>
                    <input type="number" id="sp-teleRange" value="20" min="1">
                </div>
            </div>

            <div id="sp-effect-summon" class="fe-conditional">
                <div class="fe-field">
                    <label>Summon Type</label>
                    <select id="sp-summonType">
                        ${Object.keys(SUMMON_TYPES).map(k => `<option value="${k}">${k}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div id="sp-effect-crops" class="fe-conditional">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Range</label>
                        <input type="number" id="sp-cropRange" value="5" min="1">
                    </div>
                    <div class="fe-field">
                        <label>Radius</label>
                        <input type="number" id="sp-cropRadius" value="2" min="1">
                    </div>
                </div>
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Growth Mult</label>
                        <input type="number" id="sp-growthMult" value="1.5" step="0.1" min="1">
                    </div>
                    <div class="fe-field">
                        <label>Duration (ticks)</label>
                        <input type="number" id="sp-cropDuration" value="100" min="1">
                    </div>
                </div>
            </div>

            <div id="sp-effect-terraform" class="fe-conditional">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Range</label>
                        <input type="number" id="sp-terraRange" value="8" min="1">
                    </div>
                    <div class="fe-field">
                        <label>Radius</label>
                        <input type="number" id="sp-terraRadius" value="3" min="1">
                    </div>
                </div>
                <div class="fe-field">
                    <label>Target Terrain</label>
                    <input type="text" id="sp-targetTerrain" placeholder="grass">
                </div>
            </div>

            <div id="sp-effect-divination" class="fe-conditional">
                <div class="fe-field">
                    <label>Modifiers (JSON)</label>
                    <input type="text" id="sp-modifiers" placeholder='{"raidDelay": 200}'>
                </div>
                <div class="fe-field">
                    <label>Duration (ticks)</label>
                    <input type="number" id="sp-divDuration" value="300" min="1">
                </div>
            </div>

            <div class="fe-section-title">Tome Recipe</div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Learning Work (ticks)</label>
                    <input type="number" id="sp-learningWork" value="60" min="1">
                </div>
                <div class="fe-field">
                    <label>Min School Level</label>
                    <input type="number" id="sp-tomeMinLevel" value="0" min="0">
                </div>
            </div>
            <div class="fe-field">
                <label>Craft Cost (e.g. planks:3, runite:1)</label>
                <input type="text" id="sp-craftCost" placeholder="planks:3, runite:1">
            </div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Craft Ticks</label>
                    <input type="number" id="sp-craftTicks" value="30" min="1">
                </div>
                <div class="fe-field">
                    <label>Research Required</label>
                    <input type="text" id="sp-research" placeholder="arcane_studies">
                </div>
            </div>

            <div style="margin-top:16px;">
                <button id="sp-add-batch" class="fe-add-btn" style="padding:6px 16px;font-size:12px;">+ Add to Batch</button>
            </div>

            <div class="fe-section-title" style="margin-top:24px;">Batch Items</div>
            <div id="sp-batch-list"></div>
        `;
    }

    _bindEvents() {
        document.getElementById('sp-back').addEventListener('click', () => this._goBack());
        document.getElementById('sp-duplicate').addEventListener('click', () => this._duplicateDraft());
        document.getElementById('sp-export').addEventListener('click', () => this._showExportModal());
        document.getElementById('sp-copy').addEventListener('click', () => this._copyPreview());
        document.getElementById('sp-copy-preview').addEventListener('click', () => this._copyPreview());
        document.getElementById('sp-add-batch').addEventListener('click', () => this._addToBatch());

        document.getElementById('sp-load-config').addEventListener('change', (e) => {
            if (e.target.value) this._loadFromConfig(e.target.value);
            e.target.value = '';
        });

        document.getElementById('sp-effect').addEventListener('change', () => this._updateConditionals());
        document.getElementById('sp-castType').addEventListener('change', () => this._updateConditionals());
        document.getElementById('sp-projChar').addEventListener('input', () => this._updateCharPreview());
        document.getElementById('sp-projColor').addEventListener('input', () => this._updateCharPreview());

        this.container.querySelectorAll('.fe-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
        });

        this.container.addEventListener('input', () => this._schedulePreview());
        this.container.addEventListener('change', () => this._schedulePreview());

        window.addEventListener('keydown', (e) => {
            if (this.container.style.display === 'none') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this._undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this._redo();
                return;
            }
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'Escape') this._goBack();
        });
    }

    _switchTab(tab) {
        this.container.querySelectorAll('.fe-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        this.container.querySelector('.fe-preview-content').style.display = tab === 'preview' ? '' : 'none';
        const ref = this.container.querySelector('.fe-reference-content');
        ref.classList.toggle('visible', tab === 'reference');
        if (tab === 'reference' && !ref.dataset.built) {
            this._buildReference();
            ref.dataset.built = '1';
        }
    }

    _buildReference() {
        const container = document.getElementById('sp-reference');
        let html = `<input type="text" class="fe-ref-search" placeholder="Search IDs..." id="sp-ref-search">`;
        html += `<div id="sp-ref-list">`;
        for (const cat of REFERENCE_DATA) {
            html += `<div class="fe-ref-category">`;
            html += `<div class="fe-ref-category-title">${cat.title}</div>`;
            for (const id of cat.ids) {
                html += `<span class="fe-ref-id" data-ref-id="${id}">${id}</span>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
        container.innerHTML = html;

        container.addEventListener('click', (e) => {
            const pill = e.target.closest('.fe-ref-id');
            if (!pill) return;
            navigator.clipboard.writeText(pill.dataset.refId);
            pill.classList.add('copied');
            setTimeout(() => pill.classList.remove('copied'), 600);
        });

        document.getElementById('sp-ref-search').addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            container.querySelectorAll('.fe-ref-id').forEach(el => {
                el.style.display = el.dataset.refId.includes(q) ? '' : 'none';
            });
            container.querySelectorAll('.fe-ref-category').forEach(cat => {
                const hasVisible = [...cat.querySelectorAll('.fe-ref-id')].some(el => el.style.display !== 'none');
                cat.style.display = hasVisible ? '' : 'none';
            });
        });
    }

    _updateConditionals() {
        const effect = document.getElementById('sp-effect').value;
        const castType = document.getElementById('sp-castType').value;

        document.getElementById('sp-trigger').closest('.fe-field').style.display = castType === 'auto' ? '' : 'none';

        document.getElementById('sp-effect-damage').classList.toggle('visible', effect === 'ranged_damage' || effect === 'ranged_damage_aoe');
        document.getElementById('sp-effect-heal').classList.toggle('visible', effect === 'heal');
        document.getElementById('sp-effect-buff-speed').classList.toggle('visible', effect === 'buff_speed');
        document.getElementById('sp-effect-buff-defense').classList.toggle('visible', effect === 'buff_defense');
        document.getElementById('sp-effect-teleport').classList.toggle('visible', effect === 'teleport');
        document.getElementById('sp-effect-summon').classList.toggle('visible', effect === 'summon');
        document.getElementById('sp-effect-crops').classList.toggle('visible', effect === 'boost_crops');
        document.getElementById('sp-effect-terraform').classList.toggle('visible', effect === 'terraform');
        document.getElementById('sp-effect-divination').classList.toggle('visible', effect === 'divination_modifier');
    }

    _updateCharPreview() {
        const char = document.getElementById('sp-projChar').value || '*';
        const color = document.getElementById('sp-projColor').value;
        const preview = document.getElementById('sp-char-preview');
        if (preview) {
            preview.textContent = char;
            preview.style.color = color;
        }
    }

    _schedulePreview() {
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(() => {
            this._updatePreview();
            this._autoSave();
            this._scheduleUndoPush();
        }, 50);
    }

    _updatePreview() {
        this._updateCharPreview();
        this._validateForm();
        const data = this._collectFormData();
        const code = data ? this._formatOutput(data) : '// Fill in fields to see preview';
        document.getElementById('sp-preview').textContent = code;
    }

    _validateForm() {
        const key = document.getElementById('sp-key');
        const name = document.getElementById('sp-name');
        key.closest('.fe-field').classList.toggle('fe-error', !key.value.trim());
        name.closest('.fe-field').classList.toggle('fe-error', !name.value.trim());
    }

    _collectFormData() {
        const key = document.getElementById('sp-key').value.trim();
        const name = document.getElementById('sp-name').value.trim();
        if (!key) return null;

        const data = {
            key,
            name: name || key,
            school: document.getElementById('sp-school').value,
            minLevel: parseInt(document.getElementById('sp-minLevel').value) || 0,
            manaCost: parseInt(document.getElementById('sp-manaCost').value) || 8,
            cooldown: parseInt(document.getElementById('sp-cooldown').value) || 60,
            castType: document.getElementById('sp-castType').value,
            effect: document.getElementById('sp-effect').value,
        };

        if (data.castType === 'auto') {
            data.trigger = document.getElementById('sp-trigger').value;
        }

        const effect = data.effect;
        if (effect === 'ranged_damage' || effect === 'ranged_damage_aoe') {
            data.damage = parseInt(document.getElementById('sp-damage').value) || 10;
            data.range = parseInt(document.getElementById('sp-range').value) || 5;
            data.projectileChar = document.getElementById('sp-projChar').value || '*';
            data.projectileColor = document.getElementById('sp-projColor').value;
            if (effect === 'ranged_damage_aoe') {
                data.radius = parseInt(document.getElementById('sp-radius').value) || 2;
            }
        } else if (effect === 'heal') {
            data.healAmount = parseInt(document.getElementById('sp-healAmount').value) || 15;
            const threshold = parseFloat(document.getElementById('sp-hpThreshold').value);
            if (threshold && threshold < 1) data.hpThreshold = threshold;
            if (document.getElementById('sp-targetSelf').checked) data.targetSelf = true;
        } else if (effect === 'buff_speed') {
            data.moveSpeedBonus = parseFloat(document.getElementById('sp-moveSpeedBonus').value) || 0;
            data.workSpeedBonus = parseFloat(document.getElementById('sp-workSpeedBonus').value) || 1;
            data.duration = parseInt(document.getElementById('sp-buffDuration').value) || 60;
        } else if (effect === 'buff_defense') {
            data.damageReduction = parseFloat(document.getElementById('sp-damageReduction').value) || 0.3;
            data.duration = parseInt(document.getElementById('sp-defDuration').value) || 60;
        } else if (effect === 'teleport') {
            data.range = parseInt(document.getElementById('sp-teleRange').value) || 20;
        } else if (effect === 'summon') {
            data.summonType = document.getElementById('sp-summonType').value;
        } else if (effect === 'boost_crops') {
            data.range = parseInt(document.getElementById('sp-cropRange').value) || 5;
            data.radius = parseInt(document.getElementById('sp-cropRadius').value) || 2;
            data.growthMult = parseFloat(document.getElementById('sp-growthMult').value) || 1.5;
            data.duration = parseInt(document.getElementById('sp-cropDuration').value) || 100;
        } else if (effect === 'terraform') {
            data.range = parseInt(document.getElementById('sp-terraRange').value) || 8;
            data.radius = parseInt(document.getElementById('sp-terraRadius').value) || 3;
            data.targetTerrain = document.getElementById('sp-targetTerrain').value.trim() || 'grass';
        } else if (effect === 'divination_modifier') {
            try {
                const mods = document.getElementById('sp-modifiers').value.trim();
                if (mods) data.modifiers = JSON.parse(mods);
            } catch {}
            data.duration = parseInt(document.getElementById('sp-divDuration').value) || 300;
        }

        data.tome = {
            learningWork: parseInt(document.getElementById('sp-learningWork').value) || 60,
            minSchoolLevel: parseInt(document.getElementById('sp-tomeMinLevel').value) || 0,
            craftCost: this._parseCost(document.getElementById('sp-craftCost').value),
            craftTicks: parseInt(document.getElementById('sp-craftTicks').value) || 30,
            research: document.getElementById('sp-research').value.trim() || 'arcane_studies',
        };

        return data;
    }

    _parseCost(str) {
        const cost = {};
        if (!str.trim()) return cost;
        str.split(',').forEach(part => {
            const [k, v] = part.split(':').map(s => s.trim());
            if (k && v) cost[k] = parseInt(v) || 1;
        });
        return cost;
    }

    _formatOutput(data) {
        if (!data) return '';
        let out = '// === Add to SPELLS in config.js ===\n';
        out += `${data.key}: {\n`;
        out += `    name: '${data.name}',\n`;
        out += `    school: '${data.school}',\n`;
        out += `    minLevel: ${data.minLevel},\n`;
        out += `    manaCost: ${data.manaCost},\n`;
        out += `    cooldown: ${data.cooldown},\n`;
        out += `    castType: '${data.castType}',\n`;
        if (data.trigger) out += `    trigger: '${data.trigger}',\n`;
        out += `    effect: '${data.effect}',\n`;

        if (data.damage) out += `    damage: ${data.damage},\n`;
        if (data.range) out += `    range: ${data.range},\n`;
        if (data.radius) out += `    radius: ${data.radius},\n`;
        if (data.projectileColor) out += `    projectileColor: '${data.projectileColor}',\n`;
        if (data.projectileChar) out += `    projectileChar: '${data.projectileChar}',\n`;
        if (data.healAmount) out += `    healAmount: ${data.healAmount},\n`;
        if (data.hpThreshold) out += `    hpThreshold: ${data.hpThreshold},\n`;
        if (data.targetSelf) out += `    targetSelf: true,\n`;
        if (data.moveSpeedBonus !== undefined && data.effect === 'buff_speed') out += `    moveSpeedBonus: ${data.moveSpeedBonus},\n`;
        if (data.workSpeedBonus !== undefined && data.effect === 'buff_speed') out += `    workSpeedBonus: ${data.workSpeedBonus},\n`;
        if (data.damageReduction && data.effect === 'buff_defense') out += `    damageReduction: ${data.damageReduction},\n`;
        if (data.duration) out += `    duration: ${data.duration},\n`;
        if (data.summonType) out += `    summonType: '${data.summonType}',\n`;
        if (data.growthMult) out += `    growthMult: ${data.growthMult},\n`;
        if (data.targetTerrain) out += `    targetTerrain: '${data.targetTerrain}',\n`;
        if (data.modifiers) out += `    modifiers: ${JSON.stringify(data.modifiers)},\n`;

        out += `},\n\n`;

        const tomeKey = `tome_${data.key}`;
        out += `// === Add to SPELL_TOMES in config.js ===\n`;
        out += `${tomeKey}: { name: 'Tome: ${data.name}', spell: '${data.key}', learningWork: ${data.tome.learningWork}, minSchoolLevel: ${data.tome.minSchoolLevel} },\n\n`;

        const costStr = Object.entries(data.tome.craftCost).map(([k, v]) => `${k}: ${v}`).join(', ');
        out += `// === Add to RECIPES in config.js ===\n`;
        out += `craft_${tomeKey}: { input: { ${costStr} }, output: { ${tomeKey}: 1 }, skill: 'crafting', ticks: ${data.tome.craftTicks}, station: 'enchanting_table', research: '${data.tome.research}', category: 'Tomes' },\n`;

        return out;
    }

    _addToBatch() {
        const data = this._collectFormData();
        if (!data || !data.key) {
            this._validateForm();
            return;
        }

        const existing = this.batchItems.findIndex(i => i.key === data.key);
        if (existing >= 0) {
            this.batchItems[existing] = data;
        } else {
            this.batchItems.push(data);
        }

        this._clearForm();
        this._renderBatchList();
        this._schedulePreview();
    }

    _clearForm() {
        document.getElementById('sp-key').value = '';
        document.getElementById('sp-name').value = '';
        document.getElementById('sp-school').value = 'evocation';
        document.getElementById('sp-minLevel').value = '0';
        document.getElementById('sp-manaCost').value = '8';
        document.getElementById('sp-cooldown').value = '60';
        document.getElementById('sp-castType').value = 'auto';
        document.getElementById('sp-trigger').value = 'inCombat';
        document.getElementById('sp-effect').value = 'ranged_damage';
        document.getElementById('sp-damage').value = '10';
        document.getElementById('sp-range').value = '5';
        document.getElementById('sp-projChar').value = '*';
        document.getElementById('sp-projColor').value = '#ffaa33';
        document.getElementById('sp-radius').value = '2';
        document.getElementById('sp-healAmount').value = '15';
        document.getElementById('sp-hpThreshold').value = '0.5';
        document.getElementById('sp-targetSelf').checked = true;
        document.getElementById('sp-moveSpeedBonus').value = '0.4';
        document.getElementById('sp-workSpeedBonus').value = '1.2';
        document.getElementById('sp-buffDuration').value = '60';
        document.getElementById('sp-damageReduction').value = '0.3';
        document.getElementById('sp-defDuration').value = '60';
        document.getElementById('sp-teleRange').value = '20';
        document.getElementById('sp-summonType').value = Object.keys(SUMMON_TYPES)[0] || '';
        document.getElementById('sp-cropRange').value = '5';
        document.getElementById('sp-cropRadius').value = '2';
        document.getElementById('sp-growthMult').value = '1.5';
        document.getElementById('sp-cropDuration').value = '100';
        document.getElementById('sp-terraRange').value = '8';
        document.getElementById('sp-terraRadius').value = '3';
        document.getElementById('sp-targetTerrain').value = 'grass';
        document.getElementById('sp-modifiers').value = '';
        document.getElementById('sp-divDuration').value = '300';
        document.getElementById('sp-learningWork').value = '60';
        document.getElementById('sp-tomeMinLevel').value = '0';
        document.getElementById('sp-craftCost').value = '';
        document.getElementById('sp-craftTicks').value = '30';
        document.getElementById('sp-research').value = 'arcane_studies';
        this._updateConditionals();
    }

    _renderBatchList() {
        const container = document.getElementById('sp-batch-list');
        if (!this.batchItems.length) {
            container.innerHTML = '<div style="color:#666;font-size:11px;">No spells in batch yet.</div>';
            return;
        }
        let html = `<table class="fe-batch-table"><thead><tr>
            <th>School</th><th>Key</th><th>Name</th><th>Effect</th><th>Actions</th>
        </tr></thead><tbody>`;
        this.batchItems.forEach((item, i) => {
            html += `<tr>
                <td>${item.school}</td>
                <td>${item.key}</td>
                <td>${item.name}</td>
                <td>${item.effect}</td>
                <td>
                    <button data-edit="${i}">Edit</button>
                    <button data-remove="${i}">✕</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => this._editBatchItem(parseInt(btn.dataset.edit)));
        });
        container.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => this._removeBatchItem(parseInt(btn.dataset.remove)));
        });
    }

    _editBatchItem(index) {
        const item = this.batchItems[index];
        if (!item) return;
        this._populateForm(item);
        this.batchItems.splice(index, 1);
        this._renderBatchList();
        this._schedulePreview();
    }

    _removeBatchItem(index) {
        this.batchItems.splice(index, 1);
        this._renderBatchList();
        this._schedulePreview();
    }

    _populateForm(data) {
        document.getElementById('sp-key').value = data.key || '';
        document.getElementById('sp-name').value = data.name || '';
        document.getElementById('sp-school').value = data.school || 'evocation';
        document.getElementById('sp-minLevel').value = data.minLevel || 0;
        document.getElementById('sp-manaCost').value = data.manaCost || 8;
        document.getElementById('sp-cooldown').value = data.cooldown || 60;
        document.getElementById('sp-castType').value = data.castType || 'auto';
        document.getElementById('sp-trigger').value = data.trigger || 'inCombat';
        document.getElementById('sp-effect').value = data.effect || 'ranged_damage';

        if (data.damage) document.getElementById('sp-damage').value = data.damage;
        if (data.range) document.getElementById('sp-range').value = data.range;
        if (data.projectileChar) document.getElementById('sp-projChar').value = data.projectileChar;
        if (data.projectileColor) document.getElementById('sp-projColor').value = data.projectileColor;
        if (data.radius) document.getElementById('sp-radius').value = data.radius;
        if (data.healAmount) document.getElementById('sp-healAmount').value = data.healAmount;
        if (data.hpThreshold) document.getElementById('sp-hpThreshold').value = data.hpThreshold;
        document.getElementById('sp-targetSelf').checked = !!data.targetSelf;
        if (data.moveSpeedBonus !== undefined) document.getElementById('sp-moveSpeedBonus').value = data.moveSpeedBonus;
        if (data.workSpeedBonus !== undefined) document.getElementById('sp-workSpeedBonus').value = data.workSpeedBonus;
        if (data.effect === 'buff_speed' && data.duration) document.getElementById('sp-buffDuration').value = data.duration;
        if (data.damageReduction) document.getElementById('sp-damageReduction').value = data.damageReduction;
        if (data.effect === 'buff_defense' && data.duration) document.getElementById('sp-defDuration').value = data.duration;
        if (data.effect === 'teleport' && data.range) document.getElementById('sp-teleRange').value = data.range;
        if (data.summonType) document.getElementById('sp-summonType').value = data.summonType;
        if (data.effect === 'boost_crops') {
            if (data.range) document.getElementById('sp-cropRange').value = data.range;
            if (data.radius) document.getElementById('sp-cropRadius').value = data.radius;
            if (data.growthMult) document.getElementById('sp-growthMult').value = data.growthMult;
            if (data.duration) document.getElementById('sp-cropDuration').value = data.duration;
        }
        if (data.effect === 'terraform') {
            if (data.range) document.getElementById('sp-terraRange').value = data.range;
            if (data.radius) document.getElementById('sp-terraRadius').value = data.radius;
            if (data.targetTerrain) document.getElementById('sp-targetTerrain').value = data.targetTerrain;
        }
        if (data.modifiers) document.getElementById('sp-modifiers').value = JSON.stringify(data.modifiers);
        if (data.effect === 'divination_modifier' && data.duration) document.getElementById('sp-divDuration').value = data.duration;

        if (data.tome) {
            document.getElementById('sp-learningWork').value = data.tome.learningWork || 60;
            document.getElementById('sp-tomeMinLevel').value = data.tome.minSchoolLevel || 0;
            if (data.tome.craftCost) {
                document.getElementById('sp-craftCost').value = Object.entries(data.tome.craftCost).map(([k, v]) => `${k}:${v}`).join(', ');
            }
            document.getElementById('sp-craftTicks').value = data.tome.craftTicks || 30;
            document.getElementById('sp-research').value = data.tome.research || 'arcane_studies';
        }

        this._updateConditionals();
        this._schedulePreview();
    }

    _loadFromConfig(key) {
        const def = SPELLS[key];
        if (!def) return;
        const data = { key, ...def };
        const tome = SPELL_TOMES[`tome_${key}`];
        if (tome) {
            data.tome = {
                learningWork: tome.learningWork || 60,
                minSchoolLevel: tome.minSchoolLevel || 0,
                craftCost: {},
                craftTicks: 30,
                research: 'arcane_studies',
            };
        }
        this._populateForm(data);
        this._pushUndoState();
    }

    _duplicateDraft() {
        const data = this._collectFormData();
        if (!data || !data.key) return;
        document.getElementById('sp-key').value = data.key + '_copy';
        document.getElementById('sp-name').value = (data.name || data.key) + ' Copy';
        this._schedulePreview();
        this._pushUndoState();
    }

    _copyPreview() {
        const text = document.getElementById('sp-preview').textContent;
        navigator.clipboard.writeText(text);
    }

    _showExportModal() {
        if (!this.batchItems.length) return;
        let output = '';
        output += '// === Add to SPELLS in config.js ===\n';
        this.batchItems.forEach(item => {
            const lines = this._formatOutput(item).split('\n');
            const spellLines = lines.slice(1, lines.findIndex(l => l.startsWith('// === Add to SPELL_TOMES')));
            output += spellLines.join('\n') + '\n';
        });
        output += '\n// === Add to SPELL_TOMES in config.js ===\n';
        this.batchItems.forEach(item => {
            const tomeKey = `tome_${item.key}`;
            output += `${tomeKey}: { name: 'Tome: ${item.name}', spell: '${item.key}', learningWork: ${item.tome.learningWork}, minSchoolLevel: ${item.tome.minSchoolLevel} },\n`;
        });
        output += '\n// === Add to RECIPES in config.js ===\n';
        this.batchItems.forEach(item => {
            const tomeKey = `tome_${item.key}`;
            const costStr = Object.entries(item.tome.craftCost).map(([k, v]) => `${k}: ${v}`).join(', ');
            output += `craft_${tomeKey}: { input: { ${costStr} }, output: { ${tomeKey}: 1 }, skill: 'crafting', ticks: ${item.tome.craftTicks}, station: 'enchanting_table', research: '${item.tome.research}', category: 'Tomes' },\n`;
        });

        const modal = document.createElement('div');
        modal.className = 'fe-export-modal';
        modal.innerHTML = `
            <div class="fe-export-modal-content">
                <div style="color:#ffcc00;font-weight:bold;margin-bottom:12px;">Export All Spells (${this.batchItems.length} items)</div>
                <textarea readonly>${output}</textarea>
                <div class="fe-modal-actions">
                    <button id="sp-modal-copy">Copy to Clipboard</button>
                    <button id="sp-modal-close">Close</button>
                </div>
            </div>
        `;
        this.container.appendChild(modal);

        document.getElementById('sp-modal-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(output);
            document.getElementById('sp-modal-copy').textContent = 'Copied!';
        });
        document.getElementById('sp-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    _autoSave() {
        try {
            const state = {
                form: this._collectFormData(),
                batch: this.batchItems,
            };
            localStorage.setItem(STORAGE_KEY + '_autosave', JSON.stringify(state));
        } catch {}
    }

    _autoRestore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY + '_autosave');
            if (!raw) return;
            const state = JSON.parse(raw);
            if (state.batch && state.batch.length) this.batchItems = state.batch;
            this._renderBatchList();
            if (state.form && state.form.key) {
                this._populateForm(state.form);
            }
        } catch {}
    }

    _getFormSnapshot() {
        const inputs = this.container.querySelectorAll('#sp-form input, #sp-form select');
        const snap = {};
        inputs.forEach(el => {
            const id = el.id;
            if (!id) return;
            if (el.type === 'checkbox') snap[id] = el.checked;
            else snap[id] = el.value;
        });
        return JSON.stringify(snap);
    }

    _restoreFormSnapshot(json) {
        const snap = JSON.parse(json);
        for (const [id, val] of Object.entries(snap)) {
            const el = document.getElementById(id);
            if (!el) continue;
            if (el.type === 'checkbox') el.checked = val;
            else el.value = val;
        }
        this._updateConditionals();
        this._updatePreview();
    }

    _pushUndoState() {
        const snap = this._getFormSnapshot();
        if (this.undoStack[this.undoIndex] === snap) return;
        this.undoStack = this.undoStack.slice(0, this.undoIndex + 1);
        this.undoStack.push(snap);
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.undoIndex = this.undoStack.length - 1;
    }

    _scheduleUndoPush() {
        clearTimeout(this._undoTimer);
        this._undoTimer = setTimeout(() => this._pushUndoState(), 800);
    }

    _undo() {
        if (this.undoIndex <= 0) return;
        this.undoIndex--;
        this._restoreFormSnapshot(this.undoStack[this.undoIndex]);
    }

    _redo() {
        if (this.undoIndex >= this.undoStack.length - 1) return;
        this.undoIndex++;
        this._restoreFormSnapshot(this.undoStack[this.undoIndex]);
    }
}
