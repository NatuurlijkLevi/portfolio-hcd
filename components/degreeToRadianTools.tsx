export function degreeToRadian(degree: number) {
  return (degree / 180) * Math.PI;
}

type EulerRotation = {
  x: number;
  y: number;
  z: number;
};

export function degreeArraytoEuler(rotation: EulerRotation) {
  return {
    x: degreeToRadian(rotation.x),
    y: degreeToRadian(rotation.y),
    z: degreeToRadian(rotation.z),
  };
}
