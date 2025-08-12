import * as THREE from "three";

export class LightManager {
  private scene: THREE.Scene;
  public ambient: THREE.AmbientLight;
  public keyLight: THREE.DirectionalLight;
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
    // Luce ambientale molto più bassa per contrasti forti
    const light = new THREE.AmbientLight(0x404040, 0.2); // Era 0.5, ora 0.2
    this.scene.add(light);
    return light;
  }

  private createKeyLight(): THREE.DirectionalLight {
    // Luce principale più intensa e posizionata come un sole
    const light = new THREE.DirectionalLight(0xffffff, 2.0); // Era 1.0, ora 2.0
    light.position.set(10, 20, 10); // Più alta e laterale
    light.castShadow = true;

    // Migliori impostazioni ombre per più definizione
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;

    this.scene.add(light);
    return light;
  }

  private createFillLight(): THREE.PointLight {
    // Luce di riempimento più fredda che simula la riflessione dell'acqua
    const light = new THREE.PointLight(0x87ceeb, 0.6); // Blu cielo invece di bianco, più intensa
    light.position.set(-8, -5, 8); // Posizione più bassa, come se venisse dall'acqua

    // Aggiungi decay per un effetto più realistico
    light.decay = 2;
    light.distance = 30;

    this.scene.add(light);
    return light;
  }

  private createBackLight(): THREE.PointLight {
    // Luce di contorno più calda per separare gli oggetti dallo sfondo
    const light = new THREE.PointLight(0xffd700, 0.8); // Oro/giallo caldo invece di bianco
    light.position.set(0, 8, -15); // Più lontana e più alta

    // Impostazioni per un effetto più cinematografico
    light.decay = 1.5;
    light.distance = 40;

    this.scene.add(light);
    return light;
  }
}
