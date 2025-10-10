// Date Range Picker Component
'use client';

import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onStartDateChange(date);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onEndDateChange(date);
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    const diff = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const duration = calculateDuration();

  return (
    <div className="space-y-4">
      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Start Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium mb-2">
          End Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            min={startDate ? formatDateForInput(startDate) : new Date().toISOString().split('T')[0]}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Duration Display */}
      {duration !== null && duration > 0 && (
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            📅 Trip duration: <span className="font-semibold">{duration} {duration === 1 ? 'day' : 'days'}</span>
          </p>
        </div>
      )}

      {/* Validation Message */}
      {duration !== null && duration <= 0 && (
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
          <p className="text-sm text-red-400">
            ⚠️ End date must be after start date
          </p>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Select the dates when you plan to travel. This will be used to find overlapping trips with other travelers.
      </p>
    </div>
  );
}
