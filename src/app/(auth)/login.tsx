import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { signInWithEmail, signUpWithEmail } from '@/services/auth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerArea}>
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: colors.brand + '20', borderColor: colors.brand },
              ]}
            >
              <Ionicons name="wallet-outline" size={36} color={colors.brand} />
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>
              App Wallet
            </Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
              Personal Developer Command Center
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </Text>

            {errorMessage && (
              <ErrorState
                message={errorMessage}
                style={styles.errorAlert}
              />
            )}

            {isSignUp && (
              <TextInput
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
              />
            )}

            <TextInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />

            <TextInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            />

            <Button
              title={
                loading
                  ? isSignUp
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : isSignUp
                  ? 'Sign Up'
                  : 'Sign In'
              }
              onPress={handleSubmit}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />

            <TouchableOpacity
              onPress={() => {
                setIsSignUp((prev) => !prev);
                setErrorMessage(null);
              }}
              style={styles.toggleRow}
            >
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing[10],
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 4,
  },
  formCard: {
    padding: Spacing[6],
  },
  formTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  errorAlert: {
    marginBottom: Spacing[4],
  },
  submitBtn: {
    marginTop: Spacing[2],
  },
  toggleRow: {
    marginTop: Spacing[4],
    alignItems: 'center',
  },
  toggleText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.medium,
  },
});
