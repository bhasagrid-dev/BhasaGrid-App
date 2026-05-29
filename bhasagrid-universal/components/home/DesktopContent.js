/** Purpose: Main layout container for the desktop web view. */
import React from 'react';
import { View, Text, Image } from 'react-native';
import { getHomeStyles } from "../../styles/home.styles";
import { select } from "../../utils/platform";
import { ProfileDetailView, SecurityDetailView, PrivacyDetailView, NotificationDetailView, ConnectDetailView } from "./DetailViews";
import { ThemeSettingsView, AboutSettingsView } from "./DesktopSettingsViews";
import { CallsDetailView, StoriesDetailView } from "./FeatureViews";
import { ChatInterface } from "../chat/chat-interface";
import { UpdateSettingsView } from "./UpdateSettingsView";
import { Logger } from "../../lib/logger";

export const DesktopContent = ({
  THEME,
  desktopDetailView,
  isLargeDesktop,
  profile,
  security,
  ui,
  privacyLevel,
  handlePrivacyLevel,
  privacy,
  UpdateManager,
  insets,
  selectedConversationId,
  user,
  setSelectedConversationId,
  showSuccess,
  showError,
  // New Props being passed from home.js
  stealth,
  themePreference,
  toggleTheme,
  updates,
  isDecoyMode,
  handleRenameContact,
  conversations,
  nicknames
}) => {
  const styles = getHomeStyles(THEME);
  const isDark = THEME.background === '#0F172A' || THEME.background === '#030712' || THEME.background === '#020617';
  
  const activeConv = conversations?.find(c => c.id === selectedConversationId);
  const otherUserUid = activeConv?.otherUserUid;
  const nickname = nicknames?.[otherUserUid] || activeConv?.otherUserId;
  return (
    <View style={[styles.contentArea, { backgroundColor: THEME.background }]}>
      {desktopDetailView === 'profile' ? (
        <ProfileDetailView
          THEME={THEME}
          isLargeDesktop={isLargeDesktop}
          handlePickProfilePicture={() => profile.handlePickProfilePicture(showSuccess, showError)}
          userPhoto={profile.userPhoto}
          myUserId={profile.myUserId}
          userBio={profile.userBio}
          onChangeBio={profile.onChangeBio}
          handleUpdateBio={(bio) => profile.handleUpdateBio(bio, showSuccess, showError)}
          bioStatus={profile.bioStatus}
          displayName={profile.displayName}
          onChangeDisplayName={profile.onChangeDisplayName}
          nameStatus={profile.nameStatus}
          photoVisibility={profile.photoVisibility}
          handleTogglePhotoVisibility={profile.handleTogglePhotoVisibility}
          isInline={false}
        />
      ) : desktopDetailView === 'security' ? (
        <SecurityDetailView
          THEME={THEME}
          myUserId={profile.myUserId}
          userPin={profile.userPin}
          setAlertConfig={ui.setAlertConfig}
          setSecurityStep={ui.setSecurityStep}
          setSecurityInputPin={ui.setSecurityInputPin}
          setSecurityNewPass={ui.setSecurityNewPass}
          setSecurityMode={ui.setSecurityMode}
          setShowSecurityModal={ui.setShowSecurityModal}
          showSuccess={showSuccess}
          confirmLogout={profile.confirmLogout}
          handleToggleConfirmLogout={profile.handleToggleConfirmLogout}
          biometricsEnabled={security.biometricsEnabled}
          handleToggleBiometrics={security.handleToggleBiometrics}
          biometricsSupported={security.biometricsSupported}
          screenshotsBlocked={security.screenshotsBlocked}
          handleToggleScreenshots={security.handleToggleScreenshots}
          hardwareLockEnabled={security.hardwareLockEnabled}
          hardwareSupported={security.hardwareSupported}
          handleToggleHardwareLock={security.handleToggleHardwareLock}
        />

      ) : desktopDetailView === 'theme' ? (
        <ThemeSettingsView
          THEME={THEME}
          themePreference={themePreference}
          toggleTheme={toggleTheme}
          side={isDecoyMode ? 'decoy' : 'chat'}
          isInline={true}
        />
      ) : desktopDetailView === 'about' ? (
        <AboutSettingsView
          THEME={THEME}
          setShowUpdateWalkthrough={updates.setShowUpdateWalkthrough}
        />
      ) : desktopDetailView === 'updates' ? (
        <UpdateSettingsView THEME={THEME} />
      ) : desktopDetailView === 'privacy' ? (
        <PrivacyDetailView
          THEME={THEME}
          privacyPlatformTab={ui.privacyPlatformTab}
          setPrivacyPlatformTab={ui.setPrivacyPlatformTab}
          privacyLevel={privacyLevel}
          handlePrivacyLevel={handlePrivacyLevel}
          privacy={privacy}
        />
      ) : desktopDetailView === 'notifications' ? (
        <NotificationDetailView THEME={THEME} />
      ) : desktopDetailView === 'calls' ? (
        <CallsDetailView THEME={THEME} isDesktop={true} />
      ) : desktopDetailView === 'stories' ? (
        <StoriesDetailView THEME={THEME} />
      ) : desktopDetailView === 'connect' ? (
        <ConnectDetailView
          THEME={THEME}
          myUserId={profile.myUserId}
          user={user}
          showSuccess={showSuccess}
        />
      ) : selectedConversationId ? (
        <ChatInterface
          conversationId={selectedConversationId}
          currentUserId={user?.uid}
          onBack={() => setSelectedConversationId(null)}
          isDesktop={true}
          onOpenProfile={(uid) => {
            Logger.log("Open profile", uid);
          }}
          privacyLevel={privacyLevel}
          onRename={handleRenameContact}
          otherUserUid={otherUserUid}
          nickname={nickname}
        />
      ) : (
        // Empty State for Desktop Right Pane
        <View style={[styles.emptyStateContainer, { backgroundColor: THEME.background }]}>
          <View style={{
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            padding: 48,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            ...select({
              web: { boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.05)' },
            })
          }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 100, height: 100, marginBottom: 24, borderRadius: 24, opacity: 0.9 }} />
            <Text style={{ color: THEME.text, fontSize: 24, fontWeight: '800', marginBottom: 12, letterSpacing: -0.5 }}>BhasaGrid</Text>
            <Text style={{ color: THEME.textSecondary, fontSize: 16, textAlign: 'center', maxWidth: 280, lineHeight: 24 }}>Select a conversation to start messaging securely.</Text>
          </View>
        </View>
      )}
    </View>
  );
};
