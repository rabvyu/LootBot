// Serviço de Favoritos e Builds
import {
  FavoriteList,
  Build,
  BuildTemplate,
  SharedBuild,
  IFavoriteList,
  IFavoriteItem,
  IBuild,
  IBuildTemplate,
  ISharedBuild,
  FavoriteType,
} from '../database/models/Favorites';
import { v4 as uuidv4 } from 'uuid';

// ============= FAVORITOS =============

// Obter ou criar lista de favoritos
export async function getFavoriteList(discordId: string): Promise<IFavoriteList> {
  let list = await FavoriteList.findOne({ odiscordId: discordId });

  if (!list) {
    list = new FavoriteList({
      odiscordId: discordId,
      favorites: [],
      maxFavorites: 50,
    });
    await list.save();
  }

  return list;
}

// Adicionar favorito
export async function addFavorite(
  discordId: string,
  type: FavoriteType,
  targetId: string,
  targetName: string,
  options: { note?: string; tags?: string[] } = {}
): Promise<{ success: boolean; favorite?: IFavoriteItem; message: string }> {
  const list = await getFavoriteList(discordId);

  // Verificar limite
  if (list.favorites.length >= list.maxFavorites) {
    return { success: false, message: `Limite de ${list.maxFavorites} favoritos atingido.` };
  }

  // Verificar duplicata
  const exists = list.favorites.some(f => f.type === type && f.targetId === targetId);
  if (exists) {
    return { success: false, message: 'Este item já está nos favoritos.' };
  }

  const favorite: IFavoriteItem = {
    favoriteId: uuidv4(),
    type,
    targetId,
    targetName,
    note: options.note,
    tags: options.tags || [],
    addedAt: new Date(),
  };

  list.favorites.push(favorite);
  await list.save();

  return { success: true, favorite, message: `"${targetName}" adicionado aos favoritos!` };
}

// Remover favorito
export async function removeFavorite(
  discordId: string,
  favoriteId: string
): Promise<{ success: boolean; message: string }> {
  const list = await getFavoriteList(discordId);

  const index = list.favorites.findIndex(f => f.favoriteId === favoriteId);
  if (index === -1) {
    return { success: false, message: 'Favorito não encontrado.' };
  }

  const removed = list.favorites.splice(index, 1)[0];
  await list.save();

  return { success: true, message: `"${removed.targetName}" removido dos favoritos.` };
}

// Atualizar nota de favorito
export async function updateFavoriteNote(
  discordId: string,
  favoriteId: string,
  note: string
): Promise<{ success: boolean; message: string }> {
  const result = await FavoriteList.updateOne(
    { odiscordId: discordId, 'favorites.favoriteId': favoriteId },
    { $set: { 'favorites.$.note': note } }
  );

  if (result.modifiedCount === 0) {
    return { success: false, message: 'Favorito não encontrado.' };
  }

  return { success: true, message: 'Nota atualizada.' };
}

// Adicionar tag a favorito
export async function addTagToFavorite(
  discordId: string,
  favoriteId: string,
  tag: string
): Promise<{ success: boolean; message: string }> {
  const result = await FavoriteList.updateOne(
    { odiscordId: discordId, 'favorites.favoriteId': favoriteId },
    { $addToSet: { 'favorites.$.tags': tag } }
  );

  if (result.modifiedCount === 0) {
    return { success: false, message: 'Favorito não encontrado.' };
  }

  return { success: true, message: `Tag "${tag}" adicionada.` };
}

// Obter favoritos por tipo
export async function getFavoritesByType(
  discordId: string,
  type: FavoriteType
): Promise<IFavoriteItem[]> {
  const list = await getFavoriteList(discordId);
  return list.favorites.filter(f => f.type === type);
}

// Obter favoritos por tag
export async function getFavoritesByTag(
  discordId: string,
  tag: string
): Promise<IFavoriteItem[]> {
  const list = await getFavoriteList(discordId);
  return list.favorites.filter(f => f.tags?.includes(tag));
}

