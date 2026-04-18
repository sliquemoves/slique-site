import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-white/10 text-[8rem] font-light leading-none"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>404</p>
          <div className="h-[1px] w-16 bg-white/20 mx-auto" />
        </div>
        <div className="space-y-3">
          <h1 className="text-xl font-medium text-white tracking-wide">Page Not Found</h1>
          <p className="text-gray-500 leading-relaxed text-sm">
            The page <span className="text-gray-300">"{pageName}"</span> doesn't exist.
          </p>
        </div>
        <div className="pt-4">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-xs tracking-widest uppercase font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
