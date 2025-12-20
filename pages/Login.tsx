
import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-neutral-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-10 border border-neutral-100 dark:border-gray-700">
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-neutral-900 dark:bg-white rounded-2xl">
            <LogIn className="w-8 h-8 text-white dark:text-neutral-900" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-2">Welcome Back</h2>
        <p className="text-neutral-500 dark:text-gray-300 text-center mb-10 font-medium">Manage your professional identity</p>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-gray-200 mb-2">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-gray-500"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-gray-200 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-gray-500"
              placeholder="••••••••"
            />
          </div>
          <Link 
            to="/admin" 
            className="block w-full text-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-4 rounded-xl hover:bg-neutral-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-neutral-200 dark:hover:shadow-none"
          >
            Sign In
          </Link>
        </form>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-300 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