// ============= BUILDS =============

// Criar build
export async function createBuild(
  discordId: string,
  name: string,
  data: Partial<IBuild> = {}
): Promise<{ success: boolean; build?: IBuild; message: string }> {
  // Verificar limite de builds (máximo 20 por usuário)
  const buildCount = await Build.countDocuments({ odiscordId: discordId });
  if (buildCount >= 20) {
    return { success: false, message: 'Limite de 20 builds atingido.' };
  }

  // Verificar nome duplicado
  const existing = await Build.findOne({ odiscordId: discordId, name });
  if (existing) {
    return { success: false, message: 'Já existe uma build com esse nome.' };
  }

  const build = new Build({
    buildId: uuidv4(),
    odiscordId: discordId,
    name,
    isPublic: false,
    isFavorite: false,
    equipment: data.equipment || {},
    skills: data.skills || [],
    consumables: data.consumables || [],
    attributeDistribution: data.attributeDistribution,
    talents: data.talents || [],
    class: data.class,
    level: data.level,
    tags: data.tags || [],
    likes: 0,
    views: 0,
    uses: 0,
    ...data,
  });

  await build.save();

  return { success: true, build: build.toObject(), message: `Build "${name}" criada!` };
}

// Obter builds do usuário
export async function getUserBuilds(discordId: string): Promise<any[]> {
  return await Build.find({ odiscordId: discordId })
    .sort({ isFavorite: -1, updatedAt: -1 })
    .lean();
}

// Obter build por ID
export async function getBuildById(buildId: string): Promise<IBuild | null> {
  const build = await Build.findOne({ buildId });
  if (build) {
    build.views++;
    await build.save();
  }
  return build?.toObject() || null;
}

// Atualizar build
export async function updateBuild(
  buildId: string,
  discordId: string,
  updates: Partial<IBuild>
): Promise<{ success: boolean; build?: IBuild; message: string }> {
  // Verificar nome duplicado se estiver alterando
  if (updates.name) {
    const existing = await Build.findOne({
      odiscordId: discordId,
      name: updates.name,
      buildId: { $ne: buildId },
    });
    if (existing) {
      return { success: false, message: 'Já existe uma build com esse nome.' };
    }
  }

  const build = await Build.findOneAndUpdate(
    { buildId, odiscordId: discordId },
    { $set: updates },
    { new: true }
  );

  if (!build) {
    return { success: false, message: 'Build não encontrada.' };
  }

  return { success: true, build: build.toObject(), message: 'Build atualizada!' };
}

// Deletar build
export async function deleteBuild(
  buildId: string,
  discordId: string
): Promise<{ success: boolean; message: string }> {
  const result = await Build.deleteOne({ buildId, odiscordId: discordId });

  if (result.deletedCount === 0) {
    return { success: false, message: 'Build não encontrada.' };
  }

  // Remover compartilhamentos
  await SharedBuild.deleteMany({ buildId });

  return { success: true, message: 'Build deletada.' };
}

// Duplicar build
export async function duplicateBuild(
  buildId: string,
  discordId: string,
  newName: string
): Promise<{ success: boolean; build?: IBuild; message: string }> {
  const original = await Build.findOne({ buildId });
  if (!original) {
    return { success: false, message: 'Build original não encontrada.' };
  }

  // Verificar se tem permissão (é dono ou é pública)
  if (original.odiscordId !== discordId && !original.isPublic) {
    return { success: false, message: 'Sem permissão para duplicar esta build.' };
  }

  const buildData = original.toObject();
  delete (buildData as any)._id;
  delete (buildData as any).buildId;

  return await createBuild(discordId, newName, {
    ...buildData,
    isPublic: false,
    isFavorite: false,
    likes: 0,
    views: 0,
    uses: 0,
  });
}

