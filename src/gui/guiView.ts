import type App from "@/app/app";

interface GUIParams {
  // Ribbon parameters
  size: number;
  spacing: number;
  colorSet: number;

  // Transform parameters
  scale: number;
  rotation: number;
  translationX: number;
  translationY: number;
}

export default class GUIView {
  private app: App;
  private params: GUIParams;
  private gui: HTMLDivElement;

  constructor(app: App) {
    this.app = app;
    this.params = {
      size: 0.3,
      spacing: 0.3,
      colorSet: 2.0,
      scale: 1.0,
      rotation: 0.0,
      translationX: 0.0,
      translationY: 0.0,
    };

    this.initGUI();
  }

  private initGUI(): void {
    this.gui = document.createElement("div");
    this.gui.style.position = "fixed";
    this.gui.style.top = "10px";
    this.gui.style.right = "10px";
    this.gui.style.background = "rgba(0,0,0,0.9)";
    this.gui.style.color = "white";
    this.gui.style.padding = "15px";
    this.gui.style.fontFamily = "Arial, sans-serif";
    this.gui.style.fontSize = "12px";
    this.gui.style.borderRadius = "8px";
    this.gui.style.minWidth = "200px";
    this.gui.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

    // Ribbon Parameters Section
    this.addSection("Ribbon Parameters");
    this.addSlider("Size", "size", 0, 2.0, 0.001, this.params.size, (value) => {
      this.params.size = value;
      this.app.threeEngine.ribbons?.setSize(value);
    });

    this.addSlider(
      "Spacing",
      "spacing",
      -1,
      2.0,
      0.001,
      this.params.spacing,
      (value) => {
        this.params.spacing = value;
        this.app.threeEngine.ribbons?.setSpacing(value);
      }
    );

    this.addSlider(
      "Color Set",
      "colorSet",
      1,
      4,
      1,
      this.params.colorSet,
      (value) => {
        this.params.colorSet = value;
        this.app.threeEngine.ribbons?.setColorSet(value);
      }
    );

    // Transform Parameters Section
    this.addSection("Transform");
    this.addSlider(
      "Scale",
      "scale",
      0.1,
      3.0,
      0.01,
      this.params.scale,
      (value) => {
        this.params.scale = value;
        this.app.threeEngine.ribbons?.setScale(value);
      }
    );

    this.addSlider(
      "Rotation",
      "rotation",
      0,
      360,
      1,
      this.params.rotation,
      (value) => {
        this.params.rotation = value;
        this.app.threeEngine.ribbons?.setRotationDegrees(value);
      }
    );

    this.addSlider(
      "Translation X",
      "translationX",
      -1.0,
      1.0,
      0.01,
      this.params.translationX,
      (value) => {
        this.params.translationX = value;
        this.app.threeEngine.ribbons?.setTranslation(
          value,
          this.params.translationY
        );
      }
    );

    this.addSlider(
      "Translation Y",
      "translationY",
      -1.0,
      1.0,
      0.01,
      this.params.translationY,
      (value) => {
        this.params.translationY = value;
        this.app.threeEngine.ribbons?.setTranslation(
          this.params.translationX,
          value
        );
      }
    );

    // Reset button
    this.addButton("Reset Transform", () => {
      this.params.scale = 1.0;
      this.params.rotation = 0.0;
      this.params.translationX = 0.0;
      this.params.translationY = 0.0;

      // Update sliders
      this.updateSliderValue("scale", 1.0);
      this.updateSliderValue("rotation", 0.0);
      this.updateSliderValue("translationX", 0.0);
      this.updateSliderValue("translationY", 0.0);

      this.app.threeEngine.ribbons?.reset();
    });

    document.body.appendChild(this.gui);
  }

  private addSection(title: string): void {
    const section = document.createElement("div");
    section.style.marginTop = "15px";
    section.style.marginBottom = "10px";
    section.style.fontSize = "14px";
    section.style.fontWeight = "bold";
    section.style.color = "#ffffff";
    section.style.borderBottom = "1px solid #444";
    section.style.paddingBottom = "5px";
    section.textContent = title;
    this.gui.appendChild(section);
  }

  private addSlider(
    label: string,
    id: string,
    min: number,
    max: number,
    step: number,
    initialValue: number,
    onChange: (value: number) => void
  ): void {
    const container = document.createElement("div");
    container.style.marginBottom = "8px";

    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.style.marginBottom = "3px";
    labelEl.style.fontSize = "11px";
    container.appendChild(labelEl);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = initialValue.toString();
    slider.id = id;
    slider.style.width = "100%";
    slider.style.marginBottom = "5px";

    const valueDisplay = document.createElement("span");
    valueDisplay.style.fontSize = "10px";
    valueDisplay.style.color = "#ccc";
    valueDisplay.textContent = initialValue.toFixed(3);

    slider.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      valueDisplay.textContent = value.toFixed(3);
      onChange(value);
    });

    container.appendChild(slider);
    container.appendChild(valueDisplay);
    this.gui.appendChild(container);
  }

  private addCheckbox(
    label: string,
    id: string,
    initialValue: boolean,
    onChange: (checked: boolean) => void
  ): void {
    const container = document.createElement("div");
    container.style.marginBottom = "8px";
    container.style.display = "flex";
    container.style.alignItems = "center";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.checked = initialValue;
    checkbox.style.marginRight = "8px";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.style.fontSize = "11px";
    labelEl.style.cursor = "pointer";
    labelEl.htmlFor = id;

    checkbox.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      onChange(target.checked);
    });

    container.appendChild(checkbox);
    container.appendChild(labelEl);
    this.gui.appendChild(container);
  }

  private addButton(label: string, onClick: () => void): void {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.width = "100%";
    button.style.padding = "8px";
    button.style.marginTop = "10px";
    button.style.backgroundColor = "#333";
    button.style.color = "white";
    button.style.border = "1px solid #555";
    button.style.borderRadius = "4px";
    button.style.cursor = "pointer";
    button.style.fontSize = "11px";

    button.addEventListener("click", onClick);
    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "#444";
    });
    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "#333";
    });

    this.gui.appendChild(button);
  }

  private updateSliderValue(id: string, value: number): void {
    const slider = document.getElementById(id) as HTMLInputElement;
    if (slider) {
      slider.value = value.toString();
      const valueDisplay = slider.nextElementSibling as HTMLSpanElement;
      if (valueDisplay) {
        valueDisplay.textContent = value.toFixed(3);
      }
    }
  }

  private updateCheckboxValue(id: string, checked: boolean): void {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = checked;
    }
  }

  private startUpdateLoop(): void {
    const update = () => {
      if (this.params.animateRotation) {
        this.app.threeEngine.ribbons?.animateRotation(
          this.params.rotationSpeed
        );
      }

      if (this.params.animateScale) {
        this.app.threeEngine.ribbons?.animateScale(0.3, 2.0, 1.0);
      }

      if (this.params.animateTranslation) {
        this.app.threeEngine.ribbons?.animateTranslation(0.1, 0.1, 1.5);
      }

      this.animationId = requestAnimationFrame(update);
    };

    update();
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.gui && this.gui.parentNode) {
      this.gui.parentNode.removeChild(this.gui);
    }
  }
}
