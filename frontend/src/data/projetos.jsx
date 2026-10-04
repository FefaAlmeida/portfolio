// Legado: a página usa a API. Edite backend/seed/content.json para atualizar dados no desenvolvimento.
export const PROJETOS = [
  {
    "id": "luminar",
    "titulo": "Luminar",
    "subtitulo": "Plataforma de Gestão e Acessibilidade a Energia Solar",
    "pitch": "Plataforma centralizada que viabiliza a transição energética ao baratear o acesso a painéis solares e simplificar o monitoramento em tempo real do parque solar.",
    "imagemUrl": "/luminar_logo.jpeg",
    "imagemBg": "#FEFEFE",
    "tagEsquerda": "02 · Projeto Integrador",
    "tagDireita": "FINALIZADO",
    "bgCor": "bg-[#1f2937]",
    "textCor": "text-white",
    "tecnologias": [
      "Next.js",
      "Node.js",
      "SQL"
    ],
    "problema": "O altíssimo custo de aquisição inicial das placas solares impede o acesso à energia limpa, além da falta de visibilidade sobre a saúde dos equipamentos e a economia real.",
    "solucao": "Modelo de adesão acessível (pagamento inicial focado na instalação + parcelas contínuas para aquisição das placas) integrado a um painel inteligente de monitoramento.",
    "descricao": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Como Desenvolvedora Fullstack, atuei na construção de uma plataforma centralizada criada para impulsionar a transição energética. O sistema democratiza o acesso à energia solar por meio de um modelo financeiro acessível (focado no custo de instalação com parcelamento das placas) e integra um painel inteligente para monitoramento de todo o parque solar em tempo real"
            }
          ]
        }
      ]
    },
    "linkGithub": "https://github.com/FefaAlmeida/projetoIntegrador",
    "detalhes": {
      "periodo": "1º Semestre de 2025",
      "tipo": "Projeto Integrador SENAI",
      "modeloNegocio": "Acessibilidade Financeira: O cliente paga apenas a taxa de instalação inicial, enquanto o custo das placas é dividido em parcelas acessíveis ao longo do tempo.",
      "perfis": [
        {
          "categoria": "admin",
          "funcionalidades": [
            "Acompanhar o parque solar por painéis e tabelas.",
            "Consultar alertas de manutenção e diagnósticos das placas.",
            "Gerenciar clientes, usuários e permissões.",
            "Distribuir tarefas e acompanhar chamados.",
            "Atender clientes e trocar mensagens pela central de atendimento.",
            "Gerenciar pedidos de placas e controlar o estoque."
          ],
          "nome": "A equipe de gestão pode:"
        },
        {
          "categoria": "usuario",
          "funcionalidades": [
            "Acompanhar a geração de energia.",
            "Analisar a economia na conta de luz.",
            "Consultar indicadores de desempenho e eficiência.",
            "Receber notificações sobre manutenção e outros alertas.",
            "Abrir e acompanhar chamados de suporte."
          ],
          "nome": "Os clientes podem:"
        }
      ]
    }
  },
  {
    "id": "lector-hub",
    "titulo": "Lector Hub",
    "subtitulo": "Sistema Inteligente de Gestão de Bibliotecas",
    "pitch": "Plataforma para gestão de acervos bibliográficos, conectando leitores e bibliotecários com controle de empréstimos e comunidade interativa.",
    "imagemUrl": "/lector_hub_logo.jpeg",
    "imagemBg": "#460D14",
    "tagEsquerda": "01 · Projeto Acadêmico",
    "tagDireita": "FINALIZADO",
    "bgCor": "bg-[#18181b]",
    "textCor": "text-white",
    "tecnologias": [
      "Next.js",
      "Node.js",
      "SQL",
      "Chakra UI"
    ],
    "problema": "Controle manual e burocrático de acervos, dificuldades na aprovação de empréstimos e falta de engajamento dos leitores com a biblioteca.",
    "solucao": "Ecossistema digital com painel administrativo para controle do acervo e portal interativo para leitores reservarem e avaliarem obras.",
    "descricao": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Como Desenvolvedora Full-Stack, com foco em Back-end, e Gestora do Projeto, atuei na construção de uma "
            },
            {
              "type": "text",
              "text": "plataforma para gestão de acervos bibliográficos, conectando leitores e bibliotecários com controle de empréstimos e comunidade interativa."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Ecossistema digital com painel administrativo para controle do acervo e portal interativo para leitores reservarem e avaliarem obras."
            }
          ]
        }
      ]
    },
    "linkGithub": "https://github.com/FefaAlmeida/lectorHub",
    "detalhes": {
      "periodo": "2º Semestre de 2024",
      "tipo": "Projeto Acadêmico SENAI",
      "perfis": [
        {
          "categoria": "admin",
          "funcionalidades": [
            "Cadastrar e organizar livros e categorias.",
            "Aprovar ou recusar solicitações de empréstimo.",
            "Controlar devoluções, prazos e bloqueios.",
            "Gerenciar usuários e consultar o histórico da biblioteca."
          ],
          "nome": "Os bibliotecários podem:"
        },
        {
          "categoria": "usuario",
          "funcionalidades": [
            "Explorar o catálogo digital de livros.",
            "Solicitar empréstimos e reservar livros.",
            "Avaliar, dar notas e comentar sobre as obras.",
            "Consultar o histórico de leitura e receber recomendações personalizadas."
          ],
          "nome": "Os leitores podem:"
        }
      ]
    }
  },
  {
    "id": "wisen",
    "titulo": "Wisen",
    "subtitulo": "Plataforma Adaptativa de Conhecimento Baseada em Eventos",
    "pitch": "Plataforma que utiliza notícias reais como ponto de partida para ensinar conceitos complexos, adaptando o conteúdo ao nível individual de cada leitor.",
    "imagemUrl": "/wisen_logo.jpeg",
    "imagemBg": "#DAD6CF",
    "tagEsquerda": "03 · TCC SENAI",
    "tagDireita": "EM DESENVOLVIMENTO",
    "bgCor": "bg-[#0f172a]",
    "textCor": "text-white",
    "tecnologias": [
      "Next.js",
      "Node.js",
      "SQL",
      "Grafo de Conhecimento"
    ],
    "problema": "Notícias frequentemente utilizam termos e conceitos complexos sem explicá-los, gerando lacunas de compreensão para o leitor.",
    "solucao": "Mapeamento em Grafo de Conhecimento que cruza o histórico do usuário para entregar explicações sob medida, sem repetições redundantes.",
    "descricao": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Como Pesquisadora e Desenvolvedora Principal do meu TCC, atuei na construção de uma "
            },
            {
              "type": "text",
              "text": "plataforma que utiliza notícias reais como ponto de partida para ensinar conceitos complexos, adaptando o conteúdo ao nível individual de cada leitor."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Mapeamento em Grafo de Conhecimento que cruza o histórico do usuário para entregar explicações sob medida, sem repetições redundantes."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "A mesma notícia gera explicações diferentes para cada pessoa. Se o usuário já domina conceitos básicos, o WiseN foca diretamente nas suas lacunas de aprendizado."
            }
          ]
        }
      ]
    },
    "linkGithub": "https://github.com/FefaAlmeida/wisen",
    "detalhes": {
      "periodo": "2025 — TCC",
      "tipo": "Trabalho de Conclusão de Curso (SENAI)",
      "cicloAprendizado": "Notícias → Eventos → Conceitos → Histórico do Usuário → Conteúdo Personalizado → Aprendizado",
      "diferencial": "A mesma notícia gera explicações diferentes para cada pessoa. Se o usuário já domina conceitos básicos, o WiseN foca diretamente nas suas lacunas de aprendizado.",
      "aplicacoes": [
        "Educação Contextual: Ensino de conceitos a partir de acontecimentos reais",
        "Compreensão de Atualidades: Leitura facilitada de notícias complexas",
        "Aprendizado Adaptativo: Respeita o ritmo e conhecimento prévio individual",
        "Revisão Inteligente: Identifica conteúdos que precisam ser revisados",
        "Grafo de Conhecimento: Navegação interativa entre conceitos, entidades e eventos relacionados"
      ],
      "perfis": [
        {
          "categoria": "usuario",
          "funcionalidades": [
            "Aprender conceitos a partir de notícias e acontecimentos reais.",
            "Receber explicações adaptadas ao seu conhecimento prévio.",
            "Aprofundar os conceitos que ainda precisa compreender.",
            "Revisar conteúdos conforme suas lacunas de aprendizado.",
            "Explorar relações entre conceitos, entidades e eventos no Grafo de Conhecimento."
          ],
          "nome": "O leitor pode:"
        }
      ]
    }
  },
  {
    "id": "snack-point",
    "titulo": "Snack Point",
    "subtitulo": "Aplicativo Mobile para Gestão de Pedidos e Redução de Filas",
    "pitch": "Aplicativo Android intuitivo desenvolvido para eliminar filas na cantina do SENAI, otimizando a escolha, personalização e realização de pedidos.",
    "imagemUrl": "/snack_point.jpeg",
    "imagemBg": "#6F7B67",
    "tagEsquerda": "04 · Projeto Mobile",
    "tagDireita": "FINALIZADO",
    "bgCor": "bg-[#27272a]",
    "textCor": "text-white",
    "tecnologias": [
      "Java",
      "Android Studio",
      "XML",
      "SQLite"
    ],
    "problema": "Filas extensas e tempo de espera elevado no intervalo das aulas, causando gargalos na cantina do SENAI.",
    "solucao": "Aplicação mobile nativa para consulta rápida do cardápio, filtragem por categoria, personalização de itens e montagem de carrinho com persistência em SQLite.",
    "descricao": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Como Desenvolvedora Front-End e responsável pelas integrações Back-End, atuei no desenvolvimento de um "
            },
            {
              "type": "text",
              "text": "aplicativo Android intuitivo desenvolvido para eliminar filas na cantina do SENAI, otimizando a escolha, personalização e realização de pedidos."
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Aplicação mobile nativa para consulta rápida do cardápio, filtragem por categoria, personalização de itens e montagem de carrinho com persistência em SQLite."
            }
          ]
        }
      ]
    },
    "linkGithub": "https://github.com/FefaAlmeida/ProjetoCantina",
    "detalhes": {
      "periodo": "Agosto — Setembro de 2024",
      "tipo": "Projeto Mobile SENAI",
      "perfis": [
        {
          "categoria": "usuario",
          "funcionalidades": [
            "Consultar o cardápio digital completo da cantina.",
            "Filtrar produtos por categoria: salgados, doces, bebidas e pratos.",
            "Personalizar ingredientes e incluir observações no pedido.",
            "Gerenciar o carrinho com cálculo automático do valor total.",
            "Enviar o pedido para agilizar o atendimento no balcão.",
            "Manter os dados e o histórico do carrinho salvos localmente."
          ],
          "nome": "O cliente pode:"
        }
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
