class App {

  constructor () {
    this.lazyCanvas = new LazyCanvas('.canvas')
    this.videoCamera = new VideoCamera('.video')
    this.videoCamera.start().then(() => {
      this.ui = new UI()
      this.ui.bindDelayButton((delay) => { this.start(delay) })
      this.start(3000)
    })
  }

  start (delay) {
    this.lazyCanvas.clear()
    this.lazyCanvas.startRecord(this.videoCamera)
    this.lazyCanvas.startRender(delay)
  }

}

class LazyCanvas {

  constructor (selector) {
    this.canvas = document.querySelector(selector)
    this.context = this.canvas.getContext('2d')
    this.interval = 100
    this.snapshots = []
    this.recordTimer = null
    this.renderTimer = null
  }

  clear () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.snapshots = []
    if (this.recordTimer != null) {
      clearInterval(this.recordTimer)
      this.recordTimer = null
    }
    if (this.renderTimer != null) {
      clearInterval(this.renderTimer)
      this.renderTimer = null
    }
  }

  startRecord (videoCamera) {
    const { width, height } = videoCamera.stream.getVideoTracks()[0].getSettings()
    this.recordTimer = setInterval(() => { this.addSnapshot(videoCamera.node, width, height) }, this.interval)
  }

  addSnapshot (videoNode, videoWidth, videoHeight) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const height = Math.round(this.canvas.clientWidth * videoHeight / videoWidth)
    canvas.style['width'] = `${this.canvas.clientWidth}px`
    canvas.style['height'] = `${height}px`
    this.canvas.style['height'] = `${height}px`
    context.drawImage(videoNode, 0, 0, canvas.width, canvas.height)
    this.snapshots.push(canvas)
  }

  startRender (delay) {
    setTimeout(() => {
      this.renderTimer = setInterval(() => {
        this.context.drawImage(this.snapshots.shift(), 0, 0)
      }, this.interval)
    }, delay)
  }

}

class VideoCamera {

  constructor (selector) {
    this.node = document.querySelector(selector)
    this.stream = null
    this.fallback()
  }

  fallback () {
    if (navigator.mediaDevices == null) {
      navigator.mediaDevices = {}
    }
    if (navigator.mediaDevices.getUserMedia == null) {
      navigator.mediaDevices.getUserMedia =
        navigator.getUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia
    }
  }

  start () {
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    }).then((stream) => {
      this.node.onloadedmetadata = () => { this.node.play() }
      this.node.srcObject = this.stream = stream
    }).catch((error) => {
      alert(`カメラへのアクセスが拒否された、もしくは何らかのエラーが発生しました。\nエラー: ${error.name}`)
    })
  }

}

class UI {

  bindDelayButton (callback) {
    document.getElementsByName('delay').forEach((node) => {
      node.addEventListener('click', (event) => {
        callback(parseInt(event.target.value, 10))
      })
    })
  }

}

new App()
