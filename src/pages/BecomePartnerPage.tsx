import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Handshake,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  BadgeAlert,
  ArrowRight,
  Check
} from 'lucide-react';

export const BecomePartnerPage: React.FC = () => {
  const { addVendor, currentLocality, showToast, setCurrentRole, setCurrentPage } = useApp();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('AC & Appliances');
  const [experienceYears, setExperienceYears] = useState(5);
  const [selectedPlanId, setSelectedPlanId] = useState<'initial' | 'contractor' | 'enterprise'>('initial');
  const [submitted, setSubmitted] = useState(false);

  const planConfig = {
    initial: {
      name: 'Initial Demo Plan',
      price: 1499,
      totalOpportunities: 7,
      validityDays: 30
    },
    contractor: {
      name: 'Contractor Plan',
      price: 2999,
      totalOpportunities: 16,
      validityDays: 30
    },
    enterprise: {
      name: 'Enterprise Crew Plan',
      price: 4999,
      totalOpportunities: 30,
      validityDays: 45
    }
  };

  const selectedPlan = planConfig[selectedPlanId];

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
        name: selectedPlan.name,
        price: selectedPlan.price,
        totalOpportunities: selectedPlan.totalOpportunities,
        usedOpportunities: 0,
        remainingOpportunities: selectedPlan.totalOpportunities,
        validityDays: selectedPlan.validityDays,
        expiryDate: new Date(Date.now() + selectedPlan.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      activeJobs: 0,
      completedJobs: 0,
      rating: 5.0,
      createdAt: new Date().toISOString().split('T')[0]
    });

    setSubmitted(true);
    showToast(`Partner application submitted with ${selectedPlan.name} (₹${selectedPlan.price.toLocaleString('en-IN')})!`, 'success');
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
            className="px-4 py-2.5 rounded-xl bg-white text-[#003523] font-bold text-xs hover:bg-[#b6efd1] transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <span>Open Existing Partner Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="p-6 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Partner Subscription Plans & Verified Quotas
            </h3>
            <p className="text-xs text-[#707973]">
              Choose your starter tier. We never sell blind leads — opportunities are verified domestic requests.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#003523] bg-[#c0edd3]/40 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Zero Commission on Parts & Extra Labor
          </span>
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Initial Demo Plan */}
          <div
            onClick={() => setSelectedPlanId('initial')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedPlanId === 'initial'
                ? 'border-[#003523] bg-[#c0edd3]/25 ring-1 ring-[#003523] shadow-xs'
                : 'border-[#c0c9c2]/60 bg-white hover:border-[#003523]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#003523] uppercase tracking-wider">
                  Initial Demo Plan
                </span>
                {selectedPlanId === 'initial' ? (
                  <span className="text-[10px] font-bold bg-[#003523] text-white px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Selected</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#707973] bg-[#faf8ff] px-1.5 py-0.5 rounded">
                    Trial Tier
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-[#131b2e]">₹1,499</div>
              <div className="text-xs font-bold text-[#003523]">7 Qualified Work Opportunities</div>
              <p className="text-[11px] text-[#707973] leading-relaxed">
                30-Day validity · Immediate verified domestic dispatch across Sectors 94 to 111 (Mohali).
              </p>
            </div>
            <div className="text-[10px] text-[#404943] pt-2 border-t border-[#c0c9c2]/30">
              * Opportunities deducted only upon Operations dispatch assignment.
            </div>
          </div>

          {/* Contractor Plan */}
          <div
            onClick={() => setSelectedPlanId('contractor')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedPlanId === 'contractor'
                ? 'border-[#003523] bg-[#c0edd3]/25 ring-1 ring-[#003523] shadow-xs'
                : 'border-[#c0c9c2]/60 bg-white hover:border-[#003523]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#904d00] uppercase tracking-wider">
                  Contractor Plan
                </span>
                <span className="text-[10px] font-bold bg-[#ffdcc3] text-[#904d00] px-2 py-0.5 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-2xl font-black text-[#131b2e]">₹2,999</div>
              <div className="text-xs font-bold text-[#003523]">16 Qualified Work Opportunities</div>
              <p className="text-[11px] text-[#707973] leading-relaxed">
                30-Day validity · Multi-category allocation and fast dispatch routing.
              </p>
            </div>
            <div className="text-[10px] text-[#404943] pt-2 border-t border-[#c0c9c2]/30">
              Ideal for plumbing, electrical & gate/grill fabrication contractor teams.
            </div>
          </div>

          {/* Enterprise Crew Plan */}
          <div
            onClick={() => setSelectedPlanId('enterprise')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedPlanId === 'enterprise'
                ? 'border-[#003523] bg-[#c0edd3]/25 ring-1 ring-[#003523] shadow-xs'
                : 'border-[#c0c9c2]/60 bg-white hover:border-[#003523]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#003523] uppercase tracking-wider">
                  Enterprise Crew Plan
                </span>
                <span className="text-[10px] font-bold bg-[#c0edd3] text-[#003523] px-2 py-0.5 rounded-full">
                  BEST VALUE
                </span>
              </div>
              <div className="text-2xl font-black text-[#131b2e]">₹4,999</div>
              <div className="text-xs font-bold text-[#003523]">30 Qualified Work Opportunities</div>
              <p className="text-[11px] text-[#707973] leading-relaxed">
                45-Day validity · Priority dispatch routing & dedicated cluster coordinator.
              </p>
            </div>
            <div className="text-[10px] text-[#404943] pt-2 border-t border-[#c0c9c2]/30">
              Ideal for renovation, civil, painting & multi-artisan crews.
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#c0c9c2]/50 shadow-xs max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b border-[#c0c9c2]/40 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Apply for Partner Onboarding
            </h3>
            <p className="text-xs text-[#707973]">
              Selected Tier: <strong className="text-[#003523]">{selectedPlan.name} (₹{selectedPlan.price.toLocaleString('en-IN')})</strong>
            </p>
          </div>
          <span className="text-xs font-extrabold text-[#003523] bg-[#c0edd3]/50 px-2.5 py-1 rounded-lg">
            {selectedPlan.totalOpportunities} Leads Included
          </span>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-3 bg-[#c0edd3]/25 rounded-xl border border-[#b6efd1]">
            <CheckCircle2 className="w-12 h-12 text-[#003523] mx-auto" />
            <h4 className="font-bold text-sm text-[#003523]">Application Registered!</h4>
            <p className="text-xs text-[#404943]">
              Your business has been queued in our Operations portal under "Pending Verification" with the <strong>{selectedPlan.name} (₹{selectedPlan.price.toLocaleString('en-IN')})</strong>. Our operations supervisor will verify documents and activate your credit quota within 24 hours.
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
                  <option>Gate & Grill Fabrication</option>
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
              Required for verification: Aadhar card, trade background check, and personal interview at our operations center.
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#003523] hover:bg-[#144d37] text-white font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-1.5"
            >
              <span>Submit Partner Registration with {selectedPlan.name} (₹{selectedPlan.price.toLocaleString('en-IN')})</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
