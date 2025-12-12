import { getAssetUrl } from '~/utils'
import { TestimonialCard } from './TestimonialCard'

interface Testimonial {
  testimonial: string
  name: string
  course: string
  avatarUrl?: string
  url?: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    testimonial: `O Fénix é uma floresta de termos técnicos e promessas de matéria interessante, que metade das vezes não reflete a experiência real dos alunos a tirar as cadeiras.

O Uni Feedback fornece algo que não conseguimos encontrar em mais nenhum lado, uma coleção organizada das opiniões diretas dos alunos que tiveram a cadeira e de informação relevante do fénix, tudo num só conveniente site!`,
    name: 'Miguel F.',
    course: 'Computer Science, 5th Year',
    avatarUrl: getAssetUrl('testimonials/miguel_fernandes.png') || undefined,
    url: 'https://www.linkedin.com/in/miguel-fernandes-60bbb8267/'
  },
  {
    testimonial:
      'Gostava de ter tido uma ferramenta como o Uni Feedback quando escolhi as minhas cadeiras. Saber a opinião de outros alunos sobre professores, projetos e dificuldade faz toda a diferença na preparação do ano.',
    name: 'Martim P.',
    course: 'Materials Eng., 5th Year',
    avatarUrl: getAssetUrl('testimonials/martim_parreirao.png') || undefined,
    url: 'https://www.linkedin.com/in/martim-parreirao/'
  },
  {
    testimonial:
      'Escolher cursos no primeiro semestre foi um verdadeiro caos. Não consegui entrar nos cursos que queria e acabei em cadeiras sobre as quais sabia quase nada para além do syllabus. O melhor que tínhamos era um Excel desorganizado a ser partilhado por grupos de WhatsApp. Com o Uni Feedback, finalmente podemos escolher os cursos sabendo ao que vamos e tomar decisões muito mais informadas.',
    name: 'Francisco P.',
    course: 'Management, 5th Year',
    avatarUrl: getAssetUrl('testimonials/francisco_palare.png') || undefined,
    url: 'https://www.linkedin.com/in/franciscofrancopalar%C3%A9/'
  },
  // {
  //   testimonial:
  //     'Uni Feedback helps students pick the courses that will actually be useful in real life',
  //   name: 'Emma P.',
  //   course: 'Civil Eng., 4th Year',
  //   avatarUrl: 'https://randomuser.me/api/portraits/women/67.jpg'
  // },
  {
    testimonial:
      'Já não preciso de ser crente na altura de escolher as cadeiras! Chega de rezar para que o professor seja bom ou que não tenha muita carga horária. Graças a outros que já a experienciaram, agora consigo saber no que me estou a meter.',
    name: 'João D.',
    course: 'Electrical and Computers Engineering, 5th Year',
    avatarUrl: getAssetUrl('testimonials/joao_duarte.png') || undefined
  }
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            What Students Say
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Hear from students who have used Uni Feedback to make better course
            decisions
          </p>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="break-inside-avoid mb-6">
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
