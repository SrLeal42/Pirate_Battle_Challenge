import {
    Application, Container, Sprite, Graphics, Text, TextStyle,
} from 'pixi.js';
import type { GameState, EnemyState, ProjectileState, TileType } from '../core/types';
import type { GameEvent } from '../core/types';
import type { ArenaMap, TileDef } from '../core/arena';
import { GAME_CONFIG } from '../core/config';
import { getTexture } from './assets';

const ROTATION_OFFSET = -Math.PI / 2; // Sprites point down, our 0 = -X

export class GameRenderer {
    private app: Application;
    private arenaContainer!: Container;
    private entityContainer!: Container;
    private effectContainer!: Container;

    // Sprite pools
    private playerSprite!: Sprite;
    private enemySprites: Map<string, Sprite> = new Map();
    private projectileSprites: Map<string, Sprite> = new Map();
    private healthBars: Map<string, Graphics> = new Map();

    private arenaMap: ArenaMap;
    private debugGraphics: Graphics | null = null;
    private showDebug = false;

    constructor(app: Application, arenaMap: ArenaMap) {
        this.app = app;
        this.arenaMap = arenaMap;
        this.setup();
    }

    private setup(): void {
        // Layer order: arena (tiles) → entities (ships, projectiles) → effects
        this.arenaContainer = new Container();
        this.entityContainer = new Container();
        this.effectContainer = new Container();

        this.app.stage.addChild(this.arenaContainer);
        this.app.stage.addChild(this.entityContainer);
        this.app.stage.addChild(this.effectContainer);

        this.buildArena();
        this.createPlayerSprite();
    }

    private buildArena(): void {
        const ts = GAME_CONFIG.tileSize;
        for (const tile of this.arenaMap.tiles) {
            const alias = `tile_${tile.type}`;
            const tex = getTexture(alias);
            if (!tex) continue;

            const sprite = new Sprite(tex);
            sprite.x = tile.col * ts;
            sprite.y = tile.row * ts;
            sprite.width = ts;
            sprite.height = ts;
            this.arenaContainer.addChild(sprite);
        }
    }

    private createPlayerSprite(): void {
        const tex = getTexture('ship_player');
        this.playerSprite = new Sprite(tex);
        this.playerSprite.anchor.set(0.5);
        this.entityContainer.addChild(this.playerSprite);
    }

    // Called every frame with latest state
    update(state: Readonly<GameState>): void {
        this.updatePlayer(state);
        this.updateEnemies(state);
        this.updateProjectiles(state);
        this.updateHealthBars(state);
    }

    private updatePlayer(state: Readonly<GameState>): void {
        const p = state.player;
        this.playerSprite.x = p.position.x;
        this.playerSprite.y = p.position.y;
        this.playerSprite.rotation = p.rotation + ROTATION_OFFSET;
        this.playerSprite.visible = !p.isDead;
        this.playerSprite.alpha = p.isDead ? 0 : 1;
    }

    private updateEnemies(state: Readonly<GameState>): void {
        const activeIds = new Set<string>();

        for (const enemy of state.enemies) {
            if (enemy.isDead) continue;
            activeIds.add(enemy.id);

            let sprite = this.enemySprites.get(enemy.id);
            if (!sprite) {
                const texAlias = enemy.type === 'chaser' ? 'ship_chaser' : 'ship_shooter';
                sprite = new Sprite(getTexture(texAlias));
                sprite.anchor.set(0.5);
                this.entityContainer.addChild(sprite);
                this.enemySprites.set(enemy.id, sprite);
            }

            sprite.x = enemy.position.x;
            sprite.y = enemy.position.y;
            sprite.rotation = enemy.rotation + ROTATION_OFFSET;
        }

        // Remove sprites for dead/removed enemies
        for (const [id, sprite] of this.enemySprites) {
            if (!activeIds.has(id)) {
                this.entityContainer.removeChild(sprite);
                sprite.destroy();
                this.enemySprites.delete(id);
                this.healthBars.get(id)?.destroy();
                this.healthBars.delete(id);
            }
        }
    }

    private updateProjectiles(state: Readonly<GameState>): void {
        const activeIds = new Set<string>();

        for (const proj of state.projectiles) {
            activeIds.add(proj.id);

            let sprite = this.projectileSprites.get(proj.id);
            if (!sprite) {
                sprite = new Sprite(getTexture('cannon_ball'));
                sprite.anchor.set(0.5);
                this.entityContainer.addChild(sprite);
                this.projectileSprites.set(proj.id, sprite);
            }

            sprite.x = proj.position.x;
            sprite.y = proj.position.y;
        }

        // Remove expired projectiles
        for (const [id, sprite] of this.projectileSprites) {
            if (!activeIds.has(id)) {
                this.entityContainer.removeChild(sprite);
                sprite.destroy();
                this.projectileSprites.delete(id);
            }
        }
    }

    private updateHealthBars(state: Readonly<GameState>): void {
        // Player health bar
        this.drawHealthBar(
            'player',
            state.player.position.x,
            state.player.position.y - 50,
            state.player.health / GAME_CONFIG.playerMaxHealth,
            50,
        );

        // Enemy health bars
        for (const enemy of state.enemies) {
            if (enemy.isDead) continue;
            const maxHp = enemy.type === 'chaser'
                ? GAME_CONFIG.chaserHealth
                : GAME_CONFIG.shooterHealth;
            this.drawHealthBar(
                enemy.id,
                enemy.position.x,
                enemy.position.y - 45,
                enemy.health / maxHp,
                40,
            );
        }
    }

    private drawHealthBar(
        id: string, x: number, y: number, ratio: number, width: number,
    ): void {
        let bar = this.healthBars.get(id);
        if (!bar) {
            bar = new Graphics();
            this.effectContainer.addChild(bar);
            this.healthBars.set(id, bar);
        }

        const height = 6;
        const clampedRatio = Math.max(0, Math.min(1, ratio));

        bar.clear();
        // Background
        bar.rect(x - width / 2, y, width, height);
        bar.fill({ color: 0x333333, alpha: 0.7 });
        // Fill
        const color = clampedRatio > 0.5 ? 0x44cc44 : clampedRatio > 0.25 ? 0xccaa00 : 0xcc3333;
        bar.rect(x - width / 2, y, width * clampedRatio, height);
        bar.fill({ color });
    }

    // Handle events for visual effects
    handleEvents(events: GameEvent[]): void {
        for (const event of events) {
            if (event.type === 'shipDestroyed') {
                this.spawnExplosion(event.shipId);
            }
        }
    }

    private spawnExplosion(shipId: string): void {
        // Get position of destroyed ship
        const sprite = shipId === 'player'
            ? this.playerSprite
            : this.enemySprites.get(shipId);
        if (!sprite) return;

        const tex = getTexture('effect_explosion1');
        if (!tex) return;

        const explosion = new Sprite(tex);
        explosion.anchor.set(0.5);
        explosion.x = sprite.x;
        explosion.y = sprite.y;
        explosion.scale.set(1.5);
        this.effectContainer.addChild(explosion);

        // Simple fade out and remove
        let life = 500; // ms
        const ticker = this.app.ticker;
        const onTick = () => {
            life -= ticker.deltaMS;
            explosion.alpha = Math.max(0, life / 500);
            if (life <= 0) {
                ticker.remove(onTick);
                this.effectContainer.removeChild(explosion);
                explosion.destroy();
            }
        };
        ticker.add(onTick);
    }

    // Debug overlay: draw collision hitboxes
    toggleDebug(): void {
        this.showDebug = !this.showDebug;
        if (!this.showDebug && this.debugGraphics) {
            this.debugGraphics.clear();
        }
    }

    drawDebugOverlay(state: Readonly<GameState>): void {
        if (!this.showDebug) return;
        if (!this.debugGraphics) {
            this.debugGraphics = new Graphics();
            this.effectContainer.addChild(this.debugGraphics);
        }

        const g = this.debugGraphics;
        g.clear();

        // Island polygons
        for (const island of this.arenaMap.arenaDef.islands) {
            const poly = island.polygon;
            const points = poly.vertices.map(v => [poly.pos.x + v.x, poly.pos.y + v.y]).flat();
            g.poly(points);
            g.stroke({ color: 0xff0000, alpha: 0.5, width: 2 });
        }

        // Player hitbox
        const p = state.player;
        g.rect(
            p.position.x - GAME_CONFIG.playerHitboxWidth / 2,
            p.position.y - GAME_CONFIG.playerHitboxHeight / 2,
            GAME_CONFIG.playerHitboxWidth,
            GAME_CONFIG.playerHitboxHeight,
        );
        g.stroke({ color: 0x00ff00, alpha: 0.5, width: 1 });
    }

    destroy(): void {
        // Cleanup all sprites
        for (const [, sprite] of this.enemySprites) sprite.destroy();
        for (const [, sprite] of this.projectileSprites) sprite.destroy();
        for (const [, bar] of this.healthBars) bar.destroy();
        this.enemySprites.clear();
        this.projectileSprites.clear();
        this.healthBars.clear();

        this.debugGraphics?.destroy();
        this.arenaContainer.destroy({ children: true });
        this.entityContainer.destroy({ children: true });
        this.effectContainer.destroy({ children: true });
    }

}
