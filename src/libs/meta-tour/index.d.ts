import pannellum from "./libraries/pannellum";

export interface MetaTourPropsType {
  hfov?: number;
  pitch?: number;
  yaw?: number;
  onPitch?: Function;
  onHfov?: Function;
  onYaw?: Function;
  children?: React.ReactNode;
  draggable?: boolean;
  fadeDuration?: number;
  onLoad?: Function;
  onHotSpotClick?: Function;
  onHotSpotDrag?: Function;
}

export interface MetaTourScenePropsType {
  _id: string;
  image: string;
  hotSpots?: Array;
  yaw?: number;
  pitch?: number;
  hfov?: number;
  maxHfov?: number;
  minHfov?: number;
  maxPitch?: number;
  minPitch?: number;
  maxYaw?: number;
  minYaw?: number;
}

export type ViewerPropsType = ReturnType<typeof pannellum.viewer>;

export function MetaTour(props: MetaTourPropsType): JSX.Element;

export function loadScene(
  sceneId: string,
  targetPitch?: number,
  targetYaw?: number,
  targetHfov?: number,
  fadeDone?: boolean
): void;

export namespace MetaTour {
  export function Scene(props: MetaTourScenePropsType): JSX.Element;
}