// Usar build (equipar)
export async function useBuild(
  buildId: string,
  discordId: string
): Promise<{ success: boolean; build?: IBuild; message: string }> {
  const build = await Build.findOneAndUpdate(
    { buildId, odiscordId: discordId },
    { $inc: { uses: 1 }, $set: { lastUsedAt: new Date() } },
    { new: true }
  );

  if (!build) {
    return { success: false, message: 'Build não encontrada.' };
  }

  return {
    success: true,
    build: build.toObject(),
    message: `Build "${build.name}" equipada!`,
  };
}

// Favoritar/desfavoritar build
export async function toggleBuildFavorite(
  buildId: string,
  discordId: string
): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
  const build = await Build.findOne({ buildId, odiscordId: discordId });
  if (!build) {
    return { success: false, isFavorite: false, message: 'Build não encontrada.' };
  }

  build.isFavorite = !build.isFavorite;
  await build.save();

  return {
    success: true,
    isFavorite: build.isFavorite,
    message: build.isFavorite ? 'Build favoritada!' : 'Build removida dos favoritos.',
  };
}

// Tornar build pública/privada
export async function toggleBuildPublic(
  buildId: string,
  discordId: string
): Promise<{ success: boolean; isPublic: boolean; message: string }> {
  const build = await Build.findOne({ buildId, odiscordId: discordId });
  if (!build) {
    return { success: false, isPublic: false, message: 'Build não encontrada.' };
  }

  build.isPublic = !build.isPublic;
  await build.save();

  return {
    success: true,
    isPublic: build.isPublic,
    message: build.isPublic ? 'Build agora é pública!' : 'Build agora é privada.',
  };
}

// Dar like em build
export async function likeBuild(
  buildId: string,
  discordId: string
): Promise<{ success: boolean; likes: number; message: string }> {
  const build = await Build.findOne({ buildId, isPublic: true });
  if (!build) {
    return { success: false, likes: 0, message: 'Build não encontrada ou não é pública.' };
  }

  // Não pode dar like na própria build
  if (build.odiscordId === discordId) {
    return { success: false, likes: build.likes, message: 'Não pode dar like na própria build.' };
  }

  build.likes++;
  await build.save();

  return { success: true, likes: build.likes, message: 'Like dado!' };
}

