import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-green-600">
            {t('home.appName')}
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('home.title')}
          </h2>

          <p className="text-xl text-gray-600 mb-8">
            {t('home.subtitle')}
          </p>

          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700"
            >
              {t('common.login')}
            </Link>

            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
            >
              {t('common.register')}
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                {t('home.searchTitle')}
              </h3>
              <p className="text-gray-600">
                {t('home.searchDesc')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                {t('home.bookTitle')}
              </h3>
              <p className="text-gray-600">
                {t('home.bookDesc')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-green-400 to-blue-600 flex items-center justify-center"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                {t('home.payTitle')}
              </h3>
              <p className="text-gray-600">
                {t('home.payDesc')}
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
