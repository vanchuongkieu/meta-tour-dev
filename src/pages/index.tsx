import MetaTour, {
  Scene,
  zoomIn,
  zoomOut,
  Compass,
  loadScene,
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
        id_room: "scene1",
        animation: "pulse",
      },
    ],
  },
];

const Home: NextPage = () => {
  const [idRoom, setIdRoom] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [orientationActive, setOrientationActive] = useState<boolean>(false);
  // const [hfov, setHfov] = useState<number>(120);
  // const [pitch, setPitch] = useState<number>(0);
  // const [yaw, setYaw] = useState<number>(0);

  useEffect(() => {
    setIsMobile(isOrientationSupported());
    setOrientationActive(isOrientationActive());
  }, []);

  const handleOrientation = () => {
    setOrientationActive(!orientationActive);
    orientationActive ? stopOrientation() : startOrientation();
  };

  return (
    <div>
      <MetaTour
        loadDone={setIdRoom}
        onProgress={(percent) => setProgress(percent)}
      >
        {panorams.map((panoram) => (
          <Scene {...panoram} key={panoram._id} />
        ))}
      </MetaTour>
      <div style={{ margin: 10 }}>
        <Compass room={idRoom} onClick={() => setOrientationActive(false)} />
      </div>
      <div style={{ position: "absolute", top: 50, left: 0, zIndex: 12 }}>
        {isMobile && (
          <button onClick={handleOrientation}>
            {orientationActive ? "STOP" : "START"}
          </button>
        )}
        <br />
        <button onClick={() => loadScene("scene1")}>Room 1</button>
        <button onClick={() => loadScene("scene2")}>Room 2</button>
        <br />
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={zoomOut}>Zoom Out</button>
        <br />
        <button onClick={toggleFullscreen}>Fullscreen</button>
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
