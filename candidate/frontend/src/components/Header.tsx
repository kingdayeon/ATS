import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const navigate = useNavigate();

  const handleJobListingsClick = () => {
    navigate("/");
  };

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="font-bold text-lg cursor-pointer" onClick={handleJobListingsClick}>
            MUSINSA
          </div>
          <Button 
            className="bg-black text-white hover:bg-gray-800"
            onClick={handleJobListingsClick}
          >
            채용 중인 공고
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header; 