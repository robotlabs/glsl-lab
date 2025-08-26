import type { Assets } from "@/types/types";

function isImageAsset(a: unknown): a is HTMLImageElement {
  return a instanceof HTMLImageElement;
}

export default class App {
  constructor() {}

  init(container: HTMLElement, assets: Assets = {}) {
    const imageIds = ["test-image-local", "test-image-remote"];
    imageIds.forEach((id) => {
      const asset = assets[id];
      if (isImageAsset(asset)) {
        asset.style.maxWidth = "400px";
        asset.style.border = "2px solid #ccc";
        asset.style.margin = "20px";
        document.body.appendChild(asset);
      }
    });

    const remoteImage = assets["test-image-remote"];
    if (isImageAsset(remoteImage)) {
      console.log("Remote image ready for Three.js:", remoteImage.src);
      // e.g.
      // const texture = new THREE.Texture(remoteImage);
      // texture.needsUpdate = true;
    }

    // Access config
    const config = assets["config"];
    if (config && typeof config === "object") {
    }
  }
}
