export const IRREGULAR_SHAPES = ['cloud', 'hexagon', 'diamond'];

export const IRREGULAR_SHAPE_PATHS: Record<string, string> = {
  cloud: "M77.56,38.98 C75.01,19.57 63.65,5 50,5 C39.16,5 29.75,14.23 25.06,27.73 C13.78,29.53 5,43.87 5,61.25 C5,79.87 15.09,95 27.5,95 L76.25,95 C86.6,95 95,82.4 95,66.88 C95,52.03 87.31,39.99 77.56,38.98 Z",
  hexagon: "M25,5 L75,5 L95,50 L75,95 L25,95 L5,50 Z",
  diamond: "M41.52,13.49 Q50,5 58.49,13.49 L86.52,41.52 Q95,50 86.52,58.49 L58.49,86.52 Q50,95 41.52,86.52 L13.49,58.49 Q5,50 13.49,41.52 L41.52,13.49 Z",
};

export const SHAPE_SVG_INSET = 4;

export const scalePathToBox = (path: string, width: number, height: number, inset: number): string => {
  let coordIndex = 0;
  return path.replace(/-?\d*\.?\d+/g, (token) => {
    const value = parseFloat(token);
    const scaled = coordIndex % 2 === 0
      ? (value / 100) * (width + inset * 2) - inset
      : (value / 100) * (height + inset * 2) - inset;
    coordIndex++;
    return scaled.toFixed(2);
  });
};
