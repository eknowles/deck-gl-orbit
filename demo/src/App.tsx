import { OrbitAreaDemo } from "./components/OrbitAreaDemo";
// @ts-expect-error
import "./index.css";

export function App() {
  return (
    <div className="app" style={{ width: "100vw", height: "100vh" }}>
      <OrbitAreaDemo />
    </div>
  );
}

export default App;
