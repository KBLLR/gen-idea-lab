import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Building,
  Calendar,
  Target,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

/*
 * AcademicGenerator
 *
 * This component builds on the AcademicIdeaGenerator by integrating the
 * module dataset from CODE University (modules-code-university.json). Users
 * can select a module from a dropdown, which auto-fills the form fields
 * (module name, subject/topic, semester/timeframe and learning outcomes).
 * They can then generate tailored ideas for teaching strategy, coursework
 * development, student engagement, research projects, student support or
 * administrative processes. If an API backend is unavailable, the
 * component falls back to predefined ideas and summary based on the
 * selected module.
 */

// Import module data. This assumes that modules-code-university.json has
// been copied into the public folder or can be imported directly. If
// bundler does not support JSON imports, fetch the file instead.
import modulesData from './modules-code-university.json';

// Translation strings reused from AcademicIdeaGenerator
const TRANSLATIONS = {
  'en-US': {
    appTitle: 'Academic Idea Generator',
    appDescription:
      'Generate contextual, actionable ideas tailored specifically to your academic module and objectives',
    companyContextTitle: 'Module Context',
    moduleSelectLabel: 'Select Module',
    moduleSelectPlaceholder: 'Choose a module...',
    companyNameLabel: 'Course/Module Name *',
    companyNamePlaceholder: 'e.g., Intro to Computer Science',
    productServiceLabel: 'Subject/Topic *',
    productServicePlaceholder: 'e.g., Machine Learning Basics',
    timelineLabel: 'Semester/Timeframe',
    timelinePlaceholder: 'e.g., Fall 2025, midterm project period',
    sessionTypeLabel: 'Focus Area',
    teamGoalsLabel: 'Learning Outcomes & Objectives *',
    teamGoalsPlaceholder:
      'e.g., Understand fundamental concepts, develop critical thinking skills...',
    generateIdeasButton: 'Generate Ideas',
    generatingIdeasButton: 'Generating Ideas...',
    requiredFieldsError: 'Please fill in all required fields',
    generateIdeasError: 'Failed to generate ideas. Please try again.',
    aiUnderstandingTitle: 'AI Understanding Summary',
    generatedIdeasTitle: 'Generated Ideas',
    priorityLabel: 'Priority:',
    effortLabel: 'Effort:',
    impactLabel: 'Impact:',
    sessionTypeTeachingStrategy: 'Teaching Strategy',
    sessionTypeCoursework: 'Coursework Development',
    sessionTypeStudentEngagement: 'Student Engagement',
    sessionTypeResearch: 'Research & Projects',
    sessionTypeStudentSupport: 'Student Support',
    sessionTypeAdministration: 'Administration & Processes',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    effortHigh: 'High',
    effortMedium: 'Medium',
    effortLow: 'Low',
    impactHigh: 'High',
    impactMedium: 'Medium',
    impactLow: 'Low',
    fallbackIdeaTitle1: 'Active Learning Exercises',
    fallbackIdeaDescription1:
      'Implement active learning activities and in-class problem solving to reinforce key concepts and encourage student participation.',
    fallbackIdeaTitle2: 'Peer Review Workshops',
    fallbackIdeaDescription2:
      'Organise structured peer review sessions to help students provide and receive feedback on assignments and projects.',
    fallbackIdeaTitle3: 'Project-Based Assessment',
    fallbackIdeaDescription3:
      'Design project-based assessments that allow students to apply theoretical knowledge to real-world problems.',
    fallbackIdeaTitle4: 'Integration of Technology',
    fallbackIdeaDescription4:
      'Use educational technology tools (e.g., simulation software, online collaboration platforms) to enhance learning experiences.',
    fallbackIdeaTitle5: 'Mid-Semester Feedback Survey',
    fallbackIdeaDescription5:
      'Conduct mid-semester surveys to gather feedback on teaching effectiveness and course content.',
    fallbackIdeaTitle6: 'Collaborative Research Opportunities',
    fallbackIdeaDescription6:
      'Create opportunities for students to participate in collaborative research projects aligned with course topics.'
  }
};

// Determine locale from browser; fall back to English
const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const locale = Object.keys(TRANSLATIONS).includes(browserLocale)
  ? browserLocale
  : 'en-US';
const t = (key) => TRANSLATIONS[locale]?.[key] || TRANSLATIONS['en-US'][key] || key;

