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

  const handleInputChange = (field: string, value: string) => {
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
      
      const response = await fetch('/api/elections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramAuth,
          ...formData,
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
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
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
            <GlassCard className="mb-6">
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
                  />
                </div>
              </div>

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
          <div className="space-y-6">
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
