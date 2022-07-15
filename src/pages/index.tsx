import { loadScene, MetaTour } from "@/libs/meta-tour";
import type { NextPage } from "next";
import { useState } from "react";

const panorams = [
  {
    _id: "scene1",
    pitch: 0.24362161026749807,
    yaw: -5.619446410686189,
    hfov: 120,
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586907/panoramas/25_6_2022_fpoly_1_-_Panorama_4_-_Panorama_jtzttr.jpg",
    hotSpots: [
      {
        _id: "hs1",
        pitch: -8.970919321567305,
        yaw: 7.617890278757896,
        icon: "location-dot",
        transform: {
          scale: 1.4,
          rotate: 29,
          rotateZ: -33,
          rotateY: 12,
          rotateX: -9,
        },
        type: "visit",
        buttonText: "visit",
        tooltip: "Man 1",
        sceneId: "scene2",
        animation: "bounce",
        clickArgs: 1,
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
        clickArgs: 1,
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
        clickArgs: "tel:0982934000",
        animation: "bounce",
      },
    ],
  },
  {
    _id: "scene2",
    image:
      "https://res.cloudinary.com/lavana/image/upload/v1657586905/panoramas/25_6_2022_fpoly_1_-_Panorama_5_-_Panorama_bp9w3r.jpg",
    hotSpots: [
      {
        _id: "hs4",
        pitch: -9.4,
        yaw: 222.6,
        type: "visit",
        tooltip: "Art Museum Drive",
        transform: {
          scale: 1.4,
        },
        sceneId: "scene1",
        animation: "pulse",
      },
    ],
  },
];

const Home: NextPage = () => {
  const [hfov, setHfov] = useState<number>(120);
  const [pitch, setPitch] = useState<number>(0);
  const [yaw, setYaw] = useState<number>(0);

  return (
    <div>
      <MetaTour
        hfov={hfov}
        pitch={pitch}
        yaw={yaw}
        onHfov={setHfov}
        onPitch={setPitch}
        onYaw={setYaw}
        onHotSpotClick={console.log}
        onHotSpotDrag={console.log}
        onLoaded={console.log}
      >
        {panorams.map((panoram) => (
          <MetaTour.Scene {...panoram} key={panoram._id} />
        ))}
        {/* <MetaTour.Scene {...panorams[0]} key={panorams[0]._id} /> */}
      </MetaTour>
      <div className="box">
        <div>
          <div>
            <strong>HFOV: </strong> {hfov}
          </div>
          <input
            type="range"
            min={50}
            max={120}
            value={hfov}
            onChange={(e) => setHfov(Number(e.target.value))}
          />
        </div>
        <div>
          <div>
            <strong>PITCH: </strong> {pitch}
          </div>
          <input
            type="range"
            min={-90}
            max={90}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
          />
        </div>
        <div>
          <div>
            <strong>YAW: </strong> {yaw}
          </div>
          <input
            type="range"
            min={-90}
            max={90}
            value={yaw}
            onChange={(e) => setYaw(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
