const STORAGE_KEY = 'convocation_equipment_drafts';

const CATEGORIES = {
    weapon: { label: 'Weapon', config: 'WEAPONS' },
    armor: { label: 'Armor', config: 'ARMORS' },
    helmet: { label: 'Helmet', config: 'HELMETS' },
    tool: { label: 'Tool', config: 'TOOLS' },
    artifact: { label: 'Artifact', config: 'ARTIFACTS' },
};

const STAT_FIELDS = {
    weapon: [
        { key: 'damage', label: 'Damage', type: 'number', required: true },
        { key: 'spellDamageBonus', label: 'Spell Damage Bonus', type: 'number', step: 0.05 },
        { key: 'miningSpeed', label: 'Mining Speed', type: 'number', step: 0.05 },
        { key: 'choppingSpeed', label: 'Chopping Speed', type: 'number', step: 0.05 },
    ],
    armor: [
        { key: 'damageReduction', label: 'Damage Reduction (0-1)', type: 'number', step: 0.01, required: true },
        { key: 'spellDamageBonus', label: 'Spell Damage Bonus', type: 'number', step: 0.05 },
        { key: 'coldResistance', label: 'Cold Resistance', type: 'number', step: 0.05 },
        { key: 'moveSpeedBonus', label: 'Move Speed Bonus', type: 'number', step: 0.05 },
    ],
    helmet: [
        { key: 'damageReduction', label: 'Damage Reduction (0-1)', type: 'number', step: 0.01, required: true },
        { key: 'spellDamageBonus', label: 'Spell Damage Bonus', type: 'number', step: 0.05 },
        { key: 'coldResistance', label: 'Cold Resistance', type: 'number', step: 0.05 },
    ],
    tool: [
        { key: 'miningSpeed', label: 'Mining Speed', type: 'number', step: 0.05 },
        { key: 'choppingSpeed', label: 'Chopping Speed', type: 'number', step: 0.05 },
        { key: 'farmingSpeed', label: 'Farming Speed', type: 'number', step: 0.05 },
        { key: 'craftingSpeed', label: 'Crafting Speed', type: 'number', step: 0.05 },
    ],
};

const ARTIFACT_EQUIPPED_STATS = [
    { key: 'moveSpeedBonus', label: 'Move Speed Bonus', step: 0.05 },
    { key: 'workSpeedBonus', label: 'Work Speed Bonus', step: 0.05 },
    { key: 'damageReduction', label: 'Damage Reduction', step: 0.05 },
    { key: 'spellDamageBonus', label: 'Spell Damage Bonus', step: 0.05 },
];

const ARTIFACT_PEDESTAL_FIELDS = [
    { key: 'radius', label: 'Radius (number or "global")', type: 'text' },
    { key: 'manaCost', label: 'Mana Cost', type: 'number' },
    { key: 'blightImmunity', label: 'Blight Immunity', type: 'checkbox' },
    { key: 'workSpeedBonus', label: 'Work Speed Bonus', type: 'number', step: 0.05 },
    { key: 'wandererChanceMult', label: 'Wanderer Chance Mult', type: 'number', step: 0.1 },
    { key: 'cookingBonusFood', label: 'Cooking Bonus Food', type: 'number' },
    { key: 'lightRadius', label: 'Light Radius', type: 'number' },
    { key: 'damageBonusMult', label: 'Damage Bonus Mult', type: 'number', step: 0.05 },
    { key: 'tradeMarkupMult', label: 'Trade Markup Mult', type: 'number', step: 0.05 },
    { key: 'skillGrowthBonus', label: 'Skill Growth Bonus', type: 'number', step: 0.05 },
];

const ARTIFACT_EXPEDITION_FIELDS = [
    { key: 'lootMult', label: 'Loot Mult', type: 'number', step: 0.1 },
    { key: 'trapDamageMult', label: 'Trap Damage Mult', type: 'number', step: 0.1 },
    { key: 'rareEncounterMult', label: 'Rare Encounter Mult', type: 'number', step: 0.1 },
    { key: 'durationMult', label: 'Duration Mult', type: 'number', step: 0.05 },
    { key: 'partyDamageMult', label: 'Party Damage Mult', type: 'number', step: 0.05 },
    { key: 'targetPriority', label: 'Target Priority', type: 'number' },
    { key: 'damageReduction', label: 'Damage Reduction', type: 'number', step: 0.05 },
    { key: 'autoReviveHp', label: 'Auto-Revive HP (fraction)', type: 'number', step: 0.1 },
];

