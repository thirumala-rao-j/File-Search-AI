import Chat from "./pages/Chat";
import Upload from "./pages/Upload";
import { Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/Chat" element={<Chat />} />
      </Routes>
    </>
  );
};

export default App;
