import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Handshake,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';

export const BecomePartnerPage: React.FC = () => {
  const { addVendor, currentLocality, showToast, setCurrentRole, setCurrentPage } = useApp();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('AC & Appliances');
  const [experienceYears, setExperienceYears] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addVendor({
      id: `vnd-${Date.now()}`,
      businessName,
      ownerName,
      mobile,
      email: email || `${ownerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      categories: [category],
      serviceAreas: [currentLocality, 'Sector 104, Mohali', 'Sector 110, Mohali', 'Sector 94, Mohali'],
      experienceYears: Number(experienceYears),
      documentsVerified: false,
      status: 'PENDING_VERIFICATION',
      plan: {
        name: 'Starter Qualified Opportunity Plan',
        price: 1500,
        totalOpportunities: 7,
        usedOpportunities: 0,
        remainingOpportunities: 7,
        validityDays: 30,
        expiryDate: '2026-11-06'
      },
      activeJobs: 0,
      completedJobs: 0,
      rating: 5.0,
      createdAt: new Date().toISOString().split('T')[0]
    });

    setSubmitted(true);
    showToast('Partner application submitted! Operations officer will verify documents.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="bg-[#003523] text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <span className="bg-[#fe932c] text-[#002114] text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
          Artisans & Contractors in Punjab
        </span>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Join UrbanCare Solution as a Registered Service Partner
        </h1>
        <p className="text-xs sm:text-sm text-[#b6efd1] max-w-2xl leading-relaxed">
          Grow your local trade business across Sectors 94 to 111 (Mohali) with genuine Qualified Work Opportunities reviewed directly by our operations team.
        </p>
        <div className="pt-2">
          <button
            onClick={() => {
              setCurrentRole('vendor');
              setCurrentPage('vendor');
            }}
            className="px-4 py-2 rounded-xl bg-[#fe932c] text-[#002114] text-xs font-bold hover:bg-[#e58020] transition-colors shadow-xs inline-flex items-center space-x-2"
          >
            <span>Already an Onboarded Partner? Enter Vendor Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Qualified Work Opportunity Model Specification */}
      <div className="p-6 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-[#904d00] font-bold text-sm">
          <BadgeAlert className="w-5 h-5 text-[#904d00]" />
          <span>Our Business Rule: Transparent Qualified Work Opportunities</span>
        </div>
        <p className="text-xs text-[#404943] leading-relaxed">
          We never sell fake or blind leads. Every lead allocated to your subscription is an Operations-verified domestic breakdown where customer phone, exact sector address, and problem description have been confirmed by our dispatcher.
        </p>

        {/* Demo Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-[#003523] bg-[#c0edd3]/15 space-y-2">
            <span className="text-[10px] font-bold text-[#003523] uppercase">Initial Demo Plan</span>
            <div className="text-xl font-black text-[#131b2e]">₹1,500</div>
            <div className="text-xs font-bold text-[#003523]">7 Qualified Work Opportunities</div>
            <div className="text-[11px] text-[#707973]">30-Day validity · Kharar & Mohali Hubs</div>
            <div className="text-[11px] text-[#404943] pt-2 border-t border-[#c0c9c2]/40">
              * Opportunities are only deducted when Operations manually assigns an order to you.
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#c0c9c2]/60 bg-white space-y-2">
            <span className="text-[10px] font-bold text-[#707973] uppercase">Contractor Plan</span>
            <div className="text-xl font-black text-[#131b2e]">₹3,000</div>
            <div className="text-xs font-bold text-[#003523]">16 Qualified Work Opportunities</div>
            <div className="text-[11px] text-[#707973]">30-Day validity · Multi-category access</div>
            <div className="text-[11px] text-[#404943] pt-2 border-t border-[#c0c9c2]/40">
              Ideal for plumbing & electrical contractor teams.
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#c0c9c2]/60 bg-white space-y-2">
            <span className="text-[10px] font-bold text-[#707973] uppercase">Enterprise Crew Plan</span>
            <div className="text-xl font-black text-[#131b2e]">₹5,000</div>
            <div className="text-xs font-bold text-[#003523]">30 Qualified Work Opportunities</div>
            <div className="text-[11px] text-[#707973]">45-Day validity · Priority dispatch</div>
            <div className="text-[11px] text-[#404943] pt-2 border-t border-[#c0c9c2]/40">
              Ideal for renovation and cleaning crews.
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#c0c9c2]/50 shadow-xs max-w-2xl mx-auto space-y-4">
        <h3 className="text-base font-bold text-[#131b2e]">
          Apply for Partner Onboarding
        </h3>

        {submitted ? (
          <div className="p-6 text-center space-y-3 bg-[#c0edd3]/25 rounded-xl border border-[#b6efd1]">
            <CheckCircle2 className="w-12 h-12 text-[#003523] mx-auto" />
            <h4 className="font-bold text-sm text-[#003523]">Application Registered!</h4>
            <p className="text-xs text-[#404943]">
              Your business has been queued in our Operations portal under "Pending Verification". Our supervisor will call you within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Malwa AC & Cooling"
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Owner / Lead Artisan Name</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Jaswinder Singh"
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Mobile (+91)</label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 9888X XXXXX"
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Primary Trade Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2] font-semibold"
                >
                  <option>AC & Appliances</option>
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Carpentry & Handyman</option>
                  <option>Painting & Improvement</option>
                  <option>Home Cleaning</option>
                  <option>Pest Control</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Years of Experience in Tricity</label>
              <input
                type="number"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 text-[11px] text-[#707973]">
              Required for verification: Aadhar card, trade background check, and personal interview at our Sunny Enclave office.
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#003523] hover:bg-[#144d37] text-white font-bold rounded-xl shadow-md transition-all active:scale-98"
            >
              Submit Partner Registration
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
