/**
 * Connection Request Tests
 * 
 * Tests the sendConnectionRequest, respondToConnectionRequest, and
 * searchUserByUserId functions, including all guard rails and edge cases.
 */

// Mock Firestore SDK
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn(() => ({ id: 'mock-ref' }));
const mockCollection = jest.fn(() => 'mock-collection');
const mockQuery = jest.fn((...args) => args);
const mockWhere = jest.fn((...args) => args);
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');
const mockOnSnapshot = jest.fn(() => jest.fn()); // returns unsubscribe
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: (...args) => mockCollection(...args),
  doc: (...args) => mockDoc(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  getDocs: (...args) => mockGetDocs(...args),
  getDoc: (...args) => mockGetDoc(...args),
  addDoc: (...args) => mockAddDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  Timestamp: { now: () => 'TIMESTAMP_NOW' },
  onSnapshot: (...args) => mockOnSnapshot(...args),
  runTransaction: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  limit: (...args) => mockLimit(...args),
}));

jest.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'alice' } },
  storage: {},
}));

jest.mock('../logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
  }
}));

jest.mock('../identity-security-service', () => ({
  IdentitySecurityService: {
    decryptFromCloud: jest.fn((val) => val),
    encryptForCloud: jest.fn((val) => `encrypted_${val}`),
    isCloudSyncEnabled: jest.fn(() => Promise.resolve(true)),
    getOrCreateProfileKey: jest.fn(() => Promise.resolve('mock-key')),
  }
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

import {
  sendConnectionRequest,
  respondToConnectionRequest,
  searchUserByUserId,
  subscribeToIncomingRequests,
} from '../firestore-service';

describe('Connection Requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // sendConnectionRequest
  // ─────────────────────────────────────────────────────────
  describe('sendConnectionRequest', () => {
    test('should throw error when UIDs are missing', async () => {
      await expect(sendConnectionRequest(null, 'bob', {})).rejects.toThrow('Missing UIDs');
      await expect(sendConnectionRequest('alice', null, {})).rejects.toThrow('Missing UIDs');
      await expect(sendConnectionRequest(null, null, {})).rejects.toThrow('Missing UIDs');
    });

    test('should block self-connection request', async () => {
      const result = await sendConnectionRequest('alice', 'alice', { userId: '1234' });
      expect(result.status).toBe('self_request');
      // Should NOT have queried Firestore at all
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    test('should detect already-connected users', async () => {
      // Mock: conversations query returns a match
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'conv-123',
          data: () => ({ participantIds: ['alice', 'bob'] }),
        }],
      });

      const result = await sendConnectionRequest('alice', 'bob', { userId: '1234' });

      expect(result.status).toBe('already_connected');
      expect(result.conversationId).toBe('conv-123');
    });

    test('should detect pending outbound request', async () => {
      // Mock: no existing conversation with bob
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'conv-999',
          data: () => ({ participantIds: ['alice', 'charlie'] }), // not bob
        }],
      });

      // Mock: outbound pending request exists
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'req-1', data: () => ({ status: 'pending' }) }],
      });

      const result = await sendConnectionRequest('alice', 'bob', { userId: '1234' });
      expect(result.status).toBe('request_sent_already');
    });

    test('should auto-accept reciprocal request', async () => {
      // Mock: no existing conversation
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock: no outbound pending request
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: inbound pending request FROM bob TO alice exists
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'req-reciprocal', data: () => ({ status: 'pending' }) }],
      });
      // Mock: getConversationBetweenUsers → no existing conv (inside respondToConnectionRequest → createConversation)
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock: createConversation addDoc
      mockAddDoc.mockResolvedValueOnce({ id: 'new-conv-id' });
      // Mock: setDoc for updating request status
      mockSetDoc.mockResolvedValueOnce();

      const result = await sendConnectionRequest('alice', 'bob', { userId: '1234' });

      expect(result.status).toBe('success');
      expect(result.autoAccepted).toBe(true);
    });

    test('should enforce 24-hour cooldown after rejection', async () => {
      // Mock: no existing conversation
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock: no outbound pending request
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: no inbound pending request
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: rejected request exists within 24h
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'req-rejected',
          data: () => ({
            status: 'rejected',
            respondedAt: { toMillis: () => Date.now() - (1 * 60 * 60 * 1000) }, // 1 hour ago
          }),
        }],
      });

      const result = await sendConnectionRequest('alice', 'bob', { userId: '1234' });
      expect(result.status).toBe('rejected_cooldown');
      // Should NOT have created a new request
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    test('should allow re-request if rejection is older than 24 hours', async () => {
      // Mock: no existing conversation
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock: no outbound pending
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: no inbound pending
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: rejected request older than 24h
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'req-old-rejected',
          data: () => ({
            status: 'rejected',
            respondedAt: { toMillis: () => Date.now() - (48 * 60 * 60 * 1000) }, // 48 hours ago
          }),
        }],
      });
      // Mock: addDoc for new request
      mockAddDoc.mockResolvedValueOnce({ id: 'new-req' });

      const result = await sendConnectionRequest('alice', 'bob', { userId: '1234' });
      expect(result.status).toBe('success');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    test('should create new request successfully', async () => {
      // Mock: no existing conversation
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock: no outbound pending
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: no inbound pending
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: no rejected requests
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: addDoc
      mockAddDoc.mockResolvedValueOnce({ id: 'req-new' });

      const senderInfo = { userId: '1234' };
      const receiverInfo = { userId: '5678' };

      const result = await sendConnectionRequest('alice', 'bob', senderInfo, receiverInfo);

      expect(result.status).toBe('success');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          senderId: 'alice',
          receiverId: 'bob',
          senderInfo,
          receiverInfo,
          status: 'pending',
        })
      );
    });

    test('should handle no prior rejections', async () => {
      // Mock: no existing conversation
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock: no outbound pending
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: no inbound pending
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: no rejected requests at all
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
      // Mock: addDoc
      mockAddDoc.mockResolvedValueOnce({ id: 'req-new' });

      const result = await sendConnectionRequest('alice', 'bob', { userId: '1234' });
      expect(result.status).toBe('success');
    });
  });

  // ─────────────────────────────────────────────────────────
  // respondToConnectionRequest
  // ─────────────────────────────────────────────────────────
  describe('respondToConnectionRequest', () => {
    test('should create conversation on accept', async () => {
      // Mock getConversationBetweenUsers → no existing conv
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      // Mock addDoc for createConversation
      mockAddDoc.mockResolvedValueOnce({ id: 'conv-new' });
      // Mock setDoc for status update
      mockSetDoc.mockResolvedValueOnce();

      const result = await respondToConnectionRequest('req-1', 'accepted', 'alice', 'bob');

      expect(result).toBe(true);
      expect(mockAddDoc).toHaveBeenCalled(); // conversation created
      expect(mockSetDoc).toHaveBeenCalled(); // status updated
    });

    test('should not create conversation on reject', async () => {
      // Mock setDoc for status update
      mockSetDoc.mockResolvedValueOnce();

      const result = await respondToConnectionRequest('req-1', 'rejected', 'alice', 'bob');

      expect(result).toBe(true);
      expect(mockAddDoc).not.toHaveBeenCalled(); // no conversation
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'rejected' }),
        { merge: true }
      );
    });

    test('should reuse existing conversation if already exists', async () => {
      // Mock getConversationBetweenUsers → existing conv found
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'conv-existing',
          data: () => ({ participantIds: ['alice', 'bob'] }),
        }],
      });
      // Mock setDoc for status update
      mockSetDoc.mockResolvedValueOnce();

      const result = await respondToConnectionRequest('req-1', 'accepted', 'alice', 'bob');

      expect(result).toBe(true);
      expect(mockAddDoc).not.toHaveBeenCalled(); // no new conversation
    });
  });

  // ─────────────────────────────────────────────────────────
  // searchUserByUserId
  // ─────────────────────────────────────────────────────────
  describe('searchUserByUserId', () => {
    test('should find user by userId', async () => {
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'bob-uid',
          data: () => ({ userId: '5678', displayName: 'Bob' }),
        }],
      });

      const result = await searchUserByUserId('5678');

      expect(result).toEqual({
        uid: 'bob-uid',
        userId: '5678',
        displayName: 'Bob',
      });
    });

    test('should return null for non-existent user', async () => {
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });

      const result = await searchUserByUserId('9999');
      expect(result).toBeNull();
    });

    test('should throw on Firestore error', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore unavailable'));

      await expect(searchUserByUserId('5678')).rejects.toThrow('Firestore unavailable');
    });
  });

  // ─────────────────────────────────────────────────────────
  // subscribeToIncomingRequests
  // ─────────────────────────────────────────────────────────
  describe('subscribeToIncomingRequests', () => {
    test('should set up onSnapshot listener', () => {
      const callback = jest.fn();
      subscribeToIncomingRequests('alice', callback);

      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    test('should return unsubscribe function', () => {
      const mockUnsub = jest.fn();
      mockOnSnapshot.mockReturnValueOnce(mockUnsub);

      const unsub = subscribeToIncomingRequests('alice', jest.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });
});
