import { ANIMALS, SPELLS, RESEARCH, CONFIG, SUMMON_TYPES, GOLEM_TYPES } from '../core/config.js';

const STORAGE_KEY = 'convocation_entity_drafts';

const SPAWN_CONDITIONS = [
    { value: '', label: 'None (always)' },
    { value: 'hostileNight', label: 'Hostile at Night/Winter' },
    { value: 'hostileWinter', label: 'Hostile in Winter' },
];

const TAMED_ROLES = [
    { value: 'guard', label: 'Guard Animal' },
    { value: 'production', label: 'Production (eggs, milk)' },
    { value: 'pack', label: 'Pack Animal' },
    { value: 'happiness', label: 'Happiness Aura' },
];

const REFERENCE_DATA = [
    { title: 'Resource IDs', ids: Object.keys(CONFIG.START_RESOURCES) },
    { title: 'Animal IDs', ids: Object.keys(ANIMALS) },
    { title: 'Summon Types', ids: Object.keys(SUMMON_TYPES) },
    { title: 'Golem Types', ids: Object.keys(GOLEM_TYPES) },
    { title: 'Spell IDs', ids: Object.keys(SPELLS) },
    { title: 'Research IDs', ids: Object.keys(RESEARCH) },
];

const CONFIG_ANIMALS = Object.entries(ANIMALS).map(([key, def]) => ({ key, ...def }));

let editorInstance = null;

export function launchEntityEditor() {
    document.getElementById('start-screen').style.display = 'none';
    if (!editorInstance) {
        editorInstance = new EntityEditor();
    }
    editorInstance.show();
}

