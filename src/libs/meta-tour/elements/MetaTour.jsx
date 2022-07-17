import utils from "@/utils";
import React, { PureComponent } from "react";
import pannellum from "../libraries/pannellum";

let myPanorama;

class MetaTour extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      percent: 0,
      loading: true,
      container: "meta-tour-container",
    };
    this.onPreviousCoordinates = this.onPreviousCoordinates.bind(this);
    this.goto = this.goto.bind(this);
  }

  static defaultProps = {
    yaw: 0,
    hfov: 0,
    pitch: 0,
    draggable: false,
    fadeDuration: 1500,
    fullscreenCtrl: false,
  };

  componentDidMount() {
    this.renderPanorama("mount");
    myPanorama.on("load", () => this.onLoad());
    myPanorama.on("vrmove", () => this.onEventMove());
    myPanorama.on("mousemove", () => this.onEventMove());
    myPanorama.on("touchmove", () => this.onEventMove());
    myPanorama.on("mousewheel", () => this.onEventWheel());
    myPanorama.on("touchstart", () => this.onEventDown());
    myPanorama.on("mousedown", () => this.onEventDown());
    myPanorama.on("onprogress", (percent, timeLoaded) => {
      if (this.props.onProgress) {
        this.props.onProgress(percent, timeLoaded);
      }
    });
    myPanorama.on("loadscene", () => this.setState({ loading: true }));
  }

  componentDidUpdate(pp) {
    const { draggable, children, pitch, yaw, hfov } = this.props;
    if (pp.draggable !== draggable || pp.children.length !== children.length) {
      this.forceRender();
    }
    pitch && myPanorama.setPitch(pitch);
    hfov && myPanorama.setHfov(hfov);
    yaw && myPanorama.setYaw(yaw);
  }

  componentWillUnmount() {
    myPanorama.destroy();
  }

  mappingScene() {
    const { children } = this.props;
    let scenes = Array.isArray(children) ? [...children] : [children];
    let sceneArray = [];
    if (Array.isArray(scenes)) {
      scenes.forEach(({ props }) => {
        const __deep = { ...props };
        __deep.type = "equirectangular";
        sceneArray.push(__deep);
      });
    }
    return sceneArray.reduce((_previous, _current) => {
      const hotspots = _current.hotSpots.map((hotspot) => {
        const __custom = {
          text: hotspot.tooltip,
        };
        const __deep = { ...hotspot, ...__custom };
        if (this.props.draggable) {
          __deep.dragHandlerFunc = this.onDragHandlerFunc;
        }

        switch (__deep.type) {
          case "visit":
            return {
              ...__deep,
              clickHandlerFunc: this.goto,
              clickHandlerArgs: [
                __deep.id_room,
                hotspot.pitch,
                hotspot.yaw,
                300,
              ],
            };
          case "link":
          case "click":
            delete __deep.id_room;
            return {
              ...__deep,
              clickHandlerFunc: this.onClickHotSpot,
              clickHandlerArgs: __deep.params && __deep.params,
            };
          default:
            return __deep;
        }
      });

      let _lockScreen = {};
      if (_current.lock) {
        _lockScreen = {
          maxPitch: _current.pitch,
          minPitch: _current.pitch,
          maxYaw: _current.yaw,
          minYaw: _current.yaw,
        };
      }

      return {
        ..._previous,
        [_current._id]: {
          ..._current,
          ..._lockScreen,
          hotSpots: hotspots,
          customCompass: _current.compass,
          cssMaker: "hotspot-custom-maker",
          hfov: _current.hfov ? _current.hfov : 120,
        },
      };
    }, {});
  }

  renderPanorama(state) {
    if (state === "update") {
      myPanorama.destroy();
    }
    const sceneObject = this.mappingScene();
    myPanorama = pannellum.viewer(this.state.container, {
      default: {
        customControls: true,
        type: "equirectangular",
        draggableHotSpot: this.props.draggable,
        sceneFadeDuration: this.props.fadeDuration,
        orientationOnByDefault: utils.isMobileOrIOS,
        showFullscreenCtrl: this.props.fullscreenCtrl,
        firstScene: this.props.firstScene || Object.keys(sceneObject)[0],
      },
      scenes: sceneObject,
    });
  }

  forceRender = () => {
    this.renderPanorama("update");
  };

  onLoad() {
    const sceneObj = myPanorama.getSceneObj(myPanorama.getScene());
    this.setState({
      scene: sceneObj,
      loading: false,
    });
    this.onCoordinates({
      pitch: myPanorama.getPitch(),
      hfov: myPanorama.getHfov(),
      yaw: myPanorama.getYaw(),
    });
    if (this.props.loadDone) {
      const id_room = myPanorama.getScene();
      this.props.loadDone(id_room);
    }
  }

  onEventWheel() {
    const hfov = myPanorama.getHfov();
    this.onCoordinates({ hfov });
  }

  onEventMove() {
    const pitch = myPanorama.getPitch();
    const yaw = myPanorama.getYaw();
    this.onCoordinates({ pitch, yaw });
  }

  onEventDown() {
    if (this.props.onEventDown) {
      this.props.onEventDown({ orientation: false });
    }
  }

  onClickHotSpot = (hs, values) => {
    if (hs.type == "link") {
      window.open(hs.values, hs.targetURL || "_self");
    } else {
      if (this.props.onHotSpotClick) {
        this.props.onHotSpotClick(hs, values);
      }
    }
  };

  onDragHandlerFunc = (hs) => {
    this.onCoordinates({
      pitch: hs.pitch,
      hfov: myPanorama.getHfov(),
      yaw: hs.yaw,
    });
    if (this.props.onHotSpotDrag) {
      this.props.onHotSpotDrag(hs);
    }
  };

  onPreviousCoordinates() {
    const pitch = this.state.scene.pitch || 0;
    const hfov = this.state.scene.hfov || 120;
    const yaw = this.state.scene.yaw || 0;
    myPanorama.lookAt(pitch, yaw, hfov);
  }

  onCoordinates({ pitch, yaw, hfov }) {
    const { onPitch, onYaw, onHfov } = this.props;
    if (onPitch && pitch) onPitch(pitch);
    if (onHfov && hfov) onHfov(hfov);
    if (onYaw && yaw) onYaw(yaw);
  }

  goto(_, [id_room, targetPitch, targetYaw, animated = 1000]) {
    const targetHfov = myPanorama.getHfov();
    myPanorama.lookAt(targetPitch, targetYaw, targetHfov - 30, animated, () => {
      myPanorama.loadScene(id_room);
    });
  }

  static loadScene(id_room, targetPitch, targetYaw, targetHfov) {
    if (id_room != myPanorama.getScene()) {
      myPanorama.loadScene(id_room, targetPitch, targetYaw, targetHfov);
    }
  }

  static toggleFullscreen() {
    myPanorama.toggleFullscreen();
  }

  static startOrientation() {
    myPanorama.startOrientation();
  }

  static stopOrientation() {
    myPanorama.stopOrientation();
  }

  static isOrientationActive() {
    return myPanorama.isOrientationActive();
  }

  static isOrientationSupported() {
    return myPanorama.isOrientationSupported();
  }

  static zoomIn() {
    myPanorama.zoomIn();
  }

  static zoomOut() {
    myPanorama.zoomOut();
  }

  render() {
    const { loading, container } = this.state;
    const loadingStyle = {
      opacity: loading ? 1 : 0,
      display: loading ? "block" : "none",
    };

    return (
      <div className="mt-wrapper">
        <div className="mt-loading" style={loadingStyle} />
        <div id={container} className="mt-container" />
      </div>
    );
  }
}

class Compass extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      scene: {},
    };
    this.onPreviousCoordinates = this.onPreviousCoordinates.bind(this);
  }

  componentDidMount() {
    this.setRoom(this.props.room);
  }

  componentDidUpdate(pp) {
    if (pp.room !== this.props.room) {
      this.setRoom(this.props.room);
    }
  }

  setRoom(id_room) {
    if (id_room) {
      const scene = myPanorama.getSceneObj(id_room);
      this.setState({ scene: scene });
    }
  }

  onPreviousCoordinates() {
    const { scene } = this.state;
    const pitch = scene.pitch || 0;
    const hfov = scene.hfov || 120;
    const yaw = scene.yaw || 0;
    myPanorama.stopOrientation();
    myPanorama.lookAt(pitch, yaw, hfov);
    this.props.onClick && this.props.onClick();
  }

  render() {
    const { scene } = this.state;
    return scene && scene.compass ? (
      <div
        onClick={this.onPreviousCoordinates}
        className="mt-compass"
        id="compass_icon"
      >
        <i className="icon-compass"></i>
      </div>
    ) : null;
  }
}

MetaTour.Compass = Compass;
MetaTour.Scene = () => {};

export default MetaTour;
