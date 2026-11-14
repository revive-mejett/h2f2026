import './style.css'
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import skyUrl from './assets/sky.png'
import skyBlankUrl from './assets/sky_blank.png'
import skyCityUrl from './assets/sky_city.png'
import skySunUrl from './assets/sky_sun.png'
import palmTreeUrl from './assets/palm_tree.png'
import titleUrl from './assets/title.png'
import ufoUrl from './assets/ufo.png'
import moneyUrl from './assets/ore_money.png'
import gaugeFuelUrl from './assets/gauge_fuel.png'
import buildingRefuelUrl from './assets/building_refuel.png'
import bronzeUrl from './assets/ore_bronze.png'
import concordiaiumUrl from './assets/ore_concordiaium.png'
import copperUrl from './assets/ore_copper.png'
import diamondUrl from './assets/ore_diamond.png'
import emeraldUrl from './assets/ore_emerald.png'
import goldUrl from './assets/ore_gold.png'
import ironUrl from './assets/ore_iron.png'
import mythrilUrl from './assets/ore_mythril.png'
import rubyUrl from './assets/ore_ruby.png'
import sapphireUrl from './assets/ore_sapphire.png'
import scsiumUrl from './assets/ore_scsium.png'
import silverUrl from './assets/ore_silver.png'

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(Texture.from(img))
    img.onerror = (err) => reject(err)
    img.src = url
  })
}

const ORE_DEFS = [
  { id: 'iron', name: 'Iron', value: 0.15, minDepth: 0, maxDepth: 150, url: ironUrl, color: 0x7b93ab, textColor: '#9ab4cc' },
  { id: 'copper', name: 'Copper', value: 0.20, minDepth: 0, maxDepth: 3000, url: copperUrl, color: 0xd96b18, textColor: '#f28730' },
  { id: 'bronze', name: 'Bronze', value: 0.25, minDepth: 0, maxDepth: 150, url: bronzeUrl, color: 0xf08c00, textColor: '#ffa726' },
  { id: 'silver', name: 'Silver', value: 0.60, minDepth: 25, maxDepth: 300, url: silverUrl, color: 0xe2e8f0, textColor: '#f1f5f9' },
  { id: 'gold', name: 'Gold', value: 1.15, minDepth: 50, maxDepth: 1000, url: goldUrl, color: 0xffea00, textColor: '#ffea00' },
  { id: 'mythril', name: 'Mythril', value: 2.30, minDepth: 100, maxDepth: 3000, url: mythrilUrl, color: 0xd896ff, textColor: '#e2a6ff' },
  { id: 'ruby', name: 'Ruby', value: 11.50, minDepth: 150, maxDepth: 3000, url: rubyUrl, color: 0xff2a2a, textColor: '#ff5252' },
  { id: 'sapphire', name: 'Sapphire', value: 27.50, minDepth: 225, maxDepth: 3000, url: sapphireUrl, color: 0x3b6eff, textColor: '#6b94ff' },
  { id: 'emerald', name: 'Emerald', value: 48.50, minDepth: 280, maxDepth: 3000, url: emeraldUrl, color: 0x00ff44, textColor: '#3dff70' },
  { id: 'diamond', name: 'Diamond', value: 120.00, minDepth: 300, maxDepth: 3000, url: diamondUrl, color: 0x22f3ff, textColor: '#5cf7ff' },
  { id: 'concordiaium', name: 'Concordiaium', value: 350.67, minDepth: 900, maxDepth: 3000, url: concordiaiumUrl, color: 0xff1e6e, textColor: '#ff3d82' },
  { id: 'scsium', name: 'Scsium', value: 1000.67, minDepth: 1000, maxDepth: 3000, url: scsiumUrl, color: 0x3df5d4, textColor: '#52ffe0', strokeColor: '#4c0b6e' },
]

const app = new Application()
const root = document.querySelector('#app')

