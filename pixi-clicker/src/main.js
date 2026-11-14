import './style.css'
import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js'
import skyUrl from './assets/sky.png'
import titleUrl from './assets/title.png'

const app = new Application()
const root = document.querySelector('#app')

const WIDTH = 960
const HEIGHT = 540

await app.init({
  width: WIDTH,
  height: HEIGHT,
  background: '#2a0a4a',
  antialias: true,
  preference: 'webgl',
})

root.appendChild(app.canvas)

const [skyTexture, titleTexture] = await Promise.all([
  Assets.load(skyUrl),
  Assets.load(titleUrl),
])

const menu = createMainMenu(() => {
  menu.visible = false
  game.visible = true
})

const game = createClickerGame()
game.visible = false

app.stage.addChild(menu, game)

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

function createClickerGame() {
  const scene = new Container()

  const sky = new Sprite(skyTexture)
  sky.width = WIDTH
  sky.height = HEIGHT
  scene.addChild(sky)

  let score = 0

  const scoreText = new Text({
    text: 'Score: 0',
    style: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 42,
      fill: '#ffffff',
      fontWeight: '600',
    },
  })
  scoreText.anchor.set(0.5)
  scoreText.position.set(WIDTH / 2, HEIGHT / 2 - 100)
  scene.addChild(scoreText)

  const clickButton = createButton('Click me!', {
    width: 220,
    height: 80,
    fill: '#3d7eff',
    hover: '#5a93ff',
    textColor: '#ffffff',
  })
  clickButton.position.set(WIDTH / 2, HEIGHT / 2 + 20)

  clickButton.on('pointerdown', () => {
    score += 1
    scoreText.text = `Score: ${score}`
    clickButton.scale.set(0.92)
  })
  clickButton.on('pointerup', () => clickButton.scale.set(1))
  clickButton.on('pointerupoutside', () => clickButton.scale.set(1))
  clickButton.on('pointerout', () => clickButton.scale.set(1))

  scene.addChild(clickButton)
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
