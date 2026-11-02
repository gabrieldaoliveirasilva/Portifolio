export interface ProfileExperience {
  period: string;
  role: string;
  companyContext: string;
  description: string;
  achievements: string[];
  skillsUsed: string[];
}

export interface ProfileEducation {
  institution: string;
  degree: string;
  period: string;
  details?: string;
}

export interface ProfileCertification {
  title: string;
  issuer: string;
  year: string;
}

export interface SkillCategory {
  title: string;
  icon: string;
  description: string;
  skills: { name: string; level: number; highlight?: boolean }[];
}

export interface ProjectCaseCard {
  slug: string;
  title: string;
  badge: string;
  category: string;
  summary: string;
  metrics: { label: string; value: string }[];
  status: "ready" | "coming_soon";
  tags: string[];
}

export const profileData = {
  name: "Gabriel Silva",
  headline: "Analista de Dados Pleno | Business Intelligence & Supply Chain Analytics",
  subheadline: "Mais de 3 anos de experiência em análise de dados aplicada a logística e supply chain, com sólida atuação em operações de e-commerce como Shopee e Mercado Livre. Foco na transformação de dados operacionais em indicadores acionáveis, planejamento de capacidade (capacity planning) e data storytelling.",
  location: "Contagem, Minas Gerais, Brasil",
  email: "gabrieldaoliveirasilva@gmail.com",
  phone: "(31) 97358-9187",
  social: {
    linkedin: "https://www.linkedin.com/in/silvagabriel97",
    github: "https://github.com/gabrieldaoliveirasilva",
  },
  bio: `Analista de Dados com mais de 3 anos de sólida trajetória em análise de dados operacionais aplicada à logística e cadeia de suprimentos, com passagens por grandes centros de distribuição e operações de alto volume de e-commerce como Shopee, Mercado Livre e Arado.

Graduado em Gestão da Cadeia de Suprimentos e Logística pela Faculdade Estácio e com vivência prática no chão de fábrica e em grandes hubs operacionais, uno conhecimento aprofundado do negócio às ferramentas analíticas modernas — com a premissa de entender o problema real da operação antes de abrir a query.

Principais frentes de atuação e entrega de valor:
• Desenvolvimento de dashboards e relatórios gerenciais executivos em Power BI, Tableau e Google Looker Studio.
• Consultas complexas, extração, tratamento e estratificação de dados em SQL (Google BigQuery e Microsoft SQL Server).
• Criação e monitoramento contínuo de KPIs estratégicos de desempenho: produtividade operacional, cumprimento de SLA, absenteísmo, custo logístico e nível de serviço.
• Planejamento de capacidade (capacity planning) por turno e por dia, correlacionando volumetria prevista, produtividade histórica e absenteísmo.
• Análise estruturada de causa raiz e indicadores para projetos de melhoria contínua de processos.
• Data storytelling: tradução de análises analíticas em direcionamentos claros e acionáveis para a operação e lideranças executivas.`,

  experiences: [
    {
      period: "Mai/2026 — Presente",
      role: "Analista de Dados Logístico Pleno",
      companyContext: "Shopee • Centro de Distribuição & Logística (Contagem, MG • Híbrido)",
      description: "Análise contínua de dados operacionais e modelagem analítica com SQL voltada para identificação de gargalos, acompanhamento de capacidade e otimização contínua de processos logísticos de alto volume.",
      achievements: [
        "Análise contínua de dados operacionais com SQL para mapear gargalos e oportunidades de otimização de fluxos logísticos.",
        "Desenvolvimento e acompanhamento de matrizes de KPIs e indicadores operacionais de desempenho (Produtividade, SLA e Volume).",
        "Construção de dashboards e relatórios gerenciais para acompanhamento em tempo real das rotinas da operação.",
        "Suporte direto ao planejamento logístico com análises preditivas de capacidade e projeções de tendências de fluxo.",
        "Apresentação executiva de resultados, diagnósticos e recomendações estratégicas para lideranças e áreas parceiras."
      ],
      skillsUsed: ["SQL", "Google BigQuery", "Business Intelligence", "KPIs & Dashboards", "Capacity Planning", "Supply Chain Analytics"]
    },
    {
      period: "Jan/2025 — Mai/2026 • 1 ano e 5 meses",
      role: "Analista de Dados (Logística)",
      companyContext: "Mercado Livre • Logística Reversa & E-commerce (Contagem, MG • Presencial)",
      description: "Desenvolvimento de soluções de Business Intelligence, extração de dados em larga escala no BigQuery e planejamento de capacidade operacional da malha de logística reversa.",
      achievements: [
        "Desenvolvimento de dashboards executivos em Google BigQuery, Looker Studio e Tableau para acompanhamento contínuo dos indicadores da operação.",
        "Escrita e otimização de consultas SQL complexas no BigQuery para extração, higienização, tratamento e estratificação de grandes bases de dados.",
        "Planejamento de capacidade (capacity planning) da logística reversa por turno e por dia, cruzando volume previsto, produtividade histórica e absenteísmo.",
        "Antecipação proativa de riscos de saturação e identificação de otimizações de plano de carga, assegurando o cumprimento de metas e SLAs.",
        "Criação e monitoramento de indicadores para projetos de melhoria contínua e análise aprofundada de causa raiz.",
        "Comunicação técnica e gerencial de resultados para a operação e áreas parceiras utilizando data storytelling."
      ],
      skillsUsed: ["SQL", "Google BigQuery", "Looker Studio", "Tableau", "Capacity Planning", "Logística Reversa", "Melhoria Contínua"]
    },
    {
      period: "Out/2023 — Dez/2024 • 1 ano e 3 meses",
      role: "Analista de Dados (Operações Logísticas)",
      companyContext: "Arado • AgTech & Distribuição Logística (Belo Horizonte, MG • Presencial)",
      description: "Criação de indicadores de desempenho, roteirização estratégica de pedidos, implantação de WMS e gestão de estoque.",
      achievements: [
        "Criação e acompanhamento sistemático de KPIs operacionais para monitoramento de resultados e direcionamento de melhorias de processo.",
        "Roteirização diária de pedidos na plataforma RoutEasy, otimizando rotas de distribuição com redução de custo logístico e aumento no nível de serviço.",
        "Liderança técnica na implantação e treinamento da equipe operacional no WMS Ninjacart e novos fluxos de armazenagem.",
        "Gestão de estoque com controle rigoroso de giro, metodologia FIFO e redução de perdas operacionais.",
        "Apoio ao faturamento, emissão de notas fiscais e liderança do time operacional na ausência da gestão."
      ],
      skillsUsed: ["KPIs Operacionais", "Roteirização (RoutEasy)", "WMS Ninjacart", "Gestão de Estoque (FIFO)", "Melhoria Contínua", "Liderança"]
    },
    {
      period: "Ago/2022 — Dez/2022 • 5 meses",
      role: "Pesquisador Associado",
      companyContext: "IBGE • Censo Demográfico 2022 (Contagem, MG • Presencial)",
      description: "Coleta de dados primários porta a porta para o Censo Demográfico 2022, seguindo rigorosa metodologia estatística e padrões de qualidade de dados do IBGE.",
      achievements: [
        "Aplicação de questionários estatísticos e validação presencial da consistência dos dados coletados.",
        "Cumprimento integral dos protocolos de conformidade, cobertura geográfica e governança de dados do instituto."
      ],
      skillsUsed: ["Coleta de Dados Primários", "Qualidade de Dados", "Metodologia Estatística", "Censo 2022"]
    },
    {
      period: "Mar/2022 — Jun/2022 • 4 meses",
      role: "Analista de Dados (Operação Industrial)",
      companyContext: "Grupo Arcor • Unidade Industrial (Contagem, MG • Presencial)",
      description: "Atuação na operação de linha de produção, acompanhamento do fluxo produtivo, movimentação de caixas e paletes e controle de volumes industriais.",
      achievements: [
        "Controle visual e físico de volumes movimentados na esteira e abastecimento de paletes.",
        "Vivência prática nos princípios de fluxo contínuo e balanceamento de linhas de fabricação."
      ],
      skillsUsed: ["Operação Industrial", "Fluxo Produtivo", "Movimentação de Materiais", "Controle de Volumes"]
    },
    {
      period: "Fev/2021 — Ago/2021 • 7 meses",
      role: "Analista de Dados (Operações Logísticas)",
      companyContext: "Drogaria Araujo S/A • Centro de Distribuição (Contagem, MG)",
      description: "Elaboração de relatórios diários e acompanhamento de indicadores da cadeia logística de e-commerce e rotinas administrativas de centro de distribuição.",
      achievements: [
        "Compilação de relatórios de expedição e atendimento de pedidos de comércio eletrônico.",
        "Suporte às rotinas de conferência e despacho de mercadorias."
      ],
      skillsUsed: ["Relatórios Operacionais", "Acompanhamento de Indicadores", "Logística E-commerce"]
    },
    {
      period: "Jun/2020 — Jan/2021 • 8 meses",
      role: "Operações em Centro de Distribuição",
      companyContext: "Luandre RH / Operações Logísticas (Contagem, MG)",
      description: "Separação, expedição e conferência de mercadorias em grande centro de distribuição — base prática fundamental para as análises de produtividade e capacidade aplicadas hoje.",
      achievements: [
        "Execução de rotinas de separação (picking), conferência e consolidação de cargas.",
        "Compreensão profunda das dores operacionais e tempos de movimentação física no armazém."
      ],
      skillsUsed: ["Centro de Distribuição", "Expedição", "Conferência de Mercadorias", "Produtividade de Separação"]
    },
    {
      period: "Fev/2017 — Jul/2017 • 6 meses",
      role: "Auditoria de Inventários & Acurácia de Estoque",
      companyContext: "RGIS Brasil • Inventários Físicos (Belo Horizonte, MG)",
      description: "Contagem, conferência e registro de mercadorias em inventários de grandes redes varejistas, garantindo a acurácia dos dados de estoque e apoiando a identificação de divergências.",
      achievements: [
        "Auditoria física de itens e batimento com relatórios de sistema.",
        "Identificação de divergências de saldo e apoio na conciliação contábil de estoques."
      ],
      skillsUsed: ["Inventário Físico", "Acurácia de Estoque", "Conferência de Dados", "Controle de Perdas"]
    }
  ] as ProfileExperience[],

  education: [
    {
      institution: "Faculdade Estácio",
      degree: "Curso Superior de Tecnologia (CST), Gestão da Cadeia de Suprimentos e Logística",
      period: "2019 — 2021",
      details: "Formação superior com foco em gestão de operações, armazenagem, transporte, custos logísticos e fluxo de suprimentos."
    }
  ] as ProfileEducation[],

  certifications: [
    { title: "Formação Google Looker Studio", issuer: "Alura", year: "2025" },
    { title: "Microsoft SQL Server 2022: Consultas Avançadas", issuer: "Alura", year: "2024" },
    { title: "Power BI Desktop: Construindo Dashboards", issuer: "Alura", year: "2024" },
    { title: "Oratória para Líderes & Comunicação Assertiva", issuer: "Alura", year: "2024" }
  ] as ProfileCertification[],

  skills: [
    {
      title: "SQL & Bancos de Dados (BigQuery & SQL Server)",
      icon: "database",
      description: "Consultas analíticas complexas, CTEs, particionamento e extração em larga escala.",
      skills: [
        { name: "Google BigQuery (Consultas Analíticas & Particionamento)", level: 95, highlight: true },
        { name: "Microsoft SQL Server 2022 (Consultas Avançadas & CTEs)", level: 95, highlight: true },
        { name: "Extração, Higienização e Estratificação de Dados", level: 95, highlight: true },
        { name: "Modelagem de Dados Operacionais & Otimização", level: 90 },
        { name: "Análise de Causa Raiz através de Dados", level: 90 }
      ]
    },
    {
      title: "Business Intelligence & Data Visualization",
      icon: "chart",
      description: "Desenvolvimento de dashboards e relatórios gerenciais executivos para suporte à tomada de decisão.",
      skills: [
        { name: "Power BI (Modelagem de Dados & Dashboards)", level: 95, highlight: true },
        { name: "Google Looker Studio (Dashboards em Tempo Real)", level: 95, highlight: true },
        { name: "Tableau (Visualização Analítica de Dados)", level: 90, highlight: true },
        { name: "Data Storytelling & Apresentação para Stakeholders", level: 95, highlight: true },
        { name: "Relatórios Gerenciais e Diagnósticos Executivos", level: 90 }
      ]
    },
    {
      title: "Supply Chain Analytics & Capacity Planning",
      icon: "truck",
      description: "Planejamento de capacidade, controle de SLAs e governança de indicadores logísticos.",
      skills: [
        { name: "Capacity Planning (Planejamento de Capacidade Turno/Dia)", level: 95, highlight: true },
        { name: "Monitoramento de KPIs (Produtividade, SLA, Volume, Custo)", level: 95, highlight: true },
        { name: "Logística Reversa & Rastreabilidade de Pedidos", level: 90, highlight: true },
        { name: "Melhoria Contínua & Lean Logistics", level: 90 },
        { name: "Controle de Absenteísmo e Produtividade", level: 90 }
      ]
    },
    {
      title: "Sistemas Logísticos, WMS & Roteirização",
      icon: "cpu",
      description: "Operação prática de armazéns, roteirização estratégica de pedidos e governança de estoque.",
      skills: [
        { name: "WMS Ninjacart (Implantação, Treinamento & Gestão)", level: 95, highlight: true },
        { name: "RoutEasy (Roteirização Diária & Otimização de Custos)", level: 95, highlight: true },
        { name: "Gestão de Estoque & Metodologia FIFO", level: 90, highlight: true },
        { name: "Google Apps Script & Automações de Planilhas", level: 90 },
        { name: "Rotinas de Expedição, Separação & Conferência", level: 95 }
      ]
    }
  ] as SkillCategory[],

  cases: [
    {
      slug: "gerencial",
      title: "Painel Gerencial: Produtividade de Esteiras, HC e Inbound Live",
      badge: "Operação Live",
      category: "Fullstack • Operations • Real-time",
      summary: "Plataforma operacional de alta velocidade com visão de esteiras, pátio, descarregamento, janelas de CPT e fechamento histórico de packing.",
      metrics: [
        { label: "Capacidade Diária", value: "180k pacotes" },
        { label: "Tempo de Resposta", value: "<150ms" },
        { label: "SLA CPT", value: "96.4%" }
      ],
      status: "ready",
      tags: ["Next.js 14", "TypeScript", "Operação 24/7", "Real-time"]
    },
    {
      slug: "gerot",
      title: "GEROT: Matriz Executiva de Indicadores & Governança",
      badge: "KPIs & Gestão",
      category: "Analytics • Governance • SLA",
      summary: "Matriz executiva de controle de metas, sinalização de farol (Cost, Quality, Speed) e monitoramento de FIFO, Misrouting e Lead Time.",
      metrics: [
        { label: "Indicadores Monitorados", value: "12 KPIs" },
        { label: "Farol Automático", value: "100%" }
      ],
      status: "ready",
      tags: ["KPIs", "SLA", "Governança Operacional"]
    }
  ] as ProjectCaseCard[]
};
