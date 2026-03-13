import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTractor, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Tractor, CalendarCheck, ShieldCheck, Phone, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    q: 'How do I rent equipment?',
    a: 'Sign up as a farmer, browse equipment near your location, select a slot, and pay a 10% advance to confirm your booking.',
  },
  {
    q: 'Who can list equipment?',
    a: 'Anyone registered as a renter (equipment owner) can list their machinery. All listings go through admin verification before going live.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. We use secure payment methods and UPI for all transactions. Only a 10% advance is charged at booking; the rest is settled directly.',
  },
  {
    q: 'What if the equipment breaks down?',
    a: 'Contact the equipment owner immediately. Raise a dispute through the app and our support team will assist within 24 hours.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes, cancellations are allowed up to 12 hours before the scheduled slot. Service charges are not refunded .',
  },
  {
    q: 'Which areas do you currently serve?',
    a: 'We currently operate in and around Mysore, Karnataka. More districts are being added soon.',
  },
];

const services = [
  {
    icon: Tractor,
    title: 'Equipment Search',
    desc: 'Find tractors, harvesters, sprayers and more within your radius.',
  },
  {
    icon: CalendarCheck,
    title: 'Slot Booking',
    desc: 'Book equipment for exact time slots that fit your schedule.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    desc: 'Pay a small advance via Razorpay or UPI to lock your booking.',
  },
  {
    icon: Phone,
    title: 'Owner Connect',
    desc: 'Chat or call equipment owners directly through the platform.',
  },
];

const Footer = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(null); // 'about' | 'services' | 'faq'
  const [openFaq, setOpenFaq] = useState(null);

  const toggle = (section) => {
    setActiveSection(activeSection === section ? null : section);
    setOpenFaq(null);
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto">

      {/* Expandable: About Us */}
      {activeSection === 'about' && (
        <div className="bg-[#1B4332] px-6 py-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-extrabold text-white">
              Bridging Farmers & Equipment Owners
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              FarmSaarthi is a Mysore-based agricultural rental platform built to
              make modern farming equipment accessible to every farmer .
               We connect equipment owners with
              farmers who need machinery for a day, a week, or a season.
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              Our mission is simple: reduce the cost of farming, increase
              equipment utilisation, and help farming community grow
              together.
            </p>
          </div>
        </div>
      )}

      {/* Expandable: Services */}
      {activeSection === 'services' && (
        <div className="bg-gray-800 px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-extrabold text-white text-center mb-8">
              Our Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 bg-gray-700/50 rounded-2xl p-4">
                  <div className="h-10 w-10 rounded-xl bg-[#74C69D]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#74C69D]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expandable: FAQ */}
      {activeSection === 'faq' && (
        <div className="bg-gray-800 px-6 py-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-gray-700/50 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:bg-gray-700 transition"
                  >
                    {faq.q}
                    {openFaq === i ? (
                      <ChevronUp className="w-4 h-4 text-[#74C69D] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-xs text-gray-400 leading-relaxed border-t border-gray-600 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main footer row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <FaTractor className="text-[#74C69D] text-3xl" />
              <span className="text-2xl font-bold">{t('app.name')}</span>
            </div>
            <p className="text-gray-400 mb-4 text-sm">{t('app.tagline')}</p>
            <div className="flex space-x-4">
              <FaFacebook className="text-2xl hover:text-[#74C69D] cursor-pointer transition-colors" />
              <FaTwitter className="text-2xl hover:text-[#74C69D] cursor-pointer transition-colors" />
              <FaInstagram className="text-2xl hover:text-[#74C69D] cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: 'About Us', key: 'about' },
                { label: 'Services', key: 'services' },
                { label: "FAQ's", key: 'faq' },
              ].map(({ label, key }) => (
                <li key={key}>
                  <button
                    onClick={() => toggle(key)}
                    className={`text-sm transition-colors hover:text-[#74C69D] ${
                      activeSection === key ? 'text-[#74C69D] font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Email: support@farmsaarthi.com</li>
              <li>Phone: +91 9999999999</li>
              <li>Mysore, Karnataka</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 {t('app.name')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;