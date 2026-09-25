export const PROJETOS = [
  {
    id: "luminar",
    titulo: "Luminar",
    subtitulo: "Plataforma de Gestão de Energia Solar",
    pitch: "Uma plataforma centralizada que acelera a transição de indústrias e residências para energias renováveis, simplificando o monitoramento e a gestão de painéis solares.",
    imagemUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200",
    tagEsquerda: "02 · Projeto Integrador",
    tagDireita: "FINALIZADO",
    bgCor: "bg-[#1f2937]",
    textCor: "text-white",
    tecnologias: ["Next.js", "Node.js", "SQL"],
    problema: "Indústrias e consumidores têm dificuldade em acompanhar o retorno sobre o investimento (ROI), a saúde operacional dos painéis solares e a eficiência energética real.",
    solucao: "Dashboard em tempo real com métricas de consumo, geração energética, gestão técnica de chamados e análise de economia financeira.",
    papel: "Desenvolvedor Front-end Principal",
    linkGithub: "https://github.com/seu-usuario/luminar",
    linkDeploy: "https://luminar-app.com",
    
    // INFORMAÇÕES DETALHADAS PARA O CARD DE "SAIBA MAIS" (MODAL/DETALHES)
    detalhes: {
      periodo: "1º Semestre de 2025",
      tipo: "Projeto Integrador SENAI",
      funcionalidadesAdmin: [
        "Dashboards e tabelas analíticas para gestão do parque solar",
        "Sistema de alertas para manutenção preventiva e preditiva",
        "Gestão completa de usuários e permissões do sistema",
        "Gestão de técnicos, atribuição e acompanhamento de chamados",
        "Módulo de gestão de mensagens e 'Fale Conosco'",
        "Monitoramento da saúde e ciclo de vida das placas solares",
        "Acompanhamento de pedidos e solicitações de novas placas"
      ],
      funcionalidadesUsuario: [
        "Visualização do desempenho e geração em tempo real das suas placas",
        "Métricas financeiras de economia e análise se o sistema está sendo benéfico",
        "Central de alertas e avisos sobre necessidade de manutenção ou falhas",
        "Histórico de consumo e relatórios de eficiência energética"
      ]
    }
  },
  {
    id: "lector-hub",
    titulo: "Lector Hub",
    subtitulo: "Sistema Inteligente de Gestão de Bibliotecas",
    pitch: "Plataforma completa para gestão de acervos bibliográficos, conectando leitores e bibliotecários com controle de empréstimos e comunidade interativa.",
    imagemUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200",
    tagEsquerda: "01 · Projeto Acadêmico",
    tagDireita: "FINALIZADO",
    bgCor: "bg-[#18181b]",
    textCor: "text-white",
    tecnologias: ["Next.js", "Node.js", "SQL", "Chakra UI"],
    problema: "Gargalos no controle manual de acervos, dificuldade de engajamento de leitores e processos burocráticos para solicitação e renovação de empréstimos.",
    solucao: "Ecossistema digital com painel administrativo para controle total do acervo e portal interativo para os leitores descobrirem e reservarem livros.",
    papel: "Desenvolvedor Full Stack",
    linkGithub: "https://github.com/seu-usuario/lector-hub",
    linkDeploy: "https://lectorhub-demo.com",

    // INFORMAÇÕES DETALHADAS PARA O CARD DE "SAIBA MAIS" (MODAL/DETALHES)
    detalhes: {
      periodo: "2º Semestre de 2024",
      tipo: "Projeto Acadêmico SENAI",
      funcionalidadesAdmin: [
        "Administração e cadastro completo do acervo de livros e categorias",
        "Gerenciamento e aprovação/recusa de solicitações de empréstimo",
        "Controle de prazos de devolução e histórico de renovações",
        "Gestão de usuários (bloqueio, liberação e controle de acessos)"
      ],
      funcionalidadesUsuario: [
        "Exploração do catálogo completo de livros disponíveis",
        "Solicitação online de empréstimos e reservas de títulos",
        "Avaliação, notas e comentários comunitários sobre as obras",
        "Painel do leitor para acompanhamento de empréstimos ativos",
        "Algoritmo de recomendação com base nas preferências de leitura"
      ]
    }
  },
  {
    id: "tcc-plataforma-adaptativa",
    titulo: "Plataforma Adaptativa de Conhecimento",
    subtitulo: "Aprendizagem Personalizada Baseada em Eventos Reais",
    pitch: "Plataforma de aprendizagem que utiliza notícias do mundo real como ponto de partida para ensinar conceitos complexos, adaptando o conteúdo ao repertório individual do usuário.",
    imagemUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200",
    tagEsquerda: "03 · TCC SENAI",
    tagDireita: "EM DESENVOLVIMENTO",
    bgCor: "bg-[#0f172a]",
    textCor: "text-white",
    tecnologias: ["Next.js", "Node.js", "SQL", "Grafo de Conhecimento"],
    problema: "Notícias atuais frequentemente exigem pré-requisitos não explicados (ex: COPOM, Selic, Juros), dificultando o entendimento do leitor e criando lacunas de conhecimento.",
    solucao: "Mapeamento automático de conceitos via Grafo de Conhecimento para cruzar o nível do usuário e entregar explicações personalizadas sem repetições redundantes.",
    papel: "Pesquisador & Desenvolvedor Principal (TCC)",
    linkGithub: "https://github.com/seu-usuario/tcc-adaptativo",
    linkDeploy: "",

    // INFORMAÇÕES DETALHADAS PARA O CARD DE "SAIBA MAIS" (MODAL/DETALHES)
    detalhes: {
      periodo: "2025 — TCC",
      tipo: "Trabalho de Conclusão de Curso (SENAI)",
      cicloAprendizado: "Notícias → Eventos → Conceitos → Histórico do Usuário → Conteúdo Personalizado → Aprendizado",
      diferencial: "A mesma notícia gera explicações diferentes para cada pessoa. Se o usuário já domina conceitos básicos (ex: inflação e juros), o sistema foca diretamente nas lacunas de conhecimento ainda não aprendidas.",
      aplicacoes: [
        "Educação Contextual: Ensino de conceitos a partir de acontecimentos do mundo real",
        "Compreensão de Atualidades: Auxílio na leitura de notícias complexas",
        "Aprendizado Adaptativo: Respeita o ritmo e histórico prévio individual",
        "Mapeamento de Lacunas: Identificação e recomendação ativa de revisões necessárias",
        "Grafo de Conhecimento: Navegação interativa entre conceitos, entidades e eventos relacionados"
      ]
    }
  }
];

