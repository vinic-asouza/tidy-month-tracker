import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Benefits } from "@/components/Benefits";
import { Preview } from "@/components/Preview";
import { StatisticsSection } from "@/components/StatisticsSection";
import { HowItWorks } from "@/components/HowItWorks";
import { Cta } from "@/components/Cta";
import { Footer } from "@/components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Header />
        <Hero />
        <Benefits />
        <Preview />
        <StatisticsSection />
        <HowItWorks />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

export default App;
