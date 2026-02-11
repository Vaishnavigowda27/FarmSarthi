import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaMapMarkerAlt,
  FaCalendarCheck,
  FaShieldAlt,
  FaHeadset,
  FaSearch,
  FaCreditCard,
  FaTruck,
  FaStar,
} from 'react-icons/fa';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl mb-8 text-white/90">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/equipment" className="bg-white text-primary-500 hover:bg-gray-100 font-medium px-8 py-3 rounded-lg transition-colors duration-200">
                {t('home.hero.cta')}
              </Link>
              <Link to="/register" className="bg-transparent border-2 border-white hover:bg-white hover:text-primary-500 font-medium px-8 py-3 rounded-lg transition-colors duration-200">
                {t('home.hero.register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-primary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.features.location.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.location.desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarCheck className="text-secondary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.features.booking.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.booking.desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-primary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.features.verified.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.verified.desc')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-xl hover:shadow-xl transition-shadow">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeadset className="text-secondary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.features.support.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.features.support.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            {t('home.how.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 -mt-12">
                <FaSearch className="text-primary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.how.step1.title')}
              </h3>
              <p className="text-gray-600">{t('home.how.step1.desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-secondary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 -mt-12">
                <FaCreditCard className="text-secondary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.how.step2.title')}
              </h3>
              <p className="text-gray-600">{t('home.how.step2.desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-primary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 -mt-12">
                <FaTruck className="text-primary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.how.step3.title')}
              </h3>
              <p className="text-gray-600">{t('home.how.step3.desc')}</p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-secondary-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 -mt-12">
                <FaStar className="text-secondary-500 text-2xl" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                {t('home.how.step4.title')}
              </h3>
              <p className="text-gray-600">{t('home.how.step4.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of farmers and equipment renters on our platform
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-500 hover:bg-gray-100 font-medium px-8 py-3 rounded-lg inline-block transition-colors duration-200"
          >
            {t('home.hero.register')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;