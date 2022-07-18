import MetaTour, {
  Scene,
  zoomIn,
  MetaMap,
  zoomOut,
  Compass,
  toggleFullscreen,
  MetaTourScenePropsType,
  startOrientation,
  stopOrientation,
  isOrientationActive,
  isOrientationSupported,
} from "@/libs/meta-tour";
import type { NextPage } from "next";
import { useEffect, useState } from "react";

const panorams: MetaTourScenePropsType[] = [
  {
    _id: "scene1",
    pitch: 0,
    yaw: 112,
    hfov: 120,
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586907/panoramas/25_6_2022_fpoly_1_-_Panorama_4_-_Panorama_jtzttr.jpg",
    compass: true,
    hotSpots: [
      {
        _id: "hs1",
        pitch: -0.5863365768080424,
        yaw: 110.88908641173171,
        icon: "location-dot",
        transform: {},
        type: "visit",
        tooltip: "Man 1",
        id_room: "scene2",
        animation: "bounce",
        values: 1,
      },
      {
        _id: "hs2",
        pitch: -29.4,
        yaw: 222.6,
        icon: "info",
        type: "click",
        tooltip: "Man 1",
        transform: {
          scale: 1.4,
        },
        values: 1,
        animation: "pulse",
      },
      {
        _id: "hs3",
        pitch: -19.4,
        yaw: 200.6,
        icon: "phone",
        type: "link",
        tooltip: "Man 1",
        transform: {
          scale: 1.4,
        },
        values: "tel:0982934000",
        animation: "bounce",
      },
    ],
  },
  {
    _id: "scene2",
    pitch: 2,
    yaw: -7.6,
    hfov: 120,
    compass: true,
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586905/panoramas/25_6_2022_fpoly_1_-_Panorama_5_-_Panorama_bp9w3r.jpg",
    hotSpots: [
      {
        _id: "hs4",
        pitch: -6.4,
        yaw: -7.6,
        icon: "location-dot",
        type: "visit",
        tooltip: "Art Museum Drive",
        transform: {
          scale: 1.4,
        },
        id_room: "scene3",
        animation: "pulse",
      },
    ],
  },
  {
    _id: "scene3",
    pitch: 2,
    yaw: -7.6,
    hfov: 120,
    compass: true,
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586907/panoramas/25_6_2022_fpoly_1_-_Panorama_4_-_Panorama_jtzttr.jpg",
    hotSpots: [
      {
        _id: "hs5",
        pitch: -6.4,
        yaw: -7.6,
        icon: "location-dot",
        type: "visit",
        tooltip: "Art Museum Drive",
        transform: {
          scale: 1.4,
        },
        id_room: "scene4",
        animation: "pulse",
      },
    ],
  },
  {
    _id: "scene4",
    pitch: 2,
    yaw: -7.6,
    hfov: 120,
    compass: true,
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586905/panoramas/25_6_2022_fpoly_1_-_Panorama_2_-_Panorama_nwipx4.jpg",
    hotSpots: [
      {
        _id: "hs6",
        pitch: -6.4,
        yaw: -7.6,
        icon: "location-dot",
        type: "visit",
        tooltip: "Art Museum Drive",
        transform: {
          scale: 1.4,
        },
        id_room: "scene5",
        animation: "pulse",
      },
    ],
  },
  {
    _id: "scene5",
    pitch: 2,
    yaw: -7.6,
    hfov: 120,
    compass: true,
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586907/panoramas/25_6_2022_fpoly_1_-_Panorama_7_-_Panorama_u1dwpp.jpg",
    hotSpots: [
      {
        _id: "hs7",
        pitch: -6.4,
        yaw: -7.6,
        icon: "location-dot",
        type: "visit",
        tooltip: "Art Museum Drive",
        transform: {
          scale: 1.4,
        },
        id_room: "scene1",
        animation: "pulse",
      },
    ],
  },
];

const mapData = {
  map_image:
    "https://res.cloudinary.com/lavana/image/upload/v1658087117/panoramas/map_1645629910368_vjlbff.png",
};

const Home: NextPage = () => {
  const [idRoom, setIdRoom] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isShowMap, setShowMap] = useState<boolean>(true);
  const [isOrientation, setOrientation] = useState<boolean>(false);
  const [isOrienSupported, setOrienSupported] = useState<boolean>(false);
  // const [hfov, setHfov] = useState<number>(120);
  // const [pitch, setPitch] = useState<number>(0);
  // const [yaw, setYaw] = useState<number>(0);

  useEffect(() => {
    setOrienSupported(isOrientationSupported());
    setOrientation(isOrientationActive());
  }, []);

  const handleOrientation = () => {
    setOrientation(!isOrientation);
    isOrientation ? stopOrientation() : startOrientation();
  };

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <MetaTour
        onError={console.log}
        loadDone={setIdRoom}
        onEventDown={({ orientation }) => setOrientation(orientation)}
        onProgress={(percent) => setProgress(percent)}
      >
        {panorams.map((panoram) => (
          <Scene {...panoram} key={panoram._id} />
        ))}
      </MetaTour>
      <MetaMap style={{ opacity: isShowMap && idRoom ? 1 : 0 }} />

      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
          width: "auto",
        }}
      >
        <Compass room={idRoom} onClick={() => setOrientation(false)} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 5,
          right: 10,
          zIndex: 12,
          display: "flex",
          opacity: idRoom ? 1 : 0,
          transition: "all .5s ease-in",
        }}
      >
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={zoomOut}>Zoom Out</button>
        <button onClick={() => setShowMap(!isShowMap)}>Map</button>
        {isOrienSupported ? (
          <button onClick={handleOrientation}>
            {isOrientation ? "STOP" : "START"}
          </button>
        ) : (
          <button onClick={toggleFullscreen}>Fullscreen</button>
        )}
      </div>
    </div>
    // <div>
    //   <MetaTour
    //     yaw={yaw}
    //     hfov={hfov}
    //     pitch={pitch}
    //     onYaw={setYaw}
    //     onHfov={setHfov}
    //     onPitch={setPitch}
    //     onLoad={console.log}
    //     onHotSpotDrag={console.log}
    //     onHotSpotClick={console.log}
    //   >
    //     {panorams.map((panoram) => (
    //       <MetaTour.Scene {...panoram} key={panoram._id} />
    //     ))}
    //   </MetaTour>
    //   <div className="box">
    //     <div>
    //       <div>
    //         <strong>HFOV: </strong> {hfov}
    //       </div>
    //       <input
    //         type="range"
    //         min={50}
    //         max={120}
    //         value={hfov}
    //         onChange={(e) => setHfov(parseInt(e.target.value))}
    //       />
    //     </div>
    //     <div>
    //       <div>
    //         <strong>PITCH: </strong> {pitch.toFixed(0)}
    //       </div>
    //       <input
    //         type="range"
    //         min={-57}
    //         max={57}
    //         value={pitch}
    //         step={Math.PI / 180 / 90}
    //         onChange={(e) => setPitch(Number(e.target.value))}
    //       />
    //     </div>
    //     <div>
    //       <div>
    //         <strong>YAW: </strong> {yaw.toFixed(0)}
    //       </div>
    //       <input
    //         type="range"
    //         min={-180}
    //         max={65}
    //         value={yaw}
    //         step={Math.PI / 180 / 90}
    //         onChange={(e) => setYaw(Number(e.target.value))}
    //       />
    //     </div>
    //   </div>
    // </div>
  );
};

export default Home;