const ARTIFACT_COMBAT_FIELDS = [
    { key: 'targetPriority', label: 'Target Priority', type: 'number' },
    { key: 'damageReduction', label: 'Damage Reduction', type: 'number', step: 0.05 },
    { key: 'autoReviveHp', label: 'Auto-Revive HP (fraction)', type: 'number', step: 0.1 },
];

let editorInstance = null;

export function launchEquipmentEditor() {
    document.getElementById('start-screen').style.display = 'none';
    if (!editorInstance) {
        editorInstance = new EquipmentEditor();
    }
    editorInstance.show();
}

class EquipmentEditor {
    constructor() {
        this.category = 'weapon';
        this.batchItems = [];
        this.container = document.getElementById('equipment-editor');
        this._buildDOM();
        this._bindEvents();
        this._refreshLoadDropdown();
        this._autoRestore();
        this._switchCategory(this.category);
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }

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
            <button id="eq-back">← Back</button>
            <span class="fe-sep"></span>
            ${Object.entries(CATEGORIES).map(([k, v]) =>
                `<button class="eq-cat-tab" data-cat="${k}">${v.label}</button>`
            ).join('')}
            <span class="fe-sep"></span>
            <select id="eq-load-select"><option value="">Load draft...</option></select>
            <button id="eq-save">Save</button>
            <button id="eq-delete">Delete</button>
            <span class="fe-sep"></span>
            <button id="eq-export">Export All</button>
        `;
        this.container.appendChild(toolbar);

        const workspace = document.createElement('div');
        workspace.className = 'fe-workspace';

        const formPanel = document.createElement('div');
        formPanel.className = 'fe-form-panel';
        formPanel.id = 'eq-form';

        const previewPanel = document.createElement('div');
        previewPanel.className = 'fe-preview-panel';
        previewPanel.innerHTML = `
            <div class="fe-preview-header">
                <span>Live Preview</span>
                <button id="eq-copy-preview" style="font-size:10px;padding:2px 8px;">Copy</button>
            </div>
            <div class="fe-preview-code" id="eq-preview"></div>
        `;

        workspace.appendChild(formPanel);
        workspace.appendChild(previewPanel);
        this.container.appendChild(workspace);

        this._buildForm();
    }

    _buildForm() {
        const form = document.getElementById('eq-form');
        form.innerHTML = `
            <div class="fe-section-title">Item Info</div>
            <div class="fe-row">
                <div class="fe-field">
                    <label>Key (snake_case)</label>
                    <input type="text" id="eq-key" placeholder="iron_sword">
                </div>
                <div class="fe-field">
                    <label>Display Name</label>
                    <input type="text" id="eq-name" placeholder="Iron Sword">
                </div>
            </div>

            <div class="fe-section-title">Stats</div>
            <div id="eq-stats-section"></div>

            <div id="eq-artifact-section" class="fe-conditional">
                <div class="fe-section-title">Equipped Stats (top-level)</div>
                <div class="fe-row" id="eq-artifact-equipped"></div>

                <div class="fe-checkbox-row">
                    <input type="checkbox" id="eq-art-consumable">
                    <label for="eq-art-consumable">Consumable (single-use)</label>
                </div>

                <div class="fe-checkbox-row">
                    <input type="checkbox" id="eq-art-pedestal-toggle">
                    <label for="eq-art-pedestal-toggle">Has Pedestal Effect</label>
                </div>
                <div id="eq-art-pedestal" class="fe-conditional"></div>

                <div class="fe-checkbox-row">
                    <input type="checkbox" id="eq-art-expedition-toggle">
                    <label for="eq-art-expedition-toggle">Has Expedition Effect</label>
                </div>
                <div id="eq-art-expedition" class="fe-conditional"></div>

                <div class="fe-checkbox-row">
                    <input type="checkbox" id="eq-art-combat-toggle">
                    <label for="eq-art-combat-toggle">Has Combat Effect</label>
                </div>
                <div id="eq-art-combat" class="fe-conditional"></div>

