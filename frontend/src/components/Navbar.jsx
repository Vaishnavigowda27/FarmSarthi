import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

const Navbar = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'kn' : 'en');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Left Side - Home */}
          <Link 
            to="/" 
            className="text-lg font-semibold text-gray-800 hover:text-blue-600"
          >
            {t('nav.home')}
          </Link>

          {/* Right Side - Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center text-gray-700 hover:text-blue-600"
          >
            <FaGlobe className="mr-1" />
            {i18n.language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
