import { PureComponent } from "react";
import metatourmap from "../libraries/metatourmap";
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
    myMetaMap.on("draggable", console.log);
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    myMetaMap.destroy();
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
          top: 36,
          left: 220,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
          clickHandlerArgs: "scene1",
        },
        {
          _id: "2",
          id_room: "scene2",
          top: 50,
          left: 100,
          text: "Tooltip",
          clickHandlerFunc: this.clickHandler,
          clickHandlerArgs: "scene2",
        },
      ],
    });
  }

  clickHandler(_, values) {
    MetaTour.loadScene(values);
  }

  render() {
    const { container } = this.state;
    return <div id={container}></div>;
  }
}

export default MetaMap;
