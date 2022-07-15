import React from "react";
import utils from "@/utils";
import pannellum from "../libraries/pannellum";

let myPanorama;

class MetaTour extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
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

        switch (__deep.type) {
          case "visit":
            return __deep;
          case "link":
          case "click":
            return {
              ...__deep,
              clickHandlerFunc: this.handleClickHotspot,
              clickHandlerArgs: __deep.clickArgs && __deep.clickArgs,
            };
          default:
            return __deep;
        }
      });
      return {
        ..._previous,
        [_current._id]: {
          ..._current,
          hotSpots: hotspots,
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

    this.setState({
      initialScene: {
        ...sceneObject[this.props.firstScene || Object.keys(sceneObject)[0]],
      },
    });

    myPanorama = this.panorama;

    this.panorama.on("load", () => this.onLoaded());
    this.panorama.on("vrmove", () => this.onMouseMove());
    this.panorama.on("mousemove", () => this.onMouseMove());
    this.panorama.on("touchmove", () => this.onMouseMove());
    this.panorama.on("mousewheel", () => this.onMouseWheel());
  }

  componentDidMount() {
    this.renderPanorama("mount");
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.draggable !== this.props.draggable ||
      prevProps.children.length !== this.props.children.length
    ) {
      this.forceRender();
    }

    if (this.props.pitch) this.panorama.setPitch(this.props.pitch);
    if (this.props.hfov) this.panorama.setHfov(this.props.hfov);
    if (this.props.yaw) this.panorama.setYaw(this.props.yaw);
  }

  componentWillUnmount() {
    this.panorama.off("load", () => this.onLoaded());
    this.panorama.off("vrmove", () => this.onMouseMove());
    this.panorama.off("mousemove", () => this.onMouseMove());
    this.panorama.off("touchmove", () => this.onMouseMove());
    this.panorama.off("mousewheel", () => this.onMouseWheel());
    this.panorama.destroy();
  }

  onLoaded() {
    if (this.props.onLoaded) {
      this.compassHandleClick();
      this.props.onLoaded({ sceneId: this.panorama.getScene() });
    }
  }

  onMouseWheel() {
    const hfov = this.panorama.getHfov();
    this.onPosition({ hfov });
  }

  onMouseMove() {
    const northOffset = this.panorama.getNorthOffset();
    const pitch = this.panorama.getPitch();
    const yaw = this.panorama.getYaw();

    this.setState({
      compassTransform: "rotate(" + (-yaw - northOffset) + "deg)",
    });

    this.onPosition({ pitch, yaw });
  }

  handleClickHotspot = (hs, args) => {
    if (this.props.onHotSpotClick) {
      this.props.onHotSpotClick(hs, args);
    }
  };

  handleDragHandlerFunc = (hs, args) => {
    if (this.props.onHotSpotDrag) {
      this.props.onHotSpotDrag(hs, args);
    }
  };

  compassHandleClick() {
    const pitch = this.state.initialScene.pitch || 0;
    const hfov = this.state.initialScene.hfov || 120;
    const yaw = this.state.initialScene.yaw || 0;
    this.onPosition({ pitch, hfov, yaw });
    this.panorama.setPitch(pitch);
    this.panorama.setHfov(hfov);
    this.panorama.setYaw(yaw);
  }

  onPosition({ pitch, yaw, hfov }) {
    const { onPitch, onYaw, onHfov } = this.props;
    if (pitch && onPitch) onPitch(pitch);
    if (hfov && onHfov) onHfov(hfov);
    if (yaw && onYaw) onYaw(yaw);
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

  static lookAt(pitch, yaw, hfov, animated = 1000, callback, callbackArgs) {
    if (myPanorama) {
      myPanorama.lookAt(pitch, yaw, hfov, animated, callback, callbackArgs);
    }
  }

  render() {
    return (
      <div className="meta-tour-wrapper">
        <div id={this.state.container}></div>
        <div className="control-bottom-right">
          <div
            className="control-bottom-item compass"
            style={{ "--transform-compass": this.state.compassTransform }}
            onClick={this.compassHandleClick}
            onTouchStart={this.compassHandleClick}
            onPointerDown={this.compassHandleClick}
          >
            <i className="fa-solid fa-compass"></i>
          </div>
        </div>
      </div>
    );
  }
}

MetaTour.Scene = () => {};

export default MetaTour;
