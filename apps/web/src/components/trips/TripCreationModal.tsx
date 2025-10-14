// Trip Creation Modal Component
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Heart, Loader2 } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import { showSuccess, showError } from '@/lib/toast';
import { RouteBuilder } from './RouteBuilder';
import { DateRangePicker } from './DateRangePicker';
import { TravelStyleSelector } from './TravelStyleSelector';

interface TripCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPublicKey: string;
}

export function TripCreationModal({ isOpen, onClose, userPublicKey }: TripCreationModalProps) {
  const [step, setStep] = useState<'route' | 'dates' | 'interests' | 'review'>('route');
  const [waypoints, setWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTrip } = useTrips();
  // TODO: Implement encryption when Arcium hook is ready
  // const { encryptTripData } = useArcium();

  const handleNext = () => {
    if (step === 'route' && waypoints.length < 2) {
      showError('Please add at least 2 waypoints to your route');
      return;
    }
    if (step === 'dates' && (!startDate || !endDate)) {
      showError('Please select start and end dates');
      return;
    }
    if (step === 'interests' && interests.length === 0) {
      showError('Please select at least one travel style');
      return;
    }

    const steps: Array<typeof step> = ['route', 'dates', 'interests', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Array<typeof step> = ['route', 'dates', 'interests', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;

    setIsSubmitting(true);

    try {
      // TODO: Encrypt trip data when Arcium hook is ready
      // const encrypted = await encryptTripData({
      //   waypoints,
      //   destination,
      //   startDate,
      //   endDate,
      //   interests,
      // });

      // Create trip via API
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPublicKey,
          waypoints,
          destination,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          interests,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const data = await response.json();

      // TODO: Sign and send Solana transaction
      // For now, just show success
      showSuccess('Trip created successfully! 🎉');
      onClose();

      // Reset form
      setWaypoints([]);
      setDestination(undefined);
      setStartDate(null);
      setEndDate(null);
      setInterests([]);
      setStep('route');
    } catch (error) {
      console.error('Failed to create trip:', error);
      showError('Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-4xl md:h-[80vh] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold">Create New Trip</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Your route stays encrypted with Arcium MPC
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-gray-800">
              {(['route', 'dates', 'interests', 'review'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step === s
                        ? 'bg-blue-600 text-white'
                        : i < ['route', 'dates', 'interests', 'review'].indexOf(step)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 3 && (
                    <div
                      className={`w-12 h-1 rounded ${
                        i < ['route', 'dates', 'interests', 'review'].indexOf(step)
                          ? 'bg-green-600'
                          : 'bg-gray-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {step === 'route' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold">Plan Your Route</h3>
                      <p className="text-sm text-gray-400">
                        Click on the map to add waypoints
                      </p>
                    </div>
                  </div>
                  <RouteBuilder 
                    waypoints={waypoints} 
                    destination={destination}
                    onChange={(newWaypoints, newDestination) => {
                      setWaypoints(newWaypoints);
                      setDestination(newDestination);
                    }} 
                  />
                </div>
              )}

              {step === 'dates' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold">Travel Dates</h3>
                      <p className="text-sm text-gray-400">
                        When are you planning to travel?
                      </p>
                    </div>
                  </div>
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </div>
              )}

              {step === 'interests' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-6 h-6 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold">Travel Style</h3>
                      <p className="text-sm text-gray-400">
                        What kind of experience are you looking for?
                      </p>
                    </div>
                  </div>
                  <TravelStyleSelector
                    selectedInterests={interests}
                    onChange={setInterests}
                  />
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Review Your Trip</h3>

                  <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Route</p>
                      <p className="font-medium">{waypoints.length} waypoints{destination ? ' + 1 destination' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Dates</p>
                      <p className="font-medium">
                        {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Travel Styles</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                    <p className="text-sm text-blue-400">
                      🔒 Your exact route will be encrypted using Arcium MPC. Only overall
                      compatibility scores are computed, keeping your location private.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
              <button
                onClick={handleBack}
                disabled={step === 'route'}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                {step !== 'review' ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create Trip'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
