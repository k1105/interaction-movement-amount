import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Handpose } from "../../@types/global";

export const calcMovementAmount = (
  handposeA: Handpose,
  handposeB: Handpose
) => {
  let sum = 0;
  handposeA.forEach((posA, index) => {
    const posB = handposeB[index];
    sum += dist(posA, posB);
  });
  console.log(sum);
  return sum;
};

const dist = (posA: Keypoint, posB: Keypoint) => {
  return Math.sqrt((posA.x - posB.x) ** 2 + (posA.y - posB.y) ** 2);
};
