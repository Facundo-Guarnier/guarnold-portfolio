
import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-neutral-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-10 border border-neutral-100">
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-neutral-900 rounded-2xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-neutral-900 mb-2">Welcome Back</h2>
        <p className="text-neutral-500 text-center mb-10 font-medium">Manage your professional identity</p>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all placeholder:text-neutral-300"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all placeholder:text-neutral-300"
              placeholder="••••••••"
            />
          </div>
          <Link 
            to="/admin" 
            className="block w-full text-center bg-neutral-900 text-white font-bold py-4 rounded-xl hover:bg-neutral-800 transition-all shadow-lg hover:shadow-neutral-200"
          >
            Sign In
          </Link>
        </form>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
