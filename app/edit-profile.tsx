import { getUserById, updateProfile } from "@/services/auth";
import { storage, UserData } from "@/src/lib/storage";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT_COLOR = "#F5B400";

const EditProfileScreen = (): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    Mobile: "",
    Password: "",
    SafetyNumber: "",
    // Salary: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await storage.getUser();
      if (!currentUser || !currentUser.Id) {
        Alert.alert("Error", "User not found. Please sign in again.");
        router.back();
        return;
      }

      const response = await getUserById(currentUser.Id);
      if (response.IsSuccess && response.Data) {
        const user = response.Data;
        setUserData(user);
        setFormData({
          Name: user.Name || "",
          Email: user.Email || "",
          Mobile: user.Mobile || "",
          Password: "", // Don't pre-fill password
          SafetyNumber: user.SafetyNumber?.toString() || "",
          // Salary: user.Salary?.toString() || '',
        });
        // Set profile image if available
        if (user.ProfileImage) {
          setProfileImage(user.ProfileImage);
          setOriginalProfileImage(user.ProfileImage);
        }
      } else {
        Alert.alert("Error", response.Message || "Failed to load user data");
        router.back();
      }
    } catch (err: any) {
      console.error("Failed to load user data:", err);
      Alert.alert("Error", "Failed to load user data. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      console.error("Error picking image:", err);
      setError("Failed to pick image");
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  const isValidProfileImage = (url: string | undefined | null): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (trimmed === "") return false;

    // Check if it's a local file URI (from image picker)
    if (trimmed.startsWith("file://") || trimmed.startsWith("content://")) {
      return true;
    }

    // Check if it's a valid remote URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      // Avoid empty CloudFront URLs
      if (
        trimmed === "https://d32fcvmmn6ow56.cloudfront.net/" ||
        trimmed.endsWith("cloudfront.net/")
      ) {
        return false;
      }
      return true;
    }

    return false;
  };

  const handleUpdate = async () => {
    if (!userData?.Id) {
      Alert.alert("Error", "User not found");
      return;
    }

    const roleIds =
      userData.RoleMappings?.filter(
        (r: any) => r.IsActive && r.IsDeleted !== true,
      ).map((r: any) => r.RoleId) || [];

    const fd = new FormData();
    fd.append("Id", String(userData.Id));
    fd.append("Name", formData.Name.trim());
    fd.append("Email", formData.Email.trim());

    if (formData.Mobile) fd.append("Mobile", formData.Mobile);
    if (formData.Password) fd.append("Password", formData.Password);
    if (formData.SafetyNumber) fd.append("SafetyNumber", formData.SafetyNumber);

    roleIds.forEach((id, i) => {
      fd.append(`RoleIds[${i}]`, String(id));
    });

    if (profileImage?.startsWith("file://")) {
      fd.append("ProfileImageFile", {
        uri: profileImage,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);
    }

    try {
      setSaving(true);
      const response = await updateProfile(fd);

      if (response.IsSuccess) {
        if (response.Data) {
          await storage.setUser(response.Data);
        }
        Alert.alert("Success", "Profile updated successfully");
        router.back();
      } else {
        setError(response.Message || "Update failed");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5B400" />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Inline Header */}
            <View style={styles.inlineHeader}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Feather name="arrow-left" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.formContainer}>
              {/* Profile Image Picker */}
              <View style={styles.profileImageContainer}>
                {profileImage && isValidProfileImage(profileImage) ? (
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.profileImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={handleRemoveImage}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.profileImagePlaceholder}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                  >
                    <Feather name="camera" size={24} color="#9C9C9C" />
                    <Text style={styles.profileImageText}>
                      {originalProfileImage
                        ? "Change Profile Photo"
                        : "Add Profile Photo"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={formData.Name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, Name: text })
                  }
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={formData.Email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, Email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#999"
                  value={formData.Mobile}
                  onChangeText={(text) => {
                    // Only allow numbers, spaces, hyphens, parentheses, and plus sign
                    const numericText = text.replace(/[^0-9+\-\s()]/g, "");
                    setFormData({ ...formData, Mobile: numericText });
                  }}
                  keyboardType="phone-pad"
                  maxLength={20}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Leave blank to keep current password"
                    placeholderTextColor="#999"
                    value={formData.Password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, Password: text })
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>
                  Leave blank if you don't want to change your password
                </Text>
              </View>

              {userData?.RoleMappings?.some(
                (rm: any) => rm.Role?.Name === "Engineer" || rm.RoleId === 2,
              ) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Safety Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter safety number"
                    placeholderTextColor="#999"
                    value={formData.SafetyNumber}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericText = text.replace(/[^0-9]/g, "");
                      setFormData({ ...formData, SafetyNumber: numericText });
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              )}

              {/* <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter salary"
                placeholderTextColor="#999"
                value={formData.Salary}
                onChangeText={(text) => setFormData({ ...formData, Salary: text })}
                keyboardType="numeric"
              />
            </View> */}
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleUpdate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#1B1B1B" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F44336",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50, // Make room for eye icon
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 12,
    padding: 4,
  },
  hintText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1B1B",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#D9534F",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  profileImageText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9C9C9C",
    textAlign: "center",
  },
});

export default EditProfileScreen;
