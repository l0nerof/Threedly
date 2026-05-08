import type { Variants } from "motion/react";
import type { UploadFileState } from "../types/upload";

export const emptyFileState: UploadFileState = {
  coverImage: "",
  modelFile: "",
  previewModelFile: "",
};

export const studioIntroVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};
