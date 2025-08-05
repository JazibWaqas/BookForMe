import React, { useState } from 'react';
import { Camera, MapPin, Mic, AlertTriangle, Upload, X, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const issueTypes = [
  { value: 'road', label: 'Road Damage', icon: '🛣️', priority: 'medium' },
  { value: 'security', label: 'Security Issue', icon: '🔒', priority: 'high' },
  { value: 'water', label: 'Water Problem', icon: '💧', priority: 'medium' },
  { value: 'electricity', label: 'Power Outage', icon: '⚡', priority: 'high' },
  { value: 'garbage', label: 'Waste Management', icon: '🗑️', priority: 'low' },
  { value: 'noise', label: 'Noise Complaint', icon: '🔊', priority: 'low' },
  { value: 'traffic', label: 'Traffic Issue', icon: '🚦', priority: 'medium' },
  { value: 'other', label: 'Other', icon: '📝', priority: 'low' }
];

export function SubmitComplaint() {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 3)); // Max 3 photos
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceNote('voice_note_recorded.m4a'); // Mock voice note
    } else {
      setIsRecording(true);
    }
  };

  const getCurrentLocation = () => {
    // Mock location detection
    setLocation('DHA Phase 5, Street 12, Karachi');
  };

  const handleSubmit = () => {
    // Mock submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      // Reset form
      setSelectedIssue('');
      setTitle('');
      setDescription('');
      setLocation('');
      setPhotos([]);
      setVoiceNote(null);
    }, 3000);
  };

  const selectedIssueData = issueTypes.find(issue => issue.value === selectedIssue);

  if (isSubmitted) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Complaint Submitted!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your complaint has been received and will be reviewed by the relevant authorities.
          </p>
          <Badge className="bg-blue-100 text-blue-700">
            Reference ID: KHI-2024-001234
          </Badge>
          <p className="text-xs text-gray-500 mt-4">
            You will receive updates on your complaint status via SMS.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Submit Complaint</h2>
            <p className="text-sm text-gray-600">Report issues in your neighborhood</p>
          </div>
        </div>
      </div>

      {/* Issue Type Selection */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">What's the issue?</h3>
        <div className="grid grid-cols-2 gap-3">
          {issueTypes.map((issue) => (
            <button
              key={issue.value}
              onClick={() => setSelectedIssue(issue.value)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                selectedIssue === issue.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{issue.icon}</span>
                <span className="text-sm font-medium">{issue.label}</span>
              </div>
              <Badge 
                variant={issue.priority === 'high' ? 'destructive' : issue.priority === 'medium' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {issue.priority} priority
              </Badge>
            </button>
          ))}
        </div>
      </Card>

      {/* Complaint Details */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Complaint Details</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Title
          </label>
          <Input
            placeholder="Brief description of the issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description
          </label>
          <Textarea
            placeholder="Provide more details about the issue, when it occurred, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter location or use current location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <MapPin size={16} />
            </Button>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <div className="space-y-3">
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {photos.length < 3 && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="text-gray-400" size={24} />
                  <p className="text-xs text-gray-500">Click to add photos</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Voice Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Note (Optional)
          </label>
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Mic size={16} />
              {isRecording ? 'Stop Recording' : 'Record Voice Note'}
            </Button>
            {voiceNote && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={16} />
                Voice note recorded
              </div>
            )}
          </div>
          {isRecording && (
            <p className="text-xs text-red-600 mt-1">Recording... Tap stop when finished</p>
          )}
        </div>
      </Card>

      {/* Priority Indicator */}
      {selectedIssueData && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedIssueData.icon}</span>
            <div>
              <h4 className="font-medium text-gray-900">{selectedIssueData.label}</h4>
              <p className="text-sm text-gray-600">
                This issue has {selectedIssueData.priority} priority and will be reviewed accordingly.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Submit Button */}
      <div className="sticky bottom-24 bg-white p-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={!selectedIssue || !title.trim() || !description.trim() || !location.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          Submit Complaint
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Your complaint will be forwarded to relevant authorities
        </p>
      </div>
    </div>
  );
}