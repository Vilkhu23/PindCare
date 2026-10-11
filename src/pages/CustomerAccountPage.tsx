import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronRight,
  HardHat,
  User,
  ShieldCheck
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const {
    requests,
    projectRequests,
    setActiveTrackingRequestId,
    currentLocality,
    currentUser,
    setIsAuthModalOpen,
    logoutCustomer
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bookings' | 'projects' | 'addresses' | 'profile'>('bookings');

  // Customer initials
  const initials = currentUser
    ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : 'PB';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
      {/* Account Header */}
      <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#003523] text-white flex items-center justify-center font-bold text-lg">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#131b2e]">
                {currentUser ? currentUser.name : 'Guest Resident'}
              </h1>
              {currentUser && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c0edd3] text-[#003523]">
                  {currentUser.status || 'ACTIVE'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#707973]">
              {currentUser ? `${currentUser.phone} · ${currentUser.locality || currentLocality}` : `Not logged in · ${currentLocality}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#c0c9c2]/60 hover:bg-[#f2f3ff] text-[#131b2e] transition-colors"
              >
                Switch Account
              </button>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#003523] bg-[#c0edd3]/25 px-3 py-1.5 rounded-xl border border-[#b6efd1]">
                <ShieldCheck className="w-4 h-4 text-[#003523]" />
                <span>Verified Resident</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-xs transition-colors"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#c0c9c2]/40 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'bookings'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          My Service Bookings ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'projects'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          Home Projects ({projectRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'addresses'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          Saved Addresses (3)
        </button>
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#c0c9c2]/40 text-xs text-[#707973]">
              No service requests yet.
            </div>
          ) : (
            requests.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 hover:border-[#003523] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#131b2e]">#{order.id}</span>
                    <span className="text-[11px] text-[#707973]">· {order.createdAt}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        order.status === 'NEW'
                          ? 'bg-[#ffdcc3] text-[#904d00]'
                          : order.status === 'UNDER REVIEW'
                          ? 'bg-[#eaedff] text-[#003523]'
                          : order.status === 'ASSIGNED'
                          ? 'bg-[#c0edd3] text-[#003523]'
                          : order.status === 'IN PROGRESS'
                          ? 'bg-[#fe932c] text-[#002114]'
                          : 'bg-[#c0edd3] text-[#003523]'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-[#131b2e]">
                    {order.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                  </div>

                  <div className="text-[11px] text-[#707973]">
                    {order.address} · Preferred Slot: {order.preferredTimeSlot}
                  </div>

                  {order.assignedTo && (
                    <div className="text-[11px] text-[#003523] font-semibold pt-0.5">
                      Assigned Pro: {order.assignedTo.name} ({order.assignedTo.phone})
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#c0c9c2]/30">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#707973] block">Total</span>
                    <span className="text-sm font-black text-[#003523]">₹{order.total}</span>
                  </div>

                  <button
                    onClick={() => setActiveTrackingRequestId(order.id)}
                    className="px-3.5 py-2 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <span>View Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projectRequests.map((prj) => (
            <div
              key={prj.id}
              className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-2 text-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[11px] font-bold text-[#707973]">{prj.id}</span>
                  <h3 className="font-bold text-sm text-[#131b2e]">{prj.projectType}</h3>
                  <div className="text-[#003523] font-semibold">
                    {prj.locality} · {prj.approxAreaSqFt} sq.ft ({prj.propertyType})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eaedff] text-[#003523]">
                  {prj.status}
                </span>
              </div>
              <p className="text-[#404943] text-xs">{prj.description}</p>
              <div className="pt-2 border-t border-[#c0c9c2]/40 flex justify-between text-[#707973]">
                <span>Budget: {prj.budgetRange}</span>
                <span>Timeline: {prj.preferredStartDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 bg-white rounded-xl border border-[#003523] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#003523]">Primary Residence (Kharar)</span>
              <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-1.5 py-0.5 rounded font-bold">
                DEFAULT
              </span>
            </div>
            <p className="text-[#131b2e]">House 412, Sector 125, Sunny Enclave, Kharar, Punjab</p>
            <div className="text-[11px] text-[#707973]">Landmark: Near Desu Majra flyover</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 space-y-2">
            <span className="font-bold text-[#131b2e]">Apartment (Sector 115)</span>
            <p className="text-[#131b2e]">Flat 302, Palm Heights, Sector 115, Kharar</p>
            <div className="text-[11px] text-[#707973]">Landmark: Gillco Parkhills road</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 space-y-2">
            <span className="font-bold text-[#131b2e]">Office / Commercial</span>
            <p className="text-[#131b2e]">SCF 19, Main Landran Road, Kharar</p>
            <div className="text-[11px] text-[#707973]">Landmark: Opposite college bus stand</div>
          </div>
        </div>
      )}
    </div>
  );
};
