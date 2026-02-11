import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-green-600">FarmSaarthi</h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Agricultural Equipment Rental Platform
          </h2>
          <p className="text-xl text-gray-600 mb-8">
             Rent Agricultural Equipment Easily .Connect farmers with equipment owners.
          </p>
          
          <div className="flex justify-center gap-4">
            <Link 
              to="/login" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Placeholder Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-white text-6xl"></span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Search Equipment</h3>
              <p className="text-gray-600">Find equipment near your farm</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-6xl"></span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Book Slots</h3>
              <p className="text-gray-600">Reserve equipment for your schedule</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-green-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-6xl"></span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Pay Securely</h3>
              <p className="text-gray-600">Advance payment with Razorpay</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}