const AcademicGenerator = () => {
  const [formData, setFormData] = useState({
    moduleName: '',
    subjectTopic: '',
    timeframe: '',
    learningGoals: '',
    sessionType: 'teaching-strategy'
  });
  const [selectedModuleCode, setSelectedModuleCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Populate formData when a module is selected
  useEffect(() => {
    if (!selectedModuleCode) return;
    const module = modulesData.find(
      (m) => m['Module Code'] === selectedModuleCode
    );
    if (module) {
      setFormData({
        moduleName: module['Module Title'] || '',
        subjectTopic: module['Key Contents / Topics'] || '',
        timeframe: module['Semester'] || '',
        learningGoals: (module['Qualification Objectives'] || [])
          .join('; '),
        sessionType: formData.sessionType
      });
    }
  }, [selectedModuleCode]);

  const sessionTypes = [
    { value: 'teaching-strategy', label: t('sessionTypeTeachingStrategy') },
    { value: 'coursework', label: t('sessionTypeCoursework') },
    { value: 'student-engagement', label: t('sessionTypeStudentEngagement') },
    { value: 'research', label: t('sessionTypeResearch') },
    { value: 'student-support', label: t('sessionTypeStudentSupport') },
    { value: 'administration', label: t('sessionTypeAdministration') }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateIdeas = async () => {
    if (!formData.moduleName || !formData.subjectTopic || !formData.learningGoals) {
      setError(t('requiredFieldsError'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Compose a prompt similar to the base version
      const prompt = `
        Please respond in ${locale} language.
        \n
        Analyse this academic module context and provide a brief understanding summary:
        \n
        Module: ${formData.moduleName}
        Subject/Topic: ${formData.subjectTopic}
        Timeframe: ${formData.timeframe}
        Learning Goals: ${formData.learningGoals}
        Focus Area: ${formData.sessionType}
        \n
        Provide a 2-3 sentence summary that shows you understand:
        1. What the module covers
        2. The current context/challenges
        3. What the instructor aims to achieve
        \n
        Then generate 6 specific, actionable ideas for ${formData.sessionType} that are directly relevant to this module's context. For each idea, provide title, description, priority, effort and impact.
      `;
      // TODO: integrate with an AI service here
      // Simulate failure to trigger fallback
      throw new Error('API unavailable');
    } catch (err) {
      console.error(err);
      setError(t('generateIdeasError'));
      setResults({
        understanding: `Based on the information provided, ${formData.moduleName} covers ${formData.subjectTopic} with goals around ${formData.learningGoals}. This context suggests opportunities for ${formData.sessionType} initiatives.`,
        ideas: [
          {
            title: t('fallbackIdeaTitle1'),
            description: t('fallbackIdeaDescription1'),
            priority: t('priorityHigh'),
            effort: t('effortMedium'),
            impact: t('impactHigh')
          },
          {
            title: t('fallbackIdeaTitle2'),
            description: t('fallbackIdeaDescription2'),
            priority: t('priorityMedium'),
            effort: t('effortLow'),
            impact: t('impactMedium')
          },
          {
            title: t('fallbackIdeaTitle3'),
            description: t('fallbackIdeaDescription3'),
            priority: t('priorityHigh'),
            effort: t('effortMedium'),
            impact: t('impactHigh')
          },
          {
            title: t('fallbackIdeaTitle4'),
            description: t('fallbackIdeaDescription4'),
            priority: t('priorityMedium'),
            effort: t('effortHigh'),
            impact: t('impactHigh')
          },
          {
            title: t('fallbackIdeaTitle5'),
            description: t('fallbackIdeaDescription5'),
            priority: t('priorityMedium'),
            effort: t('effortMedium'),
            impact: t('impactMedium')
          },
          {
            title: t('fallbackIdeaTitle6'),
            description: t('fallbackIdeaDescription6'),
            priority: t('priorityLow'),
            effort: t('effortLow'),
            impact: t('impactMedium')
          }
        ]
      });
    }
    setLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Medium':
      case 'Media':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
      case 'Baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getEffortColor = (effort) => {
    switch (effort) {
      case 'High':
      case 'Alto':
        return 'bg-purple-100 text-purple-800';
      case 'Medium':
      case 'Medio':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
      case 'Bajo':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High':
      case 'Alto':
        return 'bg-emerald-100 text-emerald-800';
      case 'Medium':
      case 'Medio':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
      case 'Bajo':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-full">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('appTitle')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('appDescription')}
          </p>
        </div>
        {/* Module selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Building className="w-6 h-6 mr-3 text-indigo-600" />
            {t('companyContextTitle')}
          </h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('moduleSelectLabel')}
            </label>
            <select
              value={selectedModuleCode}
              onChange={(e) => setSelectedModuleCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t('moduleSelectPlaceholder')}</option>
              {modulesData.map((module) => (
                <option key={module['Module Code']} value={module['Module Code']}>
                  {module['Module Code']} - {module['Module Title']}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('companyNameLabel')}
              </label>
              <input
                type="text"
                name="moduleName"
                value={formData.moduleName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('companyNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('productServiceLabel')}
              </label>
              <input
                type="text"
                name="subjectTopic"
                value={formData.subjectTopic}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('productServicePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('timelineLabel')}
              </label>
              <input
                type="text"
                name="timeframe"
                value={formData.timeframe}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('timelinePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('sessionTypeLabel')}
              </label>
              <select
                name="sessionType"
                value={formData.sessionType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {sessionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teamGoalsLabel')}
              </label>
              <textarea
                name="learningGoals"
                value={formData.learningGoals}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('teamGoalsPlaceholder')}
              />
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          <div className="mt-8 text-center">
            <button
              onClick={generateIdeas}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('generatingIdeasButton')}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  {t('generateIdeasButton')}
                </>
              )}
            </button>
          </div>
        </div>
        {/* Results */}
        {results && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-600" />
                {t('aiUnderstandingTitle')}
              </h3>
              <p className="text-gray-700 leading-relaxed">{results.understanding}</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                {t('generatedIdeasTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.ideas.map((idea, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {idea.title}
                      </h4>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {idea.description}
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">
                            {t('priorityLabel')}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              idea.priority
                            )}`}
                          >
                            {idea.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {t('effortLabel')}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(
                              idea.effort
                            )}`}
                          >
                            {idea.effort}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {t('impactLabel')}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(
                              idea.impact
                            )}`}
                          >
                            {idea.impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicGenerator;