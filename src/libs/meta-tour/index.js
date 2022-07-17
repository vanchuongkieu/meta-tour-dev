import MetaTour from "./elements/MetaTour";

const Scene = MetaTour.Scene;
const zoomIn = MetaTour.zoomIn;
const zoomOut = MetaTour.zoomOut;
const Compass = MetaTour.Compass;
const loadScene = MetaTour.loadScene;
const toggleFullscreen = MetaTour.toggleFullscreen;
const startOrientation = MetaTour.startOrientation;
const stopOrientation = MetaTour.stopOrientation;

export {
  loadScene,
  zoomIn,
  zoomOut,
  Compass,
  Scene,
  toggleFullscreen,
  startOrientation,
  stopOrientation,
};
export default MetaTour;
