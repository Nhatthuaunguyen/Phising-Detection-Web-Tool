import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, SafeAreaView } from 'react-native';

const BACKEND_API = "https://phising-detection-web-tool.vercel.app/analyze";

export default function App() {
  const [warningVisible, setWarningVisible] = useState(false);
  const [blockedUrl, setBlockedUrl] = useState(null);
  const [reasons, setReasons] = useState([]);

  // Simulate catching an Intent or Deep Link from OS
  useEffect(() => {
    // 1. App handles initial URL if opened via link
    Linking.getInitialURL().then(url => {
      if (url) handleIncomingURL(url);
    });

    // 2. App handles URLs received while in foreground/background
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingURL(url);
    });

    return () => subscription.remove();
  }, []);

  const handleIncomingURL = async (url) => {
    try {
      console.log(`Intercepted URL: ${url}`);
      // Query backend
      const response = await fetch(BACKEND_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      const data = await response.json();

      if (data.is_unsafe) {
        setBlockedUrl(url);
        setReasons(data.reasons || ["Phishing patterns detected"]);
        setWarningVisible(true);
      } else {
        // Safe, let the OS open it normally in browser
        Linking.openURL(url);
      }
    } catch (err) {
      console.error(err);
      // Failsafe block
      setBlockedUrl(url);
      setReasons(["Backend Error - Unable to verify link safety."]);
      setWarningVisible(true);
    }
  };

  const handleProceed = () => {
    setWarningVisible(false);
    if (blockedUrl) {
      Linking.openURL(blockedUrl); // Force open safely
    }
  };

  const handleBackToSafe = () => {
    setWarningVisible(false);
    setBlockedUrl(null);
    setReasons([]); // Just close modal, returning to previous app.
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI Security Checker</Text>
      <Text style={styles.sub}>Waiting to intercept links...</Text>

      {/* Simulation Button for Testing since we can't easily click a link in Zalo */}
      <TouchableOpacity
        style={styles.simulateBtn}
        onPress={() => handleIncomingURL("http://1.2.3.4/paypal-login")}
      >
        <Text style={styles.btnText}>Simulate Suspicous Link Click</Text>
      </TouchableOpacity>

      {/* Warning Modal (Matches Web CSS aesthetic) */}
      <Modal visible={warningVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Suspicious Link Blocked</Text>
            <Text style={styles.modalSub}>
              Our engine flagged this app interaction as potentially dangerous.
            </Text>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>RISK ANALYSIS</Text>
              {reasons.map((r, i) => (
                <Text key={i} style={styles.reasonItem}>• {r}</Text>
              ))}
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.backBtn} onPress={handleBackToSafe}>
                <Text style={styles.backBtnText}>Back to Safety</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                <Text style={styles.proceedBtnText}>Proceed Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#120e10' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sub: { color: '#a1a1aa', marginTop: 10, marginBottom: 40 },
  simulateBtn: { backgroundColor: '#333', padding: 15, borderRadius: 8 },
  btnText: { color: '#fff' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#1E1419',
    padding: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 105, 0.15)',
  },
  warningIcon: { fontSize: 50, textAlign: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#f87171', textAlign: 'center', marginBottom: 10 },
  modalSub: { color: '#a1a1aa', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  reasonBox: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: '#ef444440' },
  reasonTitle: { color: '#fca5a5', fontWeight: 'bold', fontSize: 12, marginBottom: 10 },
  reasonItem: { color: '#e4e4e7', marginBottom: 5, fontSize: 13 },
  buttons: { display: 'flex', flexDirection: 'column', gap: 15 },
  backBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 8, alignItems: 'center' },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  proceedBtn: { backgroundColor: 'transparent', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  proceedBtnText: { color: '#a1a1aa', fontWeight: 'bold' }
});
