export default function BannedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Banned</h1>

        {/* Message */}
        <div className="text-gray-600 mb-6 space-y-3">
          <p>Your account has been suspended due to violation of our community guidelines.</p>
          <p className="text-sm">You will no longer have access to UpGrade services.</p>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Need assistance?</h3>
          <p className="text-sm text-gray-600">
            If you believe this is a mistake, please contact our support team at:
          </p>
          {/* to be edited hehe just for fun cos idk if we have a support mail */}
          <a 
            href="mailto:NTUshannon1011@gmail.com" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            NTUshannon1011@gmail.com
          </a>
        </div>

        {/* Return to Login */}
        <div className="border-t border-gray-200 pt-6">
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Return to Login Page
          </a>
        </div>
      </div>
    </div>
  );
}