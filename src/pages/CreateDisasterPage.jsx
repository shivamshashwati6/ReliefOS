import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  FileText, 
  Activity, 
  Flame, 
  Wind, 
  Mountain, 
  Droplets,
  CloudLightning,
  AlertCircle
} from 'lucide-react';
import { useDisaster } from '../context/DisasterContext';
import Button from '../components/ui/Button';

export function CreateDisasterPage() {
  const navigate = useNavigate();
  const { createDisaster } = useDisaster();

  const getDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    region: '',
    startTime: getDefaultDateTime(),
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [createdSuccess, setCreatedSuccess] = useState(null);

  const disasterTypes = [
    { value: 'Flood', label: 'Flood', icon: Droplets },
    { value: 'Cyclone', label: 'Cyclone', icon: Wind },
    { value: 'Landslide', label: 'Landslide', icon: Mountain },
    { value: 'Earthquake', label: 'Earthquake', icon: Activity },
    { value: 'Fire', label: 'Fire', icon: Flame },
    { value: 'Extreme Weather', label: 'Extreme Weather', icon: CloudLightning },
  ];

  const validate = (dataToValidate = formData) => {
    const newErrors = {};

    if (!dataToValidate.name || !dataToValidate.name.trim()) {
      newErrors.name = 'Disaster name is required.';
    }

    if (!dataToValidate.type) {
      newErrors.type = 'Please select a disaster type.';
    }

    if (!dataToValidate.region || !dataToValidate.region.trim()) {
      newErrors.region = 'Region is required.';
    }

    if (!dataToValidate.startTime) {
      newErrors.startTime = 'Start date and time is required.';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validate();
    if (validationErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setTouched({
      name: true,
      type: true,
      region: true,
      startTime: true,
      status: true
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const created = createDisaster(formData);
    setCreatedSuccess(created);
  };

  const handleOpenCommandCenter = () => {
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Create Disaster
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up a new disaster response operation.
        </p>
      </div>

      {/* Success Notification State */}
      {createdSuccess && (
        <div 
          role="alert" 
          aria-live="polite"
          className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                Disaster created successfully
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                The operation is now active across all dashboard pages.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-emerald-200/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Name</span>
              <strong className="text-slate-900 text-sm">{createdSuccess.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Region</span>
              <strong className="text-slate-900 text-sm">{createdSuccess.region}</strong>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="default"
              size="md"
              icon={ArrowRight}
              onClick={handleOpenCommandCenter}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Main Creation Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-5">
          {/* A. Disaster Name */}
          <div className="space-y-1.5">
            <label 
              htmlFor="disaster-name" 
              className="block text-sm font-semibold text-slate-900"
            >
              Disaster Name <span className="text-red-500">*</span>
            </label>
            <input
              id="disaster-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Assam Flood Response"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors ${
                errors.name && touched.name
                  ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
              }`}
            />
            {errors.name && touched.name && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Grid: Type & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* B. Disaster Type */}
            <div className="space-y-1.5">
              <label 
                htmlFor="disaster-type" 
                className="block text-sm font-semibold text-slate-900"
              >
                Disaster Type <span className="text-red-500">*</span>
              </label>
              <select
                id="disaster-type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                onBlur={() => handleBlur('type')}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                  errors.type && touched.type
                    ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                }`}
              >
                <option value="" disabled className="text-slate-400">
                  Select disaster type...
                </option>
                {disasterTypes.map((t) => (
                  <option key={t.value} value={t.value} className="text-slate-900">
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && touched.type && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.type}
                </p>
              )}
            </div>

            {/* C. Region */}
            <div className="space-y-1.5">
              <label 
                htmlFor="disaster-region" 
                className="block text-sm font-semibold text-slate-900"
              >
                Region <span className="text-red-500">*</span>
              </label>
              <input
                id="disaster-region"
                name="region"
                type="text"
                value={formData.region}
                onChange={handleChange}
                onBlur={() => handleBlur('region')}
                placeholder="e.g. Morigaon, Assam"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors ${
                  errors.region && touched.region
                    ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                }`}
              />
              {errors.region && touched.region && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.region}
                </p>
              )}
            </div>
          </div>

          {/* Grid: Start Date & Time + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* D. Start Date & Time */}
            <div className="space-y-1.5">
              <label 
                htmlFor="disaster-start-time" 
                className="block text-sm font-semibold text-slate-900"
              >
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                id="disaster-start-time"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleChange}
                onBlur={() => handleBlur('startTime')}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 focus:bg-white focus:outline-none transition-colors ${
                  errors.startTime && touched.startTime
                    ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                }`}
              />
              {errors.startTime && touched.startTime && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.startTime}
                </p>
              )}
            </div>

            {/* E. Status */}
            <div className="space-y-1.5">
              <label 
                htmlFor="disaster-status" 
                className="block text-sm font-semibold text-slate-900"
              >
                Status
              </label>
              <select
                id="disaster-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="Active">Active</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="default"
              size="md"
            >
              Create Disaster
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDisasterPage;
