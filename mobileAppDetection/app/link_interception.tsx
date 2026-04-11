import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking } from 'react-native';

const BACKEND_API = "https://phising-detection-web-tool-backend.vercel.app/analyze";

interface CheckResult {
  is_unsafe: boolean;
  reasons?: string[];
  risk_score?: number;
}

export default function LinkInterceptorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkLink = async () => {
      try {
        // Get URL from deep link parameter
        let targetUrl = params.url as string || '';
        
        if (!targetUrl) {
          // Fallback: try to get from Linking API
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            targetUrl = extractUrlFromDeepLink(initialUrl);
          }
        }

        if (!targetUrl) {
          setError('No URL provided');
          setCheckResult({
            is_unsafe: true,
            reasons: ['No URL was detected']
          });
          setIsLoading(false);
          return;
        }

        setUrl(targetUrl);
        console.log(`[LinkInterceptor] Checking URL: ${targetUrl}`);

        const response = await fetch(BACKEND_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data: CheckResult = await response.json();
        console.log(`[LinkInterceptor] Result:`, data);
        setCheckResult(data);
      } catch (error) {
        console.error('[LinkInterceptor] Error checking link:', error);
        const errorMsg = error instanceof Error ? error.message : 'Connection error';
        setError(errorMsg);
        setCheckResult({
          is_unsafe: true,
          reasons: ['Could not verify link safety. Blocked for your protection.', errorMsg]
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkLink();
  }, [params.url]);

  const handleProceed = async () => {
    if (url) {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch (err) {
        console.error('[LinkInterceptor] Error opening URL:', err);
      } finally {
        router.back();
      }
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Scanning link...</Text>
          <Text style={styles.loadingSubText}>Checking for security threats</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSafe = checkResult && !checkResult.is_unsafe;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[
          styles.modalCard,
          isSafe 
            ? { borderColor: 'rgba(74, 222, 128, 0.3)' }
            : { borderColor: 'rgba(255, 99, 105, 0.3)' }
        ]}>
          
          {/* Unsafe/Blocked Link */}
          {!isSafe ? (
            <>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.modalTitle}>Suspicious Link Detected</Text>
              <Text style={styles.modalSub}>
                Our AI security engine flagged this link as potentially dangerous. Click a link from Facebook, Viber, Telegram, or other apps to automatically intercept and verify it.
              </Text>
              
              <View style={styles.urlBox}>
                <Text style={styles.urlLabel}>URL:</Text>
                <Text style={styles.urlText} numberOfLines={3}>{url}</Text>
              </View>

              {checkResult?.reasons && checkResult.reasons.length > 0 && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonTitle}>🔍 SECURITY ANALYSIS</Text>
                  {checkResult.reasons.map((reason, i) => (
                    <View key={i} style={styles.reasonItemContainer}>
                      <Text style={styles.reasonBullet}>●</Text>
                      <Text style={styles.reasonItem}>{reason}</Text>
                    </View>
                  ))}
                </View>
              )}

              {checkResult?.risk_score !== undefined && (
                <View style={styles.riskScoreBox}>
                  <Text style={styles.riskScoreLabel}>Risk Score: </Text>
                  <Text style={[styles.riskScore, { color: checkResult.risk_score > 70 ? '#ef4444' : '#facc15' }]}>
                    {checkResult.risk_score}%
                  </Text>
                </View>
              )}

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
                  <Text style={styles.backBtnText}>🔒 Back to Safety</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                  <Text style={styles.proceedBtnText}>⚡ Proceed Anyway</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.safeIcon}>🛡️</Text>
              <Text style={[styles.modalTitle, { color: '#4ade80' }]}>Link is Safe!</Text>
              <Text style={styles.modalSub}>
                Our AI scanned the URL and found no phishing threats. You can safely open this link.
              </Text>
              
              <View style={[styles.urlBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                <Text style={styles.urlLabel}>URL:</Text>
                <Text style={styles.urlText} numberOfLines={3}>{url}</Text>
              </View>

              <View style={[styles.reasonBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                <Text style={[styles.reasonTitle, { color: '#4ade80' }]}>✓ VERIFICATION PASSED</Text>
                <Text style={styles.reasonItem}>This URL has been verified and is safe to visit.</Text>
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity 
                  style={[styles.backBtn, { backgroundColor: '#22c55e' }]} 
                  onPress={handleProceed}
                >
                  <Text style={styles.backBtnText}>🌐 Open in Browser</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.proceedBtn} onPress={handleClose}>
                  <Text style={styles.proceedBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function extractUrlFromDeepLink(deepLink: string): string {
  // Handle various deep link formats
  // Format 1: mobileappdetection://link?url=https://example.com
  if (deepLink.startsWith('mobileappdetection://')) {
    try {
      const urlParam = new URL(deepLink.replace('mobileappdetection://', 'http://')).searchParams.get('url');
      return urlParam || deepLink;
    } catch (e) {
      console.error('Error parsing deep link:', e);
      return deepLink;
    }
  }
  
  // Format 2: Direct URL
  return deepLink;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center'
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%'
  },
  loadingCard: {
    backgroundColor: '#1E1419',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 105, 0.15)',
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20
  },
  loadingSubText: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 8
  },
  modalCard: {
    backgroundColor: '#1E1419',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 105, 0.15)',
  },
  warningIcon: { 
    fontSize: 60, 
    textAlign: 'center', 
    marginBottom: 16
  },
  safeIcon: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 16
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#f87171', 
    textAlign: 'center', 
    marginBottom: 12
  },
  modalSub: { 
    color: '#a1a1aa', 
    textAlign: 'center', 
    marginBottom: 24, 
    lineHeight: 22,
    fontSize: 14
  },
  urlBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ef444440'
  },
  urlLabel: {
    color: '#fca5a5',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6
  },
  urlText: {
    color: '#e4e4e7',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'monospace'
  },
  reasonBox: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20, 
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
    marginBottom: 20,
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
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