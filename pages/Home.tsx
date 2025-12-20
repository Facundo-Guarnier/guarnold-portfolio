
import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Download } from 'lucide-react';
import { useCVData } from '../hooks/useCVData';
import { CVPreview } from '../components/cv/CVPreview';

const Home: React.FC = () => {
  const { data } = useCVData();

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${data.personal.nombre.replace(/\s+/g, '_')}_CV`;
    window.print();
    // Note: We leave the title changed as reverting immediately can sometimes race with the print dialog
  };

  return (
    <div className="min-h-screen bg-neutral-100 md:py-10 print:bg-white print:py-0">
      {/* Navigation Controls - Hidden when printing */}
      <div className="fixed top-5 right-5 z-50 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-full shadow-lg hover:bg-neutral-50 transition-all font-medium border border-neutral-200"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download PDF</span>
        </button>
        <Link 
          to="/admin" 
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-all font-medium"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Edit CV</span>
        </Link>
      </div>

      {/* Main CV View */}
      <div className="print:w-full flex justify-center">
        <div className="w-full">
          <CVPreview data={data} />
        </div>
      </div>

      <footer className="mt-12 text-center text-neutral-400 text-xs print:hidden pb-10">
        <p>Guarnold CV System • Local Data Only</p>
      </footer>
    </div>
  );
};

export default Home;
