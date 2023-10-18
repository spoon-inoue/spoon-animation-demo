import * as THREE from 'three'
import { three } from './core/Three'
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { gui } from './Gui'

export class Canvas {
  private animation: { mixer?: THREE.AnimationMixer; actions?: { name: string; action: THREE.AnimationAction }[] } = {}
  private lights = new THREE.Group()
  private helpers = new THREE.Group()

  constructor(canvas: HTMLCanvasElement) {
    this.init(canvas)

    this.load().then((data) => {
      this.createLights()
      this.createModel(data.model, data.textures)
      this.createGround()
      this.setGui()
      three.animation(this.anime)
    })
  }

  private async load() {
    const model = await this.loadModel()
    const textures = await this.loadTextures()
    return { model, textures }
  }

  // private async loadModel() {
  //   const gltfLoader = new GLTFLoader()
  //   const dracoLoader = new DRACOLoader()
  //   dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  //   gltfLoader.setDRACOLoader(dracoLoader)

  //   const gltf = await gltfLoader.loadAsync(import.meta.env.BASE_URL + '/models/spoonsan_walk.drc')

  //   dracoLoader.dispose()
  //   return gltf
  // }

  private async loadTextures() {
    const loader = new THREE.TextureLoader()
    const files = [
      'face_hand_color.jpg',
      't-shirts_color.jpg',
      't-shirts_normal.jpg',
      'bottom_color.jpg',
      'eye_color.jpg',
      'hair_eyebrows_color.jpg',
      'shoes_color.jpg',
    ]

    return await Promise.all(
      files.map(async (file) => {
        const path = import.meta.env.BASE_URL + `models/textures/${file}`
        const name = file.split('.')[0]
        const texture = await loader.loadAsync(path)
        texture.name = name
        texture.flipY = false
        if (name.includes('_color')) {
          texture.colorSpace = THREE.SRGBColorSpace
        }
        return texture
      }),
    )
  }

  private async loadModel() {
    const gltfLoader = new GLTFLoader()
    const gltf = await gltfLoader.loadAsync(import.meta.env.BASE_URL + '/models/spoonsan.glb')
    return gltf
  }

  private init(canvas: HTMLCanvasElement) {
    three.setup(canvas)
    three.camera.position.set(-6.5, 2.6, 7.8)
    three.controls.enableDamping = true
    three.controls.dampingFactor = 0.15

    this.helpers.visible = false
    three.scene.add(this.helpers)
    this.helpers.add(new THREE.AxesHelper())
  }

  private createLights() {
    three.scene.add(this.lights)

    const ambient = new THREE.AmbientLight()
    ambient.intensity = 0.5
    this.lights.add(ambient)

    const directional = new THREE.DirectionalLight('#fff', 1.0)
    directional.position.set(3, 4, 5)
    directional.castShadow = true
    directional.shadow.mapSize.set(2048, 2048)
    directional.shadow.camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 15)
    this.lights.add(directional)

    const helper = new THREE.CameraHelper(directional.shadow.camera)
    this.helpers.add(helper)
    // three.scene.add(helper)
  }

  private createModel(gltf: GLTF, textures: THREE.Texture[]) {
    const model = gltf.scene
    three.scene.add(model)

    console.log(model)
    console.log(textures)

    const findTexture = (findName: string) => {
      return textures.find(({ name }) => name === findName)!
    }

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true

        const material = new THREE.MeshStandardMaterial()
        child.material = material

        const name = child.name

        if (name === 'body') {
          material.map = findTexture('face_hand_color')
        } else if (name === 'wear') {
          material.map = findTexture('t-shirts_color')
          material.normalMap = findTexture('t-shirts_normal')
        } else if (name === 'bottom') {
          material.map = findTexture('bottom_color')
        } else if (name === 'eye') {
          material.map = findTexture('eye_color')
        } else if (['eyebrows', 'hairFront', 'hairBack'].includes(name)) {
          material.map = findTexture('hair_eyebrows_color')
        } else if (name === 'shoes') {
          material.map = findTexture('shoes_color')
        }
      }
    })

    this.helpers.add(new THREE.SkeletonHelper(model))

    this.createModelAnimation(gltf)
  }

  private createModelAnimation(gltf: GLTF) {
    const mixer = new THREE.AnimationMixer(gltf.scene)
    const actions = gltf.animations.map((clip) => {
      const action = mixer.clipAction(clip)
      action.play()
      action.weight = 0
      return {
        name: clip.name as 'Jump' | 'Standby' | 'Tpose' | 'Walk',
        action,
      }
    })
    this.animation.mixer = mixer
    this.animation.actions = actions
  }

  private createGround() {
    const geometry = new THREE.PlaneGeometry(10, 10)
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    const material = new THREE.MeshStandardMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = -1.5
    mesh.receiveShadow = true

    three.scene.add(mesh)
  }

  private setGui() {
    gui.add(this.helpers, 'visible').name('helpers')

    this.animation.actions?.forEach((anime) => {
      gui.add(anime.action, 'weight', 0, 1, 0.01).name(anime.name)
    })

    // this.animation.actions?.forEach((anime) => {
    //   const obj = {
    //     play: () => {
    //       anime.action.reset()
    //       anime.action.play()
    //     },
    //     loop: true,
    //   }

    //   const folder = gui.addFolder(anime.name)
    //   folder.add(anime.action, 'weight', 0, 1, 0.01)
    //   folder.add(obj, 'loop').onChange((v: boolean) => {
    //     anime.action.loop = v ? THREE.LoopRepeat : THREE.LoopOnce
    //   })
    //   folder.add(obj, 'play')
    // })
  }

  private anime = () => {
    three.controls.update()
    this.lights.quaternion.copy(three.camera.quaternion)

    this.animation.mixer?.update(three.time.delta)
    three.render()
  }

  dispose() {
    three.dispose()
  }
}
