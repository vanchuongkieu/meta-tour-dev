import { loadScene, MetaTour } from "@/libs/meta-tour";
import type { NextPage } from "next";
import { useState } from "react";

const panorams = [
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
        buttonText: "visit",
        tooltip: "Man 1",
        id_room: "scene2",
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
    compass: true,
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
        id_room: "scene1",
        animation: "pulse",
      },
    ],
  },
];

const Home: NextPage = () => {
  // const [hfov, setHfov] = useState<number>(120);
  // const [pitch, setPitch] = useState<number>(0);
  // const [yaw, setYaw] = useState<number>(0);

  return (
    <div>
      <MetaTour>
        {panorams.map((panoram) => (
          <MetaTour.Scene {...panoram} key={panoram._id} />
        ))}
      </MetaTour>
      {/* <MetaTour
        yaw={yaw}
        hfov={hfov}
        pitch={pitch}
        onYaw={setYaw}
        onHfov={setHfov}
        onPitch={setPitch}
        onLoaded={console.log}
        onHotSpotDrag={console.log}
        onHotSpotClick={console.log}
      >
        {panorams.map((panoram) => (
          <MetaTour.Scene {...panoram} key={panoram._id} />
        ))}
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
            step={1}
            value={hfov}
            onChange={(e) => setHfov(parseInt(e.target.value))}
          />
        </div>
        <div>
          <div>
            <strong>PITCH: </strong> {pitch}
          </div>
          <input
            type="range"
            min={-57}
            max={57}
            step={1}
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value))}
          />
        </div>
        <div>
          <div>
            <strong>YAW: </strong> {yaw}
          </div>
          <input
            type="range"
            min={-180}
            max={65}
            step={1}
            value={yaw}
            onChange={(e) => setYaw(parseInt(e.target.value))}
          />
        </div>
      </div> */}
    </div>
  );
};

export default Home;
