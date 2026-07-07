import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { PhilosophySection } from "@/components/sections/PhilosophySection";
import { RitualSection } from "@/components/sections/RitualSection";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { MethodSection } from "@/components/sections/MethodSection";
import { WishListSection } from "@/components/sections/WishListSection";
import { ProductDemoSection } from "@/components/sections/ProductDemoSection";
import { WalletsSection } from "@/components/sections/WalletsSection";
import { AnnualSection } from "@/components/sections/AnnualSection";
import { SocialProofSection } from "@/components/sections/SocialProofSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { Footer } from "@/components/sections/Footer";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <PhilosophySection />
        <RitualSection />
        <BenefitsSection />
        <MethodSection />
        <WishListSection />
        <ProductDemoSection />
        <WalletsSection />
        <AnnualSection />
        <SocialProofSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
