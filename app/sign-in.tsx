import { getUserById, login } from "@/services/auth";
import axiosInstance from "@/src/api/axiosInstance";
import { getUserIdFromToken } from "@/src/lib/jwt";
import { storage } from "@/src/lib/storage";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ACCENT_COLOR = "#F5B400";

const SignInScreen = (): React.JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Forgot Password States
  const [modalVisible, setModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">(
    "email",
  );
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        const user = await storage.getUser();
        if (token && user) {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await login({
        Email: email.trim(),
        Password: password,
      });
      if (!response.IsSuccess || !response.Data?.token) {
        setError("Unable to sign in. Please try again.");
        return;
      }

      const token = response.Data.token;
      await storage.setToken(token);

      const userId = getUserIdFromToken(token);
      if (userId) {
        try {
          const userResponse = await getUserById(userId);
          if (userResponse.IsSuccess && userResponse.Data) {
            await storage.setUser(userResponse.Data);
            console.log("User data stored:", userResponse.Data);
          }
        } catch (userErr) {
          console.error("Failed to fetch user data:", userErr);
        }
      }
      router.replace("/(tabs)");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ??
          "Unable to sign in.")
        : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Handlers ---
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert("Error", "Please enter email");
      return;
    }
    setModalLoading(true);
    try {
      await axiosInstance.post("/Account/ForgotPassword/forgot-password", {
        Email: forgotEmail,
      });
      Alert.alert("Success", "OTP has been sent to your email.");
      setForgotStep("otp");
    } catch (err: any) {
      Alert.alert("Failed", err.response?.data?.message || "Email not found");
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter OTP");
      return;
    }
    setModalLoading(true);
    try {
      await axiosInstance.post("/Account/VerifyOtp/verify-otp", {
        Email: forgotEmail,
        Otp: otp,
      });
      Alert.alert("Verified", "OTP verified successfully");
      setForgotStep("reset");
    } catch (err: any) {
      Alert.alert("Invalid", "Invalid OTP code");
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Alert.alert("Error", "Please enter new password");
      return;
    }
    setModalLoading(true);
    try {
      await axiosInstance.post("/Account/ResetPassword/reset-password", {
        Email: forgotEmail,
        NewPassword: newPassword,
      });
      Alert.alert("Success", "Password reset successfully!");
      setModalVisible(false);
      setForgotStep("email");
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      Alert.alert("Error", "Failed to reset password");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/logo.png")}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholder="Hello@malone.com / 1234567890"
              placeholderTextColor="#9C9C9C"
              style={styles.input}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9C9C9C"
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9C9C9C"
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.row}>
              <View style={styles.rememberContainer}>
                <View style={styles.checkbox} />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.forgotText}>Forgot password</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.signInButton,
                loading && styles.signInButtonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1B1B1B" />
              ) : (
                <Text style={styles.signInText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/sign-up")}
              activeOpacity={0.7}
            >
              <Text style={styles.highlight}>Sign Up here</Text>
            </TouchableOpacity>
          </View>

          {/* FORGOT PASSWORD MODAL */}
          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {forgotStep === "email"
                    ? "Forgot Password"
                    : forgotStep === "otp"
                      ? "Verify OTP"
                      : "Reset Password"}
                </Text>

                {forgotStep === "email" && (
                  <TextInput
                    placeholder="Enter Registered Email"
                    style={styles.input}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                )}
                {forgotStep === "otp" && (
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    style={styles.input}
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                  />
                )}
                {forgotStep === "reset" && (
                  <TextInput
                    placeholder="Enter New Password"
                    style={styles.input}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={{ padding: 12 }}
                  >
                    <Text style={{ color: "#666" }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={
                      forgotStep === "email"
                        ? handleForgotPassword
                        : forgotStep === "otp"
                          ? handleVerifyOtp
                          : handleResetPassword
                    }
                    style={styles.modalActionButton}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={{ fontWeight: "bold" }}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: "center", marginTop: 32 },
  logo: { height: 90, width: 180 },
  form: { marginTop: 32, gap: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1B1B1B",
    backgroundColor: "#FAFAFA",
  },
  passwordContainer: { position: "relative" },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    color: "#1B1B1B",
    backgroundColor: "#FAFAFA",
  },
  eyeButton: { position: "absolute", right: 16, top: 14, padding: 4 },
  errorText: { color: "#D9534F", fontSize: 13, marginTop: -4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rememberContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ACCENT_COLOR,
    backgroundColor: ACCENT_COLOR,
  },
  rememberText: { fontSize: 14, color: "#404040" },
  forgotText: { color: "#000", fontSize: 14 },
  signInButton: {
    marginTop: 20,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 4,
  },
  signInButtonDisabled: { opacity: 0.6 },
  signInText: { color: "#1B1B1B", fontSize: 18, fontWeight: "600" },
  footer: {
    marginTop: "auto",
    paddingTop: 40,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: { fontSize: 14, color: "#6F6F6F" },
  highlight: { color: ACCENT_COLOR, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 25,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalActionButton: {
    backgroundColor: ACCENT_COLOR,
    padding: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
});

export default SignInScreen;
