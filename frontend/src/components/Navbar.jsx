import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';
import logo from '../assets/logo.jpeg';
const Navbar = () => {
const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'kn' : 'en');
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left: logo + title */}
          <Link to="/" className="flex items-center gap-2">
  <img
    src={logo}
    alt="FarmSaarthi Logo"
    className="h-9 w-9 rounded-2xl object-contain bg-[#2D6A4F] p-1 "
  />
  <div className="leading-tight">
    <p className="text-sm font-bold text-[#1B4332]">Farm Saarthi</p>
    <p className="text-[10px] text-gray-500">Connecting Farmers & Equipment</p>
  </div>
</Link>

          

          {/* Right: language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-[#2D6A4F] text-white hover:bg-[#1B4332]"
          >
            <FaGlobe />
            {i18n.language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
