const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with application default credentials (from gcloud auth)
initializeApp({
  projectId: 'tvk-digital',
});

const db = getFirestore();

async function createAdminUser() {
  const phone = '+17742769594';
  const userId = phone.replace(/\+/g, '');

  const adminData = {
    phone: phone,
    name: 'Super Admin',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await db.collection('janakural_users').doc(userId).set(adminData);
    console.log('Admin user created successfully!');
    console.log('Phone:', phone);
    console.log('Document ID:', userId);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
