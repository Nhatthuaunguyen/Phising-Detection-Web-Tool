import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, SafeAreaView, TextInput } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const BACKEND_API = "https://phising-detection-web-tool-backend.vercel.app/";

export default function App() {
  const [modalState, setModalState] = useState('none'); // 'none', 'unsafe', 'safe', 'error'
  const [blockedUrl, setBlockedUrl] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Simulate catching an Intent or Deep Link from OS
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) handleIncomingURL(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingURL(url);
    });
    return () => subscription.remove();
  }, []);

  const handleIncomingURL = async (url) => {
    try {
      console.log(`Intercepted URL: ${url}`);
      const response = await fetch(BACKEND_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      const data = await response.json();

      if (data.is_unsafe) {
        setBlockedUrl(url);
        setReasons(data.reasons || ["Phishing patterns detected"]);
        setModalState('unsafe');
      } else {
        setBlockedUrl(url);
        setModalState('safe');
      }
    } catch (err) {
      console.error(err);
      setBlockedUrl(url);
      setErrorMessage(err.message || "Unable to connect to AI server. Please check your network or Vercel config.");
      setModalState('error');
    }
  };

  const handleProceed = () => {
    setModalState('none');
    if (blockedUrl) {
      WebBrowser.openBrowserAsync(blockedUrl);
    }
  };

  const handleClose = () => {
    setModalState('none');
    setBlockedUrl(null);
    setReasons([]);
  };

  const [manualUrl, setManualUrl] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI Security Checker</Text>
      <Text style={styles.sub}>Waiting to intercept links or check manually...</Text>

      {/* Manual Check Box */}
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Paste or type a suspicious link here..." 
          placeholderTextColor="#666"
          value={manualUrl}
          onChangeText={setManualUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.checkBtn} 
          onPress={() => {
            if (manualUrl.trim()) {
              handleIncomingURL(manualUrl.trim());
              setManualUrl("");
            }
          }}
        >
          <Text style={styles.checkBtnText}>Check Risk</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.simulateBtn} onPress={() => handleIncomingURL("http://1.2.3.4/paypal-login")}>
        <Text style={styles.btnText}>Simulate Suspicious Web Click</Text>
      </TouchableOpacity>
      
      <View style={{marginTop: 15}}>
        <TouchableOpacity style={styles.simulateSafeBtn} onPress={() => handleIncomingURL("https://www.google.com")}>
          <Text style={styles.btnText}>Simulate Safe Web Click</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal visible={modalState !== 'none'} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[
            styles.modalCard, 
            modalState === 'safe' && { borderColor: 'rgba(74, 222, 128, 0.3)' },
            modalState === 'error' && { borderColor: 'rgba(250, 204, 21, 0.3)' }
          ]}>
            
            {/* UNSAFE MODAL */}
            {modalState === 'unsafe' && (
              <>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.modalTitle}>Suspicious Link Blocked</Text>
                <Text style={styles.modalSub}>Our engine flagged this app interaction as potentially dangerous.</Text>
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>RISK ANALYSIS</Text>
                  {reasons.map((r, i) => <Text key={i} style={styles.reasonItem}>• {r}</Text>)}
                </View>
                <View style={styles.buttons}>
                  <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
                    <Text style={styles.backBtnText}>Back to Safety</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                    <Text style={styles.proceedBtnText}>Proceed Anyway</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* SAFE MODAL */}
            {modalState === 'safe' && (
              <>
                <Text style={styles.warningIcon}>🛡️</Text>
                <Text style={[styles.modalTitle, { color: '#4ade80' }]}>Link is Safe!</Text>
                <Text style={styles.modalSub}>Our AI scanned the URL and found no phishing threats.</Text>
                <View style={[styles.reasonBox, { borderColor: '#4ade8040' }]}>
                  <Text style={styles.reasonItem}>Target: {blockedUrl}</Text>
                </View>
                <View style={styles.buttons}>
                  <TouchableOpacity style={[styles.backBtn, { backgroundColor: '#22c55e' }]} onPress={handleProceed}>
                    <Text style={styles.backBtnText}>Open In Browser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.proceedBtn} onPress={handleClose}>
                    <Text style={styles.proceedBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ERROR MODAL */}
            {modalState === 'error' && (
              <>
                <Text style={styles.warningIcon}>🔌</Text>
                <Text style={[styles.modalTitle, { color: '#facc15' }]}>Connection Error</Text>
                <Text style={styles.modalSub}>Could not reach the AI Server. {errorMessage}</Text>
                <View style={styles.buttons}>
                  <TouchableOpacity style={[styles.backBtn, { backgroundColor: '#ca8a04' }]} onPress={handleClose}>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#120e10' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sub: { color: '#a1a1aa', marginTop: 10, marginBottom: 20 },
  inputContainer: { flexDirection: 'row', width: '90%', marginBottom: 30, backgroundColor: '#1E1419', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  input: { flex: 1, color: '#fff', paddingHorizontal: 15, paddingVertical: 12 },
  checkBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, justifyContent: 'center' },
  checkBtnText: { color: '#fff', fontWeight: 'bold' },
  simulateBtn: { backgroundColor: '#333', padding: 15, borderRadius: 8 },
  simulateSafeBtn: { backgroundColor: '#166534', padding: 15, borderRadius: 8 },
  btnText: { color: '#fff' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#1E1419', padding: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255, 99, 105, 0.15)',
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
