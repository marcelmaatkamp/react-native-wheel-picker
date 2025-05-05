import {degToRad} from '../../utils/math';
export type Faces = {
  index: number;
  deg: number;
  offsetY: number;
  opacity: number;
  screenHeight: number;
};

/**
 * Calculates the height of the element after rotating it relative to the user's screen.
 * @param degree - the angle relative to the screen plane.
 * @param itemHeight - original height
 */
const calcHeight = (degree: number, itemHeight: number) =>
  itemHeight * Math.cos(degToRad(degree));
export const calcPickerHeight = (faces: Faces[], itemHeight: number) => {
  // TODO left for backward compatibility, it must be removed after updating the major version.
  if (faces.length === 7) {
    return itemHeight * 5;
  }
  return faces.reduce((r, v) => r + calcHeight(Math.abs(v.deg), itemHeight), 0);
};
export const createFaces = (
  itemHeight: number,
  visibleCount: number,
): Faces[] => {
  if (__DEV__) {
    if (visibleCount < 1 || visibleCount % 2 === 0) {
      throw new Error(
        `WheelPicker cannot display the number of visible items "${visibleCount}".` +
          ` The value must be greater than 0 and be an odd number. E.g 1, 3, 5, 7...`,
      );
    }
  }

  // e.g [30, 60, 90]
  const getDegreesRelativeCenter = () => {
    const maxStep = Math.trunc((visibleCount + 2) / 2); // + 2 because there are 2 more faces at 90 degrees
    const stepDegree = 90 / maxStep;
    const result = [];
    for (let i = 1; i <= maxStep; i++) {
      result.push(i * stepDegree);
    }
    return result;
  };
  const getScreenHeightsAndOffsets = <T extends readonly number[]>(
    degrees: T,
  ): [T, T] => {
    const screenHeights = degrees.map((deg) =>
      calcHeight(deg, itemHeight),
    ) as unknown as T;
    const freeSpaces = screenHeights.map(
      (screenHeight) => itemHeight - screenHeight,
    );
    const offsets = freeSpaces.map((freeSpace, index) => {
      let offset = freeSpace / 2;
      for (let i = 0; i < index; i++) {
        offset += freeSpaces[i]!;
      }
      return offset;
    }) as unknown as T;
    return [screenHeights, offsets];
  };
  const getOpacity = (index: number) => {
    const map: Record<number, number> = {
      0: 0,
      1: 0.2,
      2: 0.35,
      3: 0.45,
      4: 0.5,
    };
    return map[index] ?? Math.min(1, map[4]! + index * 0.5);
  };
  const degrees = getDegreesRelativeCenter();
  const [screenHeight, offsets] = getScreenHeightsAndOffsets(degrees);
  return [
    // top items
    ...degrees
      .map<Faces>((degree, index) => {
        return {
          index: -1 * (index + 1),
          deg: degree,
          opacity: getOpacity(degrees.length - 1 - index),
          offsetY: -1 * offsets[index]!,
          screenHeight: screenHeight[index]!,
        };
      })
      .reverse(),
    // center item
    {
      index: 0,
      deg: 0,
      opacity: 1,
      offsetY: 0,
      screenHeight: itemHeight,
    },
    // bottom items
    ...degrees.map<Faces>((degree, index) => {
      return {
        index: index + 1,
        deg: -1 * degree,
        opacity: getOpacity(degrees.length - 1 - index),
        offsetY: offsets[index]!,
        screenHeight: screenHeight[index]!,
      };
    }),
  ];
};
