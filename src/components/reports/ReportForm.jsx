import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Camera, 
  Send, 
  AlertCircle, 
  Navigation, 
  Upload, 
  X
} from 'lucide-react';
import { useDisaster } from '../../context/DisasterContext';
import { useReports } from '../../context/ReportContext';
import Button from '../ui/Button';

export function ReportForm({ onReportSubmitted }) {
  const { currentDisaster } = useDisaster();
  const { addReport } = useReports();

  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [photoName, setPhotoName] = useState('');

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  const validate = (desc = description) => {
    const errs = {};
    if (!desc || !desc.trim()) {
      errs.description = 'Please tell us what happened.';
    } else if (desc.trim().length < 5) {
      errs.description = 'Please provide a little more detail.';
    }
    return errs;
  };

  const handleUseMyLocation = () => {
    const demoLoc = currentDisaster && currentDisaster.region 
      ? currentDisaster.region 
      : 'Morigaon, Assam';
    setLocation(demoLoc);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const newReport = addReport({
      disasterId: currentDisaster.id,
      description,
      location,
      contact,
      photoName
    });

    if (onReportSubmitted) {
      onReportSubmitted(newReport);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* 1. What happened? */}
      <div className="space-y-1.5">
        <label 
          htmlFor="emergency-description"
          className="block text-sm font-semibold text-slate-900"
        >
          What happened? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="emergency-description"
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (touched) {
              setErrors(validate(e.target.value));
            }
          }}
          onBlur={() => {
            setTouched(true);
            setErrors(validate());
          }}
          placeholder="Describe what is happening (e.g. water entered our house, five people are on the roof)..."
          className={`w-full p-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none transition-colors ${
            errors.description
              ? 'border-red-400 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
          }`}
        />
        {errors.description && (
          <p className="text-xs font-medium text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.description}
          </p>
        )}
      </div>

      {/* 2. Where? */}
      <div className="space-y-1.5">
        <label 
          htmlFor="emergency-location"
          className="block text-sm font-semibold text-slate-900"
        >
          Where?
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="emergency-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location or landmark (e.g. Morigaon Sector 4)"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Use current</span>
          </button>
        </div>
      </div>

      {/* 3. Phone number (optional) */}
      <div className="space-y-1.5">
        <label 
          htmlFor="emergency-contact"
          className="block text-sm font-semibold text-slate-900"
        >
          Phone number <span className="text-xs font-normal text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Phone className="w-4 h-4" />
          </div>
          <input
            id="emergency-contact"
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Your phone number"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* 4. Photo (optional) */}
      <div className="space-y-1.5">
        <label 
          htmlFor="photo-upload"
          className="block text-sm font-semibold text-slate-900"
        >
          Photo <span className="text-xs font-normal text-slate-400">(optional)</span>
        </label>
        
        {photoName ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-800 truncate">
                {photoName}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label 
            htmlFor="photo-upload"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">
              Upload photo from device
            </span>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* 5. Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="default"
          size="lg"
          icon={Send}
          className="w-full justify-center"
        >
          Submit Report
        </Button>
      </div>
    </form>
  );
}

export default ReportForm;
