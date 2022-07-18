import { PureComponent } from "react";
import metatourmap from "../pannellum/tourmap";
import MetaTour from "./MetaTour";

let myMetaMap;

class MetaMap extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      container: "map-container",
    };
  }

  static defaultProps = {};

  componentDidMount() {
    this.renderMap();
    this.setState({ isOrienSupported: MetaTour.isOrientationSupported() });
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    myMetaMap.destroy();
    myMetaMap.off();
  }

  renderMap() {
    myMetaMap = metatourmap.init(this.state.container, {
      image:
        "https://res.cloudinary.com/lavana/image/upload/v1658087117/panoramas/map_1645629910368_vjlbff.png",
      draggablePointer: false,
      pointers: [
        {
          _id: "1",
          id_room: "scene1",
          top: 60,
          left: 205,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
        },
        {
          _id: "2",
          id_room: "scene2",
          top: 144,
          left: 115,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
        },
        {
          _id: "3",
          id_room: "scene3",
          top: 80,
          left: 39,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
        },
        {
          _id: "4",
          id_room: "scene4",
          top: 23,
          left: 107,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
        },
        {
          _id: "5",
          id_room: "scene5",
          top: 124,
          left: 200,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
        },
      ],
    });
    myMetaMap.on("draggable", console.log);
  }

  clickHandler(_, values) {
    MetaTour.loadScene(values);
  }

  render() {
    const { style } = this.props;
    const { container, isOrienSupported } = this.state;

    return <div id={container} style={style}></div>;
  }
}

export default MetaMap;
