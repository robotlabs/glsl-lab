import type App from "@/app/app";

interface LayerParams {
  tint: number;
  speed: number;
  opacity: number;
  freq: number;
  base: number;
  amp: number;
  heightOffset: number;
  segmentCount: number;
  segmentWidth: number;
  segmentWidthNoise: number;
  heightNoise: number;
  smoothness: number;
}

interface GUIParams {
  rotationSpeed: number;
  globalTimeScale: number;
  cameraSpeed: number;
  layerCount: number;
  mainSpeed: number; // ✅ ADD MAIN SPEED
  fluidSpeed: number;
}

export default class GUIView {
  private app: App;
  private params: GUIParams;
  private gui: HTMLDivElement;
  private layerControls: HTMLDivElement[] = [];
  private layerParams: LayerParams[] = [];
  private copiedLayerParams: LayerParams | null = null;
  private isCollapsed: boolean = false;
  private activeLayer: number = 0;

  constructor(app: App) {
    this.app = app;
    this.params = {
      rotationSpeed: 0.01,
      globalTimeScale: 1.0,
      cameraSpeed: 1.0,
      layerCount: 13,
      mainSpeed: 1.0, // ✅ INITIALIZE MAIN SPEED
      fluidSpeed: 1.0,
    };

    // Initialize layer parameters with defaults
    this.initializeLayerParams();
    this.initGUI();
    // Applica tutti i preset al ThreeEngine
    this.applyAllLayersToEngine();
  }

  private initializeLayerParams(): void {
    // I tuoi preset REALI dal ThreeEngine commentato
    const presetLayers = [
      {
        tint: 0x1c99ce,
        speed: 0.6,
        opacity: 1.0,
        freq: 0.5,
        base: 0.4,
        amp: 1.0,
        heightOffset: -0.1,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x00fffb,
        speed: 0.7,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.24,
        heightOffset: 0.02,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0xff0099, //0x001133,
        speed: 0.8,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.5,
        heightOffset: -0.05,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x000080,
        speed: 0.9,
        opacity: 1.0,
        freq: 1.0,
        base: 0.4,
        amp: 0.5,
        heightOffset: -0.0,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0xff0000, //0x000080,
        speed: 1.0,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.5,
        heightOffset: -0.15,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x40e0d0,
        speed: 1.1,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.5,
        heightOffset: -0.2,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x00ced1,
        speed: 1.2,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.5,
        heightOffset: -0.24,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x20b2aa,
        speed: 1.3,
        opacity: 1.0,
        freq: 1.2,
        base: 0.4,
        amp: 0.3,
        heightOffset: -0.12,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0xff0099,
        speed: 1.7,
        opacity: 1.0,
        freq: 1.2,
        base: 0.4,
        amp: 0.3,
        heightOffset: -0.35,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x00ffaa,
        speed: 1.9,
        opacity: 1.0,
        freq: 1.8,
        base: 0.8,
        amp: 0.3,
        heightOffset: -0.6,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x00ffaa,
        speed: 2.1,
        opacity: 1.0,
        freq: 1.8,
        base: 0.22,
        amp: 0.22,
        heightOffset: -0.05,
        segmentCount: 20.0,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.08,
        smoothness: 1.0,
      },
      {
        tint: 0x4fab8c,
        speed: 1.2,
        opacity: 0.9,
        freq: 0.6,
        base: 0.34,
        amp: 0.32,
        heightOffset: -0.26,
        heightNoise: 0.08,
        smoothness: 1.3,
      },
      {
        tint: 0x43f9d5,
        speed: 1.5,
        opacity: 0.9,
        freq: 0.3,
        base: 0.4,
        amp: 0.3,
        heightOffset: -0.45,
        heightNoise: 0.06,
        smoothness: 1.1,
      },
    ];

    // Usa i tuoi preset per i primi layers
    for (let i = 0; i < this.params.layerCount; i++) {
      if (i < presetLayers.length) {
        this.layerParams[i] = { ...presetLayers[i] };
      } else {
        // Default per layers aggiuntivi se ne hai più di 13
        this.layerParams[i] = {
          tint: 0x404e5c,
          speed: 1.0,
          opacity: 1.0,
          freq: 1.0,
          base: 0.5,
          amp: 0.5,
          heightOffset: 0.0,
          segmentCount: 20.0,
          segmentWidth: 0.3,
          segmentWidthNoise: 0.2,
          heightNoise: 0.08,
          smoothness: 1.0,
        };
      }
    }
  }

