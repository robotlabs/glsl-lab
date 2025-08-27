import type App from "@/app/app";

interface GUIParams {
  rotationSpeed: number;
  size: number;
  spacing: number;
}

export default class GUIView {
  private app: App;
  private params: GUIParams;
  private gui: HTMLDivElement;

  constructor(app: App) {
    this.app = app;
    this.params = {
      rotationSpeed: 0.01,
      size: 0.01,
      spacing: 0.01,
    };

    this.initGUI();
  }

  private initGUI(): void {
    this.gui = document.createElement("div");
    this.gui.style.position = "fixed";
    this.gui.style.top = "10px";
    this.gui.style.right = "10px";
    this.gui.style.background = "rgba(0,0,0,0.8)";
    this.gui.style.color = "white";
    this.gui.style.padding = "10px";
    this.gui.style.fontFamily = "Arial";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "0.1";
    slider.step = "0.001";
    slider.value = this.params.rotationSpeed.toString();

    slider.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.params.rotationSpeed = parseFloat(target.value);
    });

    const label = document.createElement("div");
    label.textContent = "Rotation Speed";

    this.gui.appendChild(label);
    this.gui.appendChild(slider);

    const slider2 = document.createElement("input");
    slider2.type = "range";
    slider2.min = "0";
    slider2.max = "2.0";
    slider2.step = "0.001";
    slider2.value = this.params.rotationSpeed.toString();

    slider2.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.params.size = parseFloat(target.value);
      this.app.threeEngine.shaderMaterial.uniforms.uSize.value = target.value;
    });

    const label2 = document.createElement("div");
    label2.textContent = "size";

    this.gui.appendChild(label2);
    this.gui.appendChild(slider2);

    const slider3 = document.createElement("input");
    slider3.type = "range";
    slider3.min = "-1";
    slider3.max = "2.0";
    slider3.step = "0.001";
    slider3.value = this.params.rotationSpeed.toString();

    slider3.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.params.spacing = parseFloat(target.value);
      this.app.threeEngine.shaderMaterial.uniforms.uSpacing.value =
        target.value;
    });

    const label3 = document.createElement("div");
    label3.textContent = "spacing";

    this.gui.appendChild(label3);
    this.gui.appendChild(slider3);

    document.body.appendChild(this.gui);
  }
}
