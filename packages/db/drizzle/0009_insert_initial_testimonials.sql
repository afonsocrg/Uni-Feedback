INSERT INTO "testimonials" ("testimonial", "name", "course", "avatar_url", "url", "is_active", "created_at")
VALUES
  (
    'I found this platform really useful and easy to use. It''s great to have a space where students can share honest feedback about their courses, all in one place, alongside relevant academic information. It makes choosing courses much clearer and more informed!!',
    'M. Inês Gonçalves',
    'Nova SBE',
    'testimonials/m_ines_goncalves.png',
    'https://www.linkedin.com/in/mariainescrgoncalves/',
    true,
    NOW() - INTERVAL '6 days'
  ),
  (
    'Uni-Feedback has helped me not only understand which courses are the best, but also gain insight into professors and course difficulty. With all the condensed information in one place, it became extremely easy to navigate through course details and ratings and confidently decide which option is best for me.',
    'Francisco Morão',
    'IST',
    NULL,
    NULL,
    true,
    NOW() - INTERVAL '5 days'
  ),
  (
    'Gostava de ter tido uma ferramenta como o Uni Feedback quando escolhi as minhas cadeiras. Saber a opinião de outros alunos sobre professores, projetos e dificuldade faz toda a diferença na preparação do ano.',
    'Martim Parreirão',
    'IST',
    'testimonials/martim_parreirao.png',
    'https://www.linkedin.com/in/martim-parreirao/',
    true,
    NOW() - INTERVAL '4 days'
  ),
  (
    'Escolher cursos no primeiro semestre foi um verdadeiro caos. Não consegui entrar nos cursos que queria e acabei em cadeiras sobre as quais sabia quase nada para além do syllabus. O melhor que tínhamos era um Excel desorganizado a ser partilhado por grupos de WhatsApp. Com o Uni Feedback, finalmente podemos escolher os cursos sabendo ao que vamos e tomar decisões muito mais informadas.',
    'Francisco Palaré',
    'Nova SBE',
    'testimonials/francisco_palare.png',
    'https://www.linkedin.com/in/franciscofrancopalar%C3%A9/',
    true,
    NOW() - INTERVAL '3 days'
  ),
  (
    'O Fénix é uma floresta de termos técnicos e promessas de matéria interessante, que metade das vezes não reflete a experiência real dos alunos a tirar as cadeiras.

O Uni Feedback fornece algo que não conseguimos encontrar em mais nenhum lado, uma coleção organizada das opiniões diretas dos alunos que tiveram a cadeira e de informação relevante do fénix, tudo num só conveniente site!',
    'Miguel Fernandes',
    'IST',
    'testimonials/miguel_fernandes.png',
    'https://www.linkedin.com/in/miguel-fernandes-60bbb8267/',
    true,
    NOW() - INTERVAL '2 days'
  ),
  (
    'Já não preciso de ser crente na altura de escolher as cadeiras! Chega de rezar para que o professor seja bom ou que não tenha muita carga horária. Graças a outros que já a experienciaram, agora consigo saber no que me estou a meter.',
    'João Duarte',
    'IST',
    'testimonials/joao_duarte.png',
    NULL,
    true,
    NOW() - INTERVAL '1 day'
  );