  private initGUI(): void {
    this.gui = document.createElement("div");
    this.gui.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 15px;
      font-family: 'Consolas', monospace;
      font-size: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      max-height: 80vh;
      overflow-y: auto;
      min-width: 280px;
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    `;

    this.createHeader();
    this.createGlobalControls();
    this.createLayerSelector();
    this.createLayerControls();
    this.createPresets();

    document.body.appendChild(this.gui);
  }

  private createHeader(): void {
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    `;

    const title = document.createElement("h3");
    title.textContent = "Parallax Control";
    title.style.cssText = `
      margin: 0;
      color: #00ff88;
      font-size: 16px;
    `;

    const collapseBtn = document.createElement("button");
    collapseBtn.textContent = "−";
    collapseBtn.style.cssText = `
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    collapseBtn.addEventListener("click", () => {
      this.toggleCollapse();
      collapseBtn.textContent = this.isCollapsed ? "+" : "−";
    });

    header.appendChild(title);
    header.appendChild(collapseBtn);
    this.gui.appendChild(header);
  }

  // Update the createGlobalControls method in your GUIView class
  // Update the createGlobalControls method in your GUIView class
  private createGlobalControls(): void {
    const globalDiv = document.createElement("div");
    globalDiv.className = "collapsible-content";
    globalDiv.style.marginBottom = "15px";

    const globalTitle = document.createElement("h4");
    globalTitle.textContent = "Global Controls";
    globalTitle.style.cssText = `
    margin: 0 0 10px 0;
    color: #ffaa00;
    font-size: 14px;
  `;
    globalDiv.appendChild(globalTitle);

    // Time Scale slider
    this.createSlider(
      globalDiv,
      "Time Scale",
      this.params.globalTimeScale,
      0,
      3,
      0.1,
      (value) => {
        this.params.globalTimeScale = value;
        if (this.app.threeEngine) {
          this.app.threeEngine.updateTimeScale(value);
        }
      }
    );

    // Main Speed slider
    this.createSlider(
      globalDiv,
      "Main Speed",
      this.params.mainSpeed,
      -2,
      5,
      0.1,
      (value) => {
        this.params.mainSpeed = value;
        if (this.app.threeEngine) {
          this.app.threeEngine.updateMainSpeed(value);
        }
      }
    );

    // Fluid Speed slider
    this.createSlider(
      globalDiv,
      "Fluid Speed",
      this.params.fluidSpeed,
      0,
      3,
      0.1,
      (value) => {
        this.params.fluidSpeed = value;
        if (this.app.threeEngine) {
          this.app.threeEngine.updateFluidSpeed(value);
        }
      }
    );

    // ✅ MANUAL RESET SECTION
    const resetTitle = document.createElement("h4");
    resetTitle.textContent = "Manual Reset";
    resetTitle.style.cssText = `
    margin: 15px 0 10px 0;
    color: #ff6600;
    font-size: 14px;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 10px;
  `;
    globalDiv.appendChild(resetTitle);

    // ✅ SINGLE FORCE RESET BUTTON
    const resetButtonContainer = document.createElement("div");
    resetButtonContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
  `;

    const forceResetBtn = document.createElement("button");
    forceResetBtn.textContent = "🔄 Force Reset Now";
    forceResetBtn.style.cssText = `
    background: linear-gradient(45deg, #ff6b6b, #ff5252);
    border: none;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(255,107,107,0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
  `;

    forceResetBtn.addEventListener("mouseenter", () => {
      forceResetBtn.style.transform = "scale(1.05) translateY(-2px)";
      forceResetBtn.style.boxShadow = "0 8px 25px rgba(255,107,107,0.6)";
      forceResetBtn.style.background =
        "linear-gradient(45deg, #ff5252, #ff4444)";
    });

    forceResetBtn.addEventListener("mouseleave", () => {
      forceResetBtn.style.transform = "scale(1) translateY(0)";
      forceResetBtn.style.boxShadow = "0 4px 15px rgba(255,107,107,0.4)";
      forceResetBtn.style.background =
        "linear-gradient(45deg, #ff6b6b, #ff5252)";
    });

    forceResetBtn.addEventListener("click", () => {
      if (this.app.threeEngine) {
        console.log("🎯 Manual COMPLETE reset triggered from GUI!");

        // ✅ CHIAMA IL RESET COMPLETO CHE AZZERA TUTTO
        this.app.threeEngine.forceCompleteReset();

        // Visual feedback
        forceResetBtn.textContent = "🔄 Resetting to ZERO...";
        forceResetBtn.style.background =
          "linear-gradient(45deg, #4CAF50, #45a049)";
        forceResetBtn.disabled = true;

        // Reset button after 5 seconds
        setTimeout(() => {
          forceResetBtn.textContent = "🔄 Force Reset Now";
          forceResetBtn.style.background =
            "linear-gradient(45deg, #ff6b6b, #ff5252)";
          forceResetBtn.disabled = false;
        }, 5000);
      }
    });

    // ✅ INFO TEXT
    const resetInfo = document.createElement("div");
    resetInfo.innerHTML = `
    <strong>Manual Reset:</strong><br/>
    • Clears accumulated fluid effects<br/>
    • Randomizes colors and parameters<br/>
    • Smooth fade transition<br/>
    • Only triggers when you click the button
  `;
    resetInfo.style.cssText = `
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    margin-top: 10px;
    padding: 10px;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
    border-left: 3px solid #ff6600;
    line-height: 1.4;
  `;

    resetButtonContainer.appendChild(forceResetBtn);
    resetButtonContainer.appendChild(resetInfo);
    globalDiv.appendChild(resetButtonContainer);

    this.gui.appendChild(globalDiv);
  }

