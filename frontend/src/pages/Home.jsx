import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import tractorImg from '../assets/agro.jpeg';
import calendarImg from '../assets/assurnace.jpeg';
import paymentImg from '../assets/payment.jpeg';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#F8F9FA]" >  
    <Navbar />
    <div className ="flex items-center justify-center px-4 py-10">
         
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">  {/* gap-4 → gap-8 */}

  {/* Search Equipment */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[320px]">
    <div className="h-48 w-full rounded-2xl overflow-hidden mb-4">
      <img src={tractorImg} alt="Search Equipment" className="h-full w-full object-cover" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">Search Equipment</h3>
    <p className="text-sm text-gray-600">Find equipment near your farm.</p>
  </div>

  {/* Book Slots */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[320px]">
    <div className="h-48 w-full rounded-2xl overflow-hidden mb-4">
      <img src={calendarImg} alt="Book Slots" className="h-full w-full object-cover" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">Book Slots</h3>
    <p className="text-sm text-gray-600">Reserve equipment for your schedule.</p>
  </div>

  {/* Pay Securely */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[320px]">
    <div className="h-48 w-full rounded-2xl overflow-hidden mb-4">
      <img src={paymentImg} alt="Pay Securely" className="h-full w-full object-cover" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">Pay Securely</h3>
    <p className="text-sm text-gray-600">Advance payment by scanning QR code</p>
  </div>

</div>
      </div>
    </div>
    <Footer /> 
    </div>
  );
}