const WIDTH = 960
const HEIGHT = 540

const COLS = 20
const ROWS = 3000
const TILE_SIZE = 64
const WORLD_WIDTH = COLS * TILE_SIZE
const WORLD_HEIGHT = ROWS * TILE_SIZE

await app.init({
  width: WIDTH,
  height: HEIGHT,
  background: '#2a0a4a',
  antialias: true,
  preference: 'webgl',
})

root.appendChild(app.canvas)
app.canvas.setAttribute('tabindex', '0')

const [
  skyTexture,
  skyBlankTexture,
  skyCityTexture,
  skySunTexture,
  palmTreeTexture,
  titleTexture,
  ufoTexture,
  moneyTexture,
  gaugeFuelTexture,
  buildingRefuelTexture,
  ...oreTextures
] = await Promise.all([
  loadTexture(skyUrl),
  loadTexture(skyBlankUrl),
  loadTexture(skyCityUrl),
  loadTexture(skySunUrl),
  loadTexture(palmTreeUrl),
  loadTexture(titleUrl),
  loadTexture(ufoUrl),
  loadTexture(moneyUrl),
  loadTexture(gaugeFuelUrl),
  loadTexture(buildingRefuelUrl),
  ...ORE_DEFS.map((o) => loadTexture(o.url)),
])

const ORES = ORE_DEFS.map((def, i) => ({
  ...def,
  texture: oreTextures[i],
  weight: 1 / Math.pow(def.value, 0.55),
}))

const keys = new Set()
const pressedQueue = new Set()

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase()
  if (['w', 'a', 's', 'd', ' '].includes(k)) {
    e.preventDefault()
  }
  if (!keys.has(k)) {
    pressedQueue.add(k)
  }
  keys.add(k)
})
window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
})
window.addEventListener('blur', () => {
  keys.clear()
  pressedQueue.clear()
})

const menu = createMainMenu(() => {
  window.focus()
  app.canvas.focus()
  menu.visible = false
  groundScene.visible = true
  groundScene.start()
})

const groundScene = createGroundScene(() => {
  groundScene.stop()
  groundScene.visible = false
  menu.visible = true
})
groundScene.visible = false

app.stage.addChild(menu, groundScene)

function createMainMenu(onStart) {
  const scene = new Container()

  const sky = new Sprite(skyTexture)
  sky.width = WIDTH
  sky.height = HEIGHT
  scene.addChild(sky)

  const title = new Sprite(titleTexture)
  title.anchor.set(0.5)
  const titleScale = Math.min(0.85, (WIDTH * 0.72) / titleTexture.width)
  title.scale.set(titleScale)
  title.position.set(WIDTH / 2, HEIGHT * 0.32)
  scene.addChild(title)

  const startButton = createButton('START', {
    width: 220,
    height: 72,
    fill: '#00e5c0',
    hover: '#5ffff0',
    textColor: '#1a0830',
  })
  startButton.position.set(WIDTH / 2, HEIGHT * 0.72)
  startButton.on('pointertap', onStart)
  scene.addChild(startButton)

  return scene
}