  private createLayerSelector(): void {
    const selectorDiv = document.createElement("div");
    selectorDiv.className = "collapsible-content";
    selectorDiv.style.marginBottom = "15px";

    const selectorTitle = document.createElement("h4");
    selectorTitle.textContent = "Layer Selector";
    selectorTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: #ffaa00;
      font-size: 14px;
    `;
    selectorDiv.appendChild(selectorTitle);

    const layerGrid = document.createElement("div");
    layerGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin-bottom: 10px;
    `;

    for (let i = 0; i < this.params.layerCount; i++) {
      const layerBtn = document.createElement("button");
      layerBtn.textContent = i.toString();
      layerBtn.style.cssText = `
        background: ${
          i === this.activeLayer ? "#00ff88" : "rgba(255,255,255,0.1)"
        };
        color: ${i === this.activeLayer ? "black" : "white"};
        border: 1px solid rgba(255,255,255,0.2);
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 11px;
        transition: all 0.2s;
      `;

      layerBtn.addEventListener("click", () => {
        this.setActiveLayer(i);
        this.updateLayerButtons();
      });

      layerGrid.appendChild(layerBtn);
    }

    selectorDiv.appendChild(layerGrid);
    this.gui.appendChild(selectorDiv);
  }

  private createLayerControls(): void {
    const layerDiv = document.createElement("div");
    layerDiv.className = "collapsible-content";
    layerDiv.style.marginBottom = "15px";

    const layerTitle = document.createElement("h4");
    layerTitle.textContent = `Layer ${this.activeLayer} Controls`;
    layerTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: #00aaff;
      font-size: 14px;
    `;
    layerTitle.id = "layer-title";
    layerDiv.appendChild(layerTitle);

    const controlsContainer = document.createElement("div");
    controlsContainer.id = "layer-controls";

    this.updateLayerControlsContent(controlsContainer);
    layerDiv.appendChild(controlsContainer);
    this.gui.appendChild(layerDiv);
  }

  private updateLayerControlsContent(container: HTMLDivElement): void {
    container.innerHTML = "";
    const params = this.layerParams[this.activeLayer];

    // Color picker for tint
    this.createColorPicker(container, "Tint", params.tint, (value) => {
      this.layerParams[this.activeLayer].tint = value;
      this.applyLayerParams(this.activeLayer);
    });

    // Speed
    this.createSlider(container, "Speed", params.speed, 0, 5, 0.1, (value) => {
      this.layerParams[this.activeLayer].speed = value;
      this.applyLayerParams(this.activeLayer);
    });

    // Opacity
    this.createSlider(
      container,
      "Opacity",
      params.opacity,
      0,
      1,
      0.01,
      (value) => {
        this.layerParams[this.activeLayer].opacity = value;
        this.applyLayerParams(this.activeLayer);
      }
    );

    // Frequency
    this.createSlider(
      container,
      "Frequency",
      params.freq,
      0.1,
      5,
      0.1,
      (value) => {
        this.layerParams[this.activeLayer].freq = value;
        this.applyLayerParams(this.activeLayer);
      }
    );

    // Base
    this.createSlider(
      container,
      "Base Height",
      params.base,
      0,
      2,
      0.01,
      (value) => {
        this.layerParams[this.activeLayer].base = value;
        this.applyLayerParams(this.activeLayer);
      }
    );

    // Amplitude
    this.createSlider(
      container,
      "Amplitude",
      params.amp,
      0,
      2,
      0.01,
      (value) => {
        this.layerParams[this.activeLayer].amp = value;
        this.applyLayerParams(this.activeLayer);
      }
    );

    // Height Offset
    this.createSlider(
      container,
      "Height Offset",
      params.heightOffset,
      -2,
      2,
      0.01,
      (value) => {
        this.layerParams[this.activeLayer].heightOffset = value;
        this.applyLayerParams(this.activeLayer);
      }
    );

    // Segment Count
    // this.createSlider(
    //   container,
    //   "Segment Count",
    //   params.segmentCount,
    //   1,
    //   100,
    //   1,
    //   (value) => {
    //     this.layerParams[this.activeLayer].segmentCount = value;
    //     this.applyLayerParams(this.activeLayer);
    //   }
    // );

    // // Segment Width
    // this.createSlider(
    //   container,
    //   "Segment Width",
    //   params.segmentWidth,
    //   0.1,
    //   1,
    //   0.01,
    //   (value) => {
    //     this.layerParams[this.activeLayer].segmentWidth = value;
    //     this.applyLayerParams(this.activeLayer);
    //   }
    // );

    // // Segment Width Noise
    // this.createSlider(
    //   container,
    //   "Width Noise",
    //   params.segmentWidthNoise,
    //   0,
    //   1,
    //   0.01,
    //   (value) => {
    //     this.layerParams[this.activeLayer].segmentWidthNoise = value;
    //     this.applyLayerParams(this.activeLayer);
    //   }
    // );

    // Height Noise
    this.createSlider(
      container,
      "Height Noise",
      params.heightNoise,
      0,
      2,
      0.01,
      (value) => {
        this.layerParams[this.activeLayer].heightNoise = value;
        this.applyLayerParams(this.activeLayer);
      }
    );

    // Smoothness
    this.createSlider(
      container,
      "Smoothness",
      params.smoothness,
      -5,
      10,
      0.01,
      (value) => {
        this.layerParams[this.activeLayer].smoothness = value;
        this.applyLayerParams(this.activeLayer);
      }
    );
  }

  private createSlider(
    parent: HTMLElement,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    callback: (value: number) => void
  ): void {
    const container = document.createElement("div");
    container.style.cssText = `
      margin-bottom: 12px;
      padding: 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
    `;

    const labelDiv = document.createElement("div");
    labelDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
    `;

    const labelText = document.createElement("span");
    labelText.textContent = label;

    const valueText = document.createElement("span");
    valueText.textContent = value.toFixed(3);
    valueText.style.color = "#00ff88";

    labelDiv.appendChild(labelText);
    labelDiv.appendChild(valueText);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = value.toString();
    slider.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.2);
      outline: none;
      border-radius: 2px;
    `;

    slider.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      const val = parseFloat(target.value);
      valueText.textContent = val.toFixed(3);
      callback(val);
    });

    container.appendChild(labelDiv);
    container.appendChild(slider);
    parent.appendChild(container);
  }

  private createColorPicker(
    parent: HTMLElement,
    label: string,
    value: number,
    callback: (value: number) => void
  ): void {
    const container = document.createElement("div");
    container.style.cssText = `
      margin-bottom: 12px;
      padding: 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
    `;

    const labelDiv = document.createElement("div");
    labelDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      font-size: 11px;
    `;

