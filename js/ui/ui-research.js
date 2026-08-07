import { RESEARCH, RESEARCH_TABS, DEMO_LOCKED_RESEARCH, BUILDINGS } from '../core/config.js';

export function installResearchPanel(UI) {
    Object.assign(UI.prototype, researchMethods);
}

const researchMethods = {
    toggleResearchPanel() {
        const opening = !this.researchPanelVisible;
        this._closeAllPanels();
        this.researchPanelVisible = opening;
        this._panelPause(opening);
        this.elements.researchPanel.style.display = opening ? 'block' : 'none';
        if (opening) this.updateResearchPanel();
        this._updateOverlay();
    },

    updateResearchPanel() {
        const research = this.game.research;
        const activeTab = this._researchTab || 'foundations';
        if (!this._researchTabScrolls) this._researchTabScrolls = {};
        const tabsContainer = this.elements.researchPanel.querySelector('.research-tabs');
        if (tabsContainer) {
            this._researchTabsScroll = tabsContainer.scrollLeft;
        }
        let html = '<div class="panel-close" data-panel-close="research">&times;</div><h3>Research</h3>';

        if (research.activeResearch) {
            const activeTech = RESEARCH[research.activeResearch];
            const prog = research.getProgress(research.activeResearch);
            const pct = Math.min(100, Math.floor((prog / activeTech.cost) * 100));
            html += `<div class="info-row" style="color:#aa88ff; font-weight:bold; margin-bottom:6px;">`;
            html += `Researching: ${activeTech.name} (${Math.floor(prog)}/${activeTech.cost})`;
            html += `<button style="margin-left:8px;font-size:10px;padding:1px 6px;cursor:pointer;" onclick="window.game.cancelResearch()">Cancel</button>`;
            html += `</div>`;
            html += `<div style="background:#333;border-radius:3px;height:6px;margin-bottom:8px;"><div style="background:#aa88ff;height:100%;border-radius:3px;width:${pct}%;"></div></div>`;
        } else {
            const hasAvail = research.hasAvailableResearch();
            html += `<div class="info-row" style="color:${hasAvail ? '#ffcc44' : '#888'}; font-weight:bold; margin-bottom:6px;">`;
            html += hasAvail ? 'No research selected — tome study speed doubled' : 'All available research complete';
            html += `</div>`;
        }

        html += '<div class="research-tabs">';
        for (const tab of RESEARCH_TABS) {
            const tabKeys = Object.keys(RESEARCH).filter(k => RESEARCH[k].tab === tab.key);
            const done = tabKeys.filter(k => research.completed.has(k)).length;
            const active = tab.key === activeTab ? ' active' : '';
            html += `<button class="research-tab-btn${active}" data-research-tab="${tab.key}">${tab.name} (${done}/${tabKeys.length})</button>`;
        }
        html += '</div>';

        const tabKeys = Object.keys(RESEARCH).filter(k => RESEARCH[k].tab === activeTab);
        const layers = this._buildResearchLayers(tabKeys);
        html += `<div class="research-tree">`;
        html += `<svg class="research-lines" id="research-lines"></svg>`;
        for (let depth = 0; depth < layers.length; depth++) {
            html += `<div class="research-layer">`;
            for (const key of layers[depth]) {
                const tech = RESEARCH[key];
                const completed = research.completed.has(key);
                const demoLocked = this.game.settings.demoMode && DEMO_LOCKED_RESEARCH.has(key);
                const prereqsMet = tech.requires.every(r => research.completed.has(r));
                const gatesMet = prereqsMet && research._checkGates(tech);
                const available = !completed && !demoLocked && prereqsMet && gatesMet;
                const isActive = research.activeResearch === key;
                const prog = research.getProgress(key);
                let cls = 'research-node';
                if (demoLocked) cls += ' demo-locked';
                else if (completed) cls += ' completed';
                else if (isActive) cls += ' affordable';
                else if (available) cls += ' available';
                else cls += ' locked';
                const sameTabReqs = tech.requires.filter(r => RESEARCH[r]?.tab === activeTab);
                html += `<div class="${cls}" data-key="${key}" data-requires="${sameTabReqs.join(',')}">`;
                html += `<div class="research-node-name">${tech.name}</div>`;
                html += `<div class="research-node-desc">${tech.description}</div>`;
                if (demoLocked) {
                    html += `<div class="research-node-cost" style="color:#ff6666;">Available in Full Version</div>`;
                } else if (completed) {
                    html += `<div class="research-node-cost">Researched</div>`;
                } else if (isActive) {
                    const pct = Math.min(100, Math.floor((prog / tech.cost) * 100));
                    html += `<div class="research-node-cost">${Math.floor(prog)}/${tech.cost} pts (${pct}%)</div>`;
                    html += `<div style="background:#333;border-radius:3px;height:4px;margin:4px 0;"><div style="background:#aa88ff;height:100%;border-radius:3px;width:${pct}%;"></div></div>`;
                } else if (prog > 0) {
                    html += `<div class="research-node-cost">${Math.floor(prog)}/${tech.cost} pts (paused)</div>`;
                } else {
                    html += `<div class="research-node-cost">${tech.cost} pts</div>`;
                }
                if (!completed && !demoLocked) {
                    const gateLines = this._getGateRequirements(tech, research);
                    if (gateLines.length > 0) {
                        html += '<div class="research-gates">';
                        for (const gate of gateLines) {
                            const color = gate.met ? '#66cc66' : '#cc8844';
                            html += `<div class="research-gate" style="color:${color};">${gate.met ? '✓' : '○'} ${gate.label}</div>`;
                        }
                        html += '</div>';
                    }
                }
                const crossTabReqs = tech.requires.filter(r => RESEARCH[r]?.tab !== activeTab && !research.completed.has(r));
                if (crossTabReqs.length > 0) {
                    html += '<div class="research-cross-tab-row">';
                    for (const req of crossTabReqs) {
                        const reqTech = RESEARCH[req];
                        const reqTab = RESEARCH_TABS.find(t => t.key === reqTech.tab);
                        const reqCompleted = research.completed.has(req);
                        const reqAvailable = !reqCompleted && reqTech.requires.every(r => research.completed.has(r));
                        const badgeColor = reqCompleted ? '#66cc66' : reqAvailable ? '#cc8833' : '#666';
                        html += `<span class="research-cross-tab" data-jump-tab="${reqTech.tab}" style="border-color:${badgeColor}; color:${badgeColor}">${reqTech.name} (${reqTab.name} →)</span>`;
                    }
                    html += '</div>';
                }
                if (available && !isActive) {
                    html += `<button class="research-node-btn" onclick="window.game.selectResearch('${key}')">Select</button>`;
                } else if (isActive) {
                    html += `<button class="research-node-btn" onclick="window.game.cancelResearch()" style="background:#663333;">Cancel</button>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;

        if (html !== this._lastResearchHtml) {
            this._lastResearchHtml = html;
            this.elements.researchPanel.innerHTML = html;
            const tabsContainer = this.elements.researchPanel.querySelector('.research-tabs');
            if (tabsContainer && this._researchTabsScroll) {
                tabsContainer.scrollLeft = this._researchTabsScroll;
            }
            requestAnimationFrame(() => this._drawResearchLines());
            this._initResearchHover();
        }
    },

    _initResearchHover() {
        const tree = this.elements.researchPanel.querySelector('.research-tree');
        if (!tree) return;
        let currentKey = null;
        tree.addEventListener('mouseover', (e) => {
            const node = e.target.closest('.research-node[data-key]');
            const key = node?.dataset.key || null;
            if (key !== currentKey) {
                currentKey = key;
                if (key) this._highlightResearchNode(key);
                else this._clearResearchHighlight();
            }
        });
        tree.addEventListener('mouseleave', () => {
            currentKey = null;
            this._clearResearchHighlight();
        });
    },

    _getResearchFamily(key) {
        const activeTab = this._researchTab || 'foundations';
        const family = new Set([key]);
        const findAncestors = (k) => {
            const tech = RESEARCH[k];
            if (!tech) return;
            for (const req of tech.requires) {
                if (RESEARCH[req]?.tab !== activeTab) continue;
                family.add(req);
                findAncestors(req);
            }
        };
        findAncestors(key);
        const findDescendants = (k) => {
            for (const [childKey, childTech] of Object.entries(RESEARCH)) {
                if (childTech.tab !== activeTab) continue;
                if (childTech.requires.includes(k) && !family.has(childKey)) {
                    family.add(childKey);
                    findDescendants(childKey);
                }
            }
        };
        findDescendants(key);
        return family;
    },

    _highlightResearchNode(key) {
        const tree = this.elements.researchPanel.querySelector('.research-tree');
        if (!tree) return;
        const family = this._getResearchFamily(key);
        const nodes = tree.querySelectorAll('.research-node[data-key]');
        for (const node of nodes) {
            node.classList.toggle('dimmed', !family.has(node.dataset.key));
            node.classList.toggle('highlighted', node.dataset.key === key);
        }
        const svg = document.getElementById('research-lines');
        if (svg) {
            for (const path of svg.querySelectorAll('path')) {
                path.classList.add('dimmed');
            }
            this._highlightResearchPaths(tree, family);
        }
    },

    _highlightResearchPaths(tree, family) {
        const svg = document.getElementById('research-lines');
        if (!svg) return;
        const paths = svg.querySelectorAll('path');
        const nodes = tree.querySelectorAll('.research-node[data-key]');
        let idx = 0;
        for (const node of nodes) {
            const key = node.dataset.key;
            const requires = node.dataset.requires;
            if (!requires) continue;
            for (const req of requires.split(',')) {
                if (!req) { idx++; continue; }
                if (family.has(key) && family.has(req)) {
                    paths[idx]?.classList.remove('dimmed');
                    paths[idx]?.classList.add('highlighted');
                }
                idx++;
            }
        }
    },

    _clearResearchHighlight() {
        const tree = this.elements.researchPanel.querySelector('.research-tree');
        if (!tree) return;
        const nodes = tree.querySelectorAll('.research-node[data-key]');
        for (const node of nodes) {
            node.classList.remove('dimmed', 'highlighted');
        }
        const svg = document.getElementById('research-lines');
        if (svg) {
            for (const path of svg.querySelectorAll('path')) {
                path.classList.remove('dimmed', 'highlighted');
            }
        }
    },

    _getGateRequirements(tech, research) {
        const gates = [];
        const game = this.game;

        if (tech.requiresBuildings) {
            for (const [building, count] of Object.entries(tech.requiresBuildings)) {
                let found = 0;
                for (let y = 0; y < game.map.length; y++) {
                    for (let x = 0; x < game.map[y].length; x++) {
                        if (game.map[y][x].structure === building) found++;
                        if (found >= count) break;
                    }
                    if (found >= count) break;
                }
                const bName = BUILDINGS[building]?.description?.split('.')[0] || building.replace(/_/g, ' ');
                const label = count > 1
                    ? `Build ${count}× ${building.replace(/_/g, ' ')} (${found}/${count})`
                    : `Build ${building.replace(/_/g, ' ')}`;
                gates.push({ label, met: found >= count });
            }
        }

        if (tech.requiresMilestone) {
            const { stat, min } = tech.requiresMilestone;
            const current = game.stats?.[stat] || 0;
            const labels = {
                raidsDefeated: 'Survive a raid',
                wavesCompleted: 'Complete a void wave',
                expeditionsCompleted: 'Complete an expedition',
                superiorItemsCrafted: 'Craft a Superior item',
                itemsEnchanted: `Enchant ${min} items (${current}/${min})`,
            };
            gates.push({ label: labels[stat] || stat, met: current >= min });
        }

        if (tech.requiresTabCount) {
            let tabCompleted = 0;
            for (const [k, t] of Object.entries(RESEARCH)) {
                if (t.tab === tech.tab && research.completed.has(k)) tabCompleted++;
            }
            gates.push({
                label: `${tech.requiresTabCount} techs in tab (${tabCompleted}/${tech.requiresTabCount})`,
                met: tabCompleted >= tech.requiresTabCount,
            });
        }

        return gates;
    },

    _buildResearchLayers(tabKeys) {
        const tabSet = new Set(tabKeys);
        const depths = {};
        function getDepth(key) {
            if (depths[key] !== undefined) return depths[key];
            const tech = RESEARCH[key];
            if (!tech) { depths[key] = 0; return 0; }
            const sameTabReqs = tech.requires.filter(r => tabSet.has(r));
            if (sameTabReqs.length === 0) {
                depths[key] = 0;
                return 0;
            }
            const d = 1 + Math.max(...sameTabReqs.map(r => getDepth(r)));
            depths[key] = d;
            return d;
        }
        for (const key of tabKeys) getDepth(key);
        const maxDepth = Math.max(...tabKeys.map(k => depths[k] || 0), 0);
        const layers = [];
        for (let i = 0; i <= maxDepth; i++) layers.push([]);
        for (const key of tabKeys) layers[depths[key] || 0].push(key);

        for (let i = 1; i < layers.length; i++) {
            const allPositions = {};
            for (let l = 0; l < i; l++) {
                for (let j = 0; j < layers[l].length; j++) {
                    allPositions[layers[l][j]] = layers[l].length > 1 ? j / (layers[l].length - 1) : 0.5;
                }
            }
            layers[i].sort((a, b) => {
                const aReqs = RESEARCH[a].requires.filter(r => allPositions[r] !== undefined);
                const bReqs = RESEARCH[b].requires.filter(r => allPositions[r] !== undefined);
                const aCenter = aReqs.length > 0 ? aReqs.reduce((s, r) => s + allPositions[r], 0) / aReqs.length : 0.5;
                const bCenter = bReqs.length > 0 ? bReqs.reduce((s, r) => s + allPositions[r], 0) / bReqs.length : 0.5;
                return aCenter - bCenter;
            });
        }

        return layers;
    },

    _drawResearchLines() {
        const svg = document.getElementById('research-lines');
        const tree = svg?.closest('.research-tree');
        if (!svg || !tree) return;
        const treeRect = tree.getBoundingClientRect();
        svg.setAttribute('width', tree.scrollWidth);
        svg.setAttribute('height', tree.scrollHeight);
        let paths = '';
        const nodes = tree.querySelectorAll('.research-node[data-key]');
        const nodeRects = {};
        for (const node of nodes) {
            const r = node.getBoundingClientRect();
            nodeRects[node.dataset.key] = {
                cx: r.left + r.width / 2 - treeRect.left,
                top: r.top - treeRect.top,
                bottom: r.bottom - treeRect.top
            };
        }
        for (const node of nodes) {
            const key = node.dataset.key;
            const requires = node.dataset.requires;
            if (!requires) continue;
            const nodeCompleted = node.classList.contains('completed');
            for (const req of requires.split(',')) {
                if (!req || !nodeRects[req] || !nodeRects[key]) continue;
                const reqNode = tree.querySelector(`.research-node[data-key="${req}"]`);
                const reqCompleted = reqNode?.classList.contains('completed');
                const color = (reqCompleted && nodeCompleted) ? '#66cc66' : reqCompleted ? '#886622' : '#444';
                const from = nodeRects[req];
                const to = nodeRects[key];
                const x1 = from.cx, y1 = from.bottom;
                const x2 = to.cx, y2 = to.top;
                const my = (y1 + y2) / 2;
                paths += `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" stroke="${color}" />`;
            }
        }
        svg.innerHTML = paths;
    },
};
