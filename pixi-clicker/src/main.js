import './style.css'
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import skyUrl from './assets/sky.png'
import titleUrl from './assets/title.png'
import ufoUrl from './assets/ufo.png'

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(Texture.from(img))
    img.onerror = (err) => reject(err)
    img.src = url
  })
}

const app = new Application()
const root = document.querySelector('#app')

const WIDTH = 960
const HEIGHT = 540

const COLS = 20
const ROWS = 1000
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

const [skyTexture, titleTexture, ufoTexture] = await Promise.all([
  loadTexture(skyUrl),
  loadTexture(titleUrl),
  loadTexture(ufoUrl),
])

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

const groundScene = createGroundScene()
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

function createGroundScene() {
  const scene = new Container()

  const sky = new Sprite(skyTexture)
  sky.width = WIDTH
  sky.height = HEIGHT
  scene.addChild(sky)

  const world = new Container()
  scene.addChild(world)

  const tilesGfx = new Graphics()
  world.addChild(tilesGfx)

  const particlesGfx = new Graphics()
  world.addChild(particlesGfx)

  const player = new Sprite(ufoTexture)
  player.anchor.set(0.5, 1)
  const ufoScale = 52 / Math.max(ufoTexture.width, ufoTexture.height)
  player.scale.set(ufoScale)
  world.addChild(player)

  const depthText = new Text({
    text: 'Depth: 0 / 1000',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 18,
      fill: '#ffffff',
      fontWeight: '700',
      stroke: { color: '#1a0830', width: 4 },
    },
  })
  depthText.position.set(16, 14)
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

  const grid = new Uint8Array(COLS * ROWS)
  const brownShades = [0x78492a, 0x6e4225, 0x825130, 0x673e22]

  const PLAYER_W = 42
  const PLAYER_H = 42
  const MOVE_SPEED = 270
  const GRAVITY = 1400
  const FLOAT_THRUST = 2200
  const MAX_FLOAT_SPEED = -280
  const MAX_FALL_SPEED = 650
  const MIN_PY = -HEIGHT * 0.4
  const DIG_COOLDOWN = 0.14

  let px = WORLD_WIDTH / 2
  let py = 0
  let vx = 0
  let vy = 0
  let onGround = true
  let active = false
  let digTimer = 0
  let camX = 0
  let camY = -HEIGHT * 0.62
  let tilesDirty = true
  let lastViewKey = ''

  const particles = []

  function resetWorld() {
    grid.fill(1)
    px = WORLD_WIDTH / 2
    py = 0
    vx = 0
    vy = 0
    onGround = true
    digTimer = 0
    particles.length = 0
    camX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, px - WIDTH / 2))
    camY = -HEIGHT * 0.62
    tilesDirty = true
    lastViewKey = ''
    player.position.set(px, py)
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

    const cx = col * TILE_SIZE + TILE_SIZE / 2
    const cy = row * TILE_SIZE + TILE_SIZE / 2
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

    if (endRow < 0 || startRow >= ROWS) return

    // Dark brown cavern wall behind dug-out underground tiles
    const bgTop = startRow * TILE_SIZE
    const bgHeight = (endRow - startRow + 1) * TILE_SIZE
    tilesGfx.rect(0, bgTop, WORLD_WIDTH, bgHeight).fill(0x28180e)

    for (let r = startRow; r <= endRow; r++) {
      const y = r * TILE_SIZE
      for (let c = startCol; c <= endCol; c++) {
        if (grid[r * COLS + c] !== 1) continue

        const x = c * TILE_SIZE
        const shade = brownShades[(r * 7 + c * 13) & 3]

        tilesGfx
          .rect(x, y, TILE_SIZE, TILE_SIZE)
          .fill(shade)
          .stroke({ color: 0x472916, width: 2, alignment: 1 })
      }
    }
  }

  function update(ticker) {
    if (!active) return

    const dt = Math.min(0.05, ticker.deltaMS / 1000)
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
        }
      }
    }

    // S to dig straight down
    if (sDown && digTimer <= 0) {
      const belowRow = Math.floor((py + 4) / TILE_SIZE)
      if (digTile(playerCol, belowRow)) {
        digTimer = DIG_COOLDOWN
        onGround = false
      }
    }

    vx = moveDir * MOVE_SPEED

    if (wDown) {
      if (onGround) {
        vy = -160
        onGround = false
      }
      vy = Math.max(MAX_FLOAT_SPEED, vy - (FLOAT_THRUST - GRAVITY) * dt)

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

    const depthTiles = Math.max(0, Math.floor(py / TILE_SIZE))
    depthText.text = `Depth: ${depthTiles} / ${ROWS}`
  }

  scene.start = () => {
    active = true
    resetWorld()
    renderVisibleTiles()
    world.position.set(-Math.round(camX), -Math.round(camY))
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