    const labelText = document.createElement("span");
    labelText.textContent = label;

    const hexValue = document.createElement("span");
    hexValue.textContent = `#${value
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()}`;
    hexValue.style.color = "#00ff88";

    labelDiv.appendChild(labelText);
    labelDiv.appendChild(hexValue);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = `#${value.toString(16).padStart(6, "0")}`;
    colorInput.style.cssText = `
      width: 100%;
      height: 30px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    colorInput.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      const hexColor = target.value.replace("#", "");
      const intValue = parseInt(hexColor, 16);
      hexValue.textContent = `#${hexColor.toUpperCase()}`;
      callback(intValue);
    });

    container.appendChild(labelDiv);
    container.appendChild(colorInput);
    parent.appendChild(container);
  }

  private createPresets(): void {
    const presetsDiv = document.createElement("div");
    presetsDiv.className = "collapsible-content";

    const presetsTitle = document.createElement("h4");
    presetsTitle.textContent = "Presets";
    presetsTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: #ff6600;
      font-size: 14px;
    `;
    presetsDiv.appendChild(presetsTitle);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;
    `;

    const presets = [
      { name: "Reset", action: () => this.resetLayer() },
      { name: "Save", action: () => this.savePreset() },
      { name: "Load", action: () => this.loadPreset() },
      { name: "Copy", action: () => this.copyLayer() },
      { name: "Paste", action: () => this.pasteLayer() },
    ];

    presets.forEach((preset) => {
      const btn = document.createElement("button");
      btn.textContent = preset.name;
      btn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
      `;
      btn.addEventListener("click", preset.action);
      buttonContainer.appendChild(btn);
    });

    presetsDiv.appendChild(buttonContainer);
    this.gui.appendChild(presetsDiv);
  }

  private setActiveLayer(layerIndex: number): void {
    this.activeLayer = layerIndex;
    const title = document.getElementById("layer-title");
    if (title) {
      title.textContent = `Layer ${layerIndex} Controls`;
    }

    const controls = document.getElementById("layer-controls");
    if (controls) {
      this.updateLayerControlsContent(controls as HTMLDivElement);
    }
  }

  private updateLayerButtons(): void {
    const buttons = this.gui.querySelectorAll("button");
    buttons.forEach((btn, index) => {
      if (btn.textContent && !isNaN(parseInt(btn.textContent))) {
        const layerIndex = parseInt(btn.textContent);
        if (layerIndex === this.activeLayer) {
          btn.style.background = "#00ff88";
          btn.style.color = "black";
        } else {
          btn.style.background = "rgba(255,255,255,0.1)";
          btn.style.color = "white";
        }
      }
    });
  }

  private applyLayerParams(layerIndex: number): void {
    if (this.app.threeEngine?.bg) {
      const params = this.layerParams[layerIndex];
      this.app.threeEngine.bg.setLayer(layerIndex, params);
    }
  }

  private applyAllLayersToEngine(): void {
    if (this.app.threeEngine?.bg) {
      console.log("🎯 Applying all layer presets to ThreeEngine...");
      for (let i = 0; i < this.layerParams.length; i++) {
        this.app.threeEngine.bg.setLayer(i, this.layerParams[i]);
        console.log(`✅ Layer ${i} applied:`, this.layerParams[i]);
      }
    } else {
      console.warn("⚠️ ThreeEngine or background not ready yet");
      // Retry dopo un frame
      setTimeout(() => this.applyAllLayersToEngine(), 16);
    }
  }

  private loadLayerParams(): void {
    // Questa funzione ora non serve più
    // La GUI è la source of truth
  }

  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    const collapsibleElements = this.gui.querySelectorAll(
      ".collapsible-content"
    );
    collapsibleElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.display = this.isCollapsed ? "none" : "block";
    });
  }

  private resetLayer(): void {
    const defaultParams: LayerParams = {
      tint: 0x404e5c,
      speed: 1.0,
      opacity: 1.0,
      freq: 1.0,
      base: 0.5,
      amp: 0.5,
      heightOffset: 0.0,
      segmentCount: 20.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    };

    this.layerParams[this.activeLayer] = { ...defaultParams };
    this.applyLayerParams(this.activeLayer);

    const controls = document.getElementById("layer-controls");
    if (controls) {
      this.updateLayerControlsContent(controls as HTMLDivElement);
    }
  }

  private randomizeLayer(): void {
    const params = this.layerParams[this.activeLayer];

    params.tint = Math.floor(Math.random() * 0xffffff);
    params.speed = Math.random() * 3;
    params.opacity = 0.5 + Math.random() * 0.5;
    params.freq = 0.5 + Math.random() * 2;
    params.base = Math.random() * 1.5;
    params.amp = Math.random() * 1;
    params.heightOffset = -1 + Math.random() * 2;
    params.segmentCount = 5 + Math.random() * 50;
    params.segmentWidth = 0.1 + Math.random() * 0.8;
    params.segmentWidthNoise = Math.random() * 0.5;
    params.heightNoise = 0.3 + Math.random() * 1;
    params.smoothness = Math.random() * 0.8;

    this.applyLayerParams(this.activeLayer);

    const controls = document.getElementById("layer-controls");
    if (controls) {
      this.updateLayerControlsContent(controls as HTMLDivElement);
    }
  }

  private savePreset(): void {
    const data = {
      globalParams: this.params,
      layerParams: this.layerParams,
    };
    localStorage.setItem("parallax-preset", JSON.stringify(data));
    console.log("Preset saved!");
  }

  private loadPreset(): void {
    const saved = localStorage.getItem("parallax-preset");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.params = { ...this.params, ...data.globalParams };
        this.layerParams = data.layerParams || this.layerParams;

        // Apply all layer parameters
        for (let i = 0; i < this.layerParams.length; i++) {
          this.applyLayerParams(i);
        }

        // Refresh UI
        const controls = document.getElementById("layer-controls");
        if (controls) {
          this.updateLayerControlsContent(controls as HTMLDivElement);
        }

        console.log("Preset loaded!");
      } catch (e) {
        console.error("Failed to load preset:", e);
      }
    }
  }

  // Public method to update rotation speed (for compatibility with existing code)
  public getRotationSpeed(): number {
    return this.params.rotationSpeed;
  }

  public getGlobalTimeScale(): number {
    return this.params.globalTimeScale;
  }

  // Metodo pubblico per forzare l'applicazione di tutti i layer
  public forceApplyAllLayers(): void {
    this.applyAllLayersToEngine();
  }

  // Metodo pubblico per ottenere i parametri di un layer
  public getLayerParams(layerIndex: number): LayerParams | null {
    return this.layerParams[layerIndex] || null;
  }
}
