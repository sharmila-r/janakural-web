'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, requestFcmToken, onForegroundMessage } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { saveFcmToken } from '@/services/admin';

interface AdminUser {
  uid: string;
  id: string;
  phone: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  requestNotificationPermission: () => Promise<void>;
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
            const adminRoles = ['booth_agent', 'panchayat_leader', 'constituency_head', 'district_leader', 'state_admin', 'super_admin'];
            if (adminRoles.includes(userData.role)) {
              console.log('User is admin with role:', userData.role);
              setAdminUser({
                uid: firebaseUser.uid,
                id: userDoc.id,
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

  // Set up foreground message listener
  useEffect(() => {
    if (adminUser) {
      onForegroundMessage((payload) => {
        console.log('Foreground message received:', payload);
        // Show toast notification or update UI
        const notification = payload as { notification?: { title?: string; body?: string } };
        if (notification.notification?.title) {
          // Create a browser notification for foreground messages
          if (Notification.permission === 'granted') {
            new Notification(notification.notification.title, {
              body: notification.notification.body || '',
              icon: '/icon-192.png',
            });
          }
        }
      });
    }
  }, [adminUser]);

  const isAdmin = adminUser !== null;

  // Request notification permission and save FCM token
  const requestNotificationPermission = async () => {
    if (!adminUser) return;

    try {
      const token = await requestFcmToken();
      if (token) {
        await saveFcmToken(adminUser.id, token);
        console.log('FCM token saved successfully');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, isAdmin, requestNotificationPermission }}>
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
