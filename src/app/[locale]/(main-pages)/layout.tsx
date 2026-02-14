import Footer from "@/src/business/components/Footer";
import Header from "@/src/business/components/Header";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default async function MainPagesLayout({ children }: Props) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
