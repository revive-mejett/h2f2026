import './style.css'
import { Application, Container, Graphics, Text } from 'pixi.js'

const app = new Application()
const root = document.querySelector('#app')

// Fixed size works reliably inside itch.io's iframe (window resize can be 0x0)
const WIDTH = 960
const HEIGHT = 540

await app.init({
  width: WIDTH,
  height: HEIGHT,
  background: '#1a1f2e',
  antialias: true,
  preference: 'webgl',
})

root.appendChild(app.canvas)

let score = 0

const scoreText = new Text({
  text: 'Score: 0',
  style: {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: 42,
    fill: '#f0f4ff',
    fontWeight: '600',
  },
})
scoreText.anchor.set(0.5)

const button = new Container()
button.eventMode = 'static'
button.cursor = 'pointer'

const buttonBg = new Graphics()
  .roundRect(-110, -40, 220, 80, 16)
  .fill('#3d7eff')

const buttonLabel = new Text({
  text: 'Click me!',
  style: {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    fontSize: 28,
    fill: '#ffffff',
    fontWeight: '700',
  },
})
buttonLabel.anchor.set(0.5)

button.addChild(buttonBg, buttonLabel)

function layout() {
  scoreText.position.set(WIDTH / 2, HEIGHT / 2 - 100)
  button.position.set(WIDTH / 2, HEIGHT / 2 + 20)
}

layout()

button.on('pointerdown', () => {
  score += 1
  scoreText.text = `Score: ${score}`

  button.scale.set(0.92)
})

button.on('pointerup', () => {
  button.scale.set(1)
})

button.on('pointerupoutside', () => {
  button.scale.set(1)
})

button.on('pointerover', () => {
  buttonBg.clear().roundRect(-110, -40, 220, 80, 16).fill('#5a93ff')
})

button.on('pointerout', () => {
  buttonBg.clear().roundRect(-110, -40, 220, 80, 16).fill('#3d7eff')
  button.scale.set(1)
})

app.stage.addChild(scoreText, button)
