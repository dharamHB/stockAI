import React, { useState, useEffect, useRef } from "react";
import { Camera, User, Mail, Save, X } from "lucide-react";
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
  const fileInputRef = useRef(null);

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
        alert("Only PNG and JPG images are allowed.");
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
        alert("Profile updated successfully!");
        const updatedUser = await response.json();
        // Update local storage name if it changed
        localStorage.setItem("userName", updatedUser.name);
        // Refresh to ensure everything syncs simple way
        window.location.reload();
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      hideLoader();
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Click to upload (PNG/JPG only)
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hobbies & Interests
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableHobbies.map((hobby) => (
                <label
                  key={hobby}
                  className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.hobbies.includes(hobby)}
                    onChange={() => handleHobbyChange(hobby)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{hobby}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
