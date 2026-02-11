import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { GiFarmer, GiTractor } from 'react-icons/gi';

function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'kn' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <GiTractor className="text-agro-green-600 text-3xl" />
              <span className="text-2xl font-bold text-agro-green-600">AgroRen</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
              {t('dashboard')}
            </Link>
            
            {user?.role === 'farmer' && (
              <>
                <Link to="/search" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
                  {t('searchEquipment')}
                </Link>
                <Link to="/my-bookings" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
                  {t('bookings')}
                </Link>
              </>
            )}

            {user?.role === 'renter' && (
              <>
                <Link to="/my-equipment" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
                  {t('myEquipment')}
                </Link>
                <Link to="/add-equipment" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
                  {t('addEquipment')}
                </Link>
                <Link to="/my-bookings" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
                  {t('bookings')}
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-agro-green-600 font-medium transition-colors">
                Admin
              </Link>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-md bg-agro-blue-100 text-agro-blue-700 font-medium hover:bg-agro-blue-200 transition-colors"
            >
              {i18n.language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-gray-700 hover:text-agro-green-600">
                <FiUser className="text-xl" />
              </Link>
              <button onClick={handleLogout} className="text-gray-700 hover:text-red-600">
                <FiLogOut className="text-xl" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-agro-green-600"
            >
              {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-agro-green-50 hover:text-agro-green-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('dashboard')}
            </Link>

            {user?.role === 'farmer' && (
              <>
                <Link
                  to="/search"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-agro-green-50 hover:text-agro-green-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('searchEquipment')}
                </Link>
                <Link
                  to="/my-bookings"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-agro-green-50 hover:text-agro-green-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('bookings')}
                </Link>
              </>
            )}

            {user?.role === 'renter' && (
              <>
                <Link
                  to="/my-equipment"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-agro-green-50 hover:text-agro-green-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('myEquipment')}
                </Link>
                <Link
                  to="/add-equipment"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-agro-green-50 hover:text-agro-green-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('addEquipment')}
                </Link>
              </>
            )}

            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-agro-green-50 hover:text-agro-green-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('profile')}
            </Link>

            <button
              onClick={toggleLanguage}
              className="w-full text-left px-3 py-2 rounded-md bg-agro-blue-100 text-agro-blue-700 font-medium"
            >
              {i18n.language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
