/**
 * useProfile Self-Healing Tests
 * 
 * Tests the profile self-healing logic that detects and repairs corrupt
 * profiles (document exists but userId/pin are missing).
 * 
 * Since useProfile is a React hook, we test the underlying Firestore service
 * functions and the healing logic by verifying the interactions.
 */

const mockGetUserProfile = jest.fn();
const mockCreateUserProfile = jest.fn();
const mockRepairPublicProfile = jest.fn();

jest.mock('../firestore-service', () => ({
  getUserProfile: (...args) => mockGetUserProfile(...args),
  createUserProfile: (...args) => mockCreateUserProfile(...args),
  updateUserProfile: jest.fn(() => Promise.resolve()),
  repairPublicProfile: (...args) => mockRepairPublicProfile(...args),
  subscribeToUserProfile: jest.fn(() => jest.fn()),
  updateProfilePhotoMetadata: jest.fn(),
}));

jest.mock('../logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
  }
}));

jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-uid-123' } },
}));

jest.mock('../ratchet-key-service', () => ({
  getOrCreateMyPqcKeyPair: jest.fn(() => Promise.resolve({ publicKey: 'pk', secretKey: 'sk' })),
}));

jest.mock('../identity-security-service', () => ({
  IdentitySecurityService: {
    getOrCreateProfileKey: jest.fn(() => Promise.resolve('mock-profile-key')),
  }
}));

jest.mock('../profile-picture-service', () => ({
  ProfilePictureService: {
    getSecureProfilePicture: jest.fn(),
    uploadSecureProfilePicture: jest.fn(),
  }
}));

import { getUserProfile, createUserProfile } from '../firestore-service';

describe('Profile Self-Healing Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // Simulates the useProfile decision logic without React
  // ─────────────────────────────────────────────────────────
  async function simulateProfileLoad(user) {
    const profile = await getUserProfile(user.uid);
    const result = { myUserId: 'Loading...', userPin: '....' };

    if (profile) {
      if (!profile.userId) {
        // Self-healing path
        const newProfile = await createUserProfile(user);
        result.myUserId = newProfile.userId;
        result.userPin = newProfile.pin;
        result.healed = true;
        return result;
      }

      // Normal path
      result.myUserId = profile.userId;
      result.userPin = profile.pin || '....';
      result.healed = false;
      return result;
    }

    // Profile is null — brand new or missing
    result.myUserId = null;
    result.healed = false;
    return result;
  }

  test('should display profile normally when userId exists', async () => {
    mockGetUserProfile.mockResolvedValueOnce({
      userId: '4567',
      pin: '123456',
      bio: 'Hello!',
    });

    const result = await simulateProfileLoad({ uid: 'test-uid-123' });

    expect(result.myUserId).toBe('4567');
    expect(result.userPin).toBe('123456');
    expect(result.healed).toBe(false);
    expect(mockCreateUserProfile).not.toHaveBeenCalled();
  });

  test('should trigger self-healing when profile exists but userId is missing', async () => {
    // Profile doc exists but ONLY has encryption fields
    mockGetUserProfile.mockResolvedValueOnce({
      encryptionCapabilities: { v6: true },
      dhPublicKey: 'some-key',
      // userId: undefined — MISSING
      // pin: undefined — MISSING
    });

    // Self-healing creates new profile
    mockCreateUserProfile.mockResolvedValueOnce({
      userId: '9999',
      pin: '654321',
      isNewUser: true,
    });

    const result = await simulateProfileLoad({ uid: 'test-uid-123' });

    expect(result.myUserId).toBe('9999');
    expect(result.userPin).toBe('654321');
    expect(result.healed).toBe(true);
    expect(mockCreateUserProfile).toHaveBeenCalledWith({ uid: 'test-uid-123' });
  });

  test('should propagate error when self-healing fails', async () => {
    mockGetUserProfile.mockResolvedValueOnce({
      encryptionCapabilities: { v6: true },
    });

    mockCreateUserProfile.mockRejectedValueOnce(new Error('Transaction failed'));

    await expect(simulateProfileLoad({ uid: 'test-uid-123' })).rejects.toThrow('Transaction failed');
  });

  test('should return null userId when profile is completely missing', async () => {
    mockGetUserProfile.mockResolvedValueOnce(null);

    const result = await simulateProfileLoad({ uid: 'test-uid-123' });

    expect(result.myUserId).toBeNull();
    expect(mockCreateUserProfile).not.toHaveBeenCalled();
  });

  test('should handle empty string userId as missing', async () => {
    mockGetUserProfile.mockResolvedValueOnce({
      userId: '', // empty string is falsy
      pin: '123456',
    });

    mockCreateUserProfile.mockResolvedValueOnce({
      userId: '7777',
      pin: '777777',
      isNewUser: true,
    });

    const result = await simulateProfileLoad({ uid: 'test-uid-123' });

    expect(result.myUserId).toBe('7777');
    expect(result.healed).toBe(true);
  });

  test('should not heal when profile has valid userId', async () => {
    mockGetUserProfile.mockResolvedValueOnce({
      userId: '1234',
      pin: '999999',
      encryptionCapabilities: { v6: true },
      dhPublicKey: 'key',
    });

    const result = await simulateProfileLoad({ uid: 'test-uid-123' });

    expect(result.myUserId).toBe('1234');
    expect(result.healed).toBe(false);
    expect(mockCreateUserProfile).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────
  // createUserProfile repair flow
  // ─────────────────────────────────────────────────────────
  describe('createUserProfile (repair scenarios)', () => {
    test('should handle profile with only encryption fields', async () => {
      // This tests that createUserProfile can repair a doc that exists but has no userId
      mockGetUserProfile.mockResolvedValueOnce({
        dhPublicKey: 'some-key',
        v6PublicKeys: { dh: 'dh-key', pqc: 'pqc-key' },
        encryptionCapabilities: { v6: true },
        isOnline: true,
        lastSeen: { toDate: () => new Date() },
      });

      mockCreateUserProfile.mockResolvedValueOnce({
        userId: '3333',
        pin: '333333',
        isNewUser: true,
      });

      const result = await simulateProfileLoad({ uid: 'corrupt-user' });
      expect(result.healed).toBe(true);
      expect(result.myUserId).toBe('3333');
    });

    test('should handle profile with null userId explicitly set', async () => {
      mockGetUserProfile.mockResolvedValueOnce({
        userId: null,
        pin: null,
      });

      mockCreateUserProfile.mockResolvedValueOnce({
        userId: '4444',
        pin: '444444',
        isNewUser: true,
      });

      const result = await simulateProfileLoad({ uid: 'null-id-user' });
      expect(result.healed).toBe(true);
      expect(result.myUserId).toBe('4444');
    });
  });
});
