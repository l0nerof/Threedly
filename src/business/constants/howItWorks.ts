import { CreditCard, Download, UserPlus } from "lucide-react";
import { StepKey } from "../types/howItWorksSteps";

export const AUTO_PLAY_DELAY = 4200;

export const howItWorksSteps = [
  {
    key: "one" as StepKey,
    icon: UserPlus,
  },
  {
    key: "two" as StepKey,
    icon: CreditCard,
  },
  {
    key: "three" as StepKey,
    icon: Download,
  },
] as const;
