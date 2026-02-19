import { create } from 'zustand';

interface HospitalProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
}

interface HospitalState extends HospitalProfile {
  update: (profile: Partial<HospitalProfile>) => void;
}

const defaults: HospitalProfile = {
  name: 'Helvino Hospital',
  tagline: 'Quality Healthcare Services',
  address: 'Nairobi, Kenya',
  phone: '+254 703 445 756',
  email: 'helvinotechltd@gmail.com',
};

function load(): HospitalProfile {
  try {
    const saved = localStorage.getItem('hospitalProfile');
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaults;
}

export const useHospitalStore = create<HospitalState>((set) => ({
  ...load(),
  update: (profile) => {
    set((state) => {
      const updated = { ...state, ...profile };
      localStorage.setItem('hospitalProfile', JSON.stringify({
        name: updated.name,
        tagline: updated.tagline,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
      }));
      return updated;
    });
  },
}));
