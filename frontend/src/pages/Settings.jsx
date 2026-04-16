import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    location: {
      coordinates: [],
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  const canSave = useMemo(() => {
    return profile.name.trim().length > 0 && profile.location.address.trim().length > 0;
  }, [profile]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get('/api/users/profile');
        const u = res.data.user;
        setProfile({
          name: u?.name || '',
          location: {
            coordinates: u?.location?.coordinates || [],
            address: u?.location?.address || '',
            city: u?.location?.city || '',
            state: u?.location?.state || '',
            pincode: u?.location?.pincode || '',
          },
        });
      } catch (e) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const save = async () => {
    try {
      setSaving(true);
      await axios.put('/api/users/profile', profile);
      showToast('Profile updated', 'success');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deactivateAccount = async () => {
    if (!confirm('Deactivate your account permanently?')) return;
    try {
      await axios.delete('/api/users/me');
      logout();
      showToast('Account deactivated', 'success');
      navigate('/');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to deactivate account', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-gray-500">Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1B4332]">Settings</h1>
        <p className="text-xs text-gray-600">
          Update your profile details and manage your account.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 outline-none"
              placeholder="Your name"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={profile.location.address}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  location: { ...profile.location, address: e.target.value },
                })
              }
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 outline-none"
              placeholder="Village / Taluk / District"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={profile.location.city}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  location: { ...profile.location, city: e.target.value },
                })
              }
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 outline-none"
              placeholder="Mysore"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={profile.location.state}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  location: { ...profile.location, state: e.target.value },
                })
              }
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 outline-none"
              placeholder="Karnataka"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              value={profile.location.pincode}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  location: { ...profile.location, pincode: e.target.value },
                })
              }
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 outline-none"
              placeholder="570001"
            />
          </div>

          <div className="sm:col-span-2">
            <p className="text-[11px] text-gray-500">
              Coordinates are used for nearby equipment discovery. If you want to change them,
              update your location from the registration flow or ask to add a map picker.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={save}
            className="px-4 py-2 rounded-2xl text-sm font-semibold bg-[#2D6A4F] text-white disabled:bg-gray-300"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-red-100 p-5 space-y-2">
        <h2 className="text-sm font-bold text-red-700">Danger zone</h2>
        <p className="text-xs text-gray-600">
          Deactivating your account will log you out and prevent future logins.
        </p>
        <button
          type="button"
          onClick={deactivateAccount}
          className="w-full sm:w-auto px-4 py-2 rounded-2xl text-sm font-semibold bg-red-600 text-white"
        >
          Deactivate account
        </button>
      </section>
    </div>
  );
};

export default SettingsPage;

