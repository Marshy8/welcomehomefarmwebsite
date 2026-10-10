import { Nav } from "./components/Nav";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Engage } from "./sections/Engage";
import { Calendar } from "./sections/Calendar";
import { Contact } from "./sections/Contact";
import { SECTIONS } from "./data/sections";
import { useActiveSection } from "./hooks/useActiveSection";
import { useFarmStatus } from "./hooks/useFarmStatus";

const SECTION_IDS = SECTIONS.map((s) => s.id);

function App() {
  const active = useActiveSection(SECTION_IDS);
  const farm = useFarmStatus();

  return (
    <>
      <Nav active={active} />
      <main>
        <Hero />
        <About />
        <Engage farm={farm} />
        <Calendar farm={farm} />
        <Contact />
      </main>
    </>
  );
}

export default App;
