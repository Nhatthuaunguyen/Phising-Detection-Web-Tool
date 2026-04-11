import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, TextInput, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

const BACKEND_API = "https://phising-detection-web-tool-backend.vercel.app/analyze";

interface CheckResult {
  is_unsafe: boolean;
  reasons?: string[];
  risk_score?: number;
}

export default function HomeScreen() {
  const [modalState, setModalState] = useState('none'); // 'none', 'unsafe', 'safe', 'error', 'loading'
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [riskScore, setRiskScore] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  // Handle deep links from other apps (Feature 2)
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;
      console.log(`[Feature 2] Intercepted deep link: ${url}`);
      
      // Navigate to link-interceptor screen
      // This will be handled by expo-router automatically
    };

    // Get initial URL if app was opened via link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    // Listen for URLs while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const checkUrl = async (url: string) => {
    if (!url.trim()) return;

    setModalState('loading');
    setBlockedUrl(url.trim());

    try {
      console.log(`[Feature 1] Checking URL: ${url.trim()}`);
      
      const response = await fetch(BACKEND_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: CheckResult = await response.json();
      console.log(`[Feature 1] Result:`, data);

      if (data.is_unsafe) {
        setReasons(data.reasons || ["Phishing patterns detected"]);
        setRiskScore(data.risk_score);
        setModalState('unsafe');
      } else {
        setReasons([]);
        setRiskScore(data.risk_score);
        setModalState('safe');
      }
    } catch (err) {
      console.error('[Feature 1] Error:', err);
      setErrorMessage(err instanceof Error ? err.message : "Unable to connect to AI server");
      setModalState('error');
    }
  };

  const handleOpenUrl = async () => {
    if (blockedUrl) {
      try {
        await WebBrowser.openBrowserAsync(blockedUrl);
      } catch (err) {
        console.error('Error opening URL:', err);
      }
    }
    setModalState('none');
  };

  const handleCloseModal = () => {
    setModalState('none');
    setBlockedUrl(null);
    setReasons([]);
    setRiskScore(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🛡️ Phishing Detector</Text>
        <Text style={styles.subtitle}>Feature 1: Manual Link Verification</Text>
        <Text style={styles.description}>Paste any suspicious link below to check if it's safe</Text>

        {/* Manual Check Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Paste a suspicious link here..."
            placeholderTextColor="#666"
            value={manualUrl}
            onChangeText={setManualUrl}
            autoCapitalize="none"
            editable={modalState === 'none'}
          />
          <TouchableOpacity
            style={[styles.checkBtn, (modalState !== 'none' || !manualUrl.trim()) && { opacity: 0.6 }]}
            onPress={() => {
              if (manualUrl.trim()) {
                checkUrl(manualUrl);
                setManualUrl("");
              }
            }}
            disabled={modalState !== 'none' || !manualUrl.trim()}
          >
            <Text style={styles.checkBtnText}>
              {modalState === 'loading' ? 'Checking...' : 'Check'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Test Buttons */}
        <Text style={styles.testTitle}>Quick Test</Text>
        
        <TouchableOpacity 
          style={styles.simulateBtn}
          onPress={() => checkUrl("http://1.2.3.4/paypal-login")}
          disabled={modalState !== 'none'}
        >
          <Text style={styles.btnText}>🔴 Test Suspicious Link</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.simulateSafeBtn}
          onPress={() => checkUrl("https://www.google.com")}
          disabled={modalState !== 'none'}
        >
          <Text style={styles.btnText}>🟢 Test Safe Link</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        
        {/* Feature 2 Info 
        <Text style={styles.feature2Title}>Feature 2: Auto Interception</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How Auto Interception Works:</Text>
          <Text style={styles.infoText}>
            1️⃣ Click any link from Facebook, Viber, Telegram, etc.
          </Text>
          <Text style={styles.infoText}>
            2️⃣ This app intercepts it automatically
          </Text>
          <Text style={styles.infoText}>
            3️⃣ We verify it against our AI safety database
          </Text>
          <Text style={styles.infoText}>
            4️⃣ Safe links open • Suspicious links are blocked with explanation
          </Text>
        </View>
      </ScrollView>
      */}

      {/* Result Modals */}
      <Modal visible={modalState !== 'none'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard,
            modalState === 'safe' && { borderColor: 'rgba(74, 222, 128, 0.3)' },
            modalState === 'error' && { borderColor: 'rgba(250, 204, 21, 0.3)' }
          ]}>

            {/* Loading */}
            {modalState === 'loading' && (
              <>
                <Text style={styles.loadingIcon}>🔍</Text>
                <Text style={styles.modalTitle}>Scanning Link</Text>
                <Text style={styles.modalSub}>Analyzing for security threats...</Text>
              </>
            )}

            {/* Unsafe */}
            {modalState === 'unsafe' && (
              <>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.modalTitle}>Suspicious Link Detected</Text>
                <Text style={styles.modalSub}>This link shows signs of phishing or malicious activity</Text>
                
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>🔍 SECURITY ANALYSIS</Text>
                  {reasons.map((r, i) => (
                    <View key={i} style={styles.reasonItemContainer}>
                      <Text style={styles.reasonBullet}>●</Text>
                      <Text style={styles.reasonItem}>{r}</Text>
                    </View>
                  ))}
                </View>

                {riskScore !== undefined && (
                  <View style={styles.riskScoreBox}>
                    <Text style={styles.riskScoreLabel}>Risk Score: </Text>
                    <Text style={[styles.riskScore, { color: riskScore > 70 ? '#ef4444' : '#facc15' }]}>
                      {riskScore}%
                    </Text>
                  </View>
                )}

                <View style={styles.buttons}>
                  <TouchableOpacity style={styles.backBtn} onPress={handleCloseModal}>
                    <Text style={styles.backBtnText}>🔒 Go Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.proceedBtn} onPress={handleOpenUrl}>
                    <Text style={styles.proceedBtnText}>⚡ Open Anyway</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Safe */}
            {modalState === 'safe' && (
              <>
                <Text style={styles.safeIcon}>🛡️</Text>
                <Text style={[styles.modalTitle, { color: '#4ade80' }]}>Link is Safe!</Text>
                <Text style={styles.modalSub}>Our AI verified this URL - no threats detected</Text>
                
                <View style={[styles.reasonBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                  <Text style={[styles.reasonTitle, { color: '#4ade80' }]}>✓ VERIFICATION PASSED</Text>
                  <Text style={styles.reasonItem}>This URL has been verified and is safe to visit.</Text>
                </View>

                {riskScore !== undefined && (
                  <View style={[styles.riskScoreBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                    <Text style={[styles.riskScoreLabel, { color: '#4ade80' }]}>Risk Score: </Text>
                    <Text style={[styles.riskScore, { color: '#4ade80' }]}>
                      {riskScore}%
                    </Text>
                  </View>
                )}

                <View style={styles.buttons}>
                  <TouchableOpacity style={[styles.backBtn, { backgroundColor: '#22c55e' }]} onPress={handleOpenUrl}>
                    <Text style={styles.backBtnText}>🌐 Open in Browser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.proceedBtn} onPress={handleCloseModal}>
                    <Text style={styles.proceedBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Error */}
            {modalState === 'error' && (
              <>
                <Text style={styles.errorIcon}>🔌</Text>
                <Text style={[styles.modalTitle, { color: '#facc15' }]}>Connection Error</Text>
                <Text style={styles.modalSub}>Could not reach the AI Server</Text>
                <Text style={styles.errorDetails}>{errorMessage}</Text>
                
                <View style={styles.buttons}>
                  <TouchableOpacity style={[styles.backBtn, { backgroundColor: '#ca8a04' }]} onPress={handleCloseModal}>
                    <Text style={styles.backBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#120e10'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8
  },
  description: {
    color: '#a1a1aa', 
    marginBottom: 24,
    lineHeight: 20
  },
  
  inputContainer: { 
    flexDirection: 'row', 
    marginBottom: 24, 
    backgroundColor: '#1E1419', 
    borderRadius: 8, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  input: { 
    flex: 1, 
    color: '#fff', 
    paddingHorizontal: 15, 
    paddingVertical: 12,
    fontSize: 14
  },
  checkBtn: { 
    backgroundColor: '#ef4444', 
    paddingHorizontal: 20, 
    justifyContent: 'center' 
  },
  checkBtnText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 14
  },

  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 24
  },

  testTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12
  },

  simulateBtn: { 
    backgroundColor: '#7f1d1d', 
    padding: 16, 
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef444460'
  },
  simulateSafeBtn: { 
    backgroundColor: '#15803d', 
    padding: 16, 
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#22c55e60'
  },
  btnText: { 
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14
  },

  /*
  feature2Title: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12
  },

  infoBox: {
    backgroundColor: '#1E1419',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  infoTitle: {
    color: '#4ade80',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 14
  },
  infoText: {
    color: '#a1a1aa',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20
  },
  */

  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'flex-end',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#1E1419', 
    padding: 24, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    borderWidth: 1, 
    borderColor: 'rgba(255, 99, 105, 0.15)',
  },

  loadingIcon: { fontSize: 50, textAlign: 'center', marginBottom: 16 },
  warningIcon: { fontSize: 50, textAlign: 'center', marginBottom: 16 },
  safeIcon: { fontSize: 50, textAlign: 'center', marginBottom: 16 },
  errorIcon: { fontSize: 50, textAlign: 'center', marginBottom: 16 },

  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#f87171', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  modalSub: { 
    color: '#a1a1aa', 
    textAlign: 'center', 
    marginBottom: 16, 
    lineHeight: 20,
    fontSize: 14
  },
  errorDetails: {
    color: '#fca5a5',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic'
  },

  reasonBox: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#ef444440' 
  },
  reasonTitle: { 
    color: '#fca5a5', 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginBottom: 12 
  },
  reasonItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  reasonBullet: {
    color: '#fca5a5',
    marginRight: 8,
    marginTop: 2
  },
  reasonItem: { 
    color: '#e4e4e7', 
    fontSize: 13,
    flex: 1,
    lineHeight: 18
  },

  riskScoreBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    alignItems: 'center'
  },
  riskScoreLabel: {
    color: '#facc15',
    fontWeight: 'bold',
    fontSize: 14
  },
  riskScore: {
    fontWeight: 'bold',
    fontSize: 18
  },

  buttons: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 12 
  },
  backBtn: { 
    backgroundColor: '#ef4444', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  backBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  proceedBtn: { 
    backgroundColor: 'transparent', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  proceedBtnText: { 
    color: '#a1a1aa', 
    fontWeight: 'bold',
    fontSize: 14
  }
});