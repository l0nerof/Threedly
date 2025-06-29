import Benefits from "@/business/components/Benefits";
import Categories from "@/business/components/Categories";
import Community from "@/business/components/Community";
import FeaturedModels from "@/business/components/FeaturedModels";
import Header from "@/business/components/Header";
import Hero from "@/business/components/Hero";
import RecentUploads from "@/business/components/RecentUploads";
import Footer from "@/shared/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Benefits />
        <FeaturedModels />
        <RecentUploads />
        <Categories />
        <Community />
      </main>
      <Footer />
    </>
  );
}
