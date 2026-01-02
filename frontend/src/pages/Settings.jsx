import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Camera, User, Mail, Save, X, Eye, EyeOff } from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import API_URL from "../config";

const Settings = () => {
  const { showLoader, hideLoader } = useLoading();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hobbies: [],
    profile_image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fileInputRef = useRef(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const availableHobbies = [
    "Reading",
    "Traveling",
    "Gaming",
    "Coding",
    "Music",
    "Sports",
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    showLoader();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          "x-auth-token": token,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          email: data.email,
          hobbies: data.hobbies || [],
          profile_image: data.profile_image,
        });
        if (data.profile_image) {
          setPreviewImage(`${API_URL}/${data.profile_image}`);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image/png") && !file.type.match("image/jpeg")) {
        toast.error("Only PNG and JPG images are allowed.");
        return;
      }
      setFormData({ ...formData, profile_image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleHobbyChange = (hobby) => {
    const updatedHobbies = formData.hobbies.includes(hobby)
      ? formData.hobbies.filter((h) => h !== hobby)
      : [...formData.hobbies, hobby];
    setFormData({ ...formData, hobbies: updatedHobbies });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const data = new FormData();
    data.append("name", formData.name);
    // Don't send email
    data.append("hobbies", JSON.stringify(formData.hobbies));
    if (formData.profile_image instanceof File) {
      data.append("profile_image", formData.profile_image);
    }

    showLoader();
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "x-auth-token": token,
        },
        body: data,
      });

      if (response.ok) {
        toast.success("Profile updated successfully! 🎉");
        const updatedUser = await response.json();
        // Update local storage name if it changed
        localStorage.setItem("userName", updatedUser.name);
        // Refresh to ensure everything syncs simple way
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      hideLoader();
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    showLoader();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password updated successfully! ✅");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("An error occurred while updating password");
    } finally {
      hideLoader();
    }
  };

  if (loading)
    return (
      <div className="p-8 text-gray-900 dark:text-gray-100 font-black uppercase italic tracking-widest animate-pulse">
        Synchronizing Profile...
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic">
          Profile Configuration
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Control your digital identity and authentication parameters
        </p>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center justify-center mb-8 pt-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-neutral-800 overflow-hidden bg-gray-50 dark:bg-neutral-900 flex items-center justify-center transition-all group-hover:border-primary-500/50">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-300 dark:text-neutral-700" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 dark:bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Camera className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform" />
              </div>
            </div>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Update Avatar
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".png, .jpg, .jpeg"
              onChange={handleImageChange}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest italic px-1">
                Full Display Designation
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest italic px-1">
                Registry Identifier (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 pl-12 bg-gray-100 dark:bg-neutral-900/50 border border-transparent dark:border-neutral-800 rounded-xl text-gray-400 dark:text-gray-600 cursor-not-allowed italic font-medium"
                />
                <Mail className="w-4 h-4 text-gray-300 dark:text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-2 italic px-1 font-medium">
                Verified identifier — Immutable system record
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest italic px-1">
              Competencies & Core Interests
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableHobbies.map((hobby) => (
                <label
                  key={hobby}
                  className={`flex items-center gap-3 cursor-pointer p-4 border rounded-xl transition-all duration-300 ${
                    formData.hobbies.includes(hobby)
                      ? "bg-primary-500/10 border-primary-500/30 shadow-md ring-1 ring-primary-500/20"
                      : "bg-gray-50 dark:bg-neutral-900 border-transparent dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.hobbies.includes(hobby)}
                    onChange={() => handleHobbyChange(hobby)}
                    className="w-4 h-4 text-primary-600 rounded-md bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 focus:ring-primary-500/50"
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      formData.hobbies.includes(hobby)
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {hobby}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-8 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
            <button
              type="submit"
              className="px-10 py-3.5 bg-primary-600 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-primary-700 transition-all flex items-center gap-3 shadow-xl shadow-primary-500/30 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Sync Remote State
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 italic">
            Security Protocol
          </h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1 font-black">
            Update Authorization Credentials
          </p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest italic px-1">
              Current Access Cipher
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all font-mono pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest italic px-1">
                New Access Cipher
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all font-mono pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest italic px-1">
                Re-verify Cipher
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all font-mono pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="pt-8 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
            <button
              type="submit"
              className="px-10 py-3.5 bg-gray-900 dark:bg-primary-600 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-gray-800 dark:hover:bg-primary-700 transition-all flex items-center gap-3 shadow-xl shadow-black/10 dark:shadow-primary-500/30 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Rotate Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
