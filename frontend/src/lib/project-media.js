export function projectCover(project) {
  const media = project.midias?.find((item) => item.assetId === project.capaId);
  return {
    alt: media?.alt || "",
    url:
      media?.previewUrl ||
      project.imagemUrl ||
      (project.imagemId ? `/api/media/${project.imagemId}` : ""),
    color:
      media?.corFundo || media?.corAutomatica || project.imagemBg || "#f4eee1",
  };
}