                <div class="fe-checkbox-row">
                    <input type="checkbox" id="eq-art-durability-toggle">
                    <label for="eq-art-durability-toggle">Has Durability</label>
                </div>
                <div id="eq-art-durability" class="fe-conditional"></div>
            </div>

            <div style="margin-top:16px;">
                <button id="eq-add-batch" class="fe-add-btn" style="padding:6px 16px;font-size:12px;">+ Add to Batch</button>
            </div>

            <div class="fe-section-title" style="margin-top:24px;">Batch Items</div>
            <div id="eq-batch-list"></div>
        `;

        this._buildArtifactSubSections();
        this._buildStatsSection();
    }

    _buildStatsSection() {
        const section = document.getElementById('eq-stats-section');
        const fields = STAT_FIELDS[this.category];
        if (!fields) {
            section.innerHTML = '';
            return;
        }
        section.innerHTML = fields.map(f => `
            <div class="fe-field">
                <label>${f.label}${f.required ? ' *' : ''}</label>
                <input type="number" id="eq-stat-${f.key}" step="${f.step || 1}" placeholder="0">
            </div>
        `).join('');
    }

    _buildArtifactSubSections() {
        const equipped = document.getElementById('eq-artifact-equipped');
        equipped.innerHTML = ARTIFACT_EQUIPPED_STATS.map(f => `
            <div class="fe-field">
                <label>${f.label}</label>
                <input type="number" id="eq-arteq-${f.key}" step="${f.step}" placeholder="0">
            </div>
        `).join('');

        document.getElementById('eq-art-pedestal').innerHTML = this._buildSubFields(ARTIFACT_PEDESTAL_FIELDS, 'ped');
        document.getElementById('eq-art-expedition').innerHTML = this._buildSubFields(ARTIFACT_EXPEDITION_FIELDS, 'exp');
        document.getElementById('eq-art-combat').innerHTML = this._buildSubFields(ARTIFACT_COMBAT_FIELDS, 'com');
        document.getElementById('eq-art-durability').innerHTML = `
            <div class="fe-row">
                <div class="fe-field">
                    <label>Max Durability</label>
                    <input type="number" id="eq-dur-max" placeholder="1" min="1">
                </div>
                <div class="fe-field fe-checkbox-row" style="align-self:flex-end;margin-bottom:10px;">
                    <input type="checkbox" id="eq-dur-breakOnUse">
                    <label for="eq-dur-breakOnUse">Break on Use</label>
                </div>
            </div>
        `;
    }

    _buildSubFields(fields, prefix) {
        return `<div class="fe-row" style="flex-wrap:wrap;">` + fields.map(f => {
            if (f.type === 'checkbox') {
                return `<div class="fe-field fe-checkbox-row" style="flex:0 0 50%;">
                    <input type="checkbox" id="eq-${prefix}-${f.key}">
                    <label for="eq-${prefix}-${f.key}">${f.label}</label>
                </div>`;
            }
            return `<div class="fe-field" style="flex:0 0 calc(50% - 6px);">
                <label>${f.label}</label>
                <input type="${f.type || 'number'}" id="eq-${prefix}-${f.key}" step="${f.step || 1}" placeholder="0">
            </div>`;
        }).join('') + `</div>`;
    }

    _bindEvents() {
        document.getElementById('eq-back').addEventListener('click', () => this._goBack());
        document.getElementById('eq-save').addEventListener('click', () => this._saveDraft());
        document.getElementById('eq-delete').addEventListener('click', () => this._deleteDraft());
        document.getElementById('eq-export').addEventListener('click', () => this._showExportModal());
        document.getElementById('eq-add-batch').addEventListener('click', () => this._addToBatch());
        document.getElementById('eq-copy-preview').addEventListener('click', () => this._copyPreview());

        document.getElementById('eq-load-select').addEventListener('change', (e) => {
            if (e.target.value) this._loadDraft(e.target.value);
        });

        this.container.querySelectorAll('.eq-cat-tab').forEach(btn => {
            btn.addEventListener('click', () => this._switchCategory(btn.dataset.cat));
        });

        ['eq-art-pedestal-toggle', 'eq-art-expedition-toggle', 'eq-art-combat-toggle', 'eq-art-durability-toggle'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this._updateConditionals());
        });

        this.container.addEventListener('input', () => this._schedulePreview());
        this.container.addEventListener('change', () => this._schedulePreview());

        window.addEventListener('keydown', (e) => {
            if (this.container.style.display === 'none') return;
            if (e.key === 'Escape') this._goBack();
        });
    }

    _switchCategory(cat) {
        this.category = cat;
        this.container.querySelectorAll('.eq-cat-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === cat);
        });

        const statsSection = document.getElementById('eq-stats-section');
        const artifactSection = document.getElementById('eq-artifact-section');

        if (cat === 'artifact') {
            statsSection.style.display = 'none';
            artifactSection.classList.add('visible');
        } else {
            statsSection.style.display = '';
            artifactSection.classList.remove('visible');
            this._buildStatsSection();
        }
        this._updateConditionals();
        this._schedulePreview();
    }

    _updateConditionals() {
        const toggles = ['pedestal', 'expedition', 'combat', 'durability'];
        toggles.forEach(t => {
            const checked = document.getElementById(`eq-art-${t}-toggle`).checked;
            const panel = document.getElementById(`eq-art-${t}`);
            panel.classList.toggle('visible', checked);
        });
    }

    _schedulePreview() {
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(() => {
            this._updatePreview();
            this._autoSave();
        }, 50);
    }

    _updatePreview() {
        const data = this._collectFormData();
        const code = this._formatItem(data);
        document.getElementById('eq-preview').textContent = code || '// Fill in fields to see preview';
    }

    _autoSave() {
        try {
            const state = {
                category: this.category,
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
            if (state.category) this._switchCategory(state.category);
            if (state.form && state.form.key) {
                document.getElementById('eq-key').value = state.form.key;
                document.getElementById('eq-name').value = state.form.name || '';
                if (state.category === 'artifact') {
                    ARTIFACT_EQUIPPED_STATS.forEach(f => {
                        document.getElementById(`eq-arteq-${f.key}`).value = state.form[f.key] || '';
                    });
                    document.getElementById('eq-art-consumable').checked = !!state.form.consumable;
                    if (state.form.pedestal) {
                        document.getElementById('eq-art-pedestal-toggle').checked = true;
                        ARTIFACT_PEDESTAL_FIELDS.forEach(f => {
                            const el = document.getElementById(`eq-ped-${f.key}`);
                            if (f.type === 'checkbox') el.checked = !!state.form.pedestal[f.key];
                            else el.value = state.form.pedestal[f.key] || '';
                        });
                    }
                    if (state.form.expedition) {
                        document.getElementById('eq-art-expedition-toggle').checked = true;
                        ARTIFACT_EXPEDITION_FIELDS.forEach(f => {
                            document.getElementById(`eq-exp-${f.key}`).value = state.form.expedition[f.key] || '';
                        });
                    }
                    if (state.form.combat) {
                        document.getElementById('eq-art-combat-toggle').checked = true;
                        ARTIFACT_COMBAT_FIELDS.forEach(f => {
                            document.getElementById(`eq-com-${f.key}`).value = state.form.combat[f.key] || '';
                        });
                    }
                    if (state.form.durability) {
                        document.getElementById('eq-art-durability-toggle').checked = true;
                        document.getElementById('eq-dur-max').value = state.form.durability.max || '';
                        document.getElementById('eq-dur-breakOnUse').checked = !!state.form.durability.breakOnUse;
                    }
                    this._updateConditionals();
                } else {
                    const fields = STAT_FIELDS[state.category];
                    if (fields) fields.forEach(f => {
                        const el = document.getElementById(`eq-stat-${f.key}`);
                        if (el) el.value = state.form[f.key] || '';
                    });
                }
            }
        } catch {}
    }

    _collectFormData() {
        const key = document.getElementById('eq-key').value.trim();
        const name = document.getElementById('eq-name').value.trim();
        if (!key && !name) return null;

        const item = { key, name, category: this.category };

        if (this.category === 'artifact') {
            ARTIFACT_EQUIPPED_STATS.forEach(f => {
                const val = parseFloat(document.getElementById(`eq-arteq-${f.key}`).value);
                if (val) item[f.key] = val;
            });

            if (document.getElementById('eq-art-consumable').checked) {
                item.consumable = true;
            }

            if (document.getElementById('eq-art-pedestal-toggle').checked) {
                const ped = {};
                ARTIFACT_PEDESTAL_FIELDS.forEach(f => {
                    const el = document.getElementById(`eq-ped-${f.key}`);
                    if (f.type === 'checkbox') {
                        if (el.checked) ped[f.key] = true;
                    } else if (f.type === 'text') {
                        const v = el.value.trim();
                        if (v) ped[f.key] = v === 'global' ? 'global' : (parseFloat(v) || v);
                    } else {
                        const v = parseFloat(el.value);
                        if (v) ped[f.key] = v;
                    }
                });
                if (Object.keys(ped).length) item.pedestal = ped;
            }

            if (document.getElementById('eq-art-expedition-toggle').checked) {
                const exp = {};
                ARTIFACT_EXPEDITION_FIELDS.forEach(f => {
                    const v = parseFloat(document.getElementById(`eq-exp-${f.key}`).value);
                    if (v) exp[f.key] = v;
                });
                if (Object.keys(exp).length) item.expedition = exp;
            }

            if (document.getElementById('eq-art-combat-toggle').checked) {
                const com = {};
                ARTIFACT_COMBAT_FIELDS.forEach(f => {
                    const v = parseFloat(document.getElementById(`eq-com-${f.key}`).value);
                    if (v) com[f.key] = v;
                });
                if (Object.keys(com).length) item.combat = com;
            }

            if (document.getElementById('eq-art-durability-toggle').checked) {
                const dur = {};
                const max = parseInt(document.getElementById('eq-dur-max').value);
                if (max) dur.max = max;
                if (document.getElementById('eq-dur-breakOnUse').checked) dur.breakOnUse = true;
                if (Object.keys(dur).length) item.durability = dur;
            }
        } else {
            const fields = STAT_FIELDS[this.category];
            if (fields) {
                fields.forEach(f => {
                    const val = parseFloat(document.getElementById(`eq-stat-${f.key}`).value);
                    if (val) item[f.key] = val;
                });
            }
        }

        return item;
    }

    _formatItem(item) {
        if (!item || !item.key) return '';
        const parts = [`name: '${item.name || item.key}'`];

        if (item.category === 'artifact') {
            ARTIFACT_EQUIPPED_STATS.forEach(f => {
                if (item[f.key]) parts.push(`${f.key}: ${item[f.key]}`);
            });
            if (item.consumable) parts.push('consumable: true');
            if (item.pedestal) parts.push(`pedestal: ${this._formatObj(item.pedestal)}`);
            if (item.expedition) parts.push(`expedition: ${this._formatObj(item.expedition)}`);
            if (item.combat) parts.push(`combat: ${this._formatObj(item.combat)}`);
            if (item.durability) parts.push(`durability: ${this._formatObj(item.durability)}`);
        } else {
            const fields = STAT_FIELDS[item.category];
            if (fields) {
                fields.forEach(f => {
                    if (item[f.key]) parts.push(`${f.key}: ${item[f.key]}`);
                });
            }
        }

        const inner = parts.join(', ');
        if (inner.length < 70 && !item.pedestal && !item.expedition && !item.combat && !item.durability) {
            return `${item.key}: { ${inner} },`;
        }

        let out = `${item.key}: {\n`;
        out += parts.map(p => `    ${p},`).join('\n');
        out += `\n},`;
        return out;
    }

    _formatObj(obj) {
        const entries = Object.entries(obj).map(([k, v]) => {
            if (typeof v === 'string') return `${k}: '${v}'`;
            if (typeof v === 'boolean') return `${k}: ${v}`;
            return `${k}: ${v}`;
        });
        return `{ ${entries.join(', ')} }`;
    }

    _addToBatch() {
        const data = this._collectFormData();
        if (!data || !data.key) return;
        if (!data.name) data.name = data.key;

        if (data.category !== 'artifact') {
            const fields = STAT_FIELDS[data.category];
            const hasRequired = fields.filter(f => f.required).every(f => data[f.key]);
            const hasAnyStat = fields.some(f => data[f.key]);
            if (data.category === 'tool' && !hasAnyStat) return;
            if (data.category !== 'tool' && !hasRequired) return;
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
        document.getElementById('eq-key').value = '';
        document.getElementById('eq-name').value = '';
        this.container.querySelectorAll('#eq-stats-section input').forEach(el => el.value = '');
        this.container.querySelectorAll('#eq-artifact-section input[type="number"]').forEach(el => el.value = '');
        this.container.querySelectorAll('#eq-artifact-section input[type="text"]').forEach(el => el.value = '');
        this.container.querySelectorAll('#eq-artifact-section input[type="checkbox"]').forEach(el => el.checked = false);
        this._updateConditionals();
    }

    _editBatchItem(index) {
        const item = this.batchItems[index];
        if (!item) return;

        this._switchCategory(item.category);
        document.getElementById('eq-key').value = item.key;
        document.getElementById('eq-name').value = item.name;

        if (item.category === 'artifact') {
            ARTIFACT_EQUIPPED_STATS.forEach(f => {
                document.getElementById(`eq-arteq-${f.key}`).value = item[f.key] || '';
            });
            document.getElementById('eq-art-consumable').checked = !!item.consumable;

            if (item.pedestal) {
                document.getElementById('eq-art-pedestal-toggle').checked = true;
                ARTIFACT_PEDESTAL_FIELDS.forEach(f => {
                    const el = document.getElementById(`eq-ped-${f.key}`);
                    if (f.type === 'checkbox') el.checked = !!item.pedestal[f.key];
                    else el.value = item.pedestal[f.key] || '';
                });
            }
            if (item.expedition) {
                document.getElementById('eq-art-expedition-toggle').checked = true;
                ARTIFACT_EXPEDITION_FIELDS.forEach(f => {
                    document.getElementById(`eq-exp-${f.key}`).value = item.expedition[f.key] || '';
                });
            }
            if (item.combat) {
                document.getElementById('eq-art-combat-toggle').checked = true;
                ARTIFACT_COMBAT_FIELDS.forEach(f => {
                    document.getElementById(`eq-com-${f.key}`).value = item.combat[f.key] || '';
                });
            }
            if (item.durability) {
                document.getElementById('eq-art-durability-toggle').checked = true;
                document.getElementById('eq-dur-max').value = item.durability.max || '';
                document.getElementById('eq-dur-breakOnUse').checked = !!item.durability.breakOnUse;
            }
            this._updateConditionals();
        } else {
            const fields = STAT_FIELDS[item.category];
            if (fields) {
                fields.forEach(f => {
                    const el = document.getElementById(`eq-stat-${f.key}`);
                    if (el) el.value = item[f.key] || '';
                });
            }
        }

        this.batchItems.splice(index, 1);
        this._renderBatchList();
        this._schedulePreview();
    }

    _removeBatchItem(index) {
        this.batchItems.splice(index, 1);
        this._renderBatchList();
        this._schedulePreview();
    }

    _renderBatchList() {
        const container = document.getElementById('eq-batch-list');
        if (!this.batchItems.length) {
            container.innerHTML = '<div style="color:#666;font-size:11px;">No items in batch yet. Fill in the form and click "+ Add to Batch".</div>';
            return;
        }
        let html = `<table class="fe-batch-table"><thead><tr>
            <th>Category</th><th>Key</th><th>Name</th><th>Primary Stat</th><th>Actions</th>
        </tr></thead><tbody>`;
        this.batchItems.forEach((item, i) => {
            const primary = this._getPrimaryStat(item);
            html += `<tr>
                <td>${CATEGORIES[item.category].label}</td>
                <td>${item.key}</td>
                <td>${item.name}</td>
                <td>${primary}</td>
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