export const premios = [
  {
    id: "01",
    tag: "01 · REDAÇÃO",
    ano: "2025",
    titulo: "Desempenho Letrus",
    descricao: "Certificado de reconhecimento pelo excelente desempenho nas produções textuais da plataforma Letrus em 2025."
  },
  {
    id: "02",
    tag: "02 · REDAÇÃO",
    ano: "2024",
    titulo: "Desempenho Letrus",
    descricao: "Certificado de reconhecimento pelo desempenho de destaque nas redações da plataforma Letrus em 2024."
  },
  {
    id: "03",
    tag: "03 · REDAÇÃO",
    ano: "2023",
    titulo: "Destaque em Redação",
    descricao: "Certificado de destaque pela participação ativa e evolução técnica em escrita e redação em 2023."
  },
  {
    id: "04",
    tag: "04 · ACADÊMICO",
    ano: "2025",
    titulo: "Destaque Avalia SESI",
    descricao: "Reconhecimento como estudante destaque pelo alto desempenho nas avaliações institucionais do Avalia SESI 2025."
  },
  {
    id: "05",
    tag: "05 · OLIMPÍADA",
    ano: "2024",
    titulo: "Medalha de Bronze OLITEF",
    descricao: "Premiação com medalha de bronze na Olimpíada Brasileira de Educação Financeira (OLITEF) em 2024."
  },
  {
    id: "06",
    tag: "06 · CULTURA",
    ano: "2025",
    titulo: "Leitor Destaque",
    descricao: "Certificado de leitor destaque concedido pela Biblioteca SESI 222 em reconhecimento ao engajamento com a leitura em 2025."
  }
]

