export const PROJETOS = [
  {
    id: "luminar",
    titulo: "Luminar",
    subtitulo: "Plataforma de Gestão e Acessibilidade a Energia Solar",
    pitch: "Plataforma centralizada que viabiliza a transição energética ao baratear o acesso a painéis solares e simplificar o monitoramento em tempo real do parque solar.",
    imagemUrl: "/luminar_logo.jpeg",
    imagemBg: "#FEFEFE",
    tagEsquerda: "02 · Projeto Integrador",
    tagDireita: "FINALIZADO",
    bgCor: "bg-[#1f2937]",
    textCor: "text-white",
    tecnologias: ["Next.js", "Node.js", "SQL"],
    problema: "O altíssimo custo de aquisição inicial das placas solares impede o acesso à energia limpa, além da falta de visibilidade sobre a saúde dos equipamentos e a economia real.",
    solucao: "Modelo de adesão acessível (pagamento inicial focado na instalação + parcelas contínuas para aquisição das placas) integrado a um painel inteligente de monitoramento.",
    papel: "Desenvolvedora Full-Stack",
    linkGithub: "https://github.com/FefaAlmeida/projetoIntegrador",
    
    detalhes: {
      periodo: "1º Semestre de 2025",
      tipo: "Projeto Integrador SENAI",
      modeloNegocio: "Acessibilidade Financeira: O cliente paga apenas a taxa de instalação inicial, enquanto o custo das placas é dividido em parcelas acessíveis ao longo do tempo.",
      tiposUsuarios: ["Administrador (Gestão / Empresa)", "Usuário Comum (Cliente / Proprietário)"],
      funcionalidadesAdmin: [
        "Dashboards e tabelas analíticas para monitoramento completo do parque solar",
        "Alertas automáticos para necessidade de manutenção e diagnóstico de saúde das placas",
        "Gestão completa de usuários, controle de permissões e cadastro de clientes",
        "Gestão de técnicos, distribuição de tarefas e acompanhamento de chamados",
        "Central de atendimento para gestão de mensagens ('Fale Conosco')",
        "Gestão de pedidos de novas placas solares e estoque"
      ],
      funcionalidadesUsuario: [
        "Painel de desempenho com geração energética em tempo real",
        "Análise de rentabilidade e cálculo de quanto está economizando na conta de luz",
        "Indicadores visuais para checar se o sistema está sendo benéfico e eficiente",
        "Notificações de alertas importantes (ex: necessidade de manutenção)",
        "Abertura e acompanhamento de chamados de suporte"
      ]
    }
  },
  {
    id: "lector-hub",
    titulo: "Lector Hub",
    subtitulo: "Sistema Inteligente de Gestão de Bibliotecas",
    pitch: "Plataforma para gestão de acervos bibliográficos, conectando leitores e bibliotecários com controle de empréstimos e comunidade interativa.",
    imagemUrl: "/lector_hub_logo.jpeg",
    imagemBg: "#460D14",
    tagEsquerda: "01 · Projeto Acadêmico",
    tagDireita: "FINALIZADO",
    bgCor: "bg-[#18181b]",
    textCor: "text-white",
    tecnologias: ["Next.js", "Node.js", "SQL", "Chakra UI"],
    problema: "Controle manual e burocrático de acervos, dificuldades na aprovação de empréstimos e falta de engajamento dos leitores com a biblioteca.",
    solucao: "Ecossistema digital com painel administrativo para controle do acervo e portal interativo para leitores reservarem e avaliarem obras.",
    papel: "Desenvolvedora Full-Stack (Foco em Back-end) & Gestora do Projeto",
    linkGithub: "https://github.com/FefaAlmeida/lectorHub",

    detalhes: {
      periodo: "2º Semestre de 2024",
      tipo: "Projeto Acadêmico SENAI",
      tiposUsuarios: ["Administrador (Bibliotecário)", "Usuário Comum (Leitor)"],
      funcionalidadesAdmin: [
        "Cadastro, edição e organização do acervo de livros e categorias",
        "Gerenciamento de empréstimos (aceitar ou recusar solicitações)",
        "Controle de devoluções, prazos e aplicação de bloqueios a usuários",
        "Gestão completa de usuários e histórico da biblioteca"
      ],
      funcionalidadesUsuario: [
        "Exploração do catálogo digital completo de livros",
        "Solicitação de empréstimos e reservas diretamente pelo sistema",
        "Espaço interativo para avaliações, notas e comentários em cada obra",
        "Painel do leitor com histórico e recomendações personalizadas"
      ]
    }
  },
  {
    id: "wisen",
    titulo: "Wisen",
    subtitulo: "Plataforma Adaptativa de Conhecimento Baseada em Eventos",
    pitch: "Plataforma que utiliza notícias reais como ponto de partida para ensinar conceitos complexos, adaptando o conteúdo ao nível individual de cada leitor.",
    imagemUrl: "/wisen_logo.jpeg",
    imagemBg: "#DAD6CF",
    tagEsquerda: "03 · TCC SENAI",
    tagDireita: "EM DESENVOLVIMENTO",
    bgCor: "bg-[#0f172a]",
    textCor: "text-white",
    tecnologias: ["Next.js", "Node.js", "SQL", "Grafo de Conhecimento"],
    problema: "Notícias frequentemente utilizam termos e conceitos complexos sem explicá-los, gerando lacunas de compreensão para o leitor.",
    solucao: "Mapeamento em Grafo de Conhecimento que cruza o histórico do usuário para entregar explicações sob medida, sem repetições redundantes.",
    papel: "Pesquisadora & Desenvolvedora Principal (TCC)",
    linkGithub: "https://github.com/FefaAlmeida/wisen",

    detalhes: {
      periodo: "2025 — TCC",
      tipo: "Trabalho de Conclusão de Curso (SENAI)",
      cicloAprendizado: "Notícias → Eventos → Conceitos → Histórico do Usuário → Conteúdo Personalizado → Aprendizado",
      diferencial: "A mesma notícia gera explicações diferentes para cada pessoa. Se o usuário já domina conceitos básicos, o WiseN foca diretamente nas suas lacunas de aprendizado.",
      aplicacoes: [
        "Educação Contextual: Ensino de conceitos a partir de acontecimentos reais",
        "Compreensão de Atualidades: Leitura facilitada de notícias complexas",
        "Aprendizado Adaptativo: Respeita o ritmo e conhecimento prévio individual",
        "Revisão Inteligente: Identifica conteúdos que precisam ser revisados",
        "Grafo de Conhecimento: Navegação interativa entre conceitos, entidades e eventos relacionados"
      ]
    }
  },
  {
    id: "snack-point",
    titulo: "Snack Point",
    subtitulo: "Aplicativo Mobile para Gestão de Pedidos e Redução de Filas",
    pitch: "Aplicativo Android intuitivo desenvolvido para eliminar filas na cantina do SENAI, otimizando a escolha, personalização e realização de pedidos.",
    imagemUrl: "/snack_point.jpeg",
    imagemBg: "#6F7B67",
    tagEsquerda: "04 · Projeto Mobile",
    tagDireita: "FINALIZADO",
    bgCor: "bg-[#27272a]",
    textCor: "text-white",
    tecnologias: ["Java", "Android Studio", "XML", "SQLite"],
    problema: "Filas extensas e tempo de espera elevado no intervalo das aulas, causando gargalos na cantina do SENAI.",
    solucao: "Aplicação mobile nativa para consulta rápida do cardápio, filtragem por categoria, personalização de itens e montagem de carrinho com persistência em SQLite.",
    papel: "Desenvolvedora Front-End & Integrações Back-End",
    linkGithub: "https://github.com/FefaAlmeida/ProjetoCantina",

    detalhes: {
      periodo: "Agosto — Setembro de 2024",
      tipo: "Projeto Mobile SENAI",
      tiposUsuarios: ["Usuário Comum (Cliente / Aluno)"],
      funcionalidadesUsuario: [
        "Navegação e consulta do cardápio digital completo da cantina",
        "Filtro de produtos por categoria (Salgados, Doces, Bebidas e Pratos)",
        "Personalização de pedidos (adição/remoção de ingredientes e observações)",
        "Gerenciamento dinâmico do carrinho com cálculo automático do valor total",
        "Solicitação direta do pedido para otimização do atendimento no balcão",
        "Persistência local dos dados e histórico do carrinho via SQLite"
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
