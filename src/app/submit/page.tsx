'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { CATEGORIES, DISTRICTS, getPanchayatUnions } from '@/lib/constants';
import { submitIssue } from '@/services/issues';

function SubmitForm() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(initialCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [panchayatUnion, setPanchayatUnion] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issueId, setIssueId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 3 && !location) {
      getLocation();
    }
  }, [step]);

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // For now, just use coordinates
          setLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotos = [...photos];
      const newPhotoUrls = [...photoUrls];

      for (let i = 0; i < files.length && newPhotos.length < 4; i++) {
        newPhotos.push(files[i]);
        newPhotoUrls.push(URL.createObjectURL(files[i]));
      }

      setPhotos(newPhotos);
      setPhotoUrls(newPhotoUrls);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    const newPhotoUrls = [...photoUrls];
    newPhotos.splice(index, 1);
    newPhotoUrls.splice(index, 1);
    setPhotos(newPhotos);
    setPhotoUrls(newPhotoUrls);
  };

  const handleSubmit = async () => {
    if (!category || !title || !phone || photos.length === 0 || !district) return;

    setSubmitting(true);
    try {
      const selectedDistrict = DISTRICTS.find(d => d.id === district);
      const selectedPanchayat = getPanchayatUnions(district).find(p => p.id === panchayatUnion);

      const id = await submitIssue({
        title,
        description,
        category,
        location: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          address: location?.address || '',
          state: 'Tamil Nadu',
          district: selectedDistrict?.nameEn || district,
          constituency: selectedPanchayat?.nameEn || panchayatUnion,
          booth: '',
        },
        submitterPhone: phone,
        photos,
        // Pass district and panchayatUnion IDs for auto-assignment
        districtId: district,
        panchayatUnionId: panchayatUnion,
      });
      setIssueId(id);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting issue:', error);
      alert(t('புகார் சமர்ப்பிக்கத் தவறியது', 'Failed to submit issue'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('புகார் சமர்ப்பிக்கப்பட்டது!', 'Issue Submitted!')}
          </h2>
          <p className="text-gray-500 mb-4">
            {t('உங்கள் புகார் எண்:', 'Your issue ID:')}
          </p>
          <p className="text-lg font-mono bg-gray-100 rounded-lg p-3 mb-6">{issueId.slice(0, 8).toUpperCase()}</p>
          <Link
            href="/"
            className="block w-full bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700"
          >
            {t('முகப்பு பக்கத்திற்கு', 'Go to Home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="font-bold text-gray-900">{t('புகார் அளிக்க', 'Report an Issue')}</h1>
          </div>
          <Link
            href="/my-issues"
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 font-medium"
          >
            {t('என் புகார்', 'My Issues')}
          </Link>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex justify-between max-w-md mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-red-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Step 1: Category and Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('புகார் வகை', 'Issue Category')} *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-xl text-center border-2 transition-colors ${
                      category === cat.id
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{cat.icon}</span>
                    <span className="text-xs">{lang === 'ta' ? cat.name : cat.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('தலைப்பு', 'Title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('சுருக்கமான தலைப்பு', 'Brief title')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('விவரம்', 'Description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('பிரச்சனையின் விவரம்', 'Describe the issue')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!category || !title}
              className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('அடுத்து', 'Next')}
            </button>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('புகைப்படங்கள்', 'Photos')} * ({photos.length}/4)
              </label>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {photos.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-red-500 hover:text-red-500"
                  >
                    <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs">{t('புகைப்படம்', 'Add Photo')}</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-300"
              >
                {t('பின்னால்', 'Back')}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={photos.length === 0}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('அடுத்து', 'Next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location and Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('தொலைபேசி எண்', 'Phone Number')} *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* District Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('மாவட்டம்', 'District')} *
              </label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setPanchayatUnion('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">{t('மாவட்டத்தைத் தேர்ந்தெடுக்கவும்', 'Select District')}</option>
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {lang === 'ta' ? d.name : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Panchayat Union Selection */}
            {district && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ஊராட்சி ஒன்றியம்', 'Panchayat Union')}
                </label>
                <select
                  value={panchayatUnion}
                  onChange={(e) => setPanchayatUnion(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">{t('ஊராட்சி ஒன்றியத்தைத் தேர்ந்தெடுக்கவும்', 'Select Panchayat Union')}</option>
                  {getPanchayatUnions(district).map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'ta' ? p.name : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('GPS இடம்', 'GPS Location')}
              </label>
              <div className="bg-gray-100 rounded-xl p-4">
                {locationLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-gray-500">{t('இடம் கண்டறிகிறது...', 'Getting location...')}</span>
                  </div>
                ) : location ? (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-700">{location.address}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={getLocation}
                    className="w-full text-red-600 font-medium"
                  >
                    {t('இடத்தை கண்டறி', 'Get Location')}
                  </button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('சுருக்கம்', 'Summary')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('வகை', 'Category')}</span>
                  <span className="text-gray-900">
                    {CATEGORIES.find((c) => c.id === category)?.[lang === 'ta' ? 'name' : 'nameEn']}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('தலைப்பு', 'Title')}</span>
                  <span className="text-gray-900">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('புகைப்படங்கள்', 'Photos')}</span>
                  <span className="text-gray-900">{photos.length}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-300"
              >
                {t('பின்னால்', 'Back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !phone || !district}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('சமர்ப்பிக்கிறது...', 'Submitting...')}
                  </>
                ) : (
                  t('சமர்ப்பி', 'Submit')
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}
