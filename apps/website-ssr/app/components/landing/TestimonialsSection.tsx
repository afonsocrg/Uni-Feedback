import { getAssetUrl } from '~/utils'
import { TestimonialCard } from './TestimonialCard'

interface Testimonial {
  rating: number
  testimonial: string
  name: string
  course: string
  avatarUrl?: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    rating: 5,
    testimonial: `O Fénix é uma floresta de termos técnicos e promessas de matéria interessante, que metade das vezes não reflete a experiência real dos alunos a tirar as cadeiras.

O Uni Feedback fornece algo que não conseguimos encontrar em mais nenhum lado, uma coleção organizada das opiniões diretas dos alunos que tiveram a cadeira e de informação relevante do fénix, tudo num só conveniente site!`,
    name: 'Miguel F.',
    course: 'Computer Science, 5th Year',
    avatarUrl: getAssetUrl('testimonials/miguel_fernandes.png') || undefined
  },
  {
    rating: 5,
    testimonial:
      'Já não preciso de ser crente na altura de escolher as cadeiras! Chega de rezar para que o professor seja bom ou que não tenha muita carga horária. Graças a outros que já a experienciaram, agora consigo saber no que me estou a meter.',
    name: 'João D.',
    course: 'Electrical and Computers Engineering, 5th Year',
    avatarUrl: getAssetUrl('testimonials/joao_duarte.png') || undefined
  },
  {
    rating: 4,
    testimonial:
      'Uni Feedback helps students pick the courses that will actually be useful in real life',
    name: 'Emma P.',
    course: 'Civil Eng., 4th Year',
    avatarUrl: 'https://randomuser.me/api/portraits/women/67.jpg'
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
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
