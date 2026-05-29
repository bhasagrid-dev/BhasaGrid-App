/**
 * useHomeActions Hook Tests (handleAddChatUser)
 * 
 * Tests guard rails: self-connect, corrupt profile, and all status codes.
 * Since useHomeActions is a plain function (not a React hook with state),
 * we can call it directly with mock arguments.
 */

const mockSendConnectionRequest = jest.fn();

jest.mock('../firestore-service', () => ({
  sendConnectionRequest: (...args) => mockSendConnectionRequest(...args),
  searchUserByUserId: jest.fn(),
  saveContactNickname: jest.fn(() => Promise.resolve()),
}));

jest.mock('../data-export-service', () => ({
  exportUserData: jest.fn(),
  downloadDataExport: jest.fn(),
  completeDataDeletion: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'alice' } },
}));

jest.mock('../logger', () => ({
  Logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
  }
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'android' },
}));

jest.mock('../../context/auth-context', () => ({
  useAuth: () => ({
    logout: jest.fn(),
    setIsDeletingAccount: jest.fn(),
  }),
}));

import { useHomeActions } from '../../hooks/useHomeActions';

describe('useHomeActions - handleAddChatUser', () => {
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockSetShowSearchModal = jest.fn();
  const mockSetShowQRModal = jest.fn();
  const mockSetShowScannedModal = jest.fn();
  const mockSetSelectedConversationId = jest.fn();

  function createActions(userOverride) {
    const ui = {
      showError: mockShowError,
      showSuccess: mockShowSuccess,
      setAlertConfig: jest.fn(),
      setShowSearchModal: mockSetShowSearchModal,
      setShowQRModal: mockSetShowQRModal,
      setShowScannedModal: mockSetShowScannedModal,
      userSearchQuery: '',
      setIsSearching: jest.fn(),
      setSearchResult: jest.fn(),
      renameTarget: { uid: null, currentName: '' },
      setShowRenameModal: jest.fn(),
      setRenameTarget: jest.fn(),
      setShowScanner: jest.fn(),
      setScannedUser: jest.fn(),
    };

    const user = userOverride !== undefined ? userOverride : { uid: 'alice' };
    const profile = { myUserId: '1234' };

    return useHomeActions(ui, user, profile, 'standard', false, mockSetSelectedConversationId, jest.fn());
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should block self-connection at UI level', async () => {
    const actions = createActions();
    await actions.handleAddChatUser({ uid: 'alice', userId: '1234' });

    expect(mockShowError).toHaveBeenCalledWith("You can't connect with yourself");
    expect(mockSendConnectionRequest).not.toHaveBeenCalled();
  });

  test('should block connection with missing uid', async () => {
    const actions = createActions();
    // target has no uid property
    await actions.handleAddChatUser({ userId: '5678' });

    // First guard passes (undefined !== 'alice'), second catches missing uid
    expect(mockShowError).toHaveBeenCalledWith('Invalid user profile');
    expect(mockSendConnectionRequest).not.toHaveBeenCalled();
  });

  test('should do nothing when user is null', async () => {
    const actions = createActions(null);
    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });
    expect(mockSendConnectionRequest).not.toHaveBeenCalled();
  });

  test('should do nothing when target is null', async () => {
    const actions = createActions();
    await actions.handleAddChatUser(null);
    expect(mockSendConnectionRequest).not.toHaveBeenCalled();
  });

  test('should handle successful request', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({ status: 'success' });
    const actions = createActions();

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    expect(mockSendConnectionRequest).toHaveBeenCalledWith(
      'alice', 'bob',
      { userId: '1234' },
      { userId: '5678' },
    );
    expect(mockShowSuccess).toHaveBeenCalledWith('Connection request sent!');
    expect(mockSetShowSearchModal).toHaveBeenCalledWith(false);
    expect(mockSetShowQRModal).toHaveBeenCalledWith(false);
    expect(mockSetShowScannedModal).toHaveBeenCalledWith(false);
  });

  test('should handle already-connected status (mobile)', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({
      status: 'already_connected',
      conversationId: 'conv-existing',
    });
    const actions = createActions();

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    // Mobile: should navigate to chat-detail
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/chat-detail',
      params: { conversationId: 'conv-existing' },
    });
  });

  test('should handle request_sent_already status', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({ status: 'request_sent_already' });
    const actions = createActions();

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    expect(mockShowSuccess).toHaveBeenCalledWith('Request already pending');
  });

  test('should handle self_request status from backend', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({ status: 'self_request' });
    // Use a different user so the UI guard doesn't fire first
    const actions = createActions({ uid: 'charlie' });

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    expect(mockShowError).toHaveBeenCalledWith("You can't connect with yourself");
  });

  test('should handle rejected_cooldown status', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({ status: 'rejected_cooldown' });
    const actions = createActions();

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    expect(mockShowError).toHaveBeenCalledWith('This user recently declined your request. Try again later.');
  });

  test('should handle auto-accepted reciprocal request', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({ status: 'success', autoAccepted: true });
    const actions = createActions();

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    expect(mockShowSuccess).toHaveBeenCalledWith("You're connected! Start chatting. 🚀");
  });

  test('should fallback userId to "Unknown" for target without userId', async () => {
    mockSendConnectionRequest.mockResolvedValueOnce({ status: 'success' });
    const actions = createActions();

    // Target has uid but no userId
    await actions.handleAddChatUser({ uid: 'bob' });

    expect(mockSendConnectionRequest).toHaveBeenCalledWith(
      'alice', 'bob',
      { userId: '1234' },
      { userId: 'Unknown' },
    );
  });

  test('should show generic error on exception', async () => {
    mockSendConnectionRequest.mockRejectedValueOnce(new Error('Network error'));
    const actions = createActions();

    await actions.handleAddChatUser({ uid: 'bob', userId: '5678' });

    expect(mockShowError).toHaveBeenCalledWith('Failed to send request');
  });
});
