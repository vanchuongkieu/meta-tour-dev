import React from "react";
import utils from "@/utils";
import pannellum from "../libraries/pannellum";
import Loading from "./Loading";

let myPanorama;

class MetaTour extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      container: "meta-tour-container",
    };
    this.compassHandleClick = this.compassHandleClick.bind(this);
  }

  static defaultProps = {
    draggable: false,
    fadeDuration: 1000,
  };

  renderPanorama(state) {
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
    const sceneObject = sceneArray.reduce((_previous, _current) => {
      const hotspots = _current.hotSpots.map((hotspot) => {
        const __custom = {
          text: hotspot.tooltip,
        };
        const __deep = { ...hotspot, ...__custom };
        if (this.props.draggable) {
          __deep.dragHandlerFunc = this.handleDragHandlerFunc;
          __deep.dragHandlerArgs = __deep.dragArgs && __deep.dragArgs;
        }

        let gotoArgs = [];
        if (_current.lock) {
          gotoArgs = [__deep.id_room, _current.pitch, _current.yaw, 500];
        } else {
          gotoArgs = [__deep.id_room, hotspot.pitch + 10, hotspot.yaw, 500];
        }

        switch (__deep.type) {
          case "visit":
            return {
              ...__deep,
              clickHandlerFunc: this.goto,
              clickHandlerArgs: gotoArgs,
            };
          case "link":
          case "click":
            delete __deep.id_room;
            return {
              ...__deep,
              clickHandlerFunc: this.handleClickHotspot,
              clickHandlerArgs: __deep.clickArgs && __deep.clickArgs,
            };
          default:
            return __deep;
        }
      });

      const _lockScreen = {};
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

    if (state === "update") {
      this.panorama.destroy();
    }

    this.panorama = pannellum.viewer(this.state.container, {
      default: {
        customControls: true,
        type: "equirectangular",
        draggableHotSpot: this.props.draggable,
        sceneFadeDuration: this.props.fadeDuration,
        orientationOnByDefault: utils.isMobileOrIOS,
        firstScene: this.props.firstScene || Object.keys(sceneObject)[0],
      },
      scenes: sceneObject,
    });

    myPanorama = this.panorama;
  }

  componentDidMount() {
    this.renderPanorama("mount");
    this.panorama.on("load", () => this.onLoaded());
    this.panorama.on("vrmove", () => this.onMouseMove());
    this.panorama.on("mousemove", () => this.onMouseMove());
    this.panorama.on("touchmove", () => this.onMouseMove());
    this.panorama.on("mousewheel", () => this.onMouseWheel());
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.draggable !== this.props.draggable ||
      prevProps.children.length !== this.props.children.length
    ) {
      this.forceRender();
    }
    if (prevProps.pitch !== this.props.pitch) {
      this.panorama.setPitch(this.props.pitch);
    }
    if (prevProps.hfov !== this.props.hfov) {
      this.panorama.setHfov(this.props.hfov);
    }
    if (prevProps.yaw !== this.props.yaw) {
      this.panorama.setYaw(this.props.yaw);
    }
  }

  componentWillUnmount() {
    this.panorama.off("load");
    this.panorama.off("vrmove");
    this.panorama.off("mousemove");
    this.panorama.off("touchmove");
    this.panorama.off("mousewheel");
    this.panorama.destroy();
  }

  onLoaded() {
    if (this.props.onLoaded) {
      this.props.onLoaded({ sceneId: this.panorama.getScene() });
      this.onPosition({
        pitch: this.panorama.getPitch(),
        hfov: this.panorama.getHfov(),
        yaw: this.panorama.getYaw(),
      });
    }
    this.setState({
      scene: {
        ...this.panorama.getConfigScene(this.panorama.getScene()),
      },
      loading: false,
    });
  }

  onMouseWheel() {
    const hfov = this.panorama.getHfov();
    this.onPosition({ hfov });
  }

  onMouseMove() {
    const pitch = this.panorama.getPitch();
    const yaw = this.panorama.getYaw();
    this.onPosition({ pitch, yaw });
  }

  handleClickHotspot = (hs, args) => {
    if (this.props.onHotSpotClick) {
      this.props.onHotSpotClick(hs, args);
    }
    if (hs.type == "link") {
      window.open(hs.clickArgs, "_blank");
    }
  };

  handleDragHandlerFunc = (hs, args) => {
    this.onPosition({
      pitch: hs.pitch,
      hfov: this.panorama.getHfov(),
      yaw: hs.yaw,
    });
    if (this.props.onHotSpotDrag) {
      this.props.onHotSpotDrag(hs, args);
    }
  };

  compassHandleClick() {
    const pitch = this.state.scene.pitch || 0;
    const hfov = this.state.scene.hfov || 120;
    const yaw = this.state.scene.yaw || 0;
    this.panorama.lookAt(pitch, yaw, hfov);
  }

  onPosition({ pitch, yaw, hfov }) {
    const { onPitch, onYaw, onHfov } = this.props;
    if (onPitch && pitch) onPitch(parseInt(pitch));
    if (onHfov && hfov) onHfov(parseInt(parseInt(hfov)));
    if (onYaw && yaw) onYaw(parseInt(yaw));
  }

  forceRender = () => {
    this.renderPanorama("update");
  };

  static loadScene(sceneId, targetPitch, targetYaw, targetHfov, fadeDone) {
    if (myPanorama && sceneId && sceneId !== "") {
      myPanorama.loadScene(
        sceneId,
        targetPitch,
        targetYaw,
        targetHfov,
        fadeDone
      );
    }
  }

  goto(hs, [sceneId, pitch, yaw, animated = 1000]) {
    const hfov = myPanorama.getHfov();
    const calcHfov = hfov > 80 ? hfov - 30 : hfov;
    myPanorama.lookAt(pitch, yaw, calcHfov, animated, () => {
      myPanorama.loadScene(sceneId);
    });
  }

  render() {
    const { scene, loading, container } = this.state;
    return (
      <div className="meta-tour-wrapper">
        <Loading />
        <div id={container}></div>
        <div className="control-bottom-right">
          {scene && scene.compass && (
            <div
              className="control-bottom-item compass"
              onClick={this.compassHandleClick}
              id="compass_icon"
            >
              <i className="icon-compass"></i>
            </div>
          )}
        </div>
      </div>
    );
  }
}

MetaTour.Scene = () => {};

export default MetaTour;
