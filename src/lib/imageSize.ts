export const getImageSize = (file: string) => {
  return new Promise<ImageSize>((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      resolve({ width: image.width, height: image.height });
    });
    image.addEventListener("error", () => {
      resolve({ width: 0, height: 0 });
    });
    image.src = file;
  });
};

export type ImageSize = {
  width: number;
  height: number;
};