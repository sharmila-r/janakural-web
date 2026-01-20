'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';

interface AdminUser {
  uid: string;
  phone: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid, firebaseUser?.phoneNumber);
      setUser(firebaseUser);

      if (firebaseUser && firebaseUser.phoneNumber) {
        // Check if user is an admin by phone number
        try {
          console.log('Checking admin status for phone:', firebaseUser.phoneNumber);
          const usersRef = collection(db, COLLECTIONS.USERS);
          const q = query(usersRef, where('phone', '==', firebaseUser.phoneNumber));
          const snapshot = await getDocs(q);

          console.log('Admin query result - empty?', snapshot.empty, 'size:', snapshot.size);

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            console.log('Found user data:', userData);
            const adminRoles = ['booth_agent', 'constituency_head', 'district_leader', 'state_admin', 'super_admin'];
            if (adminRoles.includes(userData.role)) {
              console.log('User is admin with role:', userData.role);
              setAdminUser({
                uid: firebaseUser.uid,
                phone: userData.phone,
                name: userData.name,
                role: userData.role,
              });
            } else {
              console.log('User role not in admin roles:', userData.role);
              setAdminUser(null);
            }
          } else {
            console.log('No user document found for phone:', firebaseUser.phoneNumber);
            setAdminUser(null);
          }
        } catch (error) {
          console.error('Error fetching admin user:', error);
          setAdminUser(null);
        }
      } else {
        console.log('No phone number on user');
        setAdminUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = adminUser !== null;

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
