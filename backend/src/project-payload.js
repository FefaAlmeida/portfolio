// Shared by the database migration and the compatibility input parser.
function hasText(value) {
  if (typeof value === "string") return Boolean(value.trim());
  return Boolean(value?.text || value?.content?.some(hasText));
}

export function migrateProjectDescription(payload) {
  if (!payload || typeof payload !== "object" || hasText(payload.descricao))
    return payload;
  const parts = [
    hasText(payload.pitch) ? payload.pitch : payload.problema,
    hasText(payload.solucao) ? payload.solucao : payload.detalhes?.modeloNegocio,
    payload.detalhes?.diferencial,
  ].filter(hasText);
  return {
    ...payload,
    descricao: {
      type: "doc",
      content: parts.length
        ? parts.flatMap((value) => typeof value === "string"
          ? [{ type: "paragraph", content: [{ type: "text", text: value }] }]
          : value.content)
        : [{ type: "paragraph" }],
    },
  };
}

function plainText(value) {
  if (typeof value === "string") return value;
  if (value?.type === "text") return value.text;
  return value?.content?.map(plainText).join(value.type === "paragraph" ? "" : " ") || "";
}

const normalizeRole = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function migrateProjectRole(payload) {
  if (!payload || typeof payload !== "object" || !Object.hasOwn(payload, "papel"))
    return payload;
  const { papel, ...rest } = payload;
  if (typeof papel !== "string" || !papel.trim()) return rest;
  const result = migrateProjectDescription(rest);
  const text = plainText(result.descricao);
  // Full-Stack and Fullstack are the same role; keep the author's existing copy.
  if (normalizeRole(text).includes(normalizeRole(papel))) return result;

  const luminarLegacy = "Plataforma centralizada que viabiliza a transição energética ao baratear o acesso a painéis solares e simplificar o monitoramento em tempo real do parque solar. Modelo de adesão acessível (pagamento inicial focado na instalação + parcelas contínuas para aquisição das placas) integrado a um painel inteligente de monitoramento.";
  const luminarDescription = "Como Desenvolvedora Fullstack, atuei na construção de uma plataforma centralizada criada para impulsionar a transição energética. O sistema democratiza o acesso à energia solar por meio de um modelo financeiro acessível (focado no custo de instalação com parcelamento das placas) e integra um painel inteligente para monitoramento de todo o parque solar em tempo real";
  if (papel === "Desenvolvedora Full-Stack" && text === luminarLegacy) {
    return { ...result, descricao: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: luminarDescription }] }] } };
  }

  const introductions = {
    "Desenvolvedora Full-Stack": "Como Desenvolvedora Full-Stack, atuei na construção de uma ",
    "Desenvolvedora Full-Stack (Foco em Back-end) & Gestora do Projeto": "Como Desenvolvedora Full-Stack, com foco em Back-end, e Gestora do Projeto, atuei na construção de uma ",
    "Pesquisadora & Desenvolvedora Principal (TCC)": "Como Pesquisadora e Desenvolvedora Principal do meu TCC, atuei na construção de uma ",
    "Desenvolvedora Front-End & Integrações Back-End": "Como Desenvolvedora Front-End e responsável pelas integrações Back-End, atuei no desenvolvimento de um ",
  };
  const description = structuredClone(result.descricao);
  const first = description.content?.[0];
  const firstText = first?.type === "paragraph" && first.content?.[0];
  if (introductions[papel] && firstText?.type === "text" && /^(Plataforma|Aplicativo)\b/.test(firstText.text)) {
    firstText.text = firstText.text[0].toLowerCase() + firstText.text.slice(1);
    first.content.unshift({ type: "text", text: introductions[papel] });
  } else {
    const introduction = { type: "text", text: `Como ${papel.trim().replaceAll(" & ", " e ")}, participei do desenvolvimento deste projeto. ` };
    if (first?.type === "paragraph") first.content = [introduction, ...(first.content || [])];
    else description.content = [{ type: "paragraph", content: [introduction] }, ...(description.content || [])];
  }
  return { ...result, descricao: description };
}

export function migrateProjectProfiles(payload) {
  if (!payload || typeof payload !== "object" || payload.detalhes?.perfis !== undefined)
    return payload;
  const {
    tiposUsuarios = [], funcionalidadesAdmin = [], funcionalidadesUsuario = [],
    ...details
  } = payload.detalhes || {};
  // Let the schema report invalid legacy input instead of throwing in preprocessing.
  if (!Array.isArray(tiposUsuarios) || tiposUsuarios.some((label) => typeof label !== "string") ||
    !Array.isArray(funcionalidadesAdmin) || !Array.isArray(funcionalidadesUsuario)) return payload;
  const names = new Map();
  const unmatched = [];
  for (const label of tiposUsuarios) {
    const match = label.match(/^(Administrador|Admin|Usuário(?: Comum)?|Usuario(?: Comum)?)(?:\s*\((.+)\))?$/i);
    const category = match && (/^admin/i.test(match[1]) ? "admin" : "usuario");
    if (!category || names.has(category)) unmatched.push(label);
    else names.set(category, match[2]?.trim() || "");
  }
  const perfis = [
    { categoria: "admin", funcionalidades: funcionalidadesAdmin },
    { categoria: "usuario", funcionalidades: funcionalidadesUsuario },
  ].filter((profile) => names.has(profile.categoria) || profile.funcionalidades.length)
    .map((profile) => ({ ...profile, nome: names.get(profile.categoria) || "" }));
  return {
    ...payload,
    detalhes: { ...details, perfis, ...(unmatched.length ? { tiposUsuarios: unmatched } : {}) },
  };
}

export function migrateProjectPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  payload = migrateProjectRole(payload);
  payload = migrateProjectProfiles(payload);
  if (payload.midias !== undefined) return payload;
  if (payload.imagens?.length || payload.videoUrl) {
    throw Object.assign(
      new Error(
        "O projeto contém links antigos de mídia. Importe esses arquivos antes de migrar; nenhum conteúdo foi descartado.",
      ),
      { status: 400 },
    );
  }
  const { imagemId, imagemBg, imagens, videoUrl, ...rest } = payload;
  return {
    ...rest,
    midias: imagemId ? [{ assetId: imagemId, corFundo: imagemBg || null }] : [],
    capaId: imagemId || null,
  };
}
