const STORAGE_KEY = 'sprite_editor_projects';

export class ProjectManager {
    constructor(editor) {
        this.editor = editor;
        this.projects = {};
        this.currentProject = null;
        this.currentSpriteId = null;
        this._load();
        this._bindUI();
    }

    _load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) this.projects = JSON.parse(saved);
        } catch {}

        if (Object.keys(this.projects).length === 0) {
            this._createProject('My Project');
        }

        const lastProject = localStorage.getItem('sprite_editor_last_project');
        this.currentProject = lastProject && this.projects[lastProject] ? lastProject : Object.keys(this.projects)[0];
        const proj = this.projects[this.currentProject];
        this.currentSpriteId = proj.lastEdited || Object.keys(proj.sprites)[0] || null;
    }

    _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
        localStorage.setItem('sprite_editor_last_project', this.currentProject);
    }

    _createProject(name) {
        const id = 'proj_' + Date.now().toString(36);
        const spriteId = 'spr_' + Date.now().toString(36);
        this.projects[id] = {
            name,
            sprites: {
                [spriteId]: { name: 'Sprite 1', size: 16, data: null }
            },
            lastEdited: spriteId
        };
        this.currentProject = id;
        this.currentSpriteId = spriteId;
        this._save();
        return id;
    }

    getProject() {
        return this.projects[this.currentProject];
    }

    getSprite() {
        const proj = this.getProject();
        if (!proj || !this.currentSpriteId) return null;
        return proj.sprites[this.currentSpriteId];
    }

    saveCurrentSprite(pixels, canvasSize) {
        const proj = this.getProject();
        if (!proj || !this.currentSpriteId) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;
        const ctx = tempCanvas.getContext('2d');
        const imageData = new ImageData(new Uint8ClampedArray(pixels), canvasSize, canvasSize);
        ctx.putImageData(imageData, 0, 0);
        const data = tempCanvas.toDataURL('image/png');

        proj.sprites[this.currentSpriteId].data = data;
        proj.sprites[this.currentSpriteId].size = canvasSize;
        proj.lastEdited = this.currentSpriteId;
        this._save();
    }

    selectSprite(id) {
        const proj = this.getProject();
        if (!proj || !proj.sprites[id]) return;
        this.editor.autoSave();
        this.currentSpriteId = id;
        proj.lastEdited = id;
        this._save();
        this.editor.loadSprite(proj.sprites[id]);
        this.renderGallery();
    }

    addSprite(name, size) {
        const proj = this.getProject();
        if (!proj) return;
        const id = 'spr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const count = Object.keys(proj.sprites).length + 1;
        proj.sprites[id] = { name: name || `Sprite ${count}`, size: size || this.editor.canvasSize, data: null };
        this._save();
        this.selectSprite(id);
    }

    deleteSprite(id) {
        const proj = this.getProject();
        if (!proj) return;
        const keys = Object.keys(proj.sprites);
        if (keys.length <= 1) return;
        delete proj.sprites[id];
        if (this.currentSpriteId === id) {
            this.currentSpriteId = Object.keys(proj.sprites)[0];
            proj.lastEdited = this.currentSpriteId;
            this.editor.loadSprite(proj.sprites[this.currentSpriteId]);
        }
        this._save();
        this.renderGallery();
    }

    renameSprite(id, name) {
        const proj = this.getProject();
        if (!proj || !proj.sprites[id]) return;
        proj.sprites[id].name = name;
        this._save();
        this.renderGallery();
    }

    exportPNG() {
        this.editor.autoSave();
        const sprite = this.getSprite();
        if (!sprite || !sprite.data) return;
        const link = document.createElement('a');
        link.download = `${sprite.name || 'sprite'}.png`;
        link.href = sprite.data;
        link.click();
    }

    async exportZIP() {
        const proj = this.getProject();
        if (!proj) return;
        this.editor.autoSave();

        const zip = new JSZip();
        const manifest = { name: proj.name, sprites: {} };

        for (const [id, sprite] of Object.entries(proj.sprites)) {
            if (!sprite.data) continue;
            const filename = `${sprite.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
            const base64 = sprite.data.split(',')[1];
            zip.file(filename, base64, { base64: true });
            manifest.sprites[id] = { name: sprite.name, size: sprite.size, file: filename };
        }

        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = `${proj.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    async importZIP(file) {
        const zip = await JSZip.loadAsync(file);
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) return;

        const manifest = JSON.parse(await manifestFile.async('string'));
        const projectName = manifest.name || file.name.replace(/\.zip$/, '');
        const projectId = this._createProject(projectName);
        const proj = this.projects[projectId];
        proj.sprites = {};

        for (const [id, info] of Object.entries(manifest.sprites)) {
            const imgFile = zip.file(info.file);
            if (!imgFile) continue;
            const base64 = await imgFile.async('base64');
            const spriteId = 'spr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
            proj.sprites[spriteId] = {
                name: info.name,
                size: info.size,
                data: `data:image/png;base64,${base64}`
            };
        }

        if (Object.keys(proj.sprites).length === 0) {
            const spriteId = 'spr_' + Date.now().toString(36);
            proj.sprites[spriteId] = { name: 'Sprite 1', size: 16, data: null };
        }

        this.currentProject = projectId;
        this.currentSpriteId = Object.keys(proj.sprites)[0];
        proj.lastEdited = this.currentSpriteId;
        this._save();
        this.editor.loadSprite(proj.sprites[this.currentSpriteId]);
        this.renderGallery();
        this._updateProjectName();
    }

    importImage(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const size = Math.min(128, Math.max(8, Math.max(img.width, img.height)));
                const rounded = [8, 16, 32, 64, 128].reduce((prev, curr) =>
                    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
                );
                this.addSprite(file.name.replace(/\.[^.]+$/, ''), rounded);
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = rounded;
                tempCanvas.height = rounded;
                const ctx = tempCanvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, rounded, rounded);
                const imageData = ctx.getImageData(0, 0, rounded, rounded);
                this.editor.setPixelsFromData(imageData.data, rounded);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    renderGallery() {
        const proj = this.getProject();
        if (!proj) return;
        const gallery = document.getElementById('sprite-gallery');
        gallery.innerHTML = '';

        for (const [id, sprite] of Object.entries(proj.sprites)) {
            const thumb = document.createElement('div');
            thumb.className = 'sprite-thumb' + (id === this.currentSpriteId ? ' active' : '');
            thumb.dataset.id = id;

            const canvas = document.createElement('canvas');
            canvas.width = sprite.size;
            canvas.height = sprite.size;
            if (sprite.data) {
                const img = new Image();
                img.onload = () => {
                    canvas.getContext('2d').drawImage(img, 0, 0);
                };
                img.src = sprite.data;
            }

            const label = document.createElement('span');
            label.textContent = sprite.name;

            thumb.appendChild(canvas);
            thumb.appendChild(label);

            thumb.addEventListener('click', () => this.selectSprite(id));

            let pressTimer = null;
            thumb.addEventListener('pointerdown', () => {
                pressTimer = setTimeout(() => {
                    pressTimer = null;
                    const newName = prompt('Rename sprite:', sprite.name);
                    if (newName) this.renameSprite(id, newName);
                }, 600);
            });
            thumb.addEventListener('pointerup', () => { if (pressTimer) clearTimeout(pressTimer); });
            thumb.addEventListener('pointerleave', () => { if (pressTimer) clearTimeout(pressTimer); });

            gallery.appendChild(thumb);
        }
    }

    exportPNGScaled(scale) {
        this.editor.autoSave();
        const sprite = this.getSprite();
        if (!sprite || !sprite.data) return;
        const outputSize = sprite.size * scale;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, outputSize, outputSize);
            const link = document.createElement('a');
            link.download = `${sprite.name || 'sprite'}_${outputSize}x${outputSize}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = sprite.data;
    }

    _bindUI() {
        document.getElementById('btn-new-sprite').addEventListener('click', () => {
            this.addSprite(null, this.editor.canvasSize);
        });

        document.getElementById('btn-delete-sprite').addEventListener('click', () => {
            const proj = this.getProject();
            if (!proj || Object.keys(proj.sprites).length <= 1) return;
            if (confirm('Delete this sprite?')) {
                this.deleteSprite(this.currentSpriteId);
            }
        });

        document.getElementById('project-name').addEventListener('change', (e) => {
            const proj = this.getProject();
            if (proj) {
                proj.name = e.target.value;
                this._save();
            }
        });

        document.getElementById('btn-sprites').addEventListener('click', () => {
            this.renderGallery();
            this._updateProjectName();
            this.editor.togglePanel('sprites-panel');
        });

        document.getElementById('btn-save-png').addEventListener('click', () => this.exportPNG());
        document.getElementById('btn-save-png-scaled').addEventListener('click', () => {
            const scaleStr = document.getElementById('export-scale-select').value;
            this.exportPNGScaled(parseInt(scaleStr));
        });
        document.getElementById('btn-export-zip').addEventListener('click', () => this.exportZIP());

        document.getElementById('btn-import-zip').addEventListener('click', () => {
            document.getElementById('file-import-zip').click();
        });
        document.getElementById('file-import-zip').addEventListener('change', (e) => {
            if (e.target.files[0]) this.importZIP(e.target.files[0]);
            e.target.value = '';
        });

        document.getElementById('btn-import-image').addEventListener('click', () => {
            document.getElementById('file-import-image').click();
        });
        document.getElementById('file-import-image').addEventListener('change', (e) => {
            if (e.target.files[0]) this.importImage(e.target.files[0]);
            e.target.value = '';
        });
    }

    _updateProjectName() {
        const proj = this.getProject();
        if (proj) document.getElementById('project-name').value = proj.name;
    }
}