    _getPrimaryStat(item) {
        if (item.category === 'weapon') return item.damage ? `${item.damage} dmg` : '-';
        if (item.category === 'armor' || item.category === 'helmet') return item.damageReduction ? `${Math.round(item.damageReduction * 100)}% DR` : '-';
        if (item.category === 'tool') {
            const stats = ['miningSpeed', 'choppingSpeed', 'farmingSpeed', 'craftingSpeed'];
            const active = stats.filter(s => item[s]).map(s => `${s.replace('Speed', '')} ${item[s]}x`);
            return active.join(', ') || '-';
        }
        if (item.category === 'artifact') {
            const parts = [];
            if (item.pedestal) parts.push('pedestal');
            if (item.expedition) parts.push('expedition');
            if (item.combat) parts.push('combat');
            if (item.consumable) parts.push('consumable');
            return parts.join(', ') || 'equipped';
        }
        return '-';
    }

    _formatBatchExport() {
        const grouped = {};
        this.batchItems.forEach(item => {
            const cat = item.category;
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        let output = '';
        for (const [cat, items] of Object.entries(grouped)) {
            output += `// === Add to ${CATEGORIES[cat].config} in config.js ===\n`;
            items.forEach(item => {
                output += this._formatItem(item) + '\n';
            });
            output += '\n';
        }
        return output.trimEnd();
    }

    _copyPreview() {
        const text = document.getElementById('eq-preview').textContent;
        navigator.clipboard.writeText(text);
    }

    _showExportModal() {
        if (!this.batchItems.length) return;
        const output = this._formatBatchExport();

        const modal = document.createElement('div');
        modal.className = 'fe-export-modal';
        modal.innerHTML = `
            <div class="fe-export-modal-content">
                <div style="color:#ffcc00;font-weight:bold;margin-bottom:12px;">Export Equipment (${this.batchItems.length} items)</div>
                <textarea readonly>${output}</textarea>
                <div class="fe-modal-actions">
                    <button id="eq-modal-copy">Copy to Clipboard</button>
                    <button id="eq-modal-close">Close</button>
                </div>
            </div>
        `;
        this.container.appendChild(modal);

        document.getElementById('eq-modal-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(output);
            document.getElementById('eq-modal-copy').textContent = 'Copied!';
        });
        document.getElementById('eq-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }


    _saveDraft() {
        const data = this._collectFormData();
        if (!data || !data.key) return;
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
        this._editBatchItem(-1);
        this._switchCategory(item.category);
        document.getElementById('eq-key').value = item.key;
        document.getElementById('eq-name').value = item.name;

        if (item.category === 'artifact') {
            ARTIFACT_EQUIPPED_STATS.forEach(f => {
                document.getElementById(`eq-arteq-${f.key}`).value = item[f.key] || '';
            });
            document.getElementById('eq-art-consumable').checked = !!item.consumable;
            if (item.pedestal) {
                document.getElementById('eq-art-pedestal-toggle').checked = true;
                ARTIFACT_PEDESTAL_FIELDS.forEach(f => {
                    const el = document.getElementById(`eq-ped-${f.key}`);
                    if (f.type === 'checkbox') el.checked = !!item.pedestal[f.key];
                    else el.value = item.pedestal[f.key] || '';
                });
            }
            if (item.expedition) {
                document.getElementById('eq-art-expedition-toggle').checked = true;
                ARTIFACT_EXPEDITION_FIELDS.forEach(f => {
                    document.getElementById(`eq-exp-${f.key}`).value = item.expedition[f.key] || '';
                });
            }
            if (item.combat) {
                document.getElementById('eq-art-combat-toggle').checked = true;
                ARTIFACT_COMBAT_FIELDS.forEach(f => {
                    document.getElementById(`eq-com-${f.key}`).value = item.combat[f.key] || '';
                });
            }
            if (item.durability) {
                document.getElementById('eq-art-durability-toggle').checked = true;
                document.getElementById('eq-dur-max').value = item.durability.max || '';
                document.getElementById('eq-dur-breakOnUse').checked = !!item.durability.breakOnUse;
            }
            this._updateConditionals();
        } else {
            const fields = STAT_FIELDS[item.category];
            if (fields) fields.forEach(f => {
                const el = document.getElementById(`eq-stat-${f.key}`);
                if (el) el.value = item[f.key] || '';
            });
        }
        this._schedulePreview();
        document.getElementById('eq-load-select').value = '';
    }

    _deleteDraft() {
        const key = document.getElementById('eq-key').value.trim();
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
        const select = document.getElementById('eq-load-select');
        const saved = this._getSaved();
        select.innerHTML = '<option value="">Load draft...</option>' +
            saved.map(s => `<option value="${s.key}">${s.name || s.key} (${s.category})</option>`).join('');
    }
}
