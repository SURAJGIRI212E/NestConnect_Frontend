/**
 * Utility to get cropped image blob and url from an image source using canvas.
 * Supports rotation. Returns { blob, url }.
 */
export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, outputSize = 400) {
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (e) => reject(e));
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = url;
    });

  const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

  const rotateSize = (width, height, rotation) => {
    const rot = getRadianAngle(rotation);
    return {
      width: Math.abs(Math.cos(rot) * width) + Math.abs(Math.sin(rot) * height),
      height: Math.abs(Math.sin(rot) * width) + Math.abs(Math.cos(rot) * height),
    };
  };

  const image = await createImage(imageSrc);

  const rot = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // draw rotated image onto a large canvas
  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = Math.ceil(bBoxWidth);
  rotatedCanvas.height = Math.ceil(bBoxHeight);
  const rctx = rotatedCanvas.getContext('2d');

  // move to center to rotate around the center
  rctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
  rctx.rotate(rot);
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  // compute the top-left of the original image inside the rotated canvas
  const dx = (rotatedCanvas.width - image.width) / 2;
  const dy = (rotatedCanvas.height - image.height) / 2;

  // source rectangle on the rotated canvas corresponds to pixelCrop
  const sx = Math.floor(dx + pixelCrop.x);
  const sy = Math.floor(dy + pixelCrop.y);
  const sWidth = Math.floor(pixelCrop.width);
  const sHeight = Math.floor(pixelCrop.height);

  // draw the cropped area onto the output canvas (scaled to outputSize)
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const ctx = outputCanvas.getContext('2d');

  ctx.drawImage(rotatedCanvas, sx, sy, sWidth, sHeight, 0, 0, outputSize, outputSize);

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const url = URL.createObjectURL(blob);
      resolve({ blob, url });
    }, 'image/png');
  });
}
