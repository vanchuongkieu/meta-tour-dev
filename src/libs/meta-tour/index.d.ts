import pannellum from "./libraries/pannellum";

interface OnLoadPropsType {
  id_room: string;
}
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
  onLoad?: (params: OnLoadPropsType) => void;
  onHotSpotClick?: Function;
  onHotSpotDrag?: Function;
  isLoading?: (loaded: boolean) => void;
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
  compass?: boolean;
  lock?: boolean;
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
  pitch?: number;
  yaw?: number;
  tooltip?: string;
  id_room?: string;
  transform?: MetaTourSceneTransformPropsType;
  type: "link" | "visit" | "click";
  animation?: "pulse" | "bounce";
}

export type ViewerPropsType = ReturnType<typeof pannellum.viewer>;

export function MetaTour(props: MetaTourPropsType): JSX.Element;

export namespace MetaTour {
  export function Scene(props: MetaTourScenePropsType): JSX.Element;
  export function loadScene(
    id_room: string,
    targetPitch?: string,
    targetYaw?: string,
    targetHfov?: string
  ): void;
}
