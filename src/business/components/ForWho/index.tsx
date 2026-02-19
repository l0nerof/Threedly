"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/Card";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { creatorsPoints, designersPoints } from "../../constants/forWhoPoints";

const contentAnimation = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const cardsContainerAnimation = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardAnimation = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function ForWho() {
  const t = useTranslations("ForWho");

  return (
    <section
      aria-labelledby="for-who-title"
      className="container flex flex-col gap-8 py-20 sm:py-24"
    >
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={contentAnimation}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2
          id="for-who-title"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t("title")}
        </h2>

        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </motion.div>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={cardsContainerAnimation}
      >
        <motion.div
          variants={cardAnimation}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="border-border/80 flex flex-col gap-4 p-6">
            <CardHeader className="gap-2 p-0">
              <CardTitle className="text-lg sm:text-xl">
                {t("designers.title")}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ul className="flex flex-col gap-2">
                {designersPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <Check
                      className="text-primary size-5 shrink-0"
                      aria-hidden
                    />
                    <span className="text-sm sm:text-base">
                      {t(`designers.items.${point}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={cardAnimation}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="border-border/80 flex flex-col gap-4 p-6">
            <CardHeader className="gap-2 p-0">
              <CardTitle className="text-lg sm:text-xl">
                {t("creators.title")}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ul className="flex flex-col gap-2">
                {creatorsPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <Check
                      className="text-primary size-5 shrink-0"
                      aria-hidden
                    />
                    <span className="text-sm sm:text-base">
                      {t(`creators.items.${point}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default ForWho;
