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
        this.container = document.getElementById('entity-editor');
        this._buildDOM();
        this._bindEvents();
        this._refreshLoadDropdown();
        this._autoRestore();
        this._updateConditionals();
        this._schedulePreview();
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
            <select id="en-load-select"><option value="">Load draft...</option></select>
            <button id="en-save">Save</button>
            <button id="en-delete">Delete</button>
            <span class="fe-sep"></span>
            <button id="en-export">Export</button>
            <button id="en-copy">Copy</button>
        `;
        this.container.appendChild(toolbar);

        const workspace = document.createElement('div');
        workspace.className = 'fe-workspace';

        const formPanel = document.createElement('div');
        formPanel.className = 'fe-form-panel';
        formPanel.id = 'en-form';
        formPanel.innerHTML = this._buildFormHTML();

        const previewPanel = document.createElement('div');
        previewPanel.className = 'fe-preview-panel';
        previewPanel.innerHTML = `
            <div class="fe-preview-header">
                <span>Live Preview</span>
            </div>
            <div id="en-char-preview" style="text-align:center;padding:16px;font-size:48px;font-family:'Courier New',monospace;background:#0a0a14;border-bottom:1px solid #333;">?</div>
            <div class="fe-preview-code" id="en-preview"></div>
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
        `;
    }

    _bindEvents() {
        document.getElementById('en-back').addEventListener('click', () => this._goBack());
        document.getElementById('en-save').addEventListener('click', () => this._saveDraft());
        document.getElementById('en-delete').addEventListener('click', () => this._deleteDraft());
        document.getElementById('en-export').addEventListener('click', () => this._showExportModal());
        document.getElementById('en-copy').addEventListener('click', () => this._copyPreview());

        document.getElementById('en-load-select').addEventListener('change', (e) => {
            if (e.target.value) this._loadDraft(e.target.value);
        });

        document.getElementById('en-hostile').addEventListener('change', () => this._updateConditionals());
        document.getElementById('en-tameable').addEventListener('change', () => this._updateConditionals());
        document.getElementById('en-tame-role').addEventListener('change', () => this._updateConditionals());
        document.getElementById('en-tame-dangerousTame').addEventListener('change', () => this._updateConditionals());

        document.getElementById('en-char').addEventListener('input', () => this._updateCharPreview());
        document.getElementById('en-color').addEventListener('input', () => this._updateCharPreview());

        this.container.addEventListener('input', () => this._schedulePreview());
        this.container.addEventListener('change', () => this._schedulePreview());

        window.addEventListener('keydown', (e) => {
            if (this.container.style.display === 'none') return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'Escape') this._goBack();
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
            this._autoSave();
        }, 50);
    }

    _updatePreview() {
        this._updateCharPreview();
        const data = this._collectFormData();
        const code = data ? this._formatOutput(data) : '// Fill in fields to see preview';
        document.getElementById('en-preview').textContent = code;
    }

    _autoSave() {
        try {
            const data = this._collectFormData();
            localStorage.setItem(STORAGE_KEY + '_autosave', JSON.stringify(data));
        } catch {}
    }

    _autoRestore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY + '_autosave');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data && data.key) this._populateForm(data);
        } catch {}
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

    _showExportModal() {
        const data = this._collectFormData();
        if (!data) return;
        const output = this._formatOutput(data);

        const modal = document.createElement('div');
        modal.className = 'fe-export-modal';
        modal.innerHTML = `
            <div class="fe-export-modal-content">
                <div style="color:#ffcc00;font-weight:bold;margin-bottom:12px;">Export Entity: ${data.key}</div>
                <textarea readonly>// === Add to ANIMALS in config.js ===\n${output}</textarea>
                <div class="fe-modal-actions">
                    <button id="en-modal-copy">Copy to Clipboard</button>
                    <button id="en-modal-close">Close</button>
                </div>
            </div>
        `;
        this.container.appendChild(modal);

        document.getElementById('en-modal-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(`// === Add to ANIMALS in config.js ===\n${output}`);
            document.getElementById('en-modal-copy').textContent = 'Copied!';
        });
        document.getElementById('en-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    _saveDraft() {
        const data = this._collectFormData();
        if (!data) return;
        const saved = this._getSaved();
        const idx = saved.findIndex(s => s.key === data.key);
        if (idx >= 0) saved[idx] = data;
        else saved.push(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        this._refreshLoadDropdown();
    }

    _loadDraft(key) {
        const saved = this._getSaved();
        const item = saved.find(s => s.key === key);
        if (!item) return;
        this._populateForm(item);
        document.getElementById('en-load-select').value = '';
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

    _deleteDraft() {
        const key = document.getElementById('en-key').value.trim();
        if (!key) return;
        const saved = this._getSaved().filter(s => s.key !== key);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        this._refreshLoadDropdown();
    }

    _getSaved() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }

    _refreshLoadDropdown() {
        const select = document.getElementById('en-load-select');
        const saved = this._getSaved();
        select.innerHTML = '<option value="">Load draft...</option>' +
            saved.map(s => `<option value="${s.key}">${s.key} (${s.char})</option>`).join('');
    }
}