class EntityEditor {
    constructor() {
        this.activeDraftKey = null;
        this.undoStack = [];
        this.undoIndex = -1;
        this.container = document.getElementById('entity-editor');
        this._buildDOM();
        this._bindEvents();
        this._autoRestore();
        this._updateConditionals();
        this._renderDraftList();
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
            <button id="en-back">← Back</button>
            <span class="fe-sep"></span>
            <button id="en-new">+ New</button>
            <button id="en-duplicate">Duplicate</button>
            <span class="fe-sep"></span>
            <select id="en-load-config"><option value="">Load from Config...</option></select>
            <span class="fe-sep"></span>
            <button id="en-export-all">Export All</button>
            <button id="en-copy">Copy Current</button>
        `;
        this.container.appendChild(toolbar);

        const configSelect = document.getElementById('en-load-config');
        CONFIG_ANIMALS.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.key;
            opt.textContent = `${a.char || '?'} ${a.key}`;
            configSelect.appendChild(opt);
        });

        const workspace = document.createElement('div');
        workspace.className = 'fe-workspace';

        const formPanel = document.createElement('div');
        formPanel.className = 'fe-form-panel';
        formPanel.id = 'en-form';
        formPanel.innerHTML = this._buildFormHTML();

        const previewPanel = document.createElement('div');
        previewPanel.className = 'fe-preview-panel';
        previewPanel.innerHTML = `
            <div class="fe-preview-tabs">
                <button class="fe-tab-btn active" data-tab="preview">Preview</button>
                <button class="fe-tab-btn" data-tab="reference">Reference</button>
            </div>
            <div class="fe-preview-content">
                <div id="en-char-preview" style="text-align:center;padding:16px;font-size:48px;font-family:'Courier New',monospace;background:#0a0a14;border-bottom:1px solid #333;">?</div>
                <div class="fe-preview-code" id="en-preview"></div>
            </div>
            <div class="fe-reference-content" id="en-reference"></div>
        `;

        workspace.appendChild(formPanel);
        workspace.appendChild(previewPanel);
        this.container.appendChild(workspace);
    }

    _buildFormHTML() {
        return `
            <div class="fe-section-title">Basic Info</div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Key (snake_case)</label>
                    <input type="text" id="en-key" placeholder="deer">
                </div>
                <div class="fe-field" style="flex:0 0 60px;">
                    <label>Char</label>
                    <input type="text" id="en-char" maxlength="2" placeholder="d">
                </div>
                <div class="fe-field" style="flex:0 0 60px;">
                    <label>Color</label>
                    <input type="color" id="en-color" value="#bb8855">
                </div>
            </div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>HP</label>
                    <input type="number" id="en-hp" value="40" min="1">
                </div>
                <div class="fe-field">
                    <label>Speed (0-1)</label>
                    <input type="number" id="en-speed" value="0.5" min="0" max="1" step="0.05">
                </div>
            </div>

            <div class="fe-section-title">Behavior</div>
            <div class="fe-checkbox-row">
                <input type="checkbox" id="en-hostile">
                <label for="en-hostile">Hostile</label>
            </div>

            <div id="en-passive-fields" class="fe-conditional visible">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Meat Yield</label>
                        <input type="number" id="en-p-meatYield" value="3" min="0">
                    </div>
                    <div class="fe-field">
                        <label>Hide Yield</label>
                        <input type="number" id="en-p-hideYield" value="2" min="0">
                    </div>
                </div>
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Flee Range</label>
                        <input type="number" id="en-p-fleeRange" value="5" min="0">
                    </div>
                    <div class="fe-field">
                        <label>Spawn Weight</label>
                        <input type="number" id="en-p-spawnWeight" value="10" min="0">
                    </div>
                </div>
            </div>

            <div id="en-hostile-fields" class="fe-conditional">
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Meat Yield</label>
                        <input type="number" id="en-h-meatYield" value="2" min="0">
                    </div>
                    <div class="fe-field">
                        <label>Hide Yield</label>
                        <input type="number" id="en-h-hideYield" value="1" min="0">
                    </div>
                </div>
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Damage</label>
                        <input type="number" id="en-h-damage" value="8" min="1">
                    </div>
                    <div class="fe-field">
                        <label>Aggro Range</label>
                        <input type="number" id="en-h-aggroRange" value="6" min="1">
                    </div>
                </div>
                <div class="fe-row">
                    <div class="fe-field">
                        <label>Spawn Weight</label>
                        <input type="number" id="en-h-spawnWeight" value="0" min="0">
                    </div>
                    <div class="fe-field">
                        <label>Spawn Condition</label>
                        <select id="en-h-spawnCondition">
                            ${SPAWN_CONDITIONS.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="fe-section-title">Taming</div>
            <div class="fe-checkbox-row">
                <input type="checkbox" id="en-tameable">
                <label for="en-tameable">Tameable</label>
            </div>

            <div id="en-tame-fields" class="fe-conditional">
                <div class="fe-field">
                    <label>Tamed Role</label>
                    <select id="en-tame-role">
                        ${TAMED_ROLES.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
                    </select>
                </div>
                <div class="fe-field">
                    <label>Food to Tame</label>
                    <input type="number" id="en-tame-foodToTame" value="4" min="1">
                </div>

                <div id="en-tame-guard" class="fe-conditional visible">
                    <div class="fe-row">
                        <div class="fe-field">
                            <label>Guard Radius</label>
                            <input type="number" id="en-tame-guardRadius" value="8" min="1">
                        </div>
                        <div class="fe-field">
                            <label>Guard Damage</label>
                            <input type="number" id="en-tame-guardDamage" value="8" min="1">
                        </div>
                    </div>
                    <div class="fe-checkbox-row">
                        <input type="checkbox" id="en-tame-dangerousTame">
                        <label for="en-tame-dangerousTame">Dangerous to Tame</label>
                    </div>
                    <div id="en-tame-danger-fields" class="fe-conditional">
                        <div class="fe-row">
                            <div class="fe-field">
                                <label>Base Tame Chance (0-1)</label>
                                <input type="number" id="en-tame-baseTameChance" value="0.4" min="0" max="1" step="0.05">
                            </div>
                            <div class="fe-field">
                                <label>Retaliation Damage</label>
                                <input type="number" id="en-tame-retaliationDamage" value="12" min="0">
                            </div>
                        </div>
                    </div>
                </div>

                <div id="en-tame-production" class="fe-conditional">
                    <div class="fe-row">
                        <div class="fe-field">
                            <label>Produces (resource key)</label>
                            <input type="text" id="en-tame-produces" placeholder="eggs">
                        </div>
                        <div class="fe-field">
                            <label>Produce Rate (ticks)</label>
                            <input type="number" id="en-tame-produceRate" value="80" min="1">
                        </div>
                    </div>
                    <div class="fe-field">
                        <label>Produce Amount</label>
                        <input type="number" id="en-tame-produceAmount" value="1" min="1">
                    </div>
                </div>

                <div id="en-tame-pack" class="fe-conditional">
                    <div class="fe-field">
                        <label>Expedition Speed Bonus (0-1)</label>
                        <input type="number" id="en-tame-expeditionSpeedBonus" value="0.25" min="0" max="1" step="0.05">
                    </div>
                </div>

                <div id="en-tame-happiness" class="fe-conditional">
                    <div class="fe-row">
                        <div class="fe-field">
                            <label>Aura Radius</label>
                            <input type="number" id="en-tame-auraRadius" value="5" min="1">
                        </div>
                        <div class="fe-field">
                            <label>Aura Mood Bonus</label>
                            <input type="number" id="en-tame-auraMoodBonus" value="5" min="1">
                        </div>
                    </div>
                </div>
            </div>

            <div class="fe-section-title">Saved Drafts</div>
            <div id="en-draft-list" class="fe-draft-list"></div>
        `;
    }

    _bindEvents() {
        document.getElementById('en-back').addEventListener('click', () => this._goBack());
        document.getElementById('en-new').addEventListener('click', () => this._newDraft());
        document.getElementById('en-duplicate').addEventListener('click', () => this._duplicateDraft());
        document.getElementById('en-export-all').addEventListener('click', () => this._exportAll());
        document.getElementById('en-copy').addEventListener('click', () => this._copyPreview());
        document.getElementById('en-load-config').addEventListener('change', (e) => {
            if (e.target.value) this._loadFromConfig(e.target.value);
            e.target.value = '';
        });

        document.getElementById('en-hostile').addEventListener('change', () => this._updateConditionals());
        document.getElementById('en-tameable').addEventListener('change', () => this._updateConditionals());
        document.getElementById('en-tame-role').addEventListener('change', () => this._updateConditionals());
        document.getElementById('en-tame-dangerousTame').addEventListener('change', () => this._updateConditionals());

        document.getElementById('en-char').addEventListener('input', () => this._updateCharPreview());
        document.getElementById('en-color').addEventListener('input', () => this._updateCharPreview());

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
        const container = document.getElementById('en-reference');
        let html = `<input type="text" class="fe-ref-search" placeholder="Search IDs..." id="en-ref-search">`;
        html += `<div id="en-ref-list">`;
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

        document.getElementById('en-ref-search').addEventListener('input', (e) => {
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
        const hostile = document.getElementById('en-hostile').checked;
        document.getElementById('en-passive-fields').classList.toggle('visible', !hostile);
        document.getElementById('en-hostile-fields').classList.toggle('visible', hostile);

        const tameable = document.getElementById('en-tameable').checked;
        document.getElementById('en-tame-fields').classList.toggle('visible', tameable);

        const role = document.getElementById('en-tame-role').value;
        document.getElementById('en-tame-guard').classList.toggle('visible', role === 'guard');
        document.getElementById('en-tame-production').classList.toggle('visible', role === 'production');
        document.getElementById('en-tame-pack').classList.toggle('visible', role === 'pack');
        document.getElementById('en-tame-happiness').classList.toggle('visible', role === 'happiness');

        const dangerous = document.getElementById('en-tame-dangerousTame').checked;
        document.getElementById('en-tame-danger-fields').classList.toggle('visible', dangerous);
    }

    _updateCharPreview() {
        const char = document.getElementById('en-char').value || '?';
        const color = document.getElementById('en-color').value;
        const preview = document.getElementById('en-char-preview');
        preview.textContent = char;
        preview.style.color = color;
    }

    _schedulePreview() {
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(() => {
            this._updatePreview();
            this._scheduleDraftSave();
            this._scheduleUndoPush();
        }, 50);
    }

    _scheduleDraftSave() {
        clearTimeout(this._draftSaveTimer);
        this._draftSaveTimer = setTimeout(() => this._autoSaveDraft(), 500);
    }

    _updatePreview() {
        this._updateCharPreview();
        this._validateForm();
        const data = this._collectFormData();
        const code = data ? this._formatOutput(data) : '// Fill in fields to see preview';
        document.getElementById('en-preview').textContent = code;
    }

    _autoSaveDraft() {
        const data = this._collectFormData();
        if (!data || !data.key) return;
        const saved = this._getSaved();
        const idx = saved.findIndex(s => s.key === data.key);
        if (idx >= 0) saved[idx] = data;
        else saved.push(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        this.activeDraftKey = data.key;
        this._renderDraftList();
        try {
            localStorage.setItem(STORAGE_KEY + '_active', data.key);
        } catch {}
    }

    _autoRestore() {
        try {
            const activeKey = localStorage.getItem(STORAGE_KEY + '_active');
            if (activeKey) {
                const saved = this._getSaved();
                const item = saved.find(s => s.key === activeKey);
                if (item) {
                    this.activeDraftKey = activeKey;
                    this._populateForm(item);
                    return;
                }
            }
            const raw = localStorage.getItem(STORAGE_KEY + '_autosave');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data && data.key) {
                this.activeDraftKey = data.key;
                this._populateForm(data);
            }
        } catch {}
    }

    _newDraft() {
        this._autoSaveDraft();
        this._clearForm();
        this.activeDraftKey = null;
        localStorage.removeItem(STORAGE_KEY + '_active');
        this._renderDraftList();
        this._schedulePreview();
    }

    _clearForm() {
        document.getElementById('en-key').value = '';
        document.getElementById('en-char').value = '';
        document.getElementById('en-color').value = '#bb8855';
        document.getElementById('en-hp').value = '40';
        document.getElementById('en-speed').value = '0.5';
        document.getElementById('en-hostile').checked = false;
        document.getElementById('en-p-meatYield').value = '3';
        document.getElementById('en-p-hideYield').value = '2';
        document.getElementById('en-p-fleeRange').value = '5';
        document.getElementById('en-p-spawnWeight').value = '10';
        document.getElementById('en-h-meatYield').value = '2';
        document.getElementById('en-h-hideYield').value = '1';
        document.getElementById('en-h-damage').value = '8';
        document.getElementById('en-h-aggroRange').value = '6';
        document.getElementById('en-h-spawnWeight').value = '0';
        document.getElementById('en-h-spawnCondition').value = '';
        document.getElementById('en-tameable').checked = false;
        document.getElementById('en-tame-role').value = 'guard';
        document.getElementById('en-tame-foodToTame').value = '4';
        document.getElementById('en-tame-guardRadius').value = '8';
        document.getElementById('en-tame-guardDamage').value = '8';
        document.getElementById('en-tame-dangerousTame').checked = false;
        document.getElementById('en-tame-baseTameChance').value = '0.4';
        document.getElementById('en-tame-retaliationDamage').value = '12';
        document.getElementById('en-tame-produces').value = '';
        document.getElementById('en-tame-produceRate').value = '80';
        document.getElementById('en-tame-produceAmount').value = '1';
        document.getElementById('en-tame-expeditionSpeedBonus').value = '0.25';
        document.getElementById('en-tame-auraRadius').value = '5';
        document.getElementById('en-tame-auraMoodBonus').value = '5';
        this._updateConditionals();
    }

    _renderDraftList() {
        const container = document.getElementById('en-draft-list');
        const saved = this._getSaved();
        if (!saved.length) {
            container.innerHTML = '<div style="color:#666;font-size:11px;">No drafts yet. Start filling in the form above.</div>';
            return;
        }
        container.innerHTML = saved.map(item => `
            <div class="fe-draft-row${item.key === this.activeDraftKey ? ' active' : ''}" data-draft-key="${item.key}">
                <span class="fe-draft-char" style="color:${item.color || '#ccc'}">${item.char || '?'}</span>
                <span class="fe-draft-key">${item.key}</span>
                <span class="fe-draft-actions">
                    <button data-draft-load="${item.key}">Edit</button>
                    <button data-draft-del="${item.key}" class="fe-draft-del">✕</button>
                </span>
            </div>
        `).join('');

        container.querySelectorAll('[data-draft-load]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._loadDraft(btn.dataset.draftLoad);
            });
        });
        container.querySelectorAll('[data-draft-del]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._deleteDraft(btn.dataset.draftDel);
            });
        });
    }

    _loadDraft(key) {
        const saved = this._getSaved();
        const item = saved.find(s => s.key === key);
        if (!item) return;
        this.activeDraftKey = key;
        this._populateForm(item);
        this._renderDraftList();
        localStorage.setItem(STORAGE_KEY + '_active', key);
    }

    _deleteDraft(key) {
        const saved = this._getSaved().filter(s => s.key !== key);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        if (this.activeDraftKey === key) {
            this.activeDraftKey = null;
            localStorage.removeItem(STORAGE_KEY + '_active');
        }
        this._renderDraftList();
    }

    _collectFormData() {
        const key = document.getElementById('en-key').value.trim();
        if (!key) return null;

        const hostile = document.getElementById('en-hostile').checked;
        const data = {
            key,
            char: document.getElementById('en-char').value.trim() || '?',
            color: document.getElementById('en-color').value,
            hp: parseInt(document.getElementById('en-hp').value) || 40,
            speed: parseFloat(document.getElementById('en-speed').value) || 0.5,
            hostile,
        };

        if (hostile) {
            const meatYield = parseInt(document.getElementById('en-h-meatYield').value);
            const hideYield = parseInt(document.getElementById('en-h-hideYield').value);
            if (meatYield) data.meatYield = meatYield;
            if (hideYield) data.hideYield = hideYield;
            data.damage = parseInt(document.getElementById('en-h-damage').value) || 8;
            data.aggroRange = parseInt(document.getElementById('en-h-aggroRange').value) || 6;
            data.spawnWeight = parseInt(document.getElementById('en-h-spawnWeight').value) || 0;
            const cond = document.getElementById('en-h-spawnCondition').value;
            if (cond) data.spawnCondition = cond;
        } else {
            const meatYield = parseInt(document.getElementById('en-p-meatYield').value);
            const hideYield = parseInt(document.getElementById('en-p-hideYield').value);
            if (meatYield) data.meatYield = meatYield;
            if (hideYield) data.hideYield = hideYield;
            const fleeRange = parseInt(document.getElementById('en-p-fleeRange').value);
            if (fleeRange) data.fleeRange = fleeRange;
            data.spawnWeight = parseInt(document.getElementById('en-p-spawnWeight').value) || 0;
        }

        const tameable = document.getElementById('en-tameable').checked;
        if (tameable) {
            data.tameable = true;
            const role = document.getElementById('en-tame-role').value;
            const tamed = {};
            tamed.foodToTame = parseInt(document.getElementById('en-tame-foodToTame').value) || 4;

            if (role === 'guard') {
                tamed.guardAnimal = true;
                tamed.guardRadius = parseInt(document.getElementById('en-tame-guardRadius').value) || 8;
                tamed.guardDamage = parseInt(document.getElementById('en-tame-guardDamage').value) || 8;
                if (document.getElementById('en-tame-dangerousTame').checked) {
                    tamed.dangerousTame = true;
                    tamed.baseTameChance = parseFloat(document.getElementById('en-tame-baseTameChance').value) || 0.4;
                    tamed.retaliationDamage = parseInt(document.getElementById('en-tame-retaliationDamage').value) || 12;
                }
            } else if (role === 'production') {
                tamed.produces = document.getElementById('en-tame-produces').value.trim() || 'eggs';
                tamed.produceRate = parseInt(document.getElementById('en-tame-produceRate').value) || 80;
                tamed.produceAmount = parseInt(document.getElementById('en-tame-produceAmount').value) || 1;
            } else if (role === 'pack') {
                tamed.packAnimal = true;
                tamed.expeditionSpeedBonus = parseFloat(document.getElementById('en-tame-expeditionSpeedBonus').value) || 0.25;
            } else if (role === 'happiness') {
                tamed.happinessAura = true;
                tamed.auraRadius = parseInt(document.getElementById('en-tame-auraRadius').value) || 5;
                tamed.auraMoodBonus = parseInt(document.getElementById('en-tame-auraMoodBonus').value) || 5;
            }

            data.tamed = tamed;
        }

        return data;
    }

    _formatOutput(data) {
        if (!data) return '';
        const parts = [];
        parts.push(`char: '${data.char}'`);
        parts.push(`color: '${data.color}'`);
        parts.push(`hp: ${data.hp}`);
        parts.push(`speed: ${data.speed}`);
        parts.push(`hostile: ${data.hostile}`);
        if (data.meatYield) parts.push(`meatYield: ${data.meatYield}`);
        if (data.hideYield) parts.push(`hideYield: ${data.hideYield}`);

        if (data.hostile) {
            parts.push(`damage: ${data.damage}`);
            parts.push(`aggroRange: ${data.aggroRange}`);
            parts.push(`spawnWeight: ${data.spawnWeight}`);
            if (data.spawnCondition) parts.push(`spawnCondition: '${data.spawnCondition}'`);
        } else {
            if (data.fleeRange) parts.push(`fleeRange: ${data.fleeRange}`);
            parts.push(`spawnWeight: ${data.spawnWeight}`);
        }

        if (data.tameable) {
            parts.push(`tameable: true`);
            const tamedParts = [];
            const t = data.tamed;
            if (t.guardAnimal) tamedParts.push('guardAnimal: true');
            if (t.guardRadius) tamedParts.push(`guardRadius: ${t.guardRadius}`);
            if (t.guardDamage) tamedParts.push(`guardDamage: ${t.guardDamage}`);
            if (t.packAnimal) tamedParts.push('packAnimal: true');
            if (t.expeditionSpeedBonus) tamedParts.push(`expeditionSpeedBonus: ${t.expeditionSpeedBonus}`);
            if (t.happinessAura) tamedParts.push('happinessAura: true');
            if (t.auraRadius) tamedParts.push(`auraRadius: ${t.auraRadius}`);
            if (t.auraMoodBonus) tamedParts.push(`auraMoodBonus: ${t.auraMoodBonus}`);
            if (t.produces) tamedParts.push(`produces: '${t.produces}'`);
            if (t.produceRate) tamedParts.push(`produceRate: ${t.produceRate}`);
            if (t.produceAmount) tamedParts.push(`produceAmount: ${t.produceAmount}`);
            tamedParts.push(`foodToTame: ${t.foodToTame}`);
            if (t.dangerousTame) {
                tamedParts.push('dangerousTame: true');
                tamedParts.push(`baseTameChance: ${t.baseTameChance}`);
                tamedParts.push(`retaliationDamage: ${t.retaliationDamage}`);
            }
            parts.push(`tamed: {\n        ${tamedParts.join(',\n        ')},\n    }`);
        }

        return `${data.key}: {\n    ${parts.join(',\n    ')},\n},`;
    }

    _copyPreview() {
        const text = document.getElementById('en-preview').textContent;
        navigator.clipboard.writeText(text);
    }

    _exportAll() {
        const saved = this._getSaved();
        if (!saved.length) return;
        let output = '// === Add to ANIMALS in config.js ===\n';
        saved.forEach(item => {
            output += this._formatOutput(item) + '\n\n';
        });
        output = output.trimEnd();

        const modal = document.createElement('div');
        modal.className = 'fe-export-modal';
        modal.innerHTML = `
            <div class="fe-export-modal-content">
                <div style="color:#ffcc00;font-weight:bold;margin-bottom:12px;">Export All Entities (${saved.length} items)</div>
                <textarea readonly>${output}</textarea>
                <div class="fe-modal-actions">
                    <button id="en-modal-copy">Copy to Clipboard</button>
                    <button id="en-modal-close">Close</button>
                </div>
            </div>
        `;
        this.container.appendChild(modal);

        document.getElementById('en-modal-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(output);
            document.getElementById('en-modal-copy').textContent = 'Copied!';
        });
        document.getElementById('en-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    _populateForm(data) {
        document.getElementById('en-key').value = data.key || '';
        document.getElementById('en-char').value = data.char || '';
        document.getElementById('en-color').value = data.color || '#bb8855';
        document.getElementById('en-hp').value = data.hp || 40;
        document.getElementById('en-speed').value = data.speed || 0.5;
        document.getElementById('en-hostile').checked = !!data.hostile;

        if (data.hostile) {
            document.getElementById('en-h-meatYield').value = data.meatYield || 0;
            document.getElementById('en-h-hideYield').value = data.hideYield || 0;
            document.getElementById('en-h-damage').value = data.damage || 8;
            document.getElementById('en-h-aggroRange').value = data.aggroRange || 6;
            document.getElementById('en-h-spawnWeight').value = data.spawnWeight || 0;
            document.getElementById('en-h-spawnCondition').value = data.spawnCondition || '';
        } else {
            document.getElementById('en-p-meatYield').value = data.meatYield || 0;
            document.getElementById('en-p-hideYield').value = data.hideYield || 0;
            document.getElementById('en-p-fleeRange').value = data.fleeRange || 0;
            document.getElementById('en-p-spawnWeight').value = data.spawnWeight || 0;
        }

        document.getElementById('en-tameable').checked = !!data.tameable;
        if (data.tamed) {
            let role = 'guard';
            if (data.tamed.packAnimal) role = 'pack';
            else if (data.tamed.produces) role = 'production';
            else if (data.tamed.happinessAura) role = 'happiness';
            document.getElementById('en-tame-role').value = role;
            document.getElementById('en-tame-foodToTame').value = data.tamed.foodToTame || 4;

            if (role === 'guard') {
                document.getElementById('en-tame-guardRadius').value = data.tamed.guardRadius || 8;
                document.getElementById('en-tame-guardDamage').value = data.tamed.guardDamage || 8;
                document.getElementById('en-tame-dangerousTame').checked = !!data.tamed.dangerousTame;
                if (data.tamed.dangerousTame) {
                    document.getElementById('en-tame-baseTameChance').value = data.tamed.baseTameChance || 0.4;
                    document.getElementById('en-tame-retaliationDamage').value = data.tamed.retaliationDamage || 12;
                }
            } else if (role === 'production') {
                document.getElementById('en-tame-produces').value = data.tamed.produces || '';
                document.getElementById('en-tame-produceRate').value = data.tamed.produceRate || 80;
                document.getElementById('en-tame-produceAmount').value = data.tamed.produceAmount || 1;
            } else if (role === 'pack') {
                document.getElementById('en-tame-expeditionSpeedBonus').value = data.tamed.expeditionSpeedBonus || 0.25;
            } else if (role === 'happiness') {
                document.getElementById('en-tame-auraRadius').value = data.tamed.auraRadius || 5;
                document.getElementById('en-tame-auraMoodBonus').value = data.tamed.auraMoodBonus || 5;
            }
        }

        this._updateConditionals();
        this._schedulePreview();
    }

    _loadFromConfig(key) {
        const def = ANIMALS[key];
        if (!def) return;
        const data = { key, ...def };
        if (def.tamed) { data.tameable = true; }
        this._populateForm(data);
        this.activeDraftKey = null;
        this._renderDraftList();
        this._schedulePreview();
        this._pushUndoState();
    }

    _duplicateDraft() {
        const data = this._collectFormData();
        if (!data || !data.key) return;
        data.key = data.key + '_copy';
        this._populateForm(data);
        this.activeDraftKey = null;
        this._renderDraftList();
        this._schedulePreview();
        this._pushUndoState();
    }

    _getFormSnapshot() {
        const inputs = this.container.querySelectorAll('#en-form input, #en-form select');
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

    _validateForm() {
        const key = document.getElementById('en-key');
        const char = document.getElementById('en-char');
        let valid = true;
        key.closest('.fe-field').classList.toggle('fe-error', !key.value.trim());
        char.closest('.fe-field').classList.toggle('fe-error', !char.value.trim());
        if (!key.value.trim() || !char.value.trim()) valid = false;
        return valid;
    }

    _getSaved() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
}
