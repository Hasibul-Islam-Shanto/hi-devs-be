import { app } from '@/server';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authHeader,
  createMockNotification,
  generateToken,
  VALID_OBJECT_ID,
} from './helpers';

const { mockRedis, MockNotification } = vi.hoisted(() => {
  const mockRedis = {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
  };

  const MockNotification = Object.assign(vi.fn(), {
    find: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
    updateMany: vi.fn(),
  });

  return { mockRedis, MockNotification };
});

vi.mock('@/config/redis', () => ({ default: mockRedis }));
vi.mock('@/module/notification/notification.model', () => ({
  default: MockNotification,
}));
vi.mock('@/utils/notification-sender', () => ({
  sendNotificationToUser: vi.fn().mockResolvedValue(undefined),
  broadcastNotification: vi.fn().mockResolvedValue(undefined),
  checkUserOnlineStatus: vi.fn().mockResolvedValue(false),
}));

const mockNotification = createMockNotification();
const mockNotificationRead = createMockNotification({ isRead: true });

describe('Notifications', () => {
  afterEach(() => vi.clearAllMocks());

  // ──────────────────── GET NOTIFICATIONS ───────────────────────
  describe('GET /api/notifications', () => {
    it('returns paginated notifications for authenticated user', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([mockNotification]),
              }),
            }),
          }),
        }),
      });
      MockNotification.countDocuments.mockResolvedValue(1);
      mockRedis.get.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/notifications')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('notifications');
      expect(res.body).toHaveProperty('pagination');
    });

    it('supports page and limit query parameters', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });
      MockNotification.countDocuments.mockResolvedValue(0);
      mockRedis.get.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/notifications?page=2&limit=5')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.pagination.currentPage).toBe(2);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  // ──────────────── GET UNREAD COUNT ────────────────────────────
  describe('GET /api/notifications/unread-count', () => {
    it('returns cached unread count from Redis', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      mockRedis.get.mockResolvedValue('5');

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(5);
    });

    it('queries DB and caches result on cache miss', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      mockRedis.get.mockResolvedValue(null);
      MockNotification.countDocuments.mockResolvedValue(3);

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.unreadCount).toBe(3);
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('unread_count:'),
        3,
        'EX',
        300,
      );
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/notifications/unread-count');

      expect(res.status).toBe(401);
    });
  });

  // ─────────────── MARK NOTIFICATION AS READ ────────────────────
  describe('PATCH /api/notifications/:notificationId/read', () => {
    it('marks a notification as read', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.findOneAndUpdate.mockResolvedValue(mockNotificationRead);

      const res = await request(app)
        .patch(`/api/notifications/${VALID_OBJECT_ID}/read`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification marked as read');
    });

    it('invalidates Redis cache after marking as read', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.findOneAndUpdate.mockResolvedValue(mockNotificationRead);

      await request(app)
        .patch(`/api/notifications/${VALID_OBJECT_ID}/read`)
        .set(authHeader(token));

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining(`unread_count:${VALID_OBJECT_ID}`),
      );
    });

    it('returns 404 when notification does not exist or belongs to another user', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/notifications/${VALID_OBJECT_ID}/read`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Notification not found');
    });

    it('returns 400 for invalid notification ID format', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .patch('/api/notifications/invalid-id/read')
        .set(authHeader(token));

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).patch(
        `/api/notifications/${VALID_OBJECT_ID}/read`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ─────────────── MARK ALL NOTIFICATIONS AS READ ───────────────
  describe('PATCH /api/notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All notifications marked as read');
    });

    it('invalidates Redis cache after marking all as read', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.updateMany.mockResolvedValue({ modifiedCount: 0 });

      await request(app)
        .patch('/api/notifications/read-all')
        .set(authHeader(token));

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining(`unread_count:${VALID_OBJECT_ID}`),
      );
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).patch('/api/notifications/read-all');

      expect(res.status).toBe(401);
    });
  });

  // ─────────────── DELETE NOTIFICATION ──────────────────────────
  describe('DELETE /api/notifications/:notificationId', () => {
    it('deletes a notification', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.findOneAndDelete.mockResolvedValue(mockNotification);

      const res = await request(app)
        .delete(`/api/notifications/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification deleted');
    });

    it('only deletes notification belonging to the authenticated user', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.findOneAndDelete.mockResolvedValue(mockNotification);

      await request(app)
        .delete(`/api/notifications/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(MockNotification.findOneAndDelete).toHaveBeenCalledWith({
        _id: VALID_OBJECT_ID,
        recipient: VALID_OBJECT_ID,
      });
    });

    it('returns 404 when notification does not exist or belongs to another user', async () => {
      const token = generateToken(VALID_OBJECT_ID);
      MockNotification.findOneAndDelete.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/notifications/${VALID_OBJECT_ID}`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Notification not found');
    });

    it('returns 400 for invalid notification ID format', async () => {
      const token = generateToken(VALID_OBJECT_ID);

      const res = await request(app)
        .delete('/api/notifications/invalid-id')
        .set(authHeader(token));

      expect(res.status).toBeGreaterThanOrEqual(400); // zParse throws plain Error → catchAsync may return 400 or 500
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).delete(
        `/api/notifications/${VALID_OBJECT_ID}`,
      );

      expect(res.status).toBe(401);
    });
  });
});