// Buscar builds públicas
export async function searchPublicBuilds(
  filters: {
    class?: string;
    tags?: string[];
    minLevel?: number;
    maxLevel?: number;
    search?: string;
  } = {},
  sort: 'likes' | 'views' | 'recent' = 'likes',
  limit: number = 20
): Promise<any[]> {
  const query: any = { isPublic: true };

  if (filters.class) {
    query.class = filters.class;
  }

  if (filters.tags?.length) {
    query.tags = { $in: filters.tags };
  }

  if (filters.minLevel !== undefined) {
    query.level = { ...query.level, $gte: filters.minLevel };
  }

  if (filters.maxLevel !== undefined) {
    query.level = { ...query.level, $lte: filters.maxLevel };
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const sortOptions: Record<string, any> = {
    likes: { likes: -1 },
    views: { views: -1 },
    recent: { createdAt: -1 },
  };

  return await Build.find(query)
    .sort(sortOptions[sort])
    .limit(limit)
    .lean();
}

// ============= COMPARTILHAMENTO =============

// Gerar código de compartilhamento
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Compartilhar build
export async function shareBuild(
  buildId: string,
  discordId: string,
  username: string,
  expirationDays?: number
): Promise<{ success: boolean; shareCode?: string; message: string }> {
  const build = await Build.findOne({ buildId, odiscordId: discordId });
  if (!build) {
    return { success: false, message: 'Build não encontrada.' };
  }

  // Verificar se já tem compartilhamento ativo
  const existingShare = await SharedBuild.findOne({
    buildId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  if (existingShare) {
    return { success: true, shareCode: existingShare.shareCode, message: 'Build já compartilhada.' };
  }

  const shareCode = generateShareCode();
  const expiresAt = expirationDays
    ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
    : undefined;

  const sharedBuild = new SharedBuild({
    shareCode,
    buildId,
    odiscordId: discordId,
    username,
    buildSnapshot: build.toObject(),
    expiresAt,
    views: 0,
    imports: 0,
  });

  await sharedBuild.save();

  return { success: true, shareCode, message: `Build compartilhada! Código: ${shareCode}` };
}

// Obter build por código de compartilhamento
export async function getBuildByShareCode(
  shareCode: string
): Promise<{ success: boolean; build?: Partial<IBuild>; username?: string; message: string }> {
  const shared = await SharedBuild.findOne({
    shareCode: shareCode.toUpperCase(),
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  if (!shared) {
    return { success: false, message: 'Código de compartilhamento inválido ou expirado.' };
  }

  shared.views++;
  await shared.save();

  return {
    success: true,
    build: shared.buildSnapshot,
    username: shared.username,
    message: 'Build encontrada!',
  };
}

// Importar build de código
export async function importBuildFromCode(
  shareCode: string,
  discordId: string,
  newName: string
): Promise<{ success: boolean; build?: IBuild; message: string }> {
  const shared = await SharedBuild.findOne({
    shareCode: shareCode.toUpperCase(),
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  if (!shared) {
    return { success: false, message: 'Código de compartilhamento inválido ou expirado.' };
  }

  const result = await createBuild(discordId, newName, {
    ...shared.buildSnapshot,
    isPublic: false,
    isFavorite: false,
    likes: 0,
    views: 0,
    uses: 0,
  });

  if (result.success) {
    shared.imports++;
    await shared.save();
  }

  return result;
}

// ============= TEMPLATES =============

// Obter templates por classe
export async function getTemplatesByClass(className: string): Promise<any[]> {
  return await BuildTemplate.find({ class: className, isActive: true }).lean();
}

// Obter templates por role
export async function getTemplatesByRole(role: string): Promise<any[]> {
  return await BuildTemplate.find({ role, isActive: true }).lean();
}

// Criar build a partir de template
export async function createBuildFromTemplate(
  templateId: string,
  discordId: string,
  buildName: string
): Promise<{ success: boolean; build?: IBuild; message: string }> {
  const template = await BuildTemplate.findOne({ templateId, isActive: true });
  if (!template) {
    return { success: false, message: 'Template não encontrado.' };
  }

  return await createBuild(discordId, buildName, {
    equipment: template.equipment,
    skills: template.skills,
    attributeDistribution: template.attributeDistribution,
    talents: template.talents,
    class: template.class,
    level: template.minLevel,
    description: `Baseado no template "${template.name}"`,
    tags: [template.role, template.difficulty],
  });
}

// ============= CLEANUP =============

// Limpar compartilhamentos expirados
export async function cleanupExpiredShares(): Promise<number> {
  const result = await SharedBuild.deleteMany({
    expiresAt: { $lte: new Date() },
  });
  return result.deletedCount;
}

// ============= ESTATÍSTICAS =============

// Obter estatísticas de builds do usuário
export async function getUserBuildStats(discordId: string): Promise<{
  totalBuilds: number;
  publicBuilds: number;
  totalLikes: number;
  totalViews: number;
  mostUsedBuild?: string;
  mostLikedBuild?: string;
}> {
  const builds = await Build.find({ odiscordId: discordId }).lean();

  const stats = {
    totalBuilds: builds.length,
    publicBuilds: builds.filter(b => b.isPublic).length,
    totalLikes: builds.reduce((sum, b) => sum + b.likes, 0),
    totalViews: builds.reduce((sum, b) => sum + b.views, 0),
    mostUsedBuild: undefined as string | undefined,
    mostLikedBuild: undefined as string | undefined,
  };

  if (builds.length > 0) {
    const mostUsed = builds.reduce((a, b) => (a.uses > b.uses ? a : b));
    const mostLiked = builds.reduce((a, b) => (a.likes > b.likes ? a : b));

    stats.mostUsedBuild = mostUsed.name;
    stats.mostLikedBuild = mostLiked.name;
  }

  return stats;
}
