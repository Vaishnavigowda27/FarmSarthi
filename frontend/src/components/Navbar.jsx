import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

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
          <Link to="../assets/logo.jpeg" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white text-sm font-bold">
              FS
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-[#1B4332]">Farm Saarthi</p>
              <p className="text-[10px] text-gray-500">
               
              </p>
            </div>
          </Link>

          {/* Middle: links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-600">
            <Link to="/#services" className="hover:text-[#1B4332]">
              Services
            </Link>
            <Link to="/#about" className="hover:text-[#1B4332]">
              About us
            </Link>
            <Link to="/#contact" className="hover:text-[#1B4332]">
              Contact us
            </Link>
          </div>

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
