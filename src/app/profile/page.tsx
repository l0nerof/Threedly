import Header from "@/business/components/Header";
import ProfileTabs from "@/business/components/ProfileTabs";
import Footer from "@/shared/components/Footer";
import React from "react";

function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="h-full w-full py-12 md:py-24 lg:py-32">
          <div className="container h-full px-4 md:px-6">
            <ProfileTabs />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ProfilePage;
