import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  ServiceItem,
  ServicePackage,
  CartItem,
  ServiceRequest,
  Vendor,
  Employee,
  HomeProjectRequest,
  CustomerReview,
  AuditLog,
  BookingStatus,
  OpportunityLedgerEntry,
  PriceHistoryRecord,
  PriceType,
  CustomerRecord,
  ComplaintRecord,
  PaymentRecord,
  OpsSettings,
  InternalNote,
  AssignmentHistoryItem,
  EmployeeNotification,
  DPDPConsentPreferences,
  DPDPNominee,
  DPDPGrievance
} from '../types';
import {
  INITIAL_SERVICES,
  INITIAL_PACKAGES,
  INITIAL_VENDORS,
  INITIAL_EMPLOYEES,
  INITIAL_REQUESTS,
  INITIAL_PROJECT_REQUESTS,
  INITIAL_REVIEWS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRICE_HISTORY,
  INITIAL_CUSTOMERS,
  INITIAL_COMPLAINTS,
  INITIAL_PAYMENTS,
  INITIAL_OPS_SETTINGS,
  INITIAL_OPPORTUNITY_LEDGER,
  INITIAL_EMPLOYEE_NOTIFICATIONS,
  LOCALITIES
} from '../data/initialData';
import { calculateOrderPricing, normalizeServiceItem } from '../utils/pricingEngine';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  db,
  persistServiceRequest,
  persistCustomerReview,
  persistHomeProject,
  persistComplaint
} from '../firebase';

interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Navigation & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentLocality: string;
  setCurrentLocality: (loc: string) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;

  // Catalog & Pricing Engine
  services: ServiceItem[];
  packages: ServicePackage[];
  priceHistory: PriceHistoryRecord[];
  updateServicePricing: (id: string, updates: Partial<ServiceItem>, reason?: string, changedBy?: string) => void;
  toggleServiceActive: (id: string) => void;
  addService: (service: ServiceItem) => void;
  updatePackage: (id: string, updates: Partial<ServicePackage>) => void;

  // Cart
  cart: CartItem[];
  addToCart: (service: ServiceItem, quantity?: number) => void;
  addPackageToCart: (pkg: ServicePackage) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: {
    itemSubtotal: number;
    visitFee: number;
    taxPercent: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    hasQuoteRequired: boolean;
    itemCount: number;
  };

  // Service Requests & Bookings
  requests: ServiceRequest[];
  createBookingFromCart: (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    landmark?: string;
    preferredDate: string;
    preferredTimeSlot: string;
    notes?: string;
  }) => string;
  createCustomRequirement: (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    requirementText: string;
    preferredDate: string;
    preferredTimeSlot: string;
    category?: string;
  }) => string;
  createProjectRequest: (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    projectType: string;
    propertyType: string;
    approxAreaSqFt: number;
    budgetRange: string;
    preferredStartDate: string;
    description: string;
  }) => string;

  // Operations Control Workflow
  updateRequestStatus: (requestId: string, newStatus: BookingStatus, note?: string) => void;
  assignRequest: (
    requestId: string,
    assigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    notes?: string,
    assignedBy?: string,
    reason?: string
  ) => void;
  reassignRequest: (
    requestId: string,
    newAssigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    reason: string,
    notes?: string,
    assignedBy?: string
  ) => void;
  addInternalNote: (requestId: string, text: string, author?: string) => void;

  // Customers
  customers: CustomerRecord[];
  addCustomer: (customer: CustomerRecord) => void;
  updateCustomerStatus: (customerId: string, status: CustomerRecord['status']) => void;

  // Complaints
  complaints: ComplaintRecord[];
  addComplaint: (complaint: Partial<ComplaintRecord>) => void;
  resolveComplaint: (id: string, resolutionNotes: string) => void;

  // Payments
  payments: PaymentRecord[];
  recordPayment: (payment: Partial<PaymentRecord>) => void;

  // Operations Settings
  opsSettings: OpsSettings;
  updateOpsSettings: (updates: Partial<OpsSettings>) => void;

  // Vendors & Opportunity Ledger
  vendors: Vendor[];
  opportunityLedger: OpportunityLedgerEntry[];
  adjustVendorOpportunities: (vendorId: string, delta: number, reason: string) => void;
  updateVendorStatus: (vendorId: string, status: Vendor['status']) => void;
  addVendor: (vendor: Vendor) => void;

  // Vendor Portal Actions (Strict Role Protection & Privacy Gate)
  currentVendorId: string | null;
  setCurrentVendorId: (id: string | null) => void;
  vendorAcceptAssignment: (requestId: string, notes?: string) => void;
  vendorRejectAssignment: (requestId: string, reason: string, notes?: string) => void;
  vendorConfirmSchedule: (requestId: string, confirmedSlot: string, notes?: string) => void;
  vendorMarkArrived: (requestId: string) => void;
  vendorStartWork: (requestId: string, notes?: string) => void;
  vendorUploadCompletionPhotos: (requestId: string, photos: string[]) => void;
  vendorAddNotes: (requestId: string, note: string) => void;
  vendorCompleteJob: (
    requestId: string,
    paymentMode: 'CASH' | 'UPI' | 'ONLINE',
    notes?: string,
    photos?: string[]
  ) => void;

  // Employees & Employee Portal Actions
  employees: Employee[];
  updateEmployeeAvailability: (employeeId: string, availability: Employee['availability']) => void;
  addEmployee: (employee: Employee) => void;
  currentEmployeeId: string | null;
  setCurrentEmployeeId: (id: string | null) => void;
  employeeNotifications: EmployeeNotification[];
  markNotificationAsRead: (id: string) => void;
  employeeAcceptJob: (requestId: string, notes?: string) => void;
  employeeRejectJob: (requestId: string, reason: string, notes?: string) => void;
  employeeMarkArrived: (requestId: string) => void;
  employeeStartWork: (requestId: string, notes?: string) => void;
  employeeCompleteWork: (
    requestId: string,
    completionNotes: string,
    completionPhotos: string[],
    materialInfo?: string,
    partsUsed?: { name: string; quantity: number; cost: number }[],
    paymentCollectedMode?: 'CASH' | 'UPI' | 'ONLINE'
  ) => void;

  // Home Projects
  projectRequests: HomeProjectRequest[];
  updateProjectStatus: (projectId: string, status: HomeProjectRequest['status'], notes?: string) => void;

  // Reviews
  reviews: CustomerReview[];
  submitReview: (requestId: string, rating: number, feedback: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditEntry: (
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    performedBy?: string
  ) => void;

  // Active Selected Tracker / Modal Triggers
  activeTrackingRequestId: string | null;
  setActiveTrackingRequestId: (id: string | null) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCustomTaskModalOpen: boolean;
  setIsCustomTaskModalOpen: (open: boolean) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  isLocalityModalOpen: boolean;
  setIsLocalityModalOpen: (open: boolean) => void;
  selectedDetailServiceId: string | null;
  setSelectedDetailServiceId: (id: string | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Customer Authentication & Session State
  currentUser: CustomerRecord | null;
  setCurrentUser: (user: CustomerRecord | null) => void;
  loginCustomer: (phoneOrEmail: string, otpOrPassword?: string) => boolean;
  registerCustomer: (details: {
    name: string;
    phone: string;
    email?: string;
    locality?: string;
    address?: string;
  }) => CustomerRecord;
  logoutCustomer: () => void;

  // DPDP Act 2023 Compliance & Data Principal Rights
  dpdpConsent: DPDPConsentPreferences;
  updateDPDPConsent: (preferences: Partial<DPDPConsentPreferences>) => void;
  dpdpNominee: DPDPNominee | null;
  updateDPDPNominee: (nominee: DPDPNominee) => void;
  dpdpGrievances: DPDPGrievance[];
  fileDPDPGrievance: (grievance: Omit<DPDPGrievance, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'dpoOfficer'>) => DPDPGrievance;
  requestDataErasure: (reason?: string) => void;
  exportPersonalData: () => string;
  isDPDPNoticeOpen: boolean;
  setIsDPDPNoticeOpen: (open: boolean) => void;
  isDPDPConsentManagerOpen: boolean;
  setIsDPDPConsentManagerOpen: (open: boolean) => void;
  isDPDPDataRightsOpen: boolean;
  setIsDPDPDataRightsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SERVICES: 'pindcare_services_v1',
  PACKAGES: 'pindcare_packages_v1',
  REQUESTS: 'pindcare_requests_v1',
  VENDORS: 'pindcare_vendors_v1',
  EMPLOYEES: 'pindcare_employees_v1',
  PROJECTS: 'pindcare_projects_v1',
  REVIEWS: 'pindcare_reviews_v1',
  AUDIT: 'pindcare_audit_v1',
  LEDGER: 'pindcare_ledger_v1',
  CART: 'pindcare_cart_v1',
  LOCALITY: 'pindcare_locality_v1',
  PRICE_HISTORY: 'pindcare_price_history_v1',
  CURRENT_VENDOR: 'pindcare_current_vendor_v1',
  CURRENT_EMPLOYEE: 'pindcare_current_employee_v1',
  EMPLOYEE_NOTIFICATIONS: 'pindcare_employee_notifications_v1',
  CURRENT_USER: 'pindcare_current_user_v1',
  DPDP_CONSENT: 'urbancare_dpdp_consent_v1',
  DPDP_NOMINEE: 'urbancare_dpdp_nominee_v1',
  DPDP_GRIEVANCES: 'urbancare_dpdp_grievances_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [currentVendorId, setCurrentVendorIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_VENDOR) || 'vnd-1';
  });

  const setCurrentVendorId = (id: string | null) => {
    setCurrentVendorIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_VENDOR, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_VENDOR);
    }
  };

  const [currentEmployeeId, setCurrentEmployeeIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_EMPLOYEE) || 'emp-1';
  });

  const setCurrentEmployeeId = (id: string | null) => {
    setCurrentEmployeeIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_EMPLOYEE, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_EMPLOYEE);
    }
  };

  const [employeeNotifications, setEmployeeNotifications] = useState<EmployeeNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_NOTIFICATIONS, JSON.stringify(employeeNotifications));
  }, [employeeNotifications]);

  const markNotificationAsRead = (id: string) => {
    setEmployeeNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const [currentLocality, setCurrentLocalityState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LOCALITY) || LOCALITIES[0];
  });

  const setCurrentLocality = (loc: string) => {
    setCurrentLocalityState(loc);
    localStorage.setItem(STORAGE_KEYS.LOCALITY, loc);
    showToast(`Neighborhood set to ${loc}`, 'info');
  };

  // Load or initialize Services
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!saved) return INITIAL_SERVICES;
    try {
      const parsed: ServiceItem[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((s) => s.id));
      const missing = INITIAL_SERVICES.filter((s) => !existingIds.has(s.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  // Price History records
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
    return saved ? JSON.parse(saved) : INITIAL_PRICE_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(priceHistory));
  }, [priceHistory]);

  // Packages
  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
  });

  // Requests
  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  // Opportunity Ledger
  const [opportunityLedger, setOpportunityLedger] = useState<OpportunityLedgerEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return saved ? JSON.parse(saved) : INITIAL_OPPORTUNITY_LEDGER;
  });

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  // Projects
  const [projectRequests, setProjectRequests] = useState<HomeProjectRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_REQUESTS;
  });

  // Reviews
  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [
      {
        serviceId: 'srv-ac-gen',
        serviceName: 'AC General Service',
        category: 'AC & Appliances',
        price: 499,
        visitFee: 99,
        quantity: 1
      }
    ];
  });

  // Modals & UI States
  const [activeTrackingRequestId, setActiveTrackingRequestId] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCustomTaskModalOpen, setIsCustomTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isLocalityModalOpen, setIsLocalityModalOpen] = useState(false);
  const [selectedDetailServiceId, setSelectedDetailServiceId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // DPDP Modals & Rights States
  const [isDPDPNoticeOpen, setIsDPDPNoticeOpen] = useState(false);
  const [isDPDPConsentManagerOpen, setIsDPDPConsentManagerOpen] = useState(false);
  const [isDPDPDataRightsOpen, setIsDPDPDataRightsOpen] = useState(false);

  const [dpdpConsent, setDpdpConsent] = useState<DPDPConsentPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DPDP_CONSENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      essentialService: true,
      dispatchUpdates: true,
      promotionalMarketing: false,
      callMasking: true,
      consentedAt: new Date().toISOString(),
      ipJurisdiction: 'Kharar & Mohali (Punjab, India)',
      version: 'DPDP-2023-V1.2'
    };
  });

  const [dpdpNominee, setDpdpNominee] = useState<DPDPNominee | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DPDP_NOMINEE);
    return saved ? JSON.parse(saved) : null;
  });

  const [dpdpGrievances, setDpdpGrievances] = useState<DPDPGrievance[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DPDP_GRIEVANCES);
    return saved ? JSON.parse(saved) : [
      {
        id: 'grv-sample-1',
        ticketNo: 'DPDP-GRV-8492',
        userName: 'Simranjeet Singh',
        userPhone: '+91 98881 22340',
        type: 'RIGHT_TO_ACCESS',
        description: 'Requested verification of technician call masking on sector 115 booking.',
        status: 'RESOLVED',
        createdAt: '2025-05-10T10:00:00.000Z',
        dpoOfficer: 'Mr. Gurpreet Singh (DPO, Kharar)',
        resolutionNotes: 'Masked call relay verified active. No personal numbers exposed.'
      }
    ];
  });

  // Sync DPDP preferences to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DPDP_CONSENT, JSON.stringify(dpdpConsent));
  }, [dpdpConsent]);

  useEffect(() => {
    if (dpdpNominee) {
      localStorage.setItem(STORAGE_KEYS.DPDP_NOMINEE, JSON.stringify(dpdpNominee));
    } else {
      localStorage.removeItem(STORAGE_KEYS.DPDP_NOMINEE);
    }
  }, [dpdpNominee]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DPDP_GRIEVANCES, JSON.stringify(dpdpGrievances));
  }, [dpdpGrievances]);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(opportunityLedger));
  }, [opportunityLedger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projectRequests));
  }, [projectRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  // Real-time Firestore synchronization for UrbanCare Solution
  useEffect(() => {
    let unsubReq = () => {};
    let unsubRev = () => {};
    let unsubProj = () => {};
    let unsubComp = () => {};

    try {
      unsubReq = onSnapshot(collection(db, 'service_requests'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudRequests: ServiceRequest[] = [];
          snapshot.forEach((d) => {
            cloudRequests.push(d.data() as ServiceRequest);
          });
          setRequests((prev) => {
            const map = new Map<string, ServiceRequest>();
            prev.forEach((r) => map.set(r.id, r));
            cloudRequests.forEach((r) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
      }, (err) => {
        console.warn('Firestore service_requests sync notice:', err.message);
      });

      unsubRev = onSnapshot(collection(db, 'customer_reviews'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudReviews: CustomerReview[] = [];
          snapshot.forEach((d) => {
            cloudReviews.push(d.data() as CustomerReview);
          });
          setReviews((prev) => {
            const map = new Map<string, CustomerReview>();
            prev.forEach((r) => map.set(r.id, r));
            cloudReviews.forEach((r) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
      }, (err) => {
        console.warn('Firestore customer_reviews sync notice:', err.message);
      });

      unsubProj = onSnapshot(collection(db, 'home_projects'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudProjects: HomeProjectRequest[] = [];
          snapshot.forEach((d) => {
            cloudProjects.push(d.data() as HomeProjectRequest);
          });
          setProjectRequests((prev) => {
            const map = new Map<string, HomeProjectRequest>();
            prev.forEach((p) => map.set(p.id, p));
            cloudProjects.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      }, (err) => {
        console.warn('Firestore home_projects sync notice:', err.message);
      });

      unsubComp = onSnapshot(collection(db, 'complaints'), (snapshot) => {
        if (!snapshot.empty) {
          const cloudComplaints: ComplaintRecord[] = [];
          snapshot.forEach((d) => {
            cloudComplaints.push(d.data() as ComplaintRecord);
          });
          setComplaints((prev) => {
            const map = new Map<string, ComplaintRecord>();
            prev.forEach((c) => map.set(c.id, c));
            cloudComplaints.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      }, (err) => {
        console.warn('Firestore complaints sync notice:', err.message);
      });
    } catch (err) {
      console.warn('Firestore real-time listeners initialization notice:', err);
    }

    return () => {
      unsubReq();
      unsubRev();
      unsubProj();
      unsubComp();
    };
  }, []);

  // Customers
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    const saved = localStorage.getItem('pindcare_customers_v1');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Current logged in customer state (persisted)
  const [currentUser, setCurrentUserState] = useState<CustomerRecord | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default to first customer (Amanjot Sandhu) for seamless prototype testing
    return INITIAL_CUSTOMERS[0] || null;
  });

  const setCurrentUser = (user: CustomerRecord | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  };

  // Complaints
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => {
    const saved = localStorage.getItem('pindcare_complaints_v1');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  // Payments
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('pindcare_payments_v1');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  // Operations Settings
  const [opsSettings, setOpsSettings] = useState<OpsSettings>(() => {
    const saved = localStorage.getItem('pindcare_settings_v1');
    return saved ? JSON.parse(saved) : INITIAL_OPS_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('pindcare_customers_v1', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pindcare_complaints_v1', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('pindcare_payments_v1', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('pindcare_settings_v1', JSON.stringify(opsSettings));
  }, [opsSettings]);

  // Toast Helpers
  const showToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAuditEntry = (
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    performedBy?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      entityType,
      entityId,
      details,
      performedBy:
        performedBy || (currentRole === 'operations' ? 'Operations Dispatch Supervisor' : 'Customer System'),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addCustomer = (customer: CustomerRecord) => {
    setCustomers((prev) => [customer, ...prev]);
    addAuditEntry('CUSTOMER_ADDED', 'VENDOR', customer.id, `Created customer record for ${customer.name}`);
    showToast(`Added customer ${customer.name}`, 'success');
  };

  const loginCustomer = (phoneOrEmail: string, otpOrPassword?: string): boolean => {
    const cleanInput = phoneOrEmail.trim().toLowerCase();
    const cleanPhoneDigits = cleanInput.replace(/\D/g, '');
    
    // Find customer in database by email, full phone, or last 10 digits
    const existing = customers.find((c) => {
      const cEmail = (c.email || '').trim().toLowerCase();
      const cPhoneDigits = c.phone.replace(/\D/g, '');
      return (
        cEmail === cleanInput ||
        cPhoneDigits === cleanPhoneDigits ||
        (cleanPhoneDigits.length >= 10 && cPhoneDigits.endsWith(cleanPhoneDigits.slice(-10)))
      );
    });

    if (existing) {
      setCurrentUser(existing);
      setCurrentRole('customer');
      if (existing.locality) {
        setCurrentLocalityState(existing.locality);
      }
      addAuditEntry('CUSTOMER_LOGIN', 'VENDOR', existing.id, `Customer ${existing.name} logged in`);
      showToast(`Welcome back, ${existing.name}!`, 'success');
      return true;
    } else {
      // If user provided a valid 10-digit phone number or email, auto-create or register account
      if (cleanPhoneDigits.length >= 10 || cleanInput.includes('@')) {
        const generatedName = cleanInput.includes('@') 
          ? cleanInput.split('@')[0].replace('.', ' ')
          : `Resident ${cleanPhoneDigits.slice(-4)}`;
        const formattedPhone = cleanPhoneDigits.length >= 10 
          ? `+91 ${cleanPhoneDigits.slice(-10)}` 
          : phoneOrEmail;

        const newCustomer: CustomerRecord = {
          id: `cust-${Date.now()}`,
          name: generatedName.charAt(0).toUpperCase() + generatedName.slice(1),
          phone: formattedPhone,
          email: cleanInput.includes('@') ? cleanInput : `${cleanPhoneDigits}@urbancaresolution.in`,
          locality: currentLocality,
          address: `House / Flat, ${currentLocality}`,
          totalBookings: 0,
          totalSpent: 0,
          registeredDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE'
        };

        setCustomers((prev) => [newCustomer, ...prev]);
        setCurrentUser(newCustomer);
        setCurrentRole('customer');
        addAuditEntry('CUSTOMER_REGISTERED', 'VENDOR', newCustomer.id, `New customer registered: ${newCustomer.phone}`);
        showToast(`Account created & logged in as ${newCustomer.name}`, 'success');
        return true;
      }

      showToast('Please enter a valid 10-digit mobile number or email.', 'error');
      return false;
    }
  };

  const registerCustomer = (details: {
    name: string;
    phone: string;
    email?: string;
    locality?: string;
    address?: string;
  }): CustomerRecord => {
    const cleanPhoneDigits = details.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhoneDigits.length >= 10
      ? `+91 ${cleanPhoneDigits.slice(-10)}`
      : details.phone;

    // Check if customer already exists by phone
    const existing = customers.find((c) => {
      const cPhoneDigits = c.phone.replace(/\D/g, '');
      return cleanPhoneDigits.length >= 10 && cPhoneDigits.endsWith(cleanPhoneDigits.slice(-10));
    });

    if (existing) {
      const updated: CustomerRecord = {
        ...existing,
        name: details.name || existing.name,
        email: details.email || existing.email,
        locality: details.locality || existing.locality,
        address: details.address || existing.address
      };
      setCustomers((prev) => prev.map((c) => (c.id === existing.id ? updated : c)));
      setCurrentUser(updated);
      setCurrentRole('customer');
      if (updated.locality) setCurrentLocalityState(updated.locality);
      showToast(`Welcome back, ${updated.name}! Details updated.`, 'success');
      return updated;
    }

    const newCustomer: CustomerRecord = {
      id: `cust-${Date.now()}`,
      name: details.name.trim() || 'Tricity Resident',
      phone: formattedPhone,
      email: details.email || '',
      locality: details.locality || currentLocality,
      address: details.address || `Flat/House, ${details.locality || currentLocality}`,
      totalBookings: 0,
      totalSpent: 0,
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setCurrentUser(newCustomer);
    setCurrentRole('customer');
    if (newCustomer.locality) setCurrentLocalityState(newCustomer.locality);
    addAuditEntry('CUSTOMER_REGISTERED', 'VENDOR', newCustomer.id, `Customer registered: ${newCustomer.name} (${newCustomer.phone})`);
    showToast(`Welcome to UrbanCare Solution, ${newCustomer.name}!`, 'success');
    return newCustomer;
  };

  const logoutCustomer = () => {
    const prevName = currentUser?.name;
    setCurrentUser(null);
    showToast(prevName ? `Logged out of ${prevName}'s account` : 'Logged out', 'info');
  };

  const updateCustomerStatus = (customerId: string, status: CustomerRecord['status']) => {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, status } : c)));
    addAuditEntry('CUSTOMER_STATUS_UPDATED', 'VENDOR', customerId, `Customer status changed to ${status}`);
    showToast(`Customer status updated to ${status}`, 'info');
  };

  const addComplaint = (complaint: Partial<ComplaintRecord>) => {
    const newId = `cmp-${Date.now()}`;
    const full: ComplaintRecord = {
      id: newId,
      requestId: complaint.requestId || 'PB-GENERAL',
      customerName: complaint.customerName || 'Anonymous',
      customerPhone: complaint.customerPhone || '',
      artisanName: complaint.artisanName,
      issueType: complaint.issueType || 'OTHER',
      description: complaint.description || '',
      severity: complaint.severity || 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      ...complaint
    };
    setComplaints((prev) => [full, ...prev]);
    persistComplaint(full).catch((err) => console.warn('Firestore persist complaint notice:', err));
    addAuditEntry('COMPLAINT_LOGGED', 'SERVICE_REQUEST', full.requestId, `Logged ${full.severity} complaint: ${full.issueType}`);
    showToast(`Complaint #${newId} logged for supervisor investigation`, 'warning');
  };

  const resolveComplaint = (id: string, resolutionNotes: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'RESOLVED', resolutionNotes, resolvedAt: now } : c
      )
    );
    addAuditEntry('COMPLAINT_RESOLVED', 'SERVICE_REQUEST', id, `Resolution: ${resolutionNotes}`);
    showToast(`Complaint #${id} marked resolved`, 'success');
  };

  const recordPayment = (pay: Partial<PaymentRecord>) => {
    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      requestId: pay.requestId || 'PB-DIRECT',
      customerName: pay.customerName || 'Customer',
      amount: pay.amount || 0,
      mode: pay.mode || 'UPI',
      status: pay.status || 'SUCCESS',
      transactionRef: pay.transactionRef || `TXN-${Date.now()}`,
      collectedBy: pay.collectedBy || 'Operations Lead',
      date: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      ...pay
    };
    setPayments((prev) => [newRecord, ...prev]);
    if (newRecord.requestId) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === newRecord.requestId
            ? { ...r, paymentStatus: 'PAID', paymentMode: newRecord.mode === 'CASH' ? 'CASH' : 'UPI' }
            : r
        )
      );
    }
    addAuditEntry(
      'PAYMENT_RECORDED',
      'SERVICE_REQUEST',
      newRecord.requestId,
      `Recorded ₹${newRecord.amount} (${newRecord.mode}) ref: ${newRecord.transactionRef}`
    );
    showToast(`Payment of ₹${newRecord.amount} logged!`, 'success');
  };

  const updateOpsSettings = (updates: Partial<OpsSettings>) => {
    setOpsSettings((prev) => ({ ...prev, ...updates }));
    addAuditEntry('SETTINGS_UPDATED', 'PRICING', 'GLOBAL_SETTINGS', `Updated Operations settings`);
    showToast('Operations settings updated', 'success');
  };

  const addInternalNote = (requestId: string, text: string, author: string = 'Harman (Ops Lead)') => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const newNote: InternalNote = {
      id: `in-${Date.now()}`,
      author,
      text,
      timestamp: now
    };
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, internalNotes: [...(r.internalNotes || []), newNote], updatedAt: now }
          : r
      )
    );
    addAuditEntry('INTERNAL_NOTE_ADDED', 'SERVICE_REQUEST', requestId, `Note by ${author}: "${text.substring(0, 40)}..."`, author);
    showToast('Internal note saved to file', 'success');
  };

  // Pricing & Catalog mutations
  const updateServicePricing = (
    id: string,
    updates: Partial<ServiceItem>,
    reason?: string,
    changedBy?: string
  ) => {
    const currentService = services.find((s) => s.id === id);
    if (!currentService) return;

    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const effectiveDate = updates.effective_from || new Date().toISOString().split('T')[0];
    const operator = changedBy || (currentRole === 'operations' ? 'Operations Dispatch Supervisor' : 'Operations Manager');

    const historyItems: PriceHistoryRecord[] = [];

    const oldBase = currentService.base_price ?? currentService.basePrice;
    const newBase = updates.base_price ?? updates.basePrice;
    if (newBase !== undefined && Number(newBase) !== Number(oldBase)) {
      historyItems.push({
        id: `ph-${Date.now()}-1`,
        serviceId: id,
        serviceName: currentService.name,
        fieldChanged: 'base_price',
        oldValue: oldBase,
        newValue: Number(newBase),
        effectiveFrom: effectiveDate,
        changedBy: operator,
        changedAt: now,
        reason: reason || 'Operations rate adjustment'
      });
    }

    const oldVisit = currentService.visit_fee ?? currentService.visitFee;
    const newVisit = updates.visit_fee ?? updates.visitFee;
    if (newVisit !== undefined && Number(newVisit) !== Number(oldVisit)) {
      historyItems.push({
        id: `ph-${Date.now()}-2`,
        serviceId: id,
        serviceName: currentService.name,
        fieldChanged: 'visit_fee',
        oldValue: oldVisit,
        newValue: Number(newVisit),
        effectiveFrom: effectiveDate,
        changedBy: operator,
        changedAt: now,
        reason: reason || 'Doorstep visit fee update'
      });
    }

    const oldType = currentService.price_type;
    const newType = updates.price_type ?? (updates.pricingType?.toString().toUpperCase() as PriceType);
    if (newType && newType !== oldType) {
      historyItems.push({
        id: `ph-${Date.now()}-3`,
        serviceId: id,
        serviceName: currentService.name,
        fieldChanged: 'price_type',
        oldValue: oldType,
        newValue: newType,
        effectiveFrom: effectiveDate,
        changedBy: operator,
        changedAt: now,
        reason: reason || 'Price type structural modification'
      });
    }

    if (historyItems.length > 0) {
      setPriceHistory((prev) => [...historyItems, ...prev]);
    }

    // Immediately update customer-facing catalog
    setServices((prev) =>
      prev.map((s) => (s.id === id ? normalizeServiceItem({ ...s, ...updates }) : s))
    );

    // Sync in-flight cart items
    setCart((prev) =>
      prev.map((item) =>
        item.serviceId === id
          ? {
              ...item,
              price: newBase !== undefined ? Number(newBase) : item.price,
              visitFee: newVisit !== undefined ? Number(newVisit) : item.visitFee,
              price_type: newType || item.price_type
            }
          : item
      )
    );

    addAuditEntry(
      'PRICING_UPDATED',
      'PRICING',
      id,
      `Updated ${currentService.name} (${Object.keys(updates).join(', ')}). Reason: ${reason || 'Rate modification'}`
    );
    showToast(`Updated pricing for ${currentService.name}`, 'success');
  };

  const toggleServiceActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    showToast(`Service visibility updated`, 'info');
  };

  const addService = (newService: ServiceItem) => {
    const normalized = normalizeServiceItem(newService);
    setServices((prev) => [normalized, ...prev]);
    addAuditEntry('SERVICE_CREATED', 'PRICING', normalized.id, `Created service: ${normalized.name}`);
    showToast(`New service added to catalog`, 'success');
  };

  const updatePackage = (id: string, updates: Partial<ServicePackage>) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast(`Care package updated`, 'success');
  };

  // Cart operations
  const addToCart = (service: ServiceItem, quantity: number = 1) => {
    const pType = service.price_type || (service.pricingType?.toString().toUpperCase() as PriceType) || 'FIXED';
    const effectivePrice = service.base_price ?? service.basePrice ?? 0;
    const effectiveVisit = service.visit_fee ?? service.visitFee ?? 99;

    setCart((prev) => {
      const existing = prev.find((item) => item.serviceId === service.id);
      if (existing) {
        return prev.map((item) =>
          item.serviceId === service.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          serviceId: service.id,
          serviceName: service.name,
          category: service.category,
          price: effectivePrice,
          visitFee: effectiveVisit,
          quantity,
          price_type: pType
        }
      ];
    });
    showToast(`Added ${service.name} to basket`, 'success');
  };

  const addPackageToCart = (pkg: ServicePackage) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.serviceId === pkg.id);
      if (existing) {
        return prev.map((item) =>
          item.serviceId === pkg.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          serviceId: pkg.id,
          serviceName: pkg.name,
          category: pkg.category,
          price: pkg.price,
          visitFee: 0,
          quantity: 1,
          isPackage: true,
          price_type: 'PACKAGE'
        }
      ];
    });
    showToast(`Added combo package to basket`, 'success');
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => prev.filter((item) => item.serviceId !== serviceId));
  };

  const updateCartQuantity = (serviceId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.serviceId === serviceId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const orderPricing = calculateOrderPricing(cart, services);
  const cartTotal = {
    itemSubtotal: orderPricing.itemSubtotal,
    visitFee: orderPricing.visitFee,
    taxPercent: orderPricing.taxPercent,
    taxAmount: orderPricing.taxAmount,
    discountAmount: orderPricing.discountAmount,
    total: orderPricing.total,
    hasQuoteRequired: orderPricing.hasQuoteRequired,
    itemCount: orderPricing.itemCount
  };

  // Booking Creation
  const createBookingFromCart = (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    landmark?: string;
    preferredDate: string;
    preferredTimeSlot: string;
    notes?: string;
  }): string => {
    if (cart.length === 0) return '';
    const newId = `PB-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const newRequest: ServiceRequest = {
      id: newId,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      locality: details.locality,
      address: details.address,
      landmark: details.landmark,
      requestType: 'STANDARD_SERVICE',
      items: cart.map((c) => ({
        serviceId: c.serviceId,
        serviceName: c.serviceName,
        quantity: c.quantity,
        price: c.price,
        price_type: c.price_type,
        isPackage: c.isPackage
      })),
      subtotal: cartTotal.itemSubtotal,
      visitFee: cartTotal.visitFee,
      taxAmount: cartTotal.taxAmount,
      discountAmount: cartTotal.discountAmount,
      total: cartTotal.total,
      hasQuoteRequired: cartTotal.hasQuoteRequired,
      preferredDate: details.preferredDate,
      preferredTimeSlot: details.preferredTimeSlot,
      notes: details.notes || 'Instant standard booking',
      status: 'NEW', // Operations central control: always starts at NEW for manual supervisor review!
      assignedTo: null,
      statusHistory: [
        {
          status: 'NEW',
          timestamp: now,
          updatedBy: 'Customer App',
          note: 'Request created. Queued for Operations manual review.'
        }
      ],
      assignmentHistory: [],
      createdAt: now,
      updatedAt: now,
      paymentStatus: 'PENDING_ON_COMPLETION'
    };

    setRequests((prev) => [newRequest, ...prev]);
    persistServiceRequest(newRequest).catch((err) => console.warn('Firestore persist booking notice:', err));
    clearCart();
    addAuditEntry('REQUEST_CREATED', 'SERVICE_REQUEST', newId, `Order created for ${details.locality} (₹${cartTotal.total})`);
    showToast(`Order ${newId} confirmed! Sent to Operations queue for manual dispatch.`, 'success');
    setActiveTrackingRequestId(newId);
    return newId;
  };

  // Custom Requirement Submission
  const createCustomRequirement = (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    requirementText: string;
    preferredDate: string;
    preferredTimeSlot: string;
    category?: string;
  }): string => {
    const newId = `PB-CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const newRequest: ServiceRequest = {
      id: newId,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      locality: details.locality,
      address: details.address,
      requestType: 'CUSTOM_REQUIREMENT',
      items: [
        {
          serviceName: `Custom: ${details.category || 'Domestic Repair'}`,
          quantity: 1,
          price: 199 // Standard diagnostic visit rate
        }
      ],
      subtotal: 199,
      visitFee: 99,
      total: 298,
      preferredDate: details.preferredDate,
      preferredTimeSlot: details.preferredTimeSlot,
      notes: details.requirementText,
      status: 'UNDER REVIEW',
      assignedTo: null,
      statusHistory: [
        {
          status: 'NEW',
          timestamp: now,
          updatedBy: 'Customer App',
          note: 'Custom requirement posted.'
        },
        {
          status: 'UNDER REVIEW',
          timestamp: now,
          updatedBy: 'Operations Dispatch Central',
          note: 'Supervisor isolating required tool kit and technician trade.'
        }
      ],
      assignmentHistory: [],
      createdAt: now,
      updatedAt: now,
      paymentStatus: 'PENDING_ON_COMPLETION'
    };

    setRequests((prev) => [newRequest, ...prev]);
    persistServiceRequest(newRequest).catch((err) => console.warn('Firestore persist custom task notice:', err));
    addAuditEntry('CUSTOM_TASK_POSTED', 'SERVICE_REQUEST', newId, `Requirement: ${details.requirementText.substring(0, 40)}...`);
    showToast(`Custom task ${newId} submitted. Supervisor will review and call you.`, 'success');
    setActiveTrackingRequestId(newId);
    return newId;
  };

  // Home Project Submission
  const createProjectRequest = (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    projectType: string;
    propertyType: string;
    approxAreaSqFt: number;
    budgetRange: string;
    preferredStartDate: string;
    description: string;
  }): string => {
    const newId = `PRJ-${Math.floor(500 + Math.random() * 499)}`;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const newProject: HomeProjectRequest = {
      id: newId,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      locality: details.locality,
      address: details.address,
      projectType: details.projectType,
      propertyType: details.propertyType,
      approxAreaSqFt: details.approxAreaSqFt,
      budgetRange: details.budgetRange,
      preferredStartDate: details.preferredStartDate,
      description: details.description,
      status: 'UNDER_REVIEW',
      notes: 'Customer requested civil measurement & quote.',
      createdAt: now
    };

    setProjectRequests((prev) => [newProject, ...prev]);
    persistHomeProject(newProject).catch((err) => console.warn('Firestore persist project notice:', err));
    addAuditEntry('PROJECT_REQUESTED', 'SERVICE_REQUEST', newId, `Project: ${details.projectType} in ${details.locality}`);
    showToast(`Project quote request ${newId} logged! Civil supervisor assigned shortly.`, 'success');
    return newId;
  };

  // Operations Review & Status Updates
  const updateRequestStatus = (requestId: string, newStatus: BookingStatus, note?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const newHistory = [
            ...req.statusHistory,
            {
              status: newStatus,
              timestamp: now,
              updatedBy: currentRole === 'operations' ? 'Operations Manager' : 'System',
              note: note || `Status updated to ${newStatus}`
            }
          ];

          return {
            ...req,
            status: newStatus,
            updatedAt: now,
            statusHistory: newHistory,
            paymentStatus: newStatus === 'COMPLETED' || newStatus === 'CUSTOMER CONFIRMED' ? 'PAID' : req.paymentStatus
          };
        }
        return req;
      })
    );
    addAuditEntry('STATUS_CHANGED', 'SERVICE_REQUEST', requestId, `Status -> ${newStatus}. Note: ${note || 'None'}`);
    showToast(`Request ${requestId} status updated to ${newStatus}`, 'info');
  };

  // MANUAL ASSIGNMENT (Critical Operations Core)
  // Vendor opportunity deduction happens HERE, never on initial customer booking!
  const assignRequest = (
    requestId: string,
    assigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    notes?: string,
    assignedBy?: string,
    reason?: string
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    let assignedInfo: ServiceRequest['assignedTo'] = null;

    if (assigneeType === 'EMPLOYEE') {
      const emp = employees.find((e) => e.id === assigneeId);
      if (!emp) return;
      assignedInfo = {
        id: emp.id,
        name: emp.name,
        type: 'EMPLOYEE',
        phone: emp.mobile,
        rating: `${emp.rating} ★`,
        hub: emp.serviceAreas[0] || 'Kharar Central'
      };

      // Update employee active jobs count
      setEmployees((prev) =>
        prev.map((e) => (e.id === assigneeId ? { ...e, activeJobs: e.activeJobs + 1 } : e))
      );
    } else {
      const vnd = vendors.find((v) => v.id === assigneeId);
      if (!vnd) return;

      if (vnd.plan.remainingOpportunities <= 0) {
        showToast(`Vendor ${vnd.businessName} has 0 remaining work opportunities! Please recharge plan or adjust quota.`, 'error');
        return;
      }

      assignedInfo = {
        id: vnd.id,
        name: `${vnd.businessName} (${vnd.ownerName})`,
        type: 'VENDOR',
        phone: vnd.mobile,
        rating: `${vnd.rating} ★`,
        hub: vnd.serviceAreas[0] || 'Mohali Belt'
      };

      // DEDUCT WORK OPPORTUNITY FROM VENDOR PLAN
      const newUsed = vnd.plan.usedOpportunities + 1;
      const newRemaining = vnd.plan.totalOpportunities - newUsed;

      setVendors((prev) =>
        prev.map((v) =>
          v.id === assigneeId
            ? {
                ...v,
                activeJobs: v.activeJobs + 1,
                plan: {
                  ...v.plan,
                  usedOpportunities: newUsed,
                  remainingOpportunities: Math.max(0, newRemaining)
                }
              }
            : v
        )
      );

      // Record in Opportunity Ledger
      const ledgerEntry: OpportunityLedgerEntry = {
        id: `led-${Date.now()}`,
        vendorId: vnd.id,
        vendorName: vnd.businessName,
        change: -1,
        balanceAfter: Math.max(0, newRemaining),
        reason: `Consumed Qualified Work Opportunity for Order ${requestId}`,
        performedBy: assignedBy || 'Operations Supervisor (Manual Dispatch)',
        timestamp: now,
        serviceRequestId: requestId
      };
      setOpportunityLedger((prev) => [ledgerEntry, ...prev]);
    }

    const previousAssigneeName = req.assignedTo?.name || null;

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const assignmentRecord: AssignmentHistoryItem = {
            id: `asg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            assignedBy: assignedBy || 'Harman (Ops Lead)',
            assignedTo: assignedInfo?.name || '',
            assignedToName: assignedInfo?.name || '',
            assigneeType,
            timestamp: now,
            previousAssignee: previousAssigneeName,
            previousAssigneeName,
            reason: reason || (r.assignedTo ? 'Reassignment requested' : 'Initial Dispatch Assignment'),
            notes: notes || 'Manual supervisor dispatch'
          };

          return {
            ...r,
            status: 'ASSIGNED',
            assignedTo: assignedInfo,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'ASSIGNED',
                timestamp: now,
                updatedBy: assignedBy || 'Operations Dispatch Supervisor',
                note: `Manually assigned to ${assignedInfo?.name}`
              }
            ],
            assignmentHistory: [
              ...r.assignmentHistory,
              assignmentRecord
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'MANUAL_ASSIGNMENT',
      'SERVICE_REQUEST',
      requestId,
      `Assigned to ${assignedInfo?.name} (${assigneeType}). Notes: ${notes || 'None'}. Reason: ${reason || 'Standard dispatch'}`,
      assignedBy || 'Harman (Ops Lead)'
    );
    showToast(`Manually assigned ${assignedInfo?.name} to request ${requestId}`, 'success');
  };

  const reassignRequest = (
    requestId: string,
    newAssigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    reason: string,
    notes?: string,
    assignedBy?: string
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const oldAssigneeName = req.assignedTo?.name || 'Previous Artisan';

    // Call assignRequest which handles new assignment and status
    assignRequest(requestId, newAssigneeId, assigneeType, notes, assignedBy || 'Harman (Ops Lead)', reason);

    addAuditEntry(
      'REASSIGNMENT_EXECUTED',
      'SERVICE_REQUEST',
      requestId,
      `Reassigned from ${oldAssigneeName} to new artisan. Reason: ${reason}. Notes: ${notes || 'None'}`,
      assignedBy || 'Harman (Ops Lead)'
    );
    showToast(`Request ${requestId} reassigned. Reason logged in audit log.`, 'info');
  };

  // Vendor Opportunity Ledger Adjustments
  const adjustVendorOpportunities = (vendorId: string, delta: number, reason: string) => {
    const vnd = vendors.find((v) => v.id === vendorId);
    if (!vnd) return;

    const newTotal = vnd.plan.totalOpportunities + delta;
    const newRemaining = newTotal - vnd.plan.usedOpportunities;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              plan: {
                ...v.plan,
                totalOpportunities: newTotal,
                remainingOpportunities: newRemaining
              }
            }
          : v
      )
    );

    const ledgerEntry: OpportunityLedgerEntry = {
      id: `led-${Date.now()}`,
      vendorId: vnd.id,
      vendorName: vnd.businessName,
      change: delta,
      balanceAfter: newRemaining,
      reason,
      performedBy: 'Operations Manager',
      timestamp: now
    };
    setOpportunityLedger((prev) => [ledgerEntry, ...prev]);

    addAuditEntry(
      'OPPORTUNITY_ADJUSTMENT',
      'OPPORTUNITY',
      vendorId,
      `Delta ${delta > 0 ? '+' : ''}${delta} opportunities. Reason: ${reason}`
    );
    showToast(`Adjusted opportunities for ${vnd.businessName}: ${delta > 0 ? '+' : ''}${delta}`, 'success');
  };

  const updateVendorStatus = (vendorId: string, status: Vendor['status']) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status } : v))
    );
    addAuditEntry('VENDOR_STATUS_CHANGE', 'VENDOR', vendorId, `Status set to ${status}`);
    showToast(`Vendor status updated to ${status}`, 'info');
  };

  const addVendor = (vendor: Vendor) => {
    setVendors((prev) => [vendor, ...prev]);
    addAuditEntry('VENDOR_REGISTERED', 'VENDOR', vendor.id, `Created vendor: ${vendor.businessName}`);
    showToast(`Registered new vendor partner ${vendor.businessName}`, 'success');
  };

  // VENDOR PORTAL ACTIONS (Role-protected & privacy-conscious)
  const vendorAcceptAssignment = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || req.assignedTo?.name || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'ACCEPTED',
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'ACCEPTED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: notes || 'Opportunity accepted. Customer contact and full address unlocked.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'VENDOR_ACCEPTED_ASSIGNMENT',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} accepted dispatch assignment. Privacy gate unlocked.`,
      vendorName
    );

    showToast('Opportunity accepted! Full customer contact and address details unlocked.', 'success');
  };

  const vendorRejectAssignment = (requestId: string, reason: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || req.assignedTo?.name || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'REASSIGNMENT REQUIRED',
            vendorRejectionReason: reason,
            assignedTo: null,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'REASSIGNMENT REQUIRED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: `Declined assignment. Reason: ${reason}. ${notes ? `Note: ${notes}` : ''}`
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'VENDOR_REJECTED_ASSIGNMENT',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} declined assignment. Reason: ${reason}. Returned to Operations board.`,
      vendorName
    );

    showToast('Assignment declined. Job returned to Operations Dispatch board.', 'info');
  };

  const vendorConfirmSchedule = (requestId: string, confirmedSlot: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'SCHEDULED',
            confirmedScheduleSlot: confirmedSlot,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'SCHEDULED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: `Schedule confirmed: ${confirmedSlot}. ${notes || ''}`
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'SCHEDULE_CONFIRMED',
      'SERVICE_REQUEST',
      requestId,
      `Schedule confirmed for ${confirmedSlot} by ${vendorName}`,
      vendorName
    );

    showToast(`Schedule confirmed for ${confirmedSlot}`, 'success');
  };

  const vendorMarkArrived = (requestId: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            vendorArrivalStatus: 'ARRIVED',
            arrivedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: r.status,
                timestamp: now,
                updatedBy: `${vendorName} (Doorstep Check-in)`,
                note: 'Artisan reached customer doorstep.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'VENDOR_ARRIVED',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} marked doorstep arrival at customer location.`,
      vendorName
    );

    showToast('Doorstep arrival confirmed!', 'success');
  };

  const vendorStartWork = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'IN PROGRESS',
            workStartedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'IN PROGRESS',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: notes || 'Service diagnostics and repair work commenced on site.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'WORK_STARTED',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} commenced work on site.`,
      vendorName
    );

    showToast('Work started! Status updated to In Progress.', 'info');
  };

  const vendorUploadCompletionPhotos = (requestId: string, photos: string[]) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existing = r.completionPhotos || [];
          const combined = Array.from(new Set([...existing, ...photos]));
          return {
            ...r,
            completionPhotos: combined,
            updatedAt: now
          };
        }
        return r;
      })
    );
    showToast(`${photos.length} completion photo(s) saved!`, 'success');
  };

  const vendorAddNotes = (requestId: string, note: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existing = r.vendorNotes || [];
          return {
            ...r,
            vendorNotes: [...existing, `[${now}] ${note}`],
            updatedAt: now
          };
        }
        return r;
      })
    );
    showToast('Job observation note saved.', 'success');
  };

  const vendorCompleteJob = (
    requestId: string,
    paymentMode: 'CASH' | 'UPI' | 'ONLINE',
    notes?: string,
    photos?: string[]
  ) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || req.assignedTo?.name || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existingPhotos = r.completionPhotos || [];
          const combinedPhotos = photos ? Array.from(new Set([...existingPhotos, ...photos])) : existingPhotos;
          const existingNotes = r.vendorNotes || [];
          const combinedNotes = notes ? [...existingNotes, `[Completed ${now}] ${notes}`] : existingNotes;

          return {
            ...r,
            status: 'COMPLETED',
            completedAt: now,
            paymentStatus: 'PAID',
            paymentMode,
            paymentCollectedMode: paymentMode,
            paymentCollectedAmount: r.total,
            completionPhotos: combinedPhotos,
            vendorNotes: combinedNotes,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'COMPLETED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: `Job completed on site. Payment collected via ${paymentMode} (₹${r.total}).`
              }
            ]
          };
        }
        return r;
      })
    );

    if (currentVendorId) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === currentVendorId
            ? {
                ...v,
                activeJobs: Math.max(0, v.activeJobs - 1),
                completedJobs: v.completedJobs + 1
              }
            : v
        )
      );
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      requestId,
      customerName: req.customerName,
      amount: req.total,
      mode: paymentMode === 'CASH' ? 'CASH' : 'UPI',
      status: 'SUCCESS',
      transactionRef: `${paymentMode}-VND-${Math.floor(100000 + Math.random() * 900000)}`,
      collectedBy: `${vendorName} (Artisan)`,
      date: now
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditEntry(
      'JOB_COMPLETED_BY_VENDOR',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} completed job ${requestId}. Collected ₹${req.total} via ${paymentMode}.`,
      vendorName
    );

    showToast(`Job ${requestId} completed! Payment of ₹${req.total} logged via ${paymentMode}.`, 'success');
  };

  // Employees
  const updateEmployeeAvailability = (employeeId: string, availability: Employee['availability']) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, availability } : e))
    );
    showToast(`Staff availability updated`, 'info');
  };

  const addEmployee = (emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
    addAuditEntry('EMPLOYEE_ONBOARDED', 'EMPLOYEE', emp.id, `Created employee: ${emp.name}`);
    showToast(`Added technician employee ${emp.name}`, 'success');
  };

  // EMPLOYEE PORTAL ACTIONS
  const employeeAcceptJob = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || req.assignedTo?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'ACCEPTED',
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'ACCEPTED',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: notes || 'Assigned job acknowledged and accepted by staff technician.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_ACCEPTED_JOB',
      'SERVICE_REQUEST',
      requestId,
      `${empName} accepted assignment. Tools and route confirmed.`,
      empName
    );

    showToast(`Job ${requestId} accepted! Route and customer details loaded.`, 'success');
  };

  const employeeRejectJob = (requestId: string, reason: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || req.assignedTo?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'REASSIGNMENT REQUIRED',
            employeeRejectionReason: reason,
            assignedTo: null,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'REASSIGNMENT REQUIRED',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: `Employee declined assignment. Reason: ${reason}. ${notes ? `Details: ${notes}` : ''}`
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_REJECTED_JOB',
      'SERVICE_REQUEST',
      requestId,
      `${empName} declined assigned job. Reason: ${reason}. Returned to Operations Assignment Board.`,
      empName
    );

    showToast(`Job ${requestId} declined. Returned to Operations Assignment Board for reassignment.`, 'info');
  };

  const employeeMarkArrived = (requestId: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            vendorArrivalStatus: 'ARRIVED',
            arrivedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: r.status,
                timestamp: now,
                updatedBy: `${empName} (Doorstep Check-in)`,
                note: 'Employee reached customer doorstep.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_ARRIVED',
      'SERVICE_REQUEST',
      requestId,
      `${empName} confirmed doorstep arrival at ${req.locality}.`,
      empName
    );

    showToast('Doorstep arrival confirmed!', 'success');
  };

  const employeeStartWork = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'IN PROGRESS',
            workStartedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'IN PROGRESS',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: notes || 'Diagnostics and repair work commenced on site.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_STARTED_WORK',
      'SERVICE_REQUEST',
      requestId,
      `${empName} began work on site.`,
      empName
    );

    showToast('Work started! Status updated to In Progress.', 'info');
  };

  const employeeCompleteWork = (
    requestId: string,
    completionNotes: string,
    completionPhotos: string[],
    materialInfo?: string,
    partsUsed?: { name: string; quantity: number; cost: number }[],
    paymentCollectedMode?: 'CASH' | 'UPI' | 'ONLINE'
  ) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || req.assignedTo?.name || 'Staff Technician';
    const payMode = paymentCollectedMode || req.paymentMode || 'UPI';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existingPhotos = r.completionPhotos || [];
          const combinedPhotos = Array.from(new Set([...existingPhotos, ...completionPhotos]));
          const existingNotes = r.vendorNotes || [];
          const combinedNotes = [...existingNotes, `[Staff Completed ${now}] ${completionNotes}`];

          return {
            ...r,
            status: 'COMPLETED',
            completedAt: now,
            paymentStatus: 'PAID',
            paymentMode: payMode,
            paymentCollectedMode: payMode,
            paymentCollectedAmount: r.total,
            completionPhotos: combinedPhotos,
            vendorNotes: combinedNotes,
            materialInfo: materialInfo || r.materialInfo,
            partsUsed: partsUsed || r.partsUsed,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'COMPLETED',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: `Job completed. Verified by staff technician. Collected via ${payMode} (₹${r.total}).`
              }
            ]
          };
        }
        return r;
      })
    );

    if (currentEmployeeId) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === currentEmployeeId
            ? {
                ...e,
                activeJobs: Math.max(0, e.activeJobs - 1),
                completedJobs: e.completedJobs + 1
              }
            : e
        )
      );
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      requestId,
      customerName: req.customerName,
      amount: req.total,
      mode: payMode === 'CASH' ? 'CASH' : 'UPI',
      status: 'SUCCESS',
      transactionRef: `${payMode}-EMP-${Math.floor(100000 + Math.random() * 900000)}`,
      collectedBy: `${empName} (Company Staff)`,
      date: now
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditEntry(
      'JOB_COMPLETED_BY_EMPLOYEE',
      'SERVICE_REQUEST',
      requestId,
      `${empName} completed job ${requestId}. Collected ₹${req.total} via ${payMode}. Material: ${materialInfo || 'None'}.`,
      empName
    );

    showToast(`Job ${requestId} finalized! Completion record and payment logged.`, 'success');
  };

  // Projects
  const updateProjectStatus = (projectId: string, status: HomeProjectRequest['status'], notes?: string) => {
    setProjectRequests((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status, notes: notes || p.notes } : p))
    );
    addAuditEntry('PROJECT_STATUS_UPDATE', 'SERVICE_REQUEST', projectId, `Status: ${status}`);
    showToast(`Project ${projectId} updated to ${status}`, 'info');
  };

  // Reviews
  const submitReview = (requestId: string, rating: number, feedback: string) => {
    const req = requests.find((r) => r.id === requestId);
    const now = 'Just now';

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      requestId,
      customerName: req?.customerName || 'Resident',
      locality: req?.locality || currentLocality,
      serviceName: req?.items[0]?.serviceName || 'Home Service',
      technicianName: req?.assignedTo?.name || 'Assigned Artisan',
      rating,
      review: feedback,
      timestamp: now
    };

    setReviews((prev) => [newRev, ...prev]);
    persistCustomerReview(newRev).catch((err) => console.warn('Firestore persist review notice:', err));
    // update order
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, customerRating: rating, customerFeedback: feedback } : r))
    );
    showToast(`Thank you! Your feedback for ${newRev.technicianName} was submitted.`, 'success');
  };

  // DPDP Act 2023 Compliance & Data Principal Rights Implementations
  const updateDPDPConsent = (preferences: Partial<DPDPConsentPreferences>) => {
    setDpdpConsent((prev) => ({
      ...prev,
      ...preferences,
      consentedAt: new Date().toISOString()
    }));
    addAuditEntry(
      'DPDP_CONSENT_UPDATED',
      'SERVICE_REQUEST',
      'USER_CONSENT',
      `Updated preferences: ${JSON.stringify(preferences)}`,
      currentUser?.name || 'Resident'
    );
    showToast('Your DPDP privacy preferences have been updated.', 'success');
  };

  const updateDPDPNominee = (nominee: DPDPNominee) => {
    setDpdpNominee(nominee);
    addAuditEntry(
      'DPDP_NOMINEE_UPDATED',
      'SERVICE_REQUEST',
      'SEC_14_NOMINEE',
      `Nominee recorded: ${nominee.fullName} (${nominee.relationship})`,
      currentUser?.name || 'Resident'
    );
    showToast(`Nominee ${nominee.fullName} registered under Section 14 DPDP Act.`, 'success');
  };

  const fileDPDPGrievance = (
    grievance: Omit<DPDPGrievance, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'dpoOfficer'>
  ): DPDPGrievance => {
    const newGrievance: DPDPGrievance = {
      ...grievance,
      id: `grv-${Date.now()}`,
      ticketNo: `DPDP-GRV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      dpoOfficer: 'Mr. Gurpreet Singh (DPO, UrbanCare Solution, Kharar)'
    };
    setDpdpGrievances((prev) => [newGrievance, ...prev]);
    addAuditEntry(
      'DPDP_GRIEVANCE_FILED',
      'SERVICE_REQUEST',
      newGrievance.ticketNo,
      `Category: ${newGrievance.type} - ${newGrievance.description.substring(0, 60)}...`,
      newGrievance.userName
    );
    showToast(`Grievance ${newGrievance.ticketNo} submitted to Data Protection Officer.`, 'info');
    return newGrievance;
  };

  const requestDataErasure = (reason = 'Right to Erasure under Section 12') => {
    logoutCustomer();
    setCart([]);
    addAuditEntry(
      'DPDP_ERASURE_REQUEST',
      'SERVICE_REQUEST',
      currentUser?.id || 'ANONYMOUS',
      `Reason: ${reason}`,
      currentUser?.name || 'Resident'
    );
    showToast('Personal data identifiers removed from browser storage. Erasure logged.', 'info');
  };

  const exportPersonalData = (): string => {
    const personalRecord = {
      title: 'UrbanCare Solution - Data Principal Personal Record Export',
      statutoryBasis: 'Digital Personal Data Protection Act, 2023 (Section 11)',
      exportedAt: new Date().toISOString(),
      jurisdiction: 'Kharar & Mohali, SAS Nagar, Punjab, India',
      profile: currentUser || { status: 'Guest User' },
      activeConsentPreferences: dpdpConsent,
      registeredNominee: dpdpNominee || 'No nominee appointed under Section 14',
      serviceRequestsHistory: requests.map((r) => ({
        id: r.id,
        status: r.status,
        locality: r.locality,
        address: r.address,
        createdAt: r.createdAt,
        total: r.total,
        services: r.items.map((i) => i.serviceName)
      })),
      projectRequests: projectRequests,
      privacyGrievances: dpdpGrievances,
      dataFiduciary: {
        company: 'UrbanCare Solution',
        dpoOfficer: 'Mr. Gurpreet Singh',
        dpoContact: '+91 98882 10452',
        dpoEmail: 'grievance@urbancaresolution.in',
        officeAddress: 'SCF 14, Sector 125, Sunny Enclave, Kharar, Punjab 140301'
      }
    };
    return JSON.stringify(personalRecord, null, 2);
  };


  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentLocality,
        setCurrentLocality,
        currentPage,
        setCurrentPage,
        toasts,
        showToast,
        dismissToast,
        services,
        packages,
        priceHistory,
        updateServicePricing,
        toggleServiceActive,
        addService,
        updatePackage,
        cart,
        addToCart,
        addPackageToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        requests,
        createBookingFromCart,
        createCustomRequirement,
        createProjectRequest,
        updateRequestStatus,
        assignRequest,
        reassignRequest,
        vendors,
        opportunityLedger,
        adjustVendorOpportunities,
        updateVendorStatus,
        addVendor,
        currentVendorId,
        setCurrentVendorId,
        vendorAcceptAssignment,
        vendorRejectAssignment,
        vendorConfirmSchedule,
        vendorMarkArrived,
        vendorStartWork,
        vendorUploadCompletionPhotos,
        vendorAddNotes,
        vendorCompleteJob,
        employees,
        updateEmployeeAvailability,
        addEmployee,
        currentEmployeeId,
        setCurrentEmployeeId,
        employeeNotifications,
        markNotificationAsRead,
        employeeAcceptJob,
        employeeRejectJob,
        employeeMarkArrived,
        employeeStartWork,
        employeeCompleteWork,
        projectRequests,
        updateProjectStatus,
        reviews,
        submitReview,
        auditLogs,
        addAuditEntry,
        customers,
        addCustomer,
        updateCustomerStatus,
        complaints,
        addComplaint,
        resolveComplaint,
        payments,
        recordPayment,
        opsSettings,
        updateOpsSettings,
        addInternalNote,
        activeTrackingRequestId,
        setActiveTrackingRequestId,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCustomTaskModalOpen,
        setIsCustomTaskModalOpen,
        isProjectModalOpen,
        setIsProjectModalOpen,
        isLocalityModalOpen,
        setIsLocalityModalOpen,
        selectedDetailServiceId,
        setSelectedDetailServiceId,
        isAuthModalOpen,
        setIsAuthModalOpen,
        currentUser,
        setCurrentUser,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        dpdpConsent,
        updateDPDPConsent,
        dpdpNominee,
        updateDPDPNominee,
        dpdpGrievances,
        fileDPDPGrievance,
        requestDataErasure,
        exportPersonalData,
        isDPDPNoticeOpen,
        setIsDPDPNoticeOpen,
        isDPDPConsentManagerOpen,
        setIsDPDPConsentManagerOpen,
        isDPDPDataRightsOpen,
        setIsDPDPDataRightsOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
