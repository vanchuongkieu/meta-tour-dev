import React from "react";
import utils from "@/utils";
import pannellum from "../libraries/pannellum";
import Image from "next/image";

let myPanorama;

class MetaTour extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      firstLoad: true,
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
    fadeDuration: 1000,
  };

  componentDidMount() {
    this.renderPanorama("mount");
    myPanorama.on("load", () => this.onLoad());
    myPanorama.on("vrmove", () => this.onMove());
    myPanorama.on("mousemove", () => this.onMove());
    myPanorama.on("touchmove", () => this.onMove());
    myPanorama.on("mousewheel", () => this.onWheel());
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
              clickHandlerFunc: this.onClickHotSpot,
              clickHandlerArgs: __deep.clickArgs && __deep.clickArgs,
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
    setTimeout(() => {
      this.setState({ firstLoad: false });
    }, 2000);
    if (this.props.onLoad) {
      this.props.onLoad({ sceneId: myPanorama.getScene() });
      this.onCoordinates({
        pitch: myPanorama.getPitch(),
        hfov: myPanorama.getHfov(),
        yaw: myPanorama.getYaw(),
      });
    }
  }

  onWheel() {
    const hfov = myPanorama.getHfov();
    this.onCoordinates({ hfov });
  }

  onMove() {
    const pitch = myPanorama.getPitch();
    const yaw = myPanorama.getYaw();
    this.onCoordinates({ pitch, yaw });
  }

  onClickHotSpot = (hs, args) => {
    if (this.props.onHotSpotClick) {
      this.props.onHotSpotClick(hs, args);
    }
    if (hs.type == "link") {
      window.open(hs.clickArgs, "_blank");
    }
  };

  onDragHandlerFunc = (hs, args) => {
    this.onCoordinates({
      pitch: hs.pitch,
      hfov: myPanorama.getHfov(),
      yaw: hs.yaw,
    });
    if (this.props.onHotSpotDrag) {
      this.props.onHotSpotDrag(hs, args);
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
      this.setState({ loading: true });
      myPanorama.loadScene(sceneId);
    });
  }

  render() {
    const { scene, loading, firstLoad, container } = this.state;
    return (
      <div className="meta-tour-wrapper">
        <div
          id="loading_pano"
          style={{ opacity: !firstLoad && loading ? 0.8 : 0 }}
        ></div>
        <div className="loading_start" style={{ opacity: firstLoad ? 1 : 0 }} />
        <div id={container} style={{ opacity: firstLoad ? 0 : 0.8 }}></div>
        <div className="control-bottom-right">
          {scene && scene.compass && !firstLoad && (
            <div
              className="control-bottom-item compass"
              onClick={this.onPreviousCoordinates}
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
