import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

const COLLECTIONS = {
  USERS: 'janakural_users',
  ISSUES: 'janakural_issues',
  NOTIFICATIONS: 'janakural_notifications',
};

interface AdminUser {
  phone: string;
  name: string;
  role: string;
  assignedArea?: {
    district?: string;
    panchayatUnion?: string;
  };
  fcmToken?: string;
  isActive: boolean;
}

interface NotificationDoc {
  type: string;
  issueId: string;
  title: string;
  districtId: string;
  panchayatUnionId: string;
  processed: boolean;
}

/**
 * Cloud Function triggered when a new notification document is created
 * Sends push notifications to relevant admins based on location
 */
export const sendIssueNotifications = functions.firestore
  .document(`${COLLECTIONS.NOTIFICATIONS}/{notificationId}`)
  .onCreate(async (snap, context) => {
    const notificationData = snap.data() as NotificationDoc;
    const notificationId = context.params.notificationId;

    console.log(`Processing notification ${notificationId}:`, notificationData);

    if (notificationData.type !== 'new_issue') {
      console.log('Not a new_issue notification, skipping');
      return;
    }

    try {
      // Get all active admin users
      const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
      const admins: AdminUser[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as AdminUser;
        admins.push(userData);
      });

      // Find relevant admins to notify
      const adminsToNotify: AdminUser[] = [];

      admins.forEach((admin) => {
        if (!admin.isActive || !admin.fcmToken) return;

        // Panchayat leaders for this specific area
        if (
          admin.role === 'panchayat_leader' &&
          admin.assignedArea?.district === notificationData.districtId &&
          admin.assignedArea?.panchayatUnion === notificationData.panchayatUnionId
        ) {
          adminsToNotify.push(admin);
        }

        // District leaders for this district
        if (
          admin.role === 'district_leader' &&
          admin.assignedArea?.district === notificationData.districtId
        ) {
          adminsToNotify.push(admin);
        }

        // State admins and super admins get all notifications
        if (admin.role === 'state_admin' || admin.role === 'super_admin') {
          adminsToNotify.push(admin);
        }
      });

      console.log(`Found ${adminsToNotify.length} admins to notify`);

      if (adminsToNotify.length === 0) {
        // Mark as processed even if no one to notify
        await snap.ref.update({ processed: true, adminCount: 0 });
        return;
      }

      // Collect FCM tokens
      const tokens = adminsToNotify
        .map((a) => a.fcmToken)
        .filter((token): token is string => !!token);

      if (tokens.length === 0) {
        console.log('No FCM tokens found');
        await snap.ref.update({ processed: true, adminCount: 0 });
        return;
      }

      // Send push notification
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: 'New Issue Reported',
          body: notificationData.title,
        },
        data: {
          issueId: notificationData.issueId,
          type: 'new_issue',
        },
        webpush: {
          fcmOptions: {
            link: `/admin/issues?highlight=${notificationData.issueId}`,
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);

      console.log(`Successfully sent ${response.successCount} notifications`);
      console.log(`Failed to send ${response.failureCount} notifications`);

      // Log failures for debugging
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${idx}:`, resp.error);
          }
        });
      }

      // Mark notification as processed
      await snap.ref.update({
        processed: true,
        adminCount: adminsToNotify.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      await snap.ref.update({
        processed: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

/**
 * Cloud Function to auto-assign issues to relevant leaders
 * Triggered when a new issue is created
 */
export const autoAssignIssue = functions.firestore
  .document(`${COLLECTIONS.ISSUES}/{issueId}`)
  .onCreate(async (snap, context) => {
    const issueData = snap.data();
    const issueId = context.params.issueId;

    console.log(`Auto-assigning issue ${issueId}`);

    const districtId = issueData.districtId;
    const panchayatUnionId = issueData.panchayatUnionId;

    if (!districtId) {
      console.log('No district specified, skipping auto-assignment');
      return;
    }

    try {
      // Get all active admin users
      const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();

      // Find panchayat leader for this area
      let panchayatLeader: string | null = null;
      let districtLeader: string | null = null;

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as AdminUser;

        if (!userData.isActive) return;

        // Find panchayat leader
        if (
          userData.role === 'panchayat_leader' &&
          userData.assignedArea?.district === districtId &&
          userData.assignedArea?.panchayatUnion === panchayatUnionId
        ) {
          panchayatLeader = userData.name || userData.phone;
        }

        // Find district leader
        if (
          userData.role === 'district_leader' &&
          userData.assignedArea?.district === districtId
        ) {
          districtLeader = userData.name || userData.phone;
        }
      });

      // Update issue with assignments
      const updates: Record<string, unknown> = {};

      if (panchayatLeader) {
        updates.assignedTo = panchayatLeader;
        updates.status = 'assigned';
        console.log(`Assigned to panchayat leader: ${panchayatLeader}`);
      } else if (districtLeader) {
        updates.assignedTo = districtLeader;
        updates.status = 'assigned';
        console.log(`Assigned to district leader: ${districtLeader}`);
      }

      if (Object.keys(updates).length > 0) {
        updates.assignedBy = 'System (Auto-assignment)';
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await snap.ref.update(updates);
      }
    } catch (error) {
      console.error('Error auto-assigning issue:', error);
    }
  });
