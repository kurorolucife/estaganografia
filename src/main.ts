const fileInput = document.querySelector(
  "input[type='file']"
) as HTMLInputElement;
const textInput = document.querySelector(
  "input[type='text']"
) as HTMLInputElement;
const encodeBtn = document.querySelector("#enviar") as HTMLButtonElement;
const decodeBtn = document.querySelector("#decode") as HTMLButtonElement;
const output = document.querySelector("output") as HTMLOutputElement;

const canvasPreview = document.querySelector("#antes") as HTMLCanvasElement;

const ctxPV = canvasPreview.getContext("2d") as CanvasRenderingContext2D;

const canvasHidden = document.querySelector("#depois") as HTMLCanvasElement;
const ctxHD = canvasHidden.getContext("2d") as CanvasRenderingContext2D;

const endMessageText = "x".repeat(74);

let originalImageRGBValuesInBinary: string[];
// text input mask
textInput.addEventListener("input", () => {
  textInput.value = textInput.value.replace(/[^ -~]/g, ""); // remove non ascii characters
});

fileInput.addEventListener("change", () => {
  if (fileInput.files?.length) {
    const imgFile = fileInput.files[0];
    const image = new Image();
    image.src = URL.createObjectURL(imgFile);

    image.onload = () => drawOnCanvas(image);
  }
});

encodeBtn.addEventListener("click", () => {
  const text = textInput.value;
  let initialIndex = 0;
  let newImageData = writeOnImageData(
    text + endMessageText,
    originalImageRGBValuesInBinary,
    initialIndex
  ).map((strNumber) => parseInt(strNumber, 2));

  const newImage = new ImageData(
    new Uint8ClampedArray(newImageData),
    canvasHidden.width,
    canvasHidden.height
  );

  ctxHD.putImageData(newImage, 0, 0);

  downloadNewImage();
});

decodeBtn.addEventListener("click", () => {
  const message = decodeNewImage();
  output.innerHTML = `<strong>Mensagem:</strong> ${message}`;
});

function drawOnCanvas(image: HTMLImageElement) {
  canvasPreview.width = image.width;
  canvasPreview.height = image.height;

  canvasHidden.width = image.width;
  canvasHidden.height = image.height;

  ctxPV.drawImage(image, 0, 0);

  originalImageRGBValuesInBinary = [
    ...ctxPV.getImageData(0, 0, canvasPreview.width, canvasPreview.height).data,
  ].map((n) => n.toString(2).padStart(7, "0"));
}

function writeOnImageData(
  text: string,
  imageBytesData: string[],
  initialIndex: number = 0
) {
  const textToBinaryCharCode = text
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(7, "0"));

  const imageBytesDataClone = [...imageBytesData];

  let lastIndex = initialIndex;

  textToBinaryCharCode.forEach((binStr) => {
    binStr.split("").forEach((bit) => {
      let imgByte = imageBytesDataClone[lastIndex];
      // Swap the last bit with the new one
      imgByte = imgByte.substring(0, imgByte.length - 1) + bit;
      imageBytesDataClone[lastIndex] = imgByte;
      //
      lastIndex++;
    });
  });
  return imageBytesDataClone;
}

function decodeNewImage() {
  const rgbNumbers = [
    ...ctxPV.getImageData(0, 0, canvasHidden.width, canvasHidden.height).data,
  ].map((n) => {
    const binaryNumber = n.toString(2);
    const lastBit = binaryNumber.substring(binaryNumber.length - 1);
    return lastBit;
  });
  const bytesOfString = chunkArray(rgbNumbers, 7)
    .map((item) => item.join(""))
    // Transform the bytes from binary to integer
    .map((binStr) => parseInt(binStr, 2))
    // Transform numbers into characters
    .map((int) => String.fromCharCode(int))
    .join("");

  console.log(bytesOfString);

  const messageEnd = bytesOfString.indexOf(endMessageText);
  const decoded = bytesOfString.substring(0, messageEnd).trim();
  return decoded;
}

function downloadNewImage() {
  const link = document.createElement("a");
  link.download = "newImage.png";
  link.href = canvasHidden.toDataURL();
  link.click();
}

/**
 * @example chunkArray([1,2,3,4,5,6], 2) => [[1,2],[3,4],[5,6]]
 */
function chunkArray(array: any[], size: number) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
