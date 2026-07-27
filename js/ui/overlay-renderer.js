import { CONFIG, RENDER_CONFIG } from '../core/config.js';

export class OverlayRenderer {
    constructor(container) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'overlay-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d', { alpha: true });
    }

    resize(width, height) {
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    render(game, charWidth, charHeight, camera) {
        const ctx = this.ctx;
        const cw = charWidth;
        const ch = charHeight;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (game.radiusHighlight && game.selectedColonist) {
            const c = game.selectedColonist;
            if (c.artifact && !c.artifactBroken && c.artifact.pedestal?.radius && c.artifact.pedestal.radius !== 'global') {
                game.radiusHighlight.x = c.x;
                game.radiusHighlight.y = c.y;
            }
        }
        if (game.radiusHighlight) {
            this._renderRadiusHighlight(ctx, game.radiusHighlight, cw, ch, camera);
        }

        if (!game.overlays || game.overlays.length === 0) return;

        for (const overlay of game.overlays) {
            switch (overlay.type) {
                case 'progress_bar':
                    this._renderProgressBar(ctx, overlay, cw, ch, camera);
                    break;
                case 'beam':
                    this._renderBeam(ctx, overlay, cw, ch, camera);
                    break;
                case 'health_bar':
                    this._renderHealthBar(ctx, overlay, cw, ch, camera);
                    break;
                case 'glow':
                    this._renderGlow(ctx, overlay, cw, ch, camera);
                    break;
            }
        }
    }

    _renderProgressBar(ctx, overlay, cw, ch, camera) {
        const sx = (overlay.x - camera.x) * cw;
        const sy = (overlay.y - camera.y) * ch;
        if (sx < -cw || sx > this.canvas.width || sy < -ch || sy > this.canvas.height) return;

        const barHeight = 3;
        const barWidth = cw * 0.8;
        const barX = sx + (cw - barWidth) / 2;
        const barY = sy + ch - barHeight - 1;

        ctx.fillStyle = overlay.bgColor || '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = overlay.color || '#00ff00';
        ctx.fillRect(barX, barY, barWidth * Math.max(0, Math.min(1, overlay.progress)), barHeight);
    }

    _renderBeam(ctx, overlay, cw, ch, camera) {
        const x1 = (overlay.fromX - camera.x) * cw + cw / 2;
        const y1 = (overlay.fromY - camera.y) * ch + ch / 2;
        const x2 = (overlay.toX - camera.x) * cw + cw / 2;
        const y2 = (overlay.toY - camera.y) * ch + ch / 2;

        ctx.save();
        ctx.strokeStyle = overlay.color || '#ff4444';
        ctx.lineWidth = overlay.width || 1.5;
        ctx.globalAlpha = overlay.alpha !== undefined ? overlay.alpha : 0.7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    // Renders a 2px-tall HP bar above the entity tile. Color auto-selects based
    // on HP percentage: green (>50%), yellow (25-50%), red (<25%).
    _renderHealthBar(ctx, overlay, cw, ch, camera) {
        const sx = (overlay.x - camera.x) * cw;
        const sy = (overlay.y - camera.y) * ch;
        if (sx < -cw || sx > this.canvas.width || sy < -ch || sy > this.canvas.height) return;

        const barHeight = 2;
        const barWidth = cw * 0.8;
        const barX = sx + (cw - barWidth) / 2;
        const barY = sy - 1;

        const pct = overlay.max > 0 ? overlay.current / overlay.max : 0;
        const colors = RENDER_CONFIG.healthBarColors;

        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = overlay.color || (pct > RENDER_CONFIG.healthBarGreenThreshold ? colors.green : pct > RENDER_CONFIG.healthBarYellowThreshold ? colors.yellow : colors.red);
        ctx.fillRect(barX, barY, barWidth * Math.max(0, Math.min(1, pct)), barHeight);
    }

    _renderGlow(ctx, overlay, cw, ch, camera) {
        const cx = (overlay.x - camera.x) * cw + cw / 2;
        const cy = (overlay.y - camera.y) * ch + ch / 2;
        const radius = (overlay.radius || 1) * cw;

        ctx.save();
        ctx.globalAlpha = overlay.alpha !== undefined ? overlay.alpha : 0.3;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, overlay.color || '#ffffff');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Renders a Manhattan-distance radius highlight (filled area + border outline).
    // Used when selecting pedestals, turrets, or heaters to visualize their effect range.
    _renderRadiusHighlight(ctx, highlight, cw, ch, camera) {
        const { x, y, radius, color } = highlight;
        ctx.save();
        // Fill all tiles within Manhattan distance
        ctx.fillStyle = color;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.abs(dx) + Math.abs(dy) > radius) continue;
                const sx = (x + dx - camera.x) * cw;
                const sy = (y + dy - camera.y) * ch;
                if (sx < -cw || sx > this.canvas.width || sy < -ch || sy > this.canvas.height) continue;
                ctx.fillRect(sx, sy, cw, ch);
            }
        }
        // Draw border segments only on edges where the adjacent cell in that direction
        // falls outside the radius — this produces a clean diamond-shaped outline.
        // Appending 'cc' (80% alpha) to the hex color gives a semi-transparent border.
        const borderColor = color.slice(0, 7) + 'cc';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.abs(dx) + Math.abs(dy) > radius) continue;
                const sx = (x + dx - camera.x) * cw;
                const sy = (y + dy - camera.y) * ch;
                if (Math.abs(dx) + Math.abs(dy + 1) > radius) { ctx.moveTo(sx, sy + ch); ctx.lineTo(sx + cw, sy + ch); }
                if (Math.abs(dx) + Math.abs(dy - 1) > radius) { ctx.moveTo(sx, sy); ctx.lineTo(sx + cw, sy); }
                if (Math.abs(dx + 1) + Math.abs(dy) > radius) { ctx.moveTo(sx + cw, sy); ctx.lineTo(sx + cw, sy + ch); }
                if (Math.abs(dx - 1) + Math.abs(dy) > radius) { ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + ch); }
            }
        }
        ctx.stroke();
        ctx.restore();
    }
}
