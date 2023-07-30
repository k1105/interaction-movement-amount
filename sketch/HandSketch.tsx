import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { dotHand } from "../lib/p5/dotHand";
import { isFront } from "../lib/detector/isFront";
import { Monitor } from "../components/Monitor";
import { Recorder } from "../components/Recorder";
import { Handpose } from "../@types/global";
import { DisplayHands } from "../lib/DisplayHandsClass";
import { HandposeHistory } from "../lib/HandposeHitsoryClass";
import { calcMovementAmount } from "../lib/calculator/calcMovementAmount";

type Props = {
  handpose: MutableRefObject<Hand[]>;
};
const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose }: Props) => {
  const handposeHistory = new HandposeHistory();
  const displayHands = new DisplayHands();
  let leftMovement = 0;
  let rightMovement = 0;

  const debugLog = useRef<{ label: string; value: any }[]>([]);

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
  };

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current);
    handposeHistory.update(rawHands);
    const hands: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(rawHands, handposeHistory); //平滑化された手指の動きを取得する
    // logとしてmonitorに表示する
    debugLog.current = [];
    for (const hand of handpose.current) {
      debugLog.current.push({
        label: hand.handedness + " accuracy",
        value: hand.score,
      });
      debugLog.current.push({
        label: hand.handedness + " is front",
        //@ts-ignore
        value: isFront(hand.keypoints, hand.handedness.toLowerCase()),
      });
    }

    if (handposeHistory.left.length >= 5) {
      const res = calcMovementAmount(
        handposeHistory.left[3],
        handposeHistory.left[4]
      );

      if (res > 0) {
        leftMovement = res;
      }
    }
    if (handposeHistory.right.length >= 5) {
      const res = calcMovementAmount(
        handposeHistory.right[3],
        handposeHistory.right[4]
      );
      if (res > 0) {
        rightMovement = res;
      }
      debugLog.current.push({ label: "rightMovement", value: rightMovement });
    }

    p5.clear();

    displayHands.update(hands);

    if (displayHands.left.pose.length > 0) {
      p5.push();
      p5.fill(leftMovement, 0, 255 - leftMovement, displayHands.left.opacity);
      p5.translate(p5.width / 2 - 300, p5.height / 2 + 50);
      dotHand({
        p5,
        hand: displayHands.left.pose,
        dotSize: 10,
      });
      p5.pop();
    }

    if (displayHands.right.pose.length > 0) {
      p5.push();
      p5.fill(
        rightMovement,
        0,
        255 - rightMovement,
        displayHands.right.opacity
      );
      p5.translate(p5.width / 2 + 300, p5.height / 2 + 50);
      dotHand({
        p5,
        hand: displayHands.right.pose,
        dotSize: 10,
      });
      p5.pop();
    }
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <Monitor handpose={handpose} debugLog={debugLog} />
      <Recorder handpose={handpose} />
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
