import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../utils/helpers';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';

const UPI_ID = import.meta.env.VITE_UPI_ID || 'farmsaarthi@upi';
const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'FarmSaarthi';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => { loadBooking(); }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`);
      const b = response.data.booking;
      setBooking(b);
      generateQR(b.pricing?.serviceCharge ?? b.advancePaid ?? 0);
    } catch {
      showToast('Failed to load booking', 'error');
      navigate('/farmer');
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (amount) => {
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('FarmSaarthi service charge')}`;
    const dataUrl = await QRCode.toDataURL(upiUrl, { width: 200, margin: 2 });
    setQrDataUrl(dataUrl);
  };

  const handlePaid = async () => {
    setProcessing(true);
    try {
      await axios.post('/api/payments/confirm', { bookingId, paymentType: 'advance' });
      showToast('Booking confirmed!', 'success');
      navigate('/farmer');
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-sm text-gray-500">{t('payment.loading')}</div>
    </div>
  );

  if (!booking) return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-gray-600">{t('payment.notFound')}</p>
    </div>
  );

  const serviceCharge = booking.pricing?.serviceCharge ?? booking.advancePaid ?? 0;
  const remaining = booking.pricing?.remainingPayment ?? booking.remainingAmount ?? 0;

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-lg sm:text-xl font-bold text-[#1B4332] mb-2">{t('payment.title')}</h1>
        <p className="text-xs text-gray-600">{t('payment.subtitle')}</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="border-b border-[#74C69D]/40 px-6 py-3 bg-[#74C69D]/10">
            <div className="flex items-center justify-center gap-2 text-xs text-[#1B4332]">
              <span className="text-sm">🔒</span>
              <span className="font-semibold">{t('payment.securePayment')}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            <div>
              <h2 className="text-sm font-bold mb-3 text-[#1B4332]">{t('payment.bookingSummary')}</h2>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">{t('payment.equipmentLabel')}</span>
                  <span className="font-semibold text-gray-800">{booking.equipment?.name ?? booking.equipmentId?.name ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">{t('payment.dateLabel')}</span>
                  <span className="font-medium text-gray-800">
                    {new Date(booking.bookingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">{t('payment.timeSlotLabel')}</span>
                  <span className="font-medium text-gray-800">
                    {booking.timeSlot?.startTime ?? booking.startTime} – {booking.timeSlot?.endTime ?? booking.endTime} ({booking.timeSlot?.duration ?? booking.hours ?? 0} hrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">{t('payment.distanceLabel')}</span>
                  <span className="font-medium text-gray-800">{booking.distance ?? 0} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">{t('payment.ownerLabel')}</span>
                  <span className="font-medium text-gray-800">
                    {booking.renter?.name ?? booking.renterId?.name ?? 'N/A'} • {booking.renter?.phone ?? booking.renterId?.phone ?? ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-[#74C69D]/15 border border-[#74C69D]/40 p-4 space-y-1">
                <h3 className="text-sm font-bold text-[#1B4332]">{t('payment.payNowTitle')}</h3>
                <p className="text-2xl font-bold text-[#2D6A4F]">₹{serviceCharge.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-gray-700">{t('payment.payNowDesc')}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-1">
                <h3 className="text-sm font-bold text-[#1B4332]">{t('payment.payAfterTitle')}</h3>
                <p className="text-2xl font-bold text-[#1B4332]">₹{remaining.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-gray-700">{t('payment.payAfterDesc')}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6 text-center">
              <h3 className="text-sm font-bold text-[#1B4332] mb-1">
                {t('payment.scanTitle')} ₹{serviceCharge.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-gray-500 mb-4">{t('payment.scanHint')}</p>
              {qrDataUrl
                ? <img src={qrDataUrl} alt="UPI QR code" className="w-44 h-44 mx-auto rounded-xl border border-gray-100" />
                : <div className="w-44 h-44 mx-auto bg-gray-100 rounded-xl animate-pulse" />}
              <p className="text-xs text-gray-500 mt-3">{t('payment.upiId')} <strong className="text-gray-800">{UPI_ID}</strong></p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-900">
              <p className="font-semibold mb-1">{t('payment.importantTitle')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('payment.note1')}</li>
                <li>{t('payment.note2')}</li>
                <li>{t('payment.note3')}</li>
              </ul>
            </div>

            <button onClick={handlePaid} disabled={processing}
              className="w-full bg-[#2D6A4F] text-white py-3 rounded-2xl font-semibold text-sm disabled:bg-gray-400 flex items-center justify-center gap-2">
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {t('payment.confirming')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {t('payment.paid')}
                </>
              )}
            </button>
            <p className="text-center text-gray-400 text-xs">{t('payment.confirmNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;