import { useImageSource } from "../ui/ImageDrop";
import ImageConverter from "./ImageConverter";
import ImageResizer from "./ImageResizer";
import ImageUpscaler from "./ImageUpscaler";

/** One page per image tool; each loads its own image. */
export function ConvertImages() {
  return <ImageConverter image={useImageSource()} />;
}
export function ResizeImages() {
  return <ImageResizer image={useImageSource()} />;
}
export function UpscaleImages() {
  return <ImageUpscaler image={useImageSource()} />;
}
