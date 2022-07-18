import pannellum from "./pannellum";

interface OnDownPropsType {
  orientation: boolean;
}

export interface ProgressType {
  percent: number;
  timeload: number;
}

export interface MetaTourPropsType {
  yaw?: number;
  hfov?: number;
  pitch?: number;
  draggable?: boolean;
  fadeDuration?: number;
  children?: React.ReactNode;
  onYaw?: (yaw: number) => void;
  onHfov?: (hfov: number) => void;
  onPitch?: (pitch: number) => void;
  onError?: (message: string) => void;
  loadDone?: (id_room: string) => void;
  onEventDown?: (params: OnDownPropsType) => void;
  onProgress?: (values: ProgressType) => void;
  onHotSpotDrag?: (hs: MetaTourHotSpotPropsType) => void;
  onHotSpotClick?: (hs: MetaTourHotSpotPropsType, values: any) => void;
}

export interface MetaTourScenePropsType {
  _id: string;
  image: string;
  yaw?: number;
  pitch?: number;
  hfov?: number;
  maxHfov?: number;
  minHfov?: number;
  maxPitch?: number;
  minPitch?: number;
  maxYaw?: number;
  minYaw?: number;
  compass?: boolean;
  lock?: boolean;
  hotSpots?: MetaTourHotSpotPropsType[];
}

export interface MetaTourSceneTransformPropsType {
  scale?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
}

export interface MetaTourHotSpotPropsType {
  _id: string;
  yaw?: number;
  values?: any;
  icon?: string;
  pitch?: number;
  tooltip?: string;
  id_room?: string;
  animation?: "pulse" | "bounce";
  type: "link" | "visit" | "click";
  transform?: MetaTourSceneTransformPropsType;
  targetURL?: "_blank" | "_self" | "_parent" | "_top";
}

export interface CompassPropsType {
  room: string;
  onClick?: Function;
}

export interface MetaMapPropsType {
  style?: any;
}

export type ViewerPropsType = ReturnType<typeof pannellum.viewer>;

function Scene(props: MetaTourScenePropsType): JSX.Element;

function Compass(props: CompassPropsType): JSX.Element;

function loadScene(
  id_room: string,
  targetPitch?: string,
  targetYaw?: string,
  targetHfov?: string
): void;

function zoomIn(): void;
function zoomOut(): void;
function startOrientation(): void;
function stopOrientation(): void;
function toggleFullscreen(): boolean;
function isOrientationActive(): boolean;
function isOrientationSupported(): boolean;
function MetaMap(props: MetaMapPropsType): JSX.Element;
function MetaTour(props: MetaTourPropsType): JSX.Element;

namespace MetaTour {
  export { Scene, Compass, MetaMap };
}

export {
  Scene,
  Compass,
  zoomIn,
  zoomOut,
  MetaMap,
  loadScene,
  toggleFullscreen,
  startOrientation,
  stopOrientation,
  isOrientationActive,
  isOrientationSupported,
};
export default MetaTour;
