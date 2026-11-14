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
const GROUND_HEIGHT = 80

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

window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase())
})
window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
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
  const groundTop = HEIGHT - GROUND_HEIGHT

  const sky = new Sprite(skyTexture)
  sky.width = WIDTH
  sky.height = HEIGHT
  scene.addChild(sky)

  const ground = new Graphics()
    .rect(0, groundTop, WIDTH, GROUND_HEIGHT)
    .fill('#3d2b1f')
  ground
    .rect(0, groundTop, WIDTH, 12)
    .fill('#5a8f3a')
  scene.addChild(ground)

  const player = new Sprite(ufoTexture)
  player.anchor.set(0.5, 1)
  const playerScale = 0.35
  player.scale.set(playerScale)
  player.position.set(WIDTH / 2, groundTop)
  scene.addChild(player)

  const hint = new Text({
    text: 'A / D move · W jump',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 18,
      fill: '#ffffff',
      fontWeight: '600',
    },
  })
  hint.anchor.set(0.5, 0)
  hint.position.set(WIDTH / 2, 16)
  hint.alpha = 0.85
  scene.addChild(hint)

  const MOVE_SPEED = 280
  const JUMP_VELOCITY = -520
  const GRAVITY = 1400

  let vx = 0
  let vy = 0
  let onGround = true
  let active = false
  let jumpLocked = false

  function update(ticker) {
    if (!active) return

    const dt = ticker.deltaMS / 1000

    vx = 0
    if (keys.has('a')) vx -= MOVE_SPEED
    if (keys.has('d')) vx += MOVE_SPEED

    if (keys.has('w') && onGround && !jumpLocked) {
      vy = JUMP_VELOCITY
      onGround = false
      jumpLocked = true
    }
    if (!keys.has('w')) jumpLocked = false

    vy += GRAVITY * dt

    player.x += vx * dt
    player.y += vy * dt

    const halfW = (player.width * 0.5) * 0.7
    player.x = Math.max(halfW, Math.min(WIDTH - halfW, player.x))

    if (player.y >= groundTop) {
      player.y = groundTop
      vy = 0
      onGround = true
    }
  }

  scene.start = () => {
    active = true
    player.position.set(WIDTH / 2, groundTop)
    vx = 0
    vy = 0
    onGround = true
    jumpLocked = false
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
