'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { convertBulgariaDateTimeToUTC, convertUTCToBulgariaDateTime } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Plus, X } from 'lucide-react';

const templates = [
  {
    id: 'yesno',
    name: 'Да/Не',
    icon: '✅',
    description: 'Проста анкета с два отговора',
    questions: [{
      question_text_bg: 'Съгласни ли сте?',
      question_type: 'single-choice' as const,
      options: [
        { option_text_bg: 'Да' },
        { option_text_bg: 'Не' }
      ]
    }]
  },
  {
    id: 'rating',
    name: 'Рейтинг',
    icon: '⭐',
    description: 'Оценка от 1 до 5 или по скала',
    questions: [{
      question_text_bg: 'Оценете от 1 до 5',
      question_type: 'single-choice' as const,
      options: [
        { option_text_bg: '1' },
        { option_text_bg: '2' },
        { option_text_bg: '3' },
        { option_text_bg: '4' },
        { option_text_bg: '5' }
      ]
    }]
  },
  {
    id: 'elections',
    name: 'Избори',
    icon: '🗳️',
    description: 'Избор между множество кандидати или опции',
    questions: [{
      question_text_bg: 'Изберете кандидат',
      question_type: 'single-choice' as const,
      options: [
        { option_text_bg: 'Кандидат А' },
        { option_text_bg: 'Кандидат Б' },
        { option_text_bg: 'Кандидат В' }
      ]
    }]
  },
  {
    id: 'fundraising',
    name: 'Събиране на средства',
    icon: '💰',
    description: 'Кампания за събиране на средства с анкета',
    hasFundraising: true,
    questions: [{
      question_text_bg: 'Подкрепяте ли тази кампания?',
      question_type: 'single-choice' as const,
      options: [
        { option_text_bg: 'Да, подкрепям' },
        { option_text_bg: 'Не, не подкрепям' }
      ]
    }]
  },
  {
    id: 'blank',
    name: 'Празен шаблон',
    icon: '📝',
    description: 'Започнете от нулата',
    questions: [{
      question_text_bg: '',
      question_type: 'single-choice' as const,
      options: [{ option_text_bg: '' }]
    }]
  }
];

type Step = 1 | 2 | 3 | 4 | 5;

function CreatePollPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingElection, setLoadingElection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editingElectionId, setEditingElectionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    title: string;
    title_bg: string;
    description: string;
    description_bg: string;
    start_date: string;
    end_date: string;
    has_fundraising: boolean;
    fundraising_goal: string;
    fundraising_currency: string;
    fundraising_description_bg: string;
    fundraising_end_date: string;
    fundraising_purpose: string;
    fundraising_min_amount: string;
    fundraising_suggested_amounts: string;
    fundraising_payment_methods: string[];
    fundraising_show_donors: boolean;
    questions: Array<{
      question_text: string;
      question_text_bg: string;
      question_type: 'single-choice' | 'multiple-choice';
      options: Array<{ option_text: string; option_text_bg: string }>;
    }>;
  }>({
    title: '',
    title_bg: '',
    description: '',
    description_bg: '',
    start_date: '',
    end_date: '',
    has_fundraising: false,
    fundraising_goal: '',
    fundraising_currency: 'BGN',
    fundraising_description_bg: '',
    fundraising_end_date: '',
    fundraising_purpose: '',
    fundraising_min_amount: '',
    fundraising_suggested_amounts: '',
    fundraising_payment_methods: [],
    fundraising_show_donors: true,
    questions: [
      {
        question_text: '',
        question_text_bg: '',
        question_type: 'single-choice',
        options: [{ option_text: '', option_text_bg: '' }],
      },
    ],
  });

  // Check for template or edit parameter in URL
  useEffect(() => {
    const templateParam = searchParams.get('template');
    const editParam = searchParams.get('edit');
    
    if (editParam) {
      setEditingElectionId(editParam);
      loadElectionForEdit(editParam);
    } else if (templateParam) {
      const selectedTemplate = templates.find(t => t.id === templateParam);
      if (selectedTemplate) {
        applyTemplate(selectedTemplate);
        setSelectedTemplate(templateParam);
      }
    }
  }, [searchParams]);

  const loadElectionForEdit = async (electionId: string) => {
    setLoadingElection(true);
    try {
      const response = await fetch(`/api/elections/${electionId}`);
      if (!response.ok) {
        throw new Error('Не може да се зареди анкетата за редактиране');
      }
      
      const data = await response.json();
      
      // Convert dates from UTC to datetime-local format
      const startDate = data.start_date ? convertUTCToBulgariaDateTime(data.start_date) : '';
      const endDate = data.end_date ? convertUTCToBulgariaDateTime(data.end_date) : '';
      const fundraisingEndDate = data.fundraising_end_date 
        ? convertUTCToBulgariaDateTime(data.fundraising_end_date) 
        : '';
      
      // Transform questions and options
      const questions = (data.questions || []).map((q: any) => ({
        question_text: q.question_text || '',
        question_text_bg: q.question_text_bg || '',
        question_type: q.question_type || 'single-choice',
        options: (q.options || []).map((o: any) => ({
          option_text: o.option_text || '',
          option_text_bg: o.option_text_bg || '',
        })),
      }));
      
      setFormData({
        title: data.title || '',
        title_bg: data.title_bg || '',
        description: data.description || '',
        description_bg: data.description_bg || '',
        start_date: startDate,
        end_date: endDate,
        has_fundraising: data.has_fundraising || false,
        fundraising_goal: data.fundraising_goal?.toString() || '',
        fundraising_currency: data.fundraising_currency || 'BGN',
        fundraising_description_bg: data.fundraising_description_bg || '',
        fundraising_end_date: fundraisingEndDate,
        fundraising_purpose: data.fundraising_purpose || '',
        fundraising_min_amount: data.fundraising_min_amount?.toString() || '',
        fundraising_suggested_amounts: data.fundraising_suggested_amounts || '',
        fundraising_payment_methods: data.fundraising_payment_methods || [],
        fundraising_show_donors: data.fundraising_show_donors !== undefined ? data.fundraising_show_donors : true,
        questions: questions.length > 0 ? questions : [{
          question_text: '',
          question_text_bg: '',
          question_type: 'single-choice',
          options: [{ option_text: '', option_text_bg: '' }],
        }],
      });
      
      // Skip to step 2 if editing
      setCurrentStep(2);
    } catch (error: any) {
      console.error('Error loading election:', error);
      alert(error.message || 'Грешка при зареждане на анкетата');
    } finally {
      setLoadingElection(false);
    }
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({
      ...prev,
      has_fundraising: template.hasFundraising || false,
      fundraising_goal: template.hasFundraising ? '1000' : prev.fundraising_goal,
      fundraising_currency: template.hasFundraising ? 'BGN' : prev.fundraising_currency,
      fundraising_description_bg: template.hasFundraising ? 'Подкрепете нашата кампания!' : prev.fundraising_description_bg,
      fundraising_end_date: template.hasFundraising ? prev.end_date || '' : prev.fundraising_end_date,
      fundraising_purpose: template.hasFundraising ? 'charity' : prev.fundraising_purpose,
      fundraising_min_amount: template.hasFundraising ? '10' : prev.fundraising_min_amount,
      fundraising_suggested_amounts: template.hasFundraising ? '10, 25, 50, 100, 250' : prev.fundraising_suggested_amounts,
      fundraising_payment_methods: template.hasFundraising ? ['card', 'bank_transfer'] : prev.fundraising_payment_methods,
      fundraising_show_donors: template.hasFundraising ? true : prev.fundraising_show_donors,
      questions: template.questions.map(q => ({
        question_text: '',
        question_text_bg: q.question_text_bg,
        question_type: q.question_type,
        options: q.options.map(o => ({ option_text: '', option_text_bg: o.option_text_bg }))
      }))
    }));
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = { ...options[optionIndex], [field]: value };
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  };

  const addOption = (questionIndex: number) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex].options.push({ option_text: '', option_text_bg: '' });
      return { ...prev, questions };
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      if (questions[questionIndex].options.length > 1) {
        questions[questionIndex].options.splice(optionIndex, 1);
      }
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          question_text_bg: '',
          question_type: 'single-choice',
          options: [{ option_text: '', option_text_bg: '' }],
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      if (questions.length > 1) {
        questions.splice(index, 1);
      }
      return { ...prev, questions };
    });
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return true; // Template selection is optional
      case 2:
        return !!(formData.title_bg && formData.start_date && formData.end_date);
      case 3:
        return formData.questions.every(q => 
          q.question_text_bg && 
          q.options.length > 0 && 
          q.options.every(o => o.option_text_bg)
        );
      case 4:
        if (!formData.has_fundraising) return true;
        return !!(formData.fundraising_goal && 
                  formData.fundraising_purpose && 
                  formData.fundraising_description_bg &&
                  formData.fundraising_payment_methods.length > 0);
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 5) {
      // Skip fundraising step if not enabled
      if (currentStep === 3 && !formData.has_fundraising) {
        setCurrentStep(5);
      } else {
        setCurrentStep((prev) => (prev + 1) as Step);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Skip fundraising step if not enabled when going back
      if (currentStep === 5 && !formData.has_fundraising) {
        setCurrentStep(3);
      } else {
        setCurrentStep((prev) => (prev - 1) as Step);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const telegramAuth = JSON.parse(localStorage.getItem('telegram_auth') || '{}');
      
      const submitData = {
        ...formData,
        start_date: formData.start_date ? convertBulgariaDateTimeToUTC(formData.start_date) : null,
        end_date: formData.end_date ? convertBulgariaDateTimeToUTC(formData.end_date) : null,
        fundraising_end_date: formData.has_fundraising 
          ? (formData.fundraising_end_date 
              ? convertBulgariaDateTimeToUTC(formData.fundraising_end_date)
              : (formData.end_date ? convertBulgariaDateTimeToUTC(formData.end_date) : null))
          : null,
      };
      
      // Use update endpoint if editing, otherwise create
      const url = editingElectionId 
        ? `/api/elections/${editingElectionId}`
        : '/api/elections/create';
      const method = editingElectionId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramAuth,
          ...submitData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || (editingElectionId ? 'Грешка при обновяване на изборите' : 'Грешка при създаване на изборите'));
      }

      router.push(`/dashboard`);
      router.refresh();
    } catch (error: any) {
      alert(error.message || (editingElectionId ? 'Грешка при обновяване на изборите' : 'Грешка при създаване на изборите'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Шаблон', icon: '📋' },
    { number: 2, title: 'Детайли', icon: '📝' },
    { number: 3, title: 'Въпроси', icon: '❓' },
    { number: 4, title: 'Средства', icon: '💰' },
    { number: 5, title: 'Преглед', icon: '👁️' },
  ];

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isSkipped = step.number === 4 && !formData.has_fundraising && currentStep > 4;
            
            if (isSkipped) return null;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="text-lg">{step.icon}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Step 1: Choose Template
  const renderStep1 = () => (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Изберете шаблон</GlassCardTitle>
        <GlassCardDescription>
          Изберете готов шаблон или започнете от нулата
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                onClick={() => {
                  applyTemplate(template);
                  setSelectedTemplate(template.id);
                }}
                className={`p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group relative h-full flex flex-col ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                {template.hasFundraising && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary/20 text-primary text-xs">💰</Badge>
                  </div>
                )}
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {template.icon}
                </div>
                <div className="text-lg font-bold mb-2">{template.name}</div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-primary">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Избран</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  );

  // Step 2: Basic Details
  const renderStep2 = () => (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Основна информация</GlassCardTitle>
        <GlassCardDescription>
          Въведете заглавие, описание и дати за вашата анкета
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Заглавие (Български) *</label>
          <Input
            placeholder="Напр: Анкета за политически партии"
            value={formData.title_bg}
            onChange={(e) => handleInputChange('title_bg', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Описание (Български)</label>
          <Textarea
            placeholder="Опишете вашата анкета..."
            rows={4}
            value={formData.description_bg}
            onChange={(e) => handleInputChange('description_bg', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Начална дата *</label>
            <Input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Крайна дата *</label>
            <Input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              min={formData.start_date || undefined}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="has_fundraising"
              checked={formData.has_fundraising}
              onChange={(e) => handleInputChange('has_fundraising', e.target.checked)}
              className="w-5 h-5 rounded border-border accent-primary cursor-pointer mt-0.5"
            />
            <div>
              <label htmlFor="has_fundraising" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <span>💰</span>
                <span>Активирай събиране на средства</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Ако активирате това, ще можете да конфигурирате събиране на средства в следващата стъпка
              </p>
            </div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );

  // Step 3: Questions & Options
  const renderStep3 = () => (
    <div className="space-y-6">
      {formData.questions.map((question, qIndex) => (
        <GlassCard key={qIndex}>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle>Въпрос {qIndex + 1}</GlassCardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {question.question_type === 'single-choice' ? 'Един избор' : 'Множествен избор'}
                </Badge>
                {formData.questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Текст на въпроса (Български) *</label>
              <Input
                placeholder="Напр: За коя партия бихте гласували?"
                value={question.question_text_bg}
                onChange={(e) =>
                  handleQuestionChange(qIndex, 'question_text_bg', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Тип въпрос</label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={question.question_type === 'single-choice' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    handleQuestionChange(qIndex, 'question_type', 'single-choice')
                  }
                >
                  Един избор
                </Button>
                <Button
                  type="button"
                  variant={question.question_type === 'multiple-choice' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    handleQuestionChange(qIndex, 'question_type', 'multiple-choice')
                  }
                >
                  Множествен избор
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">Опции *</label>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex gap-2">
                  <Input
                    placeholder={`Опция ${oIndex + 1}`}
                    value={option.option_text_bg}
                    onChange={(e) =>
                      handleOptionChange(qIndex, oIndex, 'option_text_bg', e.target.value)
                    }
                    className="flex-1"
                  />
                  {question.options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(qIndex, oIndex)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(qIndex)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добави опция
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добави въпрос
      </Button>
    </div>
  );

  // Step 4: Fundraising
  const renderStep4 = () => (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Събиране на средства</GlassCardTitle>
        <GlassCardDescription>
          Конфигурирайте събирането на средства за вашата кампания
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="fundraising_purpose" className="text-sm font-medium flex items-center gap-2">
            Цел на кампанията <span className="text-destructive">*</span>
          </label>
          <select
            id="fundraising_purpose"
            value={formData.fundraising_purpose}
            onChange={(e) => handleInputChange('fundraising_purpose', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Изберете цел...</option>
            <option value="charity">Благотворителност</option>
            <option value="political">Политическа кампания</option>
            <option value="community">Обществен проект</option>
            <option value="education">Образование</option>
            <option value="healthcare">Здравеопазване</option>
            <option value="environment">Околна среда</option>
            <option value="arts">Изкуство и култура</option>
            <option value="sports">Спорт</option>
            <option value="other">Друго</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fundraising_goal" className="text-sm font-medium flex items-center gap-2">
              Цел (сума) <span className="text-destructive">*</span>
            </label>
            <Input
              id="fundraising_goal"
              type="number"
              placeholder="1000"
              min="1"
              step="0.01"
              value={formData.fundraising_goal}
              onChange={(e) => handleInputChange('fundraising_goal', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="fundraising_currency" className="text-sm font-medium">
              Валута <span className="text-destructive">*</span>
            </label>
            <select
              id="fundraising_currency"
              value={formData.fundraising_currency}
              onChange={(e) => handleInputChange('fundraising_currency', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="BGN">BGN (Български лев)</option>
              <option value="EUR">EUR (Евро)</option>
              <option value="USD">USD (Долар)</option>
              <option value="GBP">GBP (Британска лира)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fundraising_min_amount" className="text-sm font-medium">
              Минимална дарена сума
            </label>
            <Input
              id="fundraising_min_amount"
              type="number"
              placeholder="10"
              min="0.01"
              step="0.01"
              value={formData.fundraising_min_amount}
              onChange={(e) => handleInputChange('fundraising_min_amount', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="fundraising_suggested_amounts" className="text-sm font-medium">
              Предложени суми
            </label>
            <Input
              id="fundraising_suggested_amounts"
              type="text"
              placeholder="10, 25, 50, 100, 250"
              value={formData.fundraising_suggested_amounts}
              onChange={(e) => handleInputChange('fundraising_suggested_amounts', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Методи на плащане *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['card', 'bank_transfer', 'paypal', 'crypto'].map((method) => {
              const methodLabels: Record<string, string> = {
                card: '💳 Карта',
                bank_transfer: '🏦 Банков превод',
                paypal: '📧 PayPal',
                crypto: '₿ Криптовалута',
              };
              const isSelected = formData.fundraising_payment_methods.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    const methods = formData.fundraising_payment_methods.includes(method)
                      ? formData.fundraising_payment_methods.filter(m => m !== method)
                      : [...formData.fundraising_payment_methods, method];
                    handleInputChange('fundraising_payment_methods', methods);
                  }}
                  className={`p-3 border-2 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {methodLabels[method] || method}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="fundraising_end_date" className="text-sm font-medium">
            Крайна дата за събиране на средства
          </label>
          <Input
            id="fundraising_end_date"
            type="datetime-local"
            value={formData.fundraising_end_date || formData.end_date || ''}
            onChange={(e) => handleInputChange('fundraising_end_date', e.target.value || '')}
            min={formData.start_date || undefined}
            max={formData.end_date || undefined}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fundraising_description_bg" className="text-sm font-medium flex items-center gap-2">
            Описание на кампанията <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="fundraising_description_bg"
            placeholder="Опишете за какво се събират средствата..."
            rows={4}
            value={formData.fundraising_description_bg}
            onChange={(e) => handleInputChange('fundraising_description_bg', e.target.value)}
            maxLength={1000}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Максимум 1000 символа</span>
            <span>{formData.fundraising_description_bg.length}/1000</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div>
            <label htmlFor="fundraising_show_donors" className="text-sm font-medium cursor-pointer">
              Показване на дарители
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Показване на имената на дарителите публично
            </p>
          </div>
          <input
            type="checkbox"
            id="fundraising_show_donors"
            checked={formData.fundraising_show_donors}
            onChange={(e) => handleInputChange('fundraising_show_donors', e.target.checked)}
            className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
          />
        </div>
      </GlassCardContent>
    </GlassCard>
  );

  // Step 5: Review & Publish
  const renderStep5 = () => (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Преглед и публикуване</GlassCardTitle>
        <GlassCardDescription>
          Проверете информацията преди да публикувате анкетата
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Заглавие</h3>
            <p className="text-muted-foreground">{formData.title_bg || 'Не е въведено'}</p>
          </div>

          {formData.description_bg && (
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-muted-foreground">{formData.description_bg}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Начална дата</h3>
              <p className="text-muted-foreground">
                {formData.start_date 
                  ? new Date(formData.start_date).toLocaleString('bg-BG')
                  : 'Не е зададена'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Крайна дата</h3>
              <p className="text-muted-foreground">
                {formData.end_date 
                  ? new Date(formData.end_date).toLocaleString('bg-BG')
                  : 'Не е зададена'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Въпроси ({formData.questions.length})</h3>
            <div className="space-y-3">
              {formData.questions.map((question, qIndex) => (
                <div key={qIndex} className="p-3 border border-border rounded-lg">
                  <p className="font-medium mb-2">{qIndex + 1}. {question.question_text_bg}</p>
                  <div className="text-sm text-muted-foreground">
                    Тип: {question.question_type === 'single-choice' ? 'Един избор' : 'Множествен избор'}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Опции:</p>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option, oIndex) => (
                        <Badge key={oIndex} variant="secondary">
                          {option.option_text_bg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formData.has_fundraising && (
            <div>
              <h3 className="font-semibold mb-2">Събиране на средства</h3>
              <div className="p-3 border border-border rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Цел:</span> {formData.fundraising_goal} {formData.fundraising_currency}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Цел:</span> {formData.fundraising_purpose}
                </p>
                <p className="text-sm text-muted-foreground">{formData.fundraising_description_bg}</p>
              </div>
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <div className="py-6 lg:py-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {editingElectionId ? 'Редактирай анкета' : 'Създай нова анкета'}
          </h1>
          <p className="text-muted-foreground">
            {editingElectionId 
              ? 'Редактирайте детайлите на вашата анкета'
              : 'Следвайте стъпките, за да създадете вашата анкета'}
          </p>
        </div>

        {renderStepIndicator()}

        <div className="mb-6">
          {renderCurrentStep()}
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => {
              if (currentStep === 1) {
                router.push('/dashboard');
              } else {
                prevStep();
              }
            }}
            variant="outline"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Отказ' : 'Назад'}
          </Button>

          <div className="flex gap-2">
            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep) || loading}
                className="gradient-primary text-white"
              >
                Напред
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep(5)}
                className="gradient-primary text-white"
              >
                {loading ? 'Публикуване...' : 'Публикувай анкета'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePollPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Зареждане...</p>
        </div>
      </div>
    }>
      <CreatePollPageContent />
    </Suspense>
  );
}
