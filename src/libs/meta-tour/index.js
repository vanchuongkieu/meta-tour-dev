import MetaTour from "./elements/MetaTour";
import MetaMap from "./elements/MetaMap";

const load = MetaTour.load;
const Scene = MetaTour.Scene;
const zoomIn = MetaTour.zoomIn;
const zoomOut = MetaTour.zoomOut;
const Compass = MetaTour.Compass;
const loadScene = MetaTour.loadScene;
const toggleFullscreen = MetaTour.toggleFullscreen;
const startOrientation = MetaTour.startOrientation;
const stopOrientation = MetaTour.stopOrientation;
const isOrientationActive = MetaTour.isOrientationActive;
const isOrientationSupported = MetaTour.isOrientationSupported;

export {
  load,
  loadScene,
  zoomIn,
  zoomOut,
  Compass,
  MetaMap,
  Scene,
  toggleFullscreen,
  startOrientation,
  stopOrientation,
  isOrientationActive,
  isOrientationSupported,
};
export default MetaTour;
