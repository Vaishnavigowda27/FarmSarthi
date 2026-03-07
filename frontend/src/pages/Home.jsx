import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full space-y-8">
        {/* Title + CTA */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4332] tracking-tight">
            {t('home.title') || 'Agricultural Equipment Rental Platform'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            {t('home.subtitle') ||
              'Rent agricultural equipment easily. Connect farmers with equipment owners.'}
          </p>
          <div className="inline-flex bg-white rounded-full shadow-sm border border-gray-100 p-1 gap-2 mt-2">
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#163325] min-h-[48px] flex items-center justify-center"
            >
              {t('common.login') || 'Login'}
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#1B4332] bg-[#74C69D]/20 hover:bg-[#74C69D]/30 min-h-[48px] flex items-center justify-center"
            >
              {t('common.register') || 'Register'}
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Equipment */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-start">
            <div className="w-full flex justify-center mb-3">
              <div className="h-20 w-24 rounded-2xl bg-gradient-to-br from-[#74C69D]/30 to-white border border-[#74C69D]/40 flex items-center justify-center">
                {/* Simple tractor over map illustration using emoji / shapes */}
                <div className="text-3xl">🚜</div>
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              {t('home.searchTitle') || 'Search Equipment'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              {t('home.searchDesc') || 'Find equipment near your farm.'}
            </p>
            <span className="mt-auto inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[11px] font-medium text-gray-700">
              5.2 km
            </span>
          </div>

          {/* Book Slots */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-start">
            <div className="w-full flex justify-center mb-3">
              <div className="h-20 w-24 rounded-2xl bg-gradient-to-br from-[#74C69D]/30 to-white border border-[#74C69D]/40 flex items-center justify-center">
                {/* Calendar illustration */}
                <div className="text-3xl">📅</div>
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              {t('home.bookTitle') || 'Book Slots'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              {t('home.bookDesc') ||
                'Reserve equipment for your schedule with clear time slots.'}
            </p>
            <span className="mt-auto inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-[11px] font-medium text-gray-700">
              Flexible timings
            </span>
          </div>

          {/* Pay Securely */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-start">
            <div className="w-full flex justify-center mb-3">
              <div className="h-20 w-24 rounded-2xl bg-gradient-to-br from-[#74C69D]/30 to-white border border-[#74C69D]/40 flex items-center justify-center">
                {/* Wallet + QR illustration */}
                <div className="text-3xl">💳</div>
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
              {t('home.payTitle') || 'Pay Securely'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              {t('home.payDesc') ||
                'Advance payment with Razorpay and UPI for safe transactions.'}
            </p>
            <span className="mt-auto inline-flex items-center px-3 py-1 rounded-full bg-[#74C69D]/15 text-[11px] font-semibold text-[#1B4332]">
              10% Advance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
