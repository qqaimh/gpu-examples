import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Engine3D, Scene3D, Object3D, Camera3D, DirectLight, HoverCameraController, Color, View3D, AtmosphericComponent, SkyRenderer, Texture, SkeletonAnimationComponent, Vector3, ComponentBase, KeyEvent, KeyCode, SkeletonAnimationClip } from '@orillusion/core'
import { Physics, Rigidbody } from '@orillusion/physics'

class KeyboardScript extends ComponentBase {
  private front: boolean = false
  private back: boolean = false
  private left: boolean = false
  private right: boolean = false
  private q: boolean = false
  private e: boolean = false
  public hoverCameraController: HoverCameraController
  public animator: SkeletonAnimationComponent

  public override init(param: any) {
    this.hoverCameraController = param.controller;
    this.animator = param.animator;
  }

  public override start() {
    Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this)
    Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this)
  }

  private keyDown(e: KeyEvent) {
    if (e.keyCode == KeyCode.Key_W) {
      this.object3D.rotationY = 0
    } else if (e.keyCode === KeyCode.Key_S) {
      this.object3D.rotationY = 180
    } else if (e.keyCode === KeyCode.Key_A) {
      this.object3D.rotationY = 90
    } else if (e.keyCode === KeyCode.Key_D) {
       this.object3D.rotationY = -90
    }

    this.animator.play('Run')
    // console.log('keyDown:', e.keyCode);
    if (e.keyCode == KeyCode.Key_W) {
      this.front = true
    } else if (e.keyCode == KeyCode.Key_S) {
      this.back = true
    } else if (e.keyCode == KeyCode.Key_A) {
      this.left = true
    } else if (e.keyCode == KeyCode.Key_D) {
      this.right = true
    } else if (e.keyCode == KeyCode.Key_Q) {
      this.q = true
    } else if (e.keyCode == KeyCode.Key_E) {
      this.e = true
    }
  }
  private keyUp(e: KeyEvent) {
    // console.log('keyUp:', e.keyCode);
    let transform = this.object3D.transform
    console.log(transform.x, transform.y, transform.z, transform.rotationX)
    if (e.keyCode == KeyCode.Key_W) {
      this.front = false
    } else if (e.keyCode == KeyCode.Key_S) {
      this.back = false
    } else if (e.keyCode == KeyCode.Key_A) {
      this.left = false
    } else if (e.keyCode == KeyCode.Key_D) {
      this.right = false
    } else if (e.keyCode == KeyCode.Key_Q) {
      this.q = false
    } else if (e.keyCode == KeyCode.Key_E) {
      this.e = false
    } else {
      transform.x = 0
      transform.y = 0
      transform.z = 0
      transform.rotationX = 0
      console.log(transform.x, transform.y, transform.z, transform.rotationX)
    }
    this.animator.play('Idle')
  }

  public override onUpdate() {
    if (!this.enable) return

    let transform = this.object3D.transform
    if (this.front) transform.z -= 0.1
    if (this.back) transform.z += 0.1
    if (this.left) transform.x -= 0.1
    if (this.right) transform.x += 0.1
    if (this.q) transform.rotationX -= 0.5
    if (this.e) transform.rotationX += 0.5

    this.hoverCameraController.target = new Vector3(transform.x, transform.y, transform.z)
  }
}

@Component({
  selector: 'gpu-examples-gpu-orillusion-clustered-ball',
  templateUrl: './gpu-orillusion-clustered-ball.component.html',
  styleUrls: ['./gpu-orillusion-clustered-ball.component.scss']
})
export class GpuOrillusionClusteredBallComponent implements OnInit, AfterViewInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;

  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    this.draw()
  }

  async draw() {
    await Physics.init()
    // initializa engine
    await Engine3D.init({
      canvasConfig: { canvas: this.theCanvas.nativeElement },
      renderLoop: () => {
        if (Physics.isInited) {
          Physics.update();
        }
      }
    })
    // create new scene as root node
    let scene3D: Scene3D = new Scene3D()
    // add an Atmospheric sky enviroment
    let sky = scene3D.addComponent(AtmosphericComponent)
    sky.sunY = 0.6
    // 城市背景
    // let sky: SkyRenderer = scene3D.addComponent(SkyRenderer)
    // let hdrTextureCube: Texture = await Engine3D.res.loadHDRTextureCube('https://cdn.orillusion.com/hdri/T_Panorama05_HDRI.HDR')
    // sky.map = hdrTextureCube
    // let sky: SkyRenderer = scene3D.addComponent(SkyRenderer)
    // let texture = await Engine3D.res.loadHDRTextureCube('../../../assets/shadow/textures/skybox/cube-basis-mipmap.ktx2');
    // sky.map = texture


    // create camera
    let cameraObj: Object3D = new Object3D()
    let camera = cameraObj.addComponent(Camera3D)
    // adjust camera view
    camera.perspective(60, Engine3D.aspect, 1, 5000.0)
    // set camera controller
    // let controller = cameraObj.addComponent(HoverCameraController)
    // controller.setCamera(0, -10, 35)

    // 加载控制器组件
    let controller: HoverCameraController = cameraObj.addComponent(HoverCameraController);
    // 通过组件 setCamera 设置相机位置
    controller.setCamera(0, -20, 8, new Vector3(0, 0, 25));

    // add camera node
    scene3D.addChild(cameraObj)
    // create light
    let light: Object3D = new Object3D()
    // add direct light component
    let component: DirectLight = light.addComponent(DirectLight)
    // adjust lighting
    light.rotationX = 45
    light.rotationY = 30
    component.lightColor = new Color(1.0, 1.0, 1.0, 1.0)
    component.intensity = 10
    // add light object
    scene3D.addChild(light)

    // load gltf model
    let city: Object3D = await Engine3D.res.loadGltf('../../../assets/shadow/models/city-set-draco.glb')
    console.log(2222, city)
    // const cityRigidbody: Rigidbody = city.addComponent(Rigidbody)
    // cityRigidbody.mass = 0
    scene3D.addChild(city)

    let man: Object3D = await Engine3D.res.loadGltf('https://cdn.orillusion.com/gltfs/glb/Soldier.glb')
    man.z = 25;
    // const manRigidbody: Rigidbody = man.addComponent(Rigidbody)
    // manRigidbody.mass = 80
   

    let animator: SkeletonAnimationComponent = man.getComponentsInChild(SkeletonAnimationComponent)[0];
    man.addComponent(KeyboardScript, {controller, animator})
    scene3D.addChild(man)


    const clips: SkeletonAnimationClip[] = animator.getAnimationClips()
    console.log(2222, animator)
    console.log(3333, clips)
   // animator.play('0')


    // create a view with target scene and camera
    let view = new View3D()
    view.scene = scene3D
    view.camera = camera
    // start render
    Engine3D.startRenderView(view)

  }

}
