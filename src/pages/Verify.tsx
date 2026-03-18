import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ShieldCheck, Upload, FileText, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Verify({ session }: { session: any }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState('passport');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleContinue = () => {
    setStep(2);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      try {
        // Convert file to base64 to store in database since we might not have storage buckets set up
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Data = reader.result as string;
          
          // We'll update the user's metadata to indicate they've submitted a document
          // In a real app, you'd insert into a verification_documents table
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            await supabase.auth.updateUser({
              data: {
                verification_status: 'pending',
                verification_document_type: documentType,
                verification_document_name: file.name
              }
            });
            
            // Also save to support_messages so admin can see it
            await supabase.from('support_messages').insert([{
              user_id: user.id,
              text: `DOCUMENT_UPLOAD:${documentType}:${file.name}:${base64Data}`,
              sender: 'user',
              status: 'document_pending'
            }]);
          }
          
          setIsUploading(false);
          setIsSuccess(true);
        };
        
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          setIsUploading(false);
          alert('Error reading file. Please try again.');
        };
      } catch (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
        alert('An error occurred during upload. Please try again.');
      }
    }
  };

  return (
    <DashboardLayout session={session}>
      <div className="max-w-2xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/settings')}
          className="text-gray-400 hover:text-white flex items-center space-x-2 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Verification Submitted</h2>
              <p className="text-gray-400 mb-8 max-w-md">
                Your documents have been successfully uploaded. Our team will review them shortly. You will be notified once your account is fully verified.
              </p>
              <button 
                onClick={() => navigate('/settings')}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-xl transition-all"
              >
                Return to Settings
              </button>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4 uppercase tracking-wide">Let's Verify Your Identity</h2>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                To ensure the security of our platform and comply with financial regulations, we need to verify your identity. This process helps us protect your account from fraud and unauthorized access.
              </p>
              
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                <h4 className="text-white font-medium mb-4">What you will need:</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span>A valid government-issued ID (Passport, Driver's License, or National ID)</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span>A well-lit environment for a clear photo</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleContinue}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                CONTINUE
              </button>
            </div>
          ) : (
            <div className="py-4">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Upload Document</h2>
              <p className="text-gray-400 mb-8">Please select the type of document you wish to upload.</p>

              <div className="space-y-4 mb-8">
                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${documentType === 'passport' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <input 
                    type="radio" 
                    name="documentType" 
                    value="passport" 
                    checked={documentType === 'passport'}
                    onChange={() => setDocumentType('passport')}
                    className="hidden"
                  />
                  <FileText className={`w-6 h-6 mr-4 ${documentType === 'passport' ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div>
                    <h4 className={`font-medium ${documentType === 'passport' ? 'text-emerald-500' : 'text-white'}`}>Passport</h4>
                    <p className="text-xs text-gray-500 mt-1">Photo page only</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${documentType === 'drivers_license' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <input 
                    type="radio" 
                    name="documentType" 
                    value="drivers_license" 
                    checked={documentType === 'drivers_license'}
                    onChange={() => setDocumentType('drivers_license')}
                    className="hidden"
                  />
                  <CreditCard className={`w-6 h-6 mr-4 ${documentType === 'drivers_license' ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div>
                    <h4 className={`font-medium ${documentType === 'drivers_license' ? 'text-emerald-500' : 'text-white'}`}>Driver's License</h4>
                    <p className="text-xs text-gray-500 mt-1">Front and back</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${documentType === 'national_id' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <input 
                    type="radio" 
                    name="documentType" 
                    value="national_id" 
                    checked={documentType === 'national_id'}
                    onChange={() => setDocumentType('national_id')}
                    className="hidden"
                  />
                  <CreditCard className={`w-6 h-6 mr-4 ${documentType === 'national_id' ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div>
                    <h4 className={`font-medium ${documentType === 'national_id' ? 'text-emerald-500' : 'text-white'}`}>National ID Card</h4>
                    <p className="text-xs text-gray-500 mt-1">Front and back</p>
                  </div>
                </label>
              </div>

              <div className="relative">
                <input 
                  type="file" 
                  id="document-upload" 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
                <label 
                  htmlFor="document-upload"
                  className={`w-full flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${isUploading ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/20 hover:border-emerald-500/50 hover:bg-white/5'}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                      <span className="text-emerald-500 font-medium">Uploading document...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-emerald-500" />
                      </div>
                      <span className="text-white font-medium mb-2">Click to UPLOAD document</span>
                      <span className="text-xs text-gray-500">Supports JPG, PNG, or PDF (Max 10MB)</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
