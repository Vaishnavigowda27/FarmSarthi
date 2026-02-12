import { useTranslation } from 'react-i18next';
import { FaTractor, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <FaTractor className="text-primary-500 text-3xl" />
              <span className="text-2xl font-bold">{t('app.name')}</span>
            </div>
            <p className="text-gray-400 mb-4">{t('app.tagline')}</p>
            <div className="flex space-x-4">
              <FaFacebook className="text-2xl hover:text-primary-500 cursor-pointer transition-colors" />
              <FaTwitter className="text-2xl hover:text-primary-500 cursor-pointer transition-colors" />
              <FaInstagram className="text-2xl hover:text-primary-500 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('nav.home')}
                </a>
              </li>
              <li>
                <a href="/equipment" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('nav.equipment')}
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('nav.about')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: support@farmsaarthi.com</li>
              <li>Phone: +91 9999999999</li>
              <li>Mysore, Karnataka</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 {t('app.name')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;