'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const templates = [
  {
    name: 'Да/Не',
    icon: '✅',
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
    name: 'Рейтинг',
    icon: '⭐',
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
    name: 'Избор на кандидат',
    icon: '👤',
    questions: [{
      question_text_bg: 'Изберете кандидат',
      question_type: 'single-choice' as const,
      options: [
        { option_text_bg: 'Кандидат А' },
        { option_text_bg: 'Кандидат Б' },
        { option_text_bg: 'Кандидат В' }
      ]
    }]
  }
];

function CreatePollPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
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
    questions: [
      {
        question_text: '',
        question_text_bg: '',
        question_type: 'single-choice',
        options: [{ option_text: '', option_text_bg: '' }],
      },
    ],
  });

  const useTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({
      ...prev,
      questions: template.questions.map(q => ({
        question_text: '',
        question_text_bg: q.question_text_bg,
        question_type: q.question_type,
        options: q.options.map(o => ({ option_text: '', option_text_bg: o.option_text_bg }))
      }))
    }));
    setStep(2);
  };

  // Check for template parameter in URL
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      const templateMap: Record<string, typeof templates[0]> = {
        'yesno': templates[0],
        'rating': templates[1],
        'candidate': templates[2],
      };
      const selectedTemplate = templateMap[templateParam];
      if (selectedTemplate) {
        setFormData(prev => ({
          ...prev,
          questions: selectedTemplate.questions.map(q => ({
            question_text: '',
            question_text_bg: q.question_text_bg,
            question_type: q.question_type,
            options: q.options.map(o => ({ option_text: '', option_text_bg: o.option_text_bg }))
          }))
        }));
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleInputChange = (field: string, value: string | boolean) => {
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const telegramAuth = JSON.parse(localStorage.getItem('telegram_auth') || '{}');
      
      // Prepare form data - use end_date for fundraising_end_date if not set
      const submitData = {
        ...formData,
        fundraising_end_date: formData.has_fundraising && formData.fundraising_end_date 
          ? formData.fundraising_end_date 
          : formData.end_date,
      };
      
      const response = await fetch('/api/elections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramAuth,
          ...submitData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Грешка при създаване на изборите');
      }

      router.push(`/vote/${result.electionId}`);
    } catch (error: any) {
      alert(error.message || 'Грешка при създаване на изборите');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 lg:py-8">
      <div className="w-full">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Създай нова анкета
          </h1>
          <p className="text-muted-foreground">
            Стъпка {step} от 2
          </p>
        </div>

        {step === 1 && (
          <>
            {/* Quick Templates */}
            <GlassCard className="mb-4 lg:mb-6">
              <GlassCardHeader>
                <GlassCardTitle>Бързи шаблони</GlassCardTitle>
                <GlassCardDescription>
                  Изберете шаблон за бързо създаване
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {templates.map((template, i) => (
                    <button
                      key={i}
                      onClick={() => useTemplate(template)}
                      className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                      <div className="text-sm font-semibold">{template.name}</div>
                    </button>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Основна информация</GlassCardTitle>
                <GlassCardDescription>
                  Въведете информация за вашата анкета
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4 lg:space-y-6">
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
                  />
                </div>
              </div>

              {/* Fundraising Card */}
              <GlassCard className="border-primary/20">
                <GlassCardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <GlassCardTitle className="flex items-center gap-2">
                        <span>💰</span>
                        Събиране на средства
                      </GlassCardTitle>
                      <GlassCardDescription className="mt-1">
                        Активирайте събиране на средства за вашата анкета
                      </GlassCardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_fundraising"
                        checked={formData.has_fundraising}
                        onChange={(e) => handleInputChange('has_fundraising', e.target.checked)}
                        className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
                      />
                      <label htmlFor="has_fundraising" className="text-sm font-medium cursor-pointer">
                        Активирай
                      </label>
                    </div>
                  </div>
                </GlassCardHeader>

                {formData.has_fundraising && (
                  <GlassCardContent className="space-y-4 pt-4">
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
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Минимална сума: 1 {formData.fundraising_currency || 'BGN'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="fundraising_currency" className="text-sm font-medium">
                          Валута
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
                        </select>
                      </div>
                    </div>

                    {/* Fundraising Timeframe */}
                    <div className="space-y-2">
                      <label htmlFor="fundraising_end_date" className="text-sm font-medium">
                        Крайна дата за събиране на средства
                      </label>
                      <Input
                        id="fundraising_end_date"
                        type="datetime-local"
                        value={formData.fundraising_end_date || formData.end_date}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('fundraising_end_date', value || formData.end_date);
                        }}
                        min={formData.start_date || undefined}
                        max={formData.end_date || undefined}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.end_date 
                          ? `По подразбиране: Крайна дата на анкетата (${new Date(formData.end_date).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })})`
                          : 'Моля, задайте първо крайна дата на анкетата'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="fundraising_description_bg" className="text-sm font-medium">
                        Описание на кампанията
                      </label>
                      <Textarea
                        id="fundraising_description_bg"
                        placeholder="Опишете за какво се събират средствата, как ще бъдат използвани и защо е важна подкрепата..."
                        rows={4}
                        value={formData.fundraising_description_bg}
                        onChange={(e) => handleInputChange('fundraising_description_bg', e.target.value)}
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Максимум 500 символа</span>
                        <span>{formData.fundraising_description_bg.length}/500</span>
                      </div>
                    </div>

                    {formData.fundraising_goal && parseFloat(formData.fundraising_goal) > 0 && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Цел:</span>
                          <span className="text-lg font-bold text-primary">
                            {parseFloat(formData.fundraising_goal || '0').toLocaleString('bg-BG', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })} {formData.fundraising_currency || 'BGN'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-background/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                            style={{ width: '0%' }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Прогресът ще се показва автоматично след първото дарение
                        </p>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-500 text-sm">💡</span>
                        <div className="text-xs text-amber-500">
                          <p className="font-semibold mb-1">Важно:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Моля, добавете платежните си данни в Настройки преди да активирате събиране на средства</li>
                            <li>Средствата ще бъдат налични за изтегляне след приключване на анкетата</li>
                            <li>Всички дарения са финални и не подлежат на възстановяване</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </GlassCardContent>
                )}
              </GlassCard>

              <div className="flex gap-4">
                <Button onClick={() => router.push('/dashboard')} variant="outline">
                  Отказ
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1">
                  Напред
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
          </>
        )}

        {step === 2 && (
          <div className="space-y-4 lg:space-y-6">
            {formData.questions.map((question, qIndex) => (
              <GlassCard key={qIndex}>
                <GlassCardHeader>
                  <div className="flex items-center justify-between">
                    <GlassCardTitle>Въпрос {qIndex + 1}</GlassCardTitle>
                    {formData.questions.length > 1 && (
                      <Badge variant="secondary">
                        {question.question_type === 'single-choice' ? 'Един избор' : 'Множествен избор'}
                      </Badge>
                    )}
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
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                    >
                      + Добави опция
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}

            <div className="flex gap-4">
              <Button variant="outline" onClick={addQuestion}>
                + Добави въпрос
              </Button>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setStep(1)} variant="outline">
                Назад
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1 gradient-primary">
                {loading ? 'Създаване...' : 'Създай анкета'}
              </Button>
            </div>
          </div>
        )}
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