function createGroundScene(onGameOver) {
  const scene = new Container()

  const sky = new Sprite(skyBlankTexture)
  sky.width = WIDTH
  sky.height = HEIGHT
  scene.addChild(sky)

  const sun = new Sprite(skySunTexture)
  sun.anchor.set(0.5)
  const sunScale = (WIDTH * 0.42) / skySunTexture.width
  sun.scale.set(sunScale)
  const sunBaseX = WIDTH * 0.5
  const sunBaseY = HEIGHT * 0.42
  sun.position.set(sunBaseX, sunBaseY)
  scene.addChild(sun)

  // City silhouette in front of sky_blank and sun
  const cityLayer = new Container()
  const cityScale = (WIDTH * 1.15) / (skyCityTexture.width || 1)
  const cityStep = skyCityTexture.width * cityScale
  for (let i = 0; i < 2; i++) {
    const city = new Sprite(skyCityTexture)
    city.anchor.set(0, 1)
    city.scale.set(cityScale)
    city.position.set(i * cityStep, 0)
    cityLayer.addChild(city)
  }
  scene.addChild(cityLayer)

  // Palm trees in front of sky_city along the surface horizon
  const palmsLayer = new Container()
  const palmPlacements = [
    { x: 90, height: 170, flip: 1 },
    { x: 250, height: 135, flip: -1 },
    { x: 470, height: 160, flip: 1 },
    { x: 710, height: 185, flip: -1 },
    { x: 920, height: 145, flip: 1 },
    { x: 1150, height: 175, flip: -1 },
  ]
  for (const p of palmPlacements) {
    const palm = new Sprite(palmTreeTexture)
    palm.anchor.set(0.5, 1)
    const s = p.height / (palmTreeTexture.height || 1)
    palm.scale.set(s * p.flip, s)
    palm.position.set(p.x, 4)
    palmsLayer.addChild(palm)
  }
  scene.addChild(palmsLayer)

  const world = new Container()
  scene.addChild(world)

  const tilesGfx = new Graphics()
  world.addChild(tilesGfx)

  const oresLayer = new Container()
  world.addChild(oresLayer)

  const REFUEL_X = 320
  const refuelStation = new Sprite(buildingRefuelTexture)
  refuelStation.anchor.set(0.5, 1)
  const refuelScale = 140 / Math.max(buildingRefuelTexture.width, buildingRefuelTexture.height)
  refuelStation.scale.set(refuelScale)
  refuelStation.position.set(REFUEL_X, 0)
  world.addChild(refuelStation)

  const particlesGfx = new Graphics()
  world.addChild(particlesGfx)

  const popupsLayer = new Container()
  world.addChild(popupsLayer)

  const player = new Sprite(ufoTexture)
  player.anchor.set(0.5, 1)
  const ufoScale = 52 / Math.max(ufoTexture.width, ufoTexture.height)
  player.scale.set(ufoScale)
  world.addChild(player)

  const moneyHud = new Container()
  moneyHud.position.set(16, 14)

  const moneyIcon = new Sprite(moneyTexture)
  moneyIcon.anchor.set(0.5)
  const moneyIconScale = 32 / Math.max(moneyTexture.width, moneyTexture.height)
  moneyIcon.scale.set(moneyIconScale)
  moneyIcon.position.set(16, 16)
  moneyHud.addChild(moneyIcon)

  const moneyText = new Text({
    text: '$0.00',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 22,
      fill: '#ffd94a',
      fontWeight: '800',
      stroke: { color: '#1a0830', width: 4 },
    },
  })
  moneyText.anchor.set(0, 0.5)
  moneyText.position.set(40, 16)
  moneyHud.addChild(moneyText)

  scene.addChild(moneyHud)

  const depthText = new Text({
    text: `Depth: 0 / ${ROWS}`,
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 18,
      fill: '#ffffff',
      fontWeight: '700',
      stroke: { color: '#1a0830', width: 4 },
    },
  })
  depthText.position.set(16, 54)
  scene.addChild(depthText)

  const hint = new Text({
    text: 'A / D move & dig · S dig down · Hold W float',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 16,
      fill: '#ffffff',
      fontWeight: '600',
      stroke: { color: '#1a0830', width: 4 },
    },
  })
  hint.anchor.set(1, 0)
  hint.position.set(WIDTH - 16, 16)
  scene.addChild(hint)

  // Bottom full-width dashboard bar
  const PANEL_H = 52
  const FUEL_BAR_W = 220
  const FUEL_BAR_H = 20

  const gaugePanel = new Container()
  gaugePanel.position.set(0, HEIGHT - PANEL_H)

  const panelBg = new Graphics()
    .rect(0, 0, WIDTH, PANEL_H)
    .fill(0x7f006e)
  gaugePanel.addChild(panelBg)

  const fuelIcon = new Sprite(gaugeFuelTexture)
  fuelIcon.anchor.set(0.5)
  const fuelIconScale = 30 / Math.max(gaugeFuelTexture.width, gaugeFuelTexture.height)
  fuelIcon.scale.set(fuelIconScale)
  fuelIcon.position.set(28, PANEL_H / 2)
  gaugePanel.addChild(fuelIcon)

  const fuelBarGfx = new Graphics()
  fuelBarGfx.position.set(52, (PANEL_H - FUEL_BAR_H) / 2)
  gaugePanel.addChild(fuelBarGfx)

  scene.addChild(gaugePanel)

  const grid = new Uint8Array(COLS * ROWS)
  const oreGrid = new Int8Array(COLS * ROWS)
  const brownShades = [0x78492a, 0x6e4225, 0x825130, 0x673e22]
  const oreSpritePool = []

  const PLAYER_W = 42
  const PLAYER_H = 42
  const MOVE_SPEED = 270
  const GRAVITY = 1400
  const FLOAT_THRUST = 2200
  const MAX_FLOAT_SPEED = -280
  const MAX_FALL_SPEED = 650
  const MIN_PY = -HEIGHT * 0.4
  const DIG_COOLDOWN = 0.14
  const ORE_SPAWN_CHANCE = 0.22
  const MAX_FUEL = 100
  const FUEL_BURN_FLOAT = 14
  const FUEL_BURN_DIG = 1.2
  const FUEL_REFILL_RATE = 55

  let money = 0
  let fuel = MAX_FUEL
  let px = WORLD_WIDTH / 2
  let py = 0
  let vx = 0
  let vy = 0
  let onGround = true
  let active = false
  let exploding = false
  let explosionTimer = 0
  let digTimer = 0
  let camX = 0
  let camY = -HEIGHT * 0.62
  let sunTime = 0
  let tilesDirty = true
  let lastViewKey = ''

  const particles = []
  const popups = []

  function formatMoney(amount) {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  function populateOres() {
    oreGrid.fill(-1)
    for (let r = 0; r < ROWS; r++) {
      const eligible = []
      let totalWeight = 0
      for (let i = 0; i < ORES.length; i++) {
        const ore = ORES[i]
        if (r >= ore.minDepth && r <= ore.maxDepth) {
          eligible.push(i)
          totalWeight += ore.weight
        }
      }
      if (eligible.length === 0) continue

      for (let c = 0; c < COLS; c++) {
        if (Math.random() > ORE_SPAWN_CHANCE) continue

        let roll = Math.random() * totalWeight
        let chosen = eligible[eligible.length - 1]
        for (let j = 0; j < eligible.length; j++) {
          const idx = eligible[j]
          roll -= ORES[idx].weight
          if (roll <= 0) {
            chosen = idx
            break
          }
        }
        oreGrid[r * COLS + c] = chosen
      }
    }
  }

  function drawFuelBar() {
    const ratio = Math.max(0, Math.min(1, fuel / MAX_FUEL))
    const fillW = Math.round(FUEL_BAR_W * ratio)

    fuelBarGfx.clear()
    // Black background when empty
    fuelBarGfx.rect(0, 0, FUEL_BAR_W, FUEL_BAR_H).fill(0x000000)

    if (fillW > 0) {
      fuelBarGfx.rect(0, 0, fillW, FUEL_BAR_H).fill(0x00ff74)
    }

    fuelBarGfx
      .rect(0, 0, FUEL_BAR_W, FUEL_BAR_H)
      .stroke({ color: 0x00ff74, width: 2.5 })
  }

  function resetWorld() {
    grid.fill(1)
    populateOres()
    money = 0
    moneyText.text = formatMoney(money)
    fuel = MAX_FUEL
    drawFuelBar()
    px = WORLD_WIDTH / 2
    py = 0
    vx = 0
    vy = 0
    onGround = true
    exploding = false
    explosionTimer = 0
    player.visible = true
    digTimer = 0
    particles.length = 0
    for (let i = popups.length - 1; i >= 0; i--) {
      popupsLayer.removeChild(popups[i].label)
      popups[i].label.destroy()
    }
    popups.length = 0
    camX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, px - WIDTH / 2))
    camY = -HEIGHT * 0.62
    tilesDirty = true
    lastViewKey = ''
    player.position.set(px, py)
  }

  function triggerExplosion() {
    if (exploding) return
    exploding = true
    explosionTimer = 1.3
    player.visible = false
    keys.clear()
    pressedQueue.clear()

    const ex = px
    const ey = py - PLAYER_H / 2
    const boomColors = [0xff4500, 0xff9900, 0xffea00, 0xffffff, 0x00e5c0]
    for (let i = 0; i < 42; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 70 + Math.random() * 280
      particles.push({
        x: ex + (Math.random() - 0.5) * 16,
        y: ey + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 6 + Math.random() * 8,
        life: 0.6 + Math.random() * 0.5,
        color: boomColors[i % boomColors.length],
      })
    }

    const label = new Text({
      text: 'OUT OF FUEL!',
      style: {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 24,
        fill: '#ff4d4d',
        fontWeight: '900',
        stroke: { color: '#12081c', width: 5 },
      },
    })
    label.anchor.set(0.5)
    label.position.set(ex, ey - 18)
    popupsLayer.addChild(label)
    popups.push({ label, life: 1.2, maxLife: 1.2 })
  }

  function isSolid(col, row) {
    if (col < 0 || col >= COLS) return true
    if (row < 0) return false
    if (row >= ROWS) return true
    return grid[row * COLS + col] === 1
  }

  function digTile(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false
    const idx = row * COLS + col
    if (grid[idx] === 0) return false

    grid[idx] = 0
    tilesDirty = true

    const oreIdx = oreGrid[idx]
    oreGrid[idx] = -1

    const cx = col * TILE_SIZE + TILE_SIZE / 2
    const cy = row * TILE_SIZE + TILE_SIZE / 2

    if (oreIdx >= 0) {
      const ore = ORES[oreIdx]
      money = Math.round((money + ore.value) * 100) / 100
      moneyText.text = formatMoney(money)

      const label = new Text({
        text: `${ore.name} +${formatMoney(ore.value)}`,
        style: {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: 18,
          fill: ore.textColor,
          fontWeight: '800',
          stroke: { color: ore.strokeColor ?? '#12081c', width: 4 },
        },
      })
      label.anchor.set(0.5)
      const clampedX = Math.max(76, Math.min(WORLD_WIDTH - 76, cx))
      label.position.set(clampedX, cy - 10)
      popupsLayer.addChild(label)
      popups.push({ label, life: 1.0, maxLife: 1.0 })

      for (let i = 0; i < 10; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 24,
          y: cy + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 220,
          vy: -90 - Math.random() * 160,
          size: 5 + Math.random() * 4,
          life: 0.4 + Math.random() * 0.2,
          color: ore.color,
        })
      }
    }

    for (let i = 0; i < 8; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * 28,
        y: cy + (Math.random() - 0.5) * 28,
        vx: (Math.random() - 0.5) * 180,
        vy: -60 - Math.random() * 140,
        size: 5 + Math.random() * 5,
        life: 0.35 + Math.random() * 0.2,
        color: brownShades[(col + row + i) % brownShades.length],
      })
    }

    return true
  }

  function getOreSprite(poolIndex) {
    if (poolIndex < oreSpritePool.length) {
      return oreSpritePool[poolIndex]
    }
    const s = new Sprite()
    s.anchor.set(0.5)
    oresLayer.addChild(s)
    oreSpritePool.push(s)
    return s
  }

  function renderVisibleTiles() {
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE))
    const endCol = Math.min(COLS - 1, Math.floor((camX + WIDTH) / TILE_SIZE))
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE))
    const endRow = Math.min(ROWS - 1, Math.floor((camY + HEIGHT) / TILE_SIZE))

    const viewKey = `${startCol},${endCol},${startRow},${endRow}`
    if (!tilesDirty && viewKey === lastViewKey) return

    tilesDirty = false
    lastViewKey = viewKey
    tilesGfx.clear()

    let usedSprites = 0

    if (endRow >= 0 && startRow < ROWS) {
      // Dark brown cavern wall behind dug-out underground tiles
      const bgTop = startRow * TILE_SIZE
      const bgHeight = (endRow - startRow + 1) * TILE_SIZE
      tilesGfx.rect(0, bgTop, WORLD_WIDTH, bgHeight).fill(0x28180e)

      for (let r = startRow; r <= endRow; r++) {
        const y = r * TILE_SIZE
        for (let c = startCol; c <= endCol; c++) {
          const idx = r * COLS + c
          if (grid[idx] !== 1) continue

          const x = c * TILE_SIZE
          const shade = brownShades[(r * 7 + c * 13) & 3]

          tilesGfx
            .rect(x, y, TILE_SIZE, TILE_SIZE)
            .fill(shade)
            .stroke({ color: 0x472916, width: 2, alignment: 1 })

          const oreIdx = oreGrid[idx]
          if (oreIdx >= 0) {
            const ore = ORES[oreIdx]
            const sprite = getOreSprite(usedSprites++)
            sprite.texture = ore.texture
            const targetSize = TILE_SIZE * 0.72
            const maxDim = Math.max(ore.texture.width, ore.texture.height) || 1
            sprite.scale.set(targetSize / maxDim)
            sprite.position.set(x + TILE_SIZE / 2, y + TILE_SIZE / 2)
            sprite.visible = true
          }
        }
      }
    }

    for (let i = usedSprites; i < oreSpritePool.length; i++) {
      oreSpritePool[i].visible = false
    }
  }

  function update(ticker) {
    if (!active) return

    const dt = Math.min(0.05, ticker.deltaMS / 1000)

    if (exploding) {
      explosionTimer -= dt

      particlesGfx.clear()
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        p.vy += 450 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        particlesGfx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size).fill(p.color)
      }

      for (let i = popups.length - 1; i >= 0; i--) {
        const pop = popups[i]
        pop.life -= dt
        if (pop.life <= 0) {
          popupsLayer.removeChild(pop.label)
          pop.label.destroy()
          popups.splice(i, 1)
          continue
        }
        pop.label.y -= 32 * dt
        pop.label.alpha = Math.min(1, (pop.life / pop.maxLife) * 1.4)
      }

      if (explosionTimer <= 0) {
        onGameOver()
      }
      return
    }

    if (digTimer > 0) digTimer = Math.max(0, digTimer - dt)

    const aDown = keys.has('a') || pressedQueue.has('a')
    const dDown = keys.has('d') || pressedQueue.has('d')
    const sDown = keys.has('s') || pressedQueue.has('s')
    const wDown = keys.has('w') || pressedQueue.has('w')

    // Horizontal input: move, or dig adjacent tile when pressed against dirt
    let moveDir = 0
    if (aDown) moveDir -= 1
    if (dDown) moveDir += 1

    const bodyRow = Math.floor((py - PLAYER_H * 0.5) / TILE_SIZE)
    const playerCol = Math.max(0, Math.min(COLS - 1, Math.floor(px / TILE_SIZE)))

    if (moveDir !== 0 && digTimer <= 0) {
      const sideX = moveDir > 0 ? px + PLAYER_W / 2 + 4 : px - PLAYER_W / 2 - 4
      const targetCol = Math.floor(sideX / TILE_SIZE)
      if (targetCol >= 0 && targetCol < COLS && bodyRow >= 0 && isSolid(targetCol, bodyRow)) {
        if (digTile(targetCol, bodyRow)) {
          digTimer = DIG_COOLDOWN
          fuel = Math.max(0, fuel - FUEL_BURN_DIG)
        }
      }
    }

    // S to dig straight down
    if (sDown && digTimer <= 0) {
      const belowRow = Math.floor((py + 4) / TILE_SIZE)
      if (digTile(playerCol, belowRow)) {
        digTimer = DIG_COOLDOWN
        onGround = false
        fuel = Math.max(0, fuel - FUEL_BURN_DIG)
      }
    }

    vx = moveDir * MOVE_SPEED

    if (wDown && fuel > 0) {
      if (onGround) {
        vy = -160
        onGround = false
      }
      vy = Math.max(MAX_FLOAT_SPEED, vy - (FLOAT_THRUST - GRAVITY) * dt)
      fuel = Math.max(0, fuel - FUEL_BURN_FLOAT * dt)

      if (Math.random() < 0.6) {
        particles.push({
          x: px + (Math.random() - 0.5) * 18,
          y: py - 2,
          vx: (Math.random() - 0.5) * 40,
          vy: 80 + Math.random() * 80,
          size: 4 + Math.random() * 3,
          life: 0.22 + Math.random() * 0.12,
          color: 0x00e5c0,
        })
      }
    } else {
      vy = Math.min(MAX_FALL_SPEED, vy + GRAVITY * dt)
    }

    // Refill only at the surface refuel station
    const atRefuelStation = Math.abs(px - REFUEL_X) <= 72 && py >= -12 && py <= 8
    if (atRefuelStation && fuel < MAX_FUEL) {
      fuel = Math.min(MAX_FUEL, fuel + FUEL_REFILL_RATE * dt)
      if (Math.random() < 0.35) {
        particles.push({
          x: px + (Math.random() - 0.5) * 32,
          y: py - 10 - Math.random() * 26,
          vx: (Math.random() - 0.5) * 20,
          vy: -40 - Math.random() * 40,
          size: 4 + Math.random() * 3,
          life: 0.3 + Math.random() * 0.15,
          color: 0x00ff74,
        })
      }
    }

    drawFuelBar()

    if (fuel <= 0) {
      triggerExplosion()
    }

    pressedQueue.clear()

    // Move & resolve X collisions
    px += vx * dt
    const topRow = Math.floor((py - PLAYER_H + 2) / TILE_SIZE)
    const bottomRow = Math.floor((py - 2) / TILE_SIZE)

    if (vx > 0) {
      const rightCol = Math.floor((px + PLAYER_W / 2) / TILE_SIZE)
      for (let r = topRow; r <= bottomRow; r++) {
        if (isSolid(rightCol, r)) {
          px = rightCol * TILE_SIZE - PLAYER_W / 2
          vx = 0
          break
        }
      }
    } else if (vx < 0) {
      const leftCol = Math.floor((px - PLAYER_W / 2) / TILE_SIZE)
      for (let r = topRow; r <= bottomRow; r++) {
        if (isSolid(leftCol, r)) {
          px = (leftCol + 1) * TILE_SIZE + PLAYER_W / 2
          vx = 0
          break
        }
      }
    }

    // Clamp to 20-tile world bounds
    px = Math.max(PLAYER_W / 2, Math.min(WORLD_WIDTH - PLAYER_W / 2, px))

    // Move & resolve Y collisions
    py += vy * dt
    const leftEdgeCol = Math.floor((px - PLAYER_W / 2 + 2) / TILE_SIZE)
    const rightEdgeCol = Math.floor((px + PLAYER_W / 2 - 2) / TILE_SIZE)

    if (vy >= 0) {
      const footRow = Math.floor(py / TILE_SIZE)
      let landed = false
      for (let c = leftEdgeCol; c <= rightEdgeCol; c++) {
        if (isSolid(c, footRow)) {
          py = footRow * TILE_SIZE
          vy = 0
          landed = true
          break
        }
      }
      onGround = landed
    } else {
      const headRow = Math.floor((py - PLAYER_H) / TILE_SIZE)
      for (let c = leftEdgeCol; c <= rightEdgeCol; c++) {
        if (isSolid(c, headRow)) {
          py = (headRow + 1) * TILE_SIZE + PLAYER_H
          vy = 0
          break
        }
      }
      onGround = false
    }

    if (py < MIN_PY) {
      py = MIN_PY
      if (vy < 0) vy = 0
    }

    player.position.set(px, py)

    // Smooth camera following player (scrollable surface + deep shaft)
    const targetCamX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, px - WIDTH / 2))
    const minCamY = -HEIGHT * 0.62
    const maxCamY = WORLD_HEIGHT - HEIGHT
    const targetCamY = Math.max(minCamY, Math.min(maxCamY, py - HEIGHT * 0.48))

    const smooth = 1 - Math.exp(-10 * dt)
    camX += (targetCamX - camX) * smooth
    camY += (targetCamY - camY) * smooth

    world.position.set(-Math.round(camX), -Math.round(camY))

    sunTime += dt
    sun.x = sunBaseX - (camX - (WORLD_WIDTH - WIDTH) / 2) * 0.12
    sun.y = sunBaseY - Math.max(0, camY + HEIGHT * 0.62) * 0.25 + Math.sin(sunTime * 1.4) * 6

    const surfaceY = -Math.round(camY)
    cityLayer.x = -Math.round(camX * 0.35)
    cityLayer.y = surfaceY + 8
    palmsLayer.x = -Math.round(camX * 0.75)
    palmsLayer.y = surfaceY

    renderVisibleTiles()

    // Update dig particles
    particlesGfx.clear()
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= dt
      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }
      p.vy += 600 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      particlesGfx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size).fill(p.color)
    }

    // Update floating money popups
    for (let i = popups.length - 1; i >= 0; i--) {
      const pop = popups[i]
      pop.life -= dt
      if (pop.life <= 0) {
        popupsLayer.removeChild(pop.label)
        pop.label.destroy()
        popups.splice(i, 1)
        continue
      }
      pop.label.y -= 42 * dt
      pop.label.alpha = Math.min(1, (pop.life / pop.maxLife) * 1.4)
    }

    const depthTiles = Math.max(0, Math.floor(py / TILE_SIZE))
    depthText.text = `Depth: ${depthTiles} / ${ROWS}`
  }

  scene.start = () => {
    active = true
    resetWorld()
    renderVisibleTiles()
    world.position.set(-Math.round(camX), -Math.round(camY))
    cityLayer.x = -Math.round(camX * 0.35)
    cityLayer.y = -Math.round(camY) + 8
    palmsLayer.x = -Math.round(camX * 0.75)
    palmsLayer.y = -Math.round(camY)
    app.ticker.add(update)
  }

  scene.stop = () => {
    active = false
    app.ticker.remove(update)
  }

  return scene
}

function createButton(label, { width, height, fill, hover, textColor }) {
  const button = new Container()
  button.eventMode = 'static'
  button.cursor = 'pointer'

  const bg = new Graphics()
    .roundRect(-width / 2, -height / 2, width, height, 16)
    .fill(fill)

  const text = new Text({
    text: label,
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 28,
      fill: textColor,
      fontWeight: '700',
    },
  })
  text.anchor.set(0.5)

  button.addChild(bg, text)

  button.on('pointerover', () => {
    bg.clear().roundRect(-width / 2, -height / 2, width, height, 16).fill(hover)
  })
  button.on('pointerout', () => {
    bg.clear().roundRect(-width / 2, -height / 2, width, height, 16).fill(fill)
  })

  return button
}
