import Header from "@/business/components/Header";
import Footer from "@/shared/components/Footer";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main className="my-10">{children}</main>
      <Footer />
    </>
  );
};

export default layout;
