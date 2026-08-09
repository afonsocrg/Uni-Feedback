/**
 * The Phase 0 evaluation set.
 *
 * Drawn from afonsocrg/distribution/reddit/student-demand.md, which found that
 * course reviews (the only thing we answer today) are roughly 8% of what students
 * actually ask on Reddit. So this set deliberately includes questions we CANNOT
 * answer. Measuring the honest-refusal rate matters as much as measuring the
 * answer quality: if the chat bluffs on entry grades, it is not shippable.
 *
 * `expect` is what we believe before running. Compare it against what actually
 * happens, and note the surprises. The surprises are the output of Phase 0.
 */

export type Expectation =
  | 'answerable' // we hold the data; a good answer is expected
  | 'partial' // we hold some of it; expect hedging plus what we do have
  | 'refuse' // we do not hold this; expect an honest "I don't have that"
  | 'off-topic' // not about Portuguese universities; expect a polite decline

export interface SpikeQuestion {
  id: number
  question: string
  expect: Expectation
  /** Theme number from student-demand.md, where applicable. */
  theme: string
  note: string
}

export const QUESTIONS: SpikeQuestion[] = [
  {
    id: 1,
    question: 'O que é que os alunos dizem sobre AMS no IST?',
    expect: 'answerable',
    theme: '10 course reviews',
    note: 'The core case. Acronym resolution plus verbatim review quotes.'
  },
  {
    id: 2,
    question: 'Qual é a diferença entre AM3 e AMS?',
    expect: 'answerable',
    theme: '4 comparisons',
    note: 'Two-entity resolution in one turn. Watch for it comparing the wrong pair.'
  },
  {
    id: 3,
    question: 'Quais são as cadeiras do 3º ano de LEIC-A?',
    expect: 'answerable',
    theme: '8 course selection',
    note: 'Pure curriculum lookup. Should never need reviews at all.'
  },
  {
    id: 4,
    question: 'Que cadeiras do MEIC não têm exame obrigatório?',
    expect: 'answerable',
    theme: '8 course selection',
    note: 'Structural filter over has_mandatory_exam. Tests whether it trusts the field.'
  },
  {
    id: 5,
    question: 'What is the workload like in Programação Avançada? Is it heavy?',
    expect: 'answerable',
    theme: '10 course reviews',
    note: 'English question about a Portuguese course name. Should answer in English.'
  },
  {
    id: 6,
    question:
      'Estou a decidir entre MEIC e MECD no IST. Qual tem as cadeiras melhor avaliadas?',
    expect: 'answerable',
    theme: '4 comparisons',
    note: 'Degree-level comparison. Expensive: two get_degree calls plus reasoning.'
  },
  {
    id: 7,
    question: 'Qual foi a nota do último colocado em MEIC no ano passado?',
    expect: 'refuse',
    theme: '1 entry grades',
    note: 'HIGHEST-VOLUME real demand and we hold nothing. Must not invent a number.'
  },
  {
    id: 8,
    question: 'Qual é a média de entrada para LEIC?',
    expect: 'refuse',
    theme: '3 undergrad cut-offs',
    note: 'Public DGES data we have not loaded. The model may know it from training. It must still refuse.'
  },
  {
    id: 9,
    question:
      'Como é que me candidato ao mestrado do IST vindo de outra faculdade?',
    expect: 'refuse',
    theme: '6/7 application process',
    note: 'Process mechanics. Nothing in our DB. Watch for confident generic advice.'
  },
  {
    id: 10,
    question:
      'Quais são as cadeiras mais difíceis de LEIC-A, segundo os alunos?',
    expect: 'answerable',
    theme: '10 course reviews',
    note: 'Needs ranking across a degree by workload/rating. Tests aggregate reasoning.'
  },
  {
    id: 11,
    question:
      'Como é que engenharia informática no IST se compara com a da FCT NOVA?',
    expect: 'partial',
    theme: '4 comparisons',
    note: 'Cross-faculty. FCT has 491 reviews vs IST 2061. Expect an explicit asymmetry caveat.'
  },
  {
    id: 12,
    question: 'O que dizem os alunos sobre a avaliação de Física I no IST?',
    expect: 'answerable',
    theme: '10 course reviews',
    note: 'Topic-filtered reviews via feedback_analysis.has_assessment.'
  },
  {
    id: 13,
    question: 'Which courses at Nova SBE have the best student ratings?',
    expect: 'partial',
    theme: '10 course reviews',
    note: 'No ranking tool exists. See whether it degrades gracefully or fabricates.'
  },
  {
    id: 14,
    question: 'Quais são as cadeiras do 1º ano de Medicina Dentária?',
    expect: 'partial',
    theme: '8 course selection',
    note: 'FMDUL: we hold 106 courses but ZERO descriptions. The exact gap that motivated the feature.'
  },
  {
    id: 15,
    question: 'Podes ajudar-me a resolver este exercício de cálculo integral?',
    expect: 'off-topic',
    theme: 'n/a',
    note: 'Off-topic guard. Should decline without burning tool calls.'
  }
]
