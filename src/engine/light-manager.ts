import * as THREE from "three";

export class LightManager {
  private scene: THREE.Scene;
  public ambient: THREE.AmbientLight;
  public keyLight: THREE.SpotLight;
  public fillLight: THREE.PointLight;
  public backLight: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.ambient = this.createAmbient();
    this.keyLight = this.createKeyLight();
    this.fillLight = this.createFillLight();
    this.backLight = this.createBackLight();
  }

  private createAmbient(): THREE.AmbientLight {
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light);
    return light;
  }
  private createKeyLight(): THREE.SpotLight {
    const light = new THREE.SpotLight(0xffffff, 2);
    light.position.set(2, 3, 4);
    light.target.position.set(0, 0, 0);
    light.angle = Math.PI / 4;
    light.penumbra = 0.3;
    light.distance = 10;
    light.castShadow = true;
    this.scene.add(light);
    this.scene.add(light.target);
    return light;
  }

  private createFillLight(): THREE.PointLight {
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(-2, 2, 3);
    light.distance = 8;
    this.scene.add(light);
    return light;
  }

  private createBackLight(): THREE.PointLight {
    const light = new THREE.PointLight(0xffccaa, 0.8);
    light.position.set(0, -1, 2);
    light.distance = 6;
    this.scene.add(light);
    return light;
  }
}
