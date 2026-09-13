import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const SYLLABUS_SUBJECTS = {
  core: [
    'AI and DS – II',
    'Internet of Everything',
    'Data Science Lab',
    'IOE Lab',
    'Secure Application Development',
    'Recent Open Source Project Lab',
    'Major Project I'
  ],
  elective3: [
    'Storage Area Network',
    'High Performance computing',
    'Infrastructure Security',
    'Software Testing and QA'
  ],
  elective4: [
    'MANET',
    'AR – VR',
    'Quantum Computing',
    'Information Retrieval System'
  ],
  instituteElective: [
    'Product Lifecycle Management',
    'Reliability Engineering',
    'Management Information System',
    'Design of Experiments',
    'Operation Research',
    'Cyber Security and Laws',
    'Disaster Management and Mitigation Measures',
    'Energy Audit and Management',
    'Development Engineering'
  ]
};

const ALL_SYLLABUS_SUBJECTS_LIST = [
  ...SYLLABUS_SUBJECTS.core,
  ...SYLLABUS_SUBJECTS.elective3,
  ...SYLLABUS_SUBJECTS.elective4,
  ...SYLLABUS_SUBJECTS.instituteElective
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  // Onboarding Wizard State
  const [onboardingStep, setOnboardingStep] = useState(() => {
    const saved = localStorage.getItem('onboarding_step');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  
  // Default to empty strings so the user types first
  const [university, setUniversity] = useState(() => localStorage.getItem('onboarding_university') || '');
  const [branch, setBranch] = useState(() => localStorage.getItem('onboarding_branch') || '');
  const [semester, setSemester] = useState(() => localStorage.getItem('onboarding_semester') || '');
  
  const [onboardingSubjects, setOnboardingSubjects] = useState<{ name: string; examDate?: string }[]>(() => {
    const saved = localStorage.getItem('onboarding_subjects');
    return saved ? JSON.parse(saved) : [];
  });
  const [newSubName, setNewSubName] = useState('');
  const [presetInitialized, setPresetInitialized] = useState(false);

  // Focus & custom dropdown toggle states
  const [uniFocused, setUniFocused] = useState(false);
  const [branchFocused, setBranchFocused] = useState(false);
  const [semFocused, setSemFocused] = useState(false);
  const [subInputFocused, setSubInputFocused] = useState(false);

  const uniOptions = ['University of Mumbai'];
  const filteredUniOptions = uniOptions.filter(opt => 
    opt.toLowerCase().includes(university.toLowerCase())
  );

  const branchOptions = ['Information Technology'];
  const filteredBranchOptions = branchOptions.filter(opt => 
    opt.toLowerCase().includes(branch.toLowerCase())
  );

  // Semester options should be from 0 to 8
  const semOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
  const filteredSemOptions = semOptions.filter(opt => 
    opt.includes(semester)
  );

  // Filter combined subjects list for the custom dropdown subjects list
  const filteredSyllabusSubjects = ALL_SYLLABUS_SUBJECTS_LIST.filter(name =>
    name.toLowerCase().includes(newSubName.toLowerCase()) &&
    !onboardingSubjects.some(sub => sub.name === name)
  );

  const isPresetEligible = 
    university === 'University of Mumbai' && 
    branch === 'Information Technology' && 
    semester === '7';

  // Persist Onboarding State in LocalStorage
  useEffect(() => {
    localStorage.setItem('onboarding_university', university);
  }, [university]);

  useEffect(() => {
    localStorage.setItem('onboarding_branch', branch);
  }, [branch]);

  useEffect(() => {
    localStorage.setItem('onboarding_semester', semester);
  }, [semester]);

  useEffect(() => {
    localStorage.setItem('onboarding_step', onboardingStep.toString());
  }, [onboardingStep]);

  useEffect(() => {
    localStorage.setItem('onboarding_subjects', JSON.stringify(onboardingSubjects));
  }, [onboardingSubjects]);

  // Pre-populate core subjects if eligible and not yet initialized
  useEffect(() => {
    if (onboardingStep === 3 && isPresetEligible && !presetInitialized && onboardingSubjects.length === 0) {
      const coreSubjects = SYLLABUS_SUBJECTS.core.map(name => ({ name }));
      setOnboardingSubjects(coreSubjects);
      setPresetInitialized(true);
    }
  }, [onboardingStep, isPresetEligible, presetInitialized, onboardingSubjects.length]);

  const clearOnboardingStorage = () => {
    localStorage.removeItem('onboarding_university');
    localStorage.removeItem('onboarding_branch');
    localStorage.removeItem('onboarding_semester');
    localStorage.removeItem('onboarding_step');
    localStorage.removeItem('onboarding_subjects');
  };

  const handleOnboardingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOnboardingNext();
    }
  };

  const handleAddOnboardingSubject = () => {
    if (newSubName.trim()) {
      setOnboardingSubjects([...onboardingSubjects, { name: newSubName.trim() }]);
      setNewSubName('');
    }
  };

  const handleToggleSubject = (name: string) => {
    const exists = onboardingSubjects.some(sub => sub.name === name);
    if (exists) {
      setOnboardingSubjects(onboardingSubjects.filter(sub => sub.name !== name));
    } else {
      setOnboardingSubjects([...onboardingSubjects, { name }]);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (onboardingSubjects.length === 0) {
      setOnboardingError('Please select or add at least one subject to get started.');
      return;
    }
    setOnboardingLoading(true);
    setOnboardingError('');
    try {
      const profilePayload = {
        university: university || 'University of Mumbai',
        branch: branch || 'Information Technology',
        semester: parseInt(semester, 10) || 7,
        subjects: onboardingSubjects
      };
      
      // Save local profile fallback
      localStorage.setItem('user_profile', JSON.stringify(profilePayload));

      try {
        await fetchApi('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload)
        });
      } catch (e) {
        console.warn('Backend API profile save warning (using local profile fallback):', e);
      }

      clearOnboardingStorage();
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Onboarding submit warning:', err);
      clearOnboardingStorage();
      await refreshProfile();
      navigate('/', { replace: true });
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleOnboardingNext = () => {
    if (!university.trim()) {
      setOnboardingError('Please enter or select your university.');
      return;
    }
    if (onboardingStep >= 1 && !branch.trim()) {
      setOnboardingError('Please enter or select your branch.');
      return;
    }
    if (onboardingStep >= 2 && (!semester || isNaN(Number(semester)))) {
      setOnboardingError('Please enter or select a valid semester number.');
      return;
    }
    setOnboardingError('');
    if (onboardingStep < 3) {
      setOnboardingStep(s => s + 1);
    } else {
      handleOnboardingSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#eeece7] font-sans text-[#212121]">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-2.5 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="w-9 h-9 rounded bg-black flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-black font-display uppercase font-sans">ArchAdemia</h1>
      </div>

      <div className="bg-white border border-[#d9d9dd] w-full max-w-md p-8 rounded-2xl shadow-sm space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                s <= onboardingStep ? 'bg-black' : 'bg-[#eeece7]'
              }`}
            />
          ))}
        </div>

        <div className="text-center">
          <span className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Step {onboardingStep + 1} of 4</span>
          <h3 className="text-xl font-bold uppercase tracking-tight text-black mt-1 font-display">
            {onboardingStep === 0 && 'Select Your University'}
            {onboardingStep === 1 && 'Select Your Branch'}
            {onboardingStep === 2 && 'Select Your Semester'}
            {onboardingStep === 3 && 'Configure Your Subjects'}
          </h3>
          <p className="text-xs text-[#75758a] mt-1.5 leading-relaxed">
            {onboardingStep === 0 && 'Which university or college do you attend?'}
            {onboardingStep === 1 && 'What is your branch or field of study?'}
            {onboardingStep === 2 && 'Which semester or term are you currently in?'}
            {onboardingStep === 3 && 'Choose your syllabus subjects or add custom ones.'}
          </p>
        </div>

        {onboardingError && (
          <div className="bg-[#b30000]/10 border border-[#b30000]/20 text-[#b30000] p-3 rounded text-xs text-center font-semibold">
            {onboardingError}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 min-h-[120px] flex flex-col justify-center">
          {onboardingStep === 0 && (
            <div className="space-y-2 relative">
              <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">University Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  onFocus={() => setUniFocused(true)}
                  onBlur={() => setTimeout(() => setUniFocused(false), 200)}
                  onKeyDown={handleOnboardingKeyDown}
                  placeholder="Type university name or select from options..."
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 pr-10 text-xs text-black placeholder-[#93939f] focus:border-[#9b60aa] outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setUniFocused(!uniFocused)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75758a] hover:text-black focus:outline-none"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${uniFocused ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {uniFocused && filteredUniOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#d9d9dd] rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                  {filteredUniOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onMouseDown={() => {
                        setUniversity(opt);
                        setUniFocused(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-black hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="space-y-2 relative">
              <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Branch / Programme</label>
              <div className="relative">
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  onFocus={() => setBranchFocused(true)}
                  onBlur={() => setTimeout(() => setBranchFocused(false), 200)}
                  onKeyDown={handleOnboardingKeyDown}
                  placeholder="Type branch name or select from options..."
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 pr-10 text-xs text-black placeholder-[#93939f] focus:border-[#9b60aa] outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setBranchFocused(!branchFocused)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75758a] hover:text-black focus:outline-none"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${branchFocused ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {branchFocused && filteredBranchOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#d9d9dd] rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                  {filteredBranchOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onMouseDown={() => {
                        setBranch(opt);
                        setBranchFocused(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-black hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-2 relative">
              <label className="block text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Semester Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  onFocus={() => setSemFocused(true)}
                  onBlur={() => setTimeout(() => setSemFocused(false), 200)}
                  onKeyDown={handleOnboardingKeyDown}
                  placeholder="Type semester number or select from options..."
                  className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 pr-10 text-xs text-black placeholder-[#93939f] focus:border-[#9b60aa] outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSemFocused(!semFocused)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75758a] hover:text-black focus:outline-none"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${semFocused ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {semFocused && filteredSemOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#d9d9dd] rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                  {filteredSemOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onMouseDown={() => {
                        setSemester(opt);
                        setSemFocused(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-black hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Semester {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-4">
              {isPresetEligible ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <span className="text-[10px] bg-[#edfce9] text-[#003c33] border border-[#ccebc5] px-2 py-0.5 rounded font-mono font-bold uppercase">
                    Mumbai University Syllabus Loaded
                  </span>
                  
                  {/* Core checklist */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Core subjects (Checked by default)</h4>
                    <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto border border-[#d9d9dd] rounded-lg p-2 bg-[#eeece7]/10">
                      {SYLLABUS_SUBJECTS.core.map((name) => (
                        <label key={name} className="flex items-start gap-2.5 text-xs text-black cursor-pointer py-1 px-1 rounded hover:bg-zinc-50">
                          <input
                            type="checkbox"
                            checked={onboardingSubjects.some(sub => sub.name === name)}
                            onChange={() => handleToggleSubject(name)}
                            className="rounded border-[#d9d9dd] text-black focus:ring-black mt-0.5"
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Elective 3 list */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Department Elective 3</h4>
                    <div className="grid grid-cols-1 gap-1.5 max-h-28 overflow-y-auto border border-[#d9d9dd] rounded-lg p-2 bg-[#eeece7]/10">
                      {SYLLABUS_SUBJECTS.elective3.map((name) => (
                        <label key={name} className="flex items-start gap-2.5 text-xs text-black cursor-pointer py-1 px-1 rounded hover:bg-zinc-50">
                          <input
                            type="checkbox"
                            checked={onboardingSubjects.some(sub => sub.name === name)}
                            onChange={() => handleToggleSubject(name)}
                            className="rounded border-[#d9d9dd] text-black focus:ring-black mt-0.5"
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Elective 4 list */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Department Elective 4</h4>
                    <div className="grid grid-cols-1 gap-1.5 max-h-28 overflow-y-auto border border-[#d9d9dd] rounded-lg p-2 bg-[#eeece7]/10">
                      {SYLLABUS_SUBJECTS.elective4.map((name) => (
                        <label key={name} className="flex items-start gap-2.5 text-xs text-black cursor-pointer py-1 px-1 rounded hover:bg-zinc-50">
                          <input
                            type="checkbox"
                            checked={onboardingSubjects.some(sub => sub.name === name)}
                            onChange={() => handleToggleSubject(name)}
                            className="rounded border-[#d9d9dd] text-black focus:ring-black mt-0.5"
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Institute Elective list */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">Institute Level Elective</h4>
                    <div className="grid grid-cols-1 gap-1.5 max-h-28 overflow-y-auto border border-[#d9d9dd] rounded-lg p-2 bg-[#eeece7]/10">
                      {SYLLABUS_SUBJECTS.instituteElective.map((name) => (
                        <label key={name} className="flex items-start gap-2.5 text-xs text-black cursor-pointer py-1 px-1 rounded hover:bg-zinc-50">
                          <input
                            type="checkbox"
                            checked={onboardingSubjects.some(sub => sub.name === name)}
                            onChange={() => handleToggleSubject(name)}
                            className="rounded border-[#d9d9dd] text-black focus:ring-black mt-0.5"
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Add Custom / Manual Subject Input */}
              <div className="space-y-2 pt-2 border-t border-[#d9d9dd] relative">
                <h4 className="text-[10px] font-mono font-bold text-[#75758a] uppercase tracking-wider">
                  {isPresetEligible ? 'Add Extra / Custom Subjects' : 'Add Subject'}
                </h4>
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onFocus={() => setSubInputFocused(true)}
                      onBlur={() => setTimeout(() => setSubInputFocused(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOnboardingSubject();
                        }
                      }}
                      className="w-full bg-white border border-[#d9d9dd] rounded px-4 py-2.5 pr-10 text-xs text-black placeholder-[#93939f] focus:border-[#9b60aa] outline-none transition-all"
                      placeholder="Type subject name or select option..."
                    />
                    <button
                      type="button"
                      onClick={() => setSubInputFocused(!subInputFocused)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75758a] hover:text-black focus:outline-none"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${subInputFocused ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOnboardingSubject}
                    className="bg-black hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Add
                  </button>
                </div>

                {subInputFocused && filteredSyllabusSubjects.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#d9d9dd] rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    {filteredSyllabusSubjects.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={() => {
                          setOnboardingSubjects([...onboardingSubjects, { name }]);
                          setNewSubName('');
                          setSubInputFocused(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-black hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Render custom / manual subject list */}
                {(!isPresetEligible
                  ? onboardingSubjects
                  : onboardingSubjects.filter(sub => 
                      !SYLLABUS_SUBJECTS.core.includes(sub.name) &&
                      !SYLLABUS_SUBJECTS.elective3.includes(sub.name) &&
                      !SYLLABUS_SUBJECTS.elective4.includes(sub.name) &&
                      !SYLLABUS_SUBJECTS.instituteElective.includes(sub.name)
                    )
                ).length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[9px] font-mono font-bold text-[#75758a] uppercase tracking-wide">
                      {isPresetEligible ? 'Custom Added:' : 'Added Subjects:'}
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1.5">
                      {(!isPresetEligible
                        ? onboardingSubjects
                        : onboardingSubjects.filter(sub => 
                            !SYLLABUS_SUBJECTS.core.includes(sub.name) &&
                            !SYLLABUS_SUBJECTS.elective3.includes(sub.name) &&
                            !SYLLABUS_SUBJECTS.elective4.includes(sub.name) &&
                            !SYLLABUS_SUBJECTS.instituteElective.includes(sub.name)
                          )
                      ).map((sub, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-[#eeece7]/30 border border-[#d9d9dd] px-3 py-1.5 rounded text-xs animate-in slide-in-from-top-1 duration-150">
                          <span className="text-black font-medium">{sub.name}</span>
                          <button
                            type="button"
                            onClick={() => setOnboardingSubjects(onboardingSubjects.filter(s => s.name !== sub.name))}
                            className="text-[#b30000] hover:underline font-mono text-[9px] uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {onboardingStep > 0 && (
            <button
              type="button"
              onClick={() => setOnboardingStep(s => s - 1)}
              disabled={onboardingLoading}
              className="flex-1 bg-transparent hover:bg-[#eeece7] border border-[#d9d9dd] text-black text-xs font-semibold py-2.5 rounded-full transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleOnboardingNext}
            disabled={onboardingLoading}
            className="flex-[2] bg-black hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-full transition-colors cursor-pointer flex justify-center items-center gap-2"
          >
            {onboardingLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>{onboardingStep === 3 ? 'Finish' : 'Next'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
