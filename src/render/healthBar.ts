import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { getTexture } from './assets';
import { getHealthTier, type HealthTier } from '../core/health';

interface Rect { x: number; y: number; w: number; h: number }

export interface HealthBarSkin {
    frame: string;
    fills: Readonly<Record<HealthTier, string>>;
    size: { w: number; h: number };
    fillRect: Rect;
}

// Layouts from ui_sheet.json ("player_health" / "enemy_health")
export const PLAYER_HEALTH_SKIN: HealthBarSkin = {
    frame: 'hud_health_frame',
    fills: { high: 'hud_health_fill_green', medium: 'hud_health_fill_amber', low: 'hud_health_fill_red' },
    size: { w: 256, h: 48 },
    fillRect: { x: 30, y: 15, w: 196, h: 20 },
};

export const ENEMY_HEALTH_SKIN: HealthBarSkin = {
    frame: 'hud_enemy_health_frame',
    // No amber asset for enemies
    fills: { high: 'hud_enemy_health_fill_green', medium: 'hud_enemy_health_fill_red', low: 'hud_enemy_health_fill_red' },
    size: { w: 160, h: 40 },
    fillRect: { x: 24, y: 12, w: 112, h: 15 },
};

/** Asset-based bar. The fill is cropped (not scaled) so its end caps keep their shape. */
export class HealthBar extends Container {
    private readonly skin: HealthBarSkin;
    private readonly fill = new Sprite();
    private fillTexture: Texture | null = null;
    private ratio = -1;

    constructor(skin: HealthBarSkin, displayWidth: number) {
        super();
        this.skin = skin;

        this.addChild(new Sprite(getTexture(skin.frame)), this.fill); // frame → fill
        this.fill.position.set(skin.fillRect.x, skin.fillRect.y);
        this.pivot.set(skin.size.w / 2, skin.size.h); // bottom-center anchor
        this.scale.set(displayWidth / skin.size.w);
    }

    setRatio(value: number): void {
        const ratio = Math.min(1, Math.max(0, value));
        if (ratio === this.ratio) return; // rebuilt only when health changes
        this.ratio = ratio;

        const { x, y, w, h } = this.skin.fillRect;
        const width = Math.round(w * ratio);
        const previous = this.fillTexture;

        if (width > 0) {
            const base = getTexture(this.skin.fills[getHealthTier(ratio)]);
            this.fillTexture = new Texture({
                source: base.source,
                frame: new Rectangle(base.frame.x + x, base.frame.y + y, width, h),
            });
        } else {
            this.fillTexture = null;
        }

        this.fill.texture = this.fillTexture ?? Texture.EMPTY;
        previous?.destroy(false); // keep the shared source
    }

    override destroy(): void {
        super.destroy({ children: true });
        this.fillTexture?.destroy(false);
        this.fillTexture = null;
    }

}
