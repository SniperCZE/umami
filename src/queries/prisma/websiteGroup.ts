import type { Prisma } from '@/generated/prisma/client';
import { buildWebsiteTree } from '@/lib/websiteTree';
import prisma from '@/lib/prisma';
import { sanitizeSortFilters } from '@/lib/sort';
import type { QueryFilters } from '@/lib/types';

const WEBSITE_GROUP_SORT_FIELDS = ['name', 'createdAt'] as const;

export async function findWebsiteGroup(criteria: Prisma.WebsiteGroupFindUniqueArgs) {
  return prisma.client.websiteGroup.findUnique(criteria);
}

export async function getWebsiteGroup(groupId: string) {
  return findWebsiteGroup({
    where: {
      id: groupId,
    },
  });
}

export async function getWebsiteGroups(
  criteria: Prisma.WebsiteGroupFindManyArgs,
  filters: QueryFilters = {},
) {
  const sortFilters = sanitizeSortFilters(filters, WEBSITE_GROUP_SORT_FIELDS, { orderBy: 'name' });
  const { search } = sortFilters;
  const { getSearchParameters, pagedQuery } = prisma;

  const where: Prisma.WebsiteGroupWhereInput = {
    ...criteria.where,
    ...getSearchParameters(search, [{ name: 'contains' }]),
  };

  return pagedQuery('websiteGroup', { ...criteria, where }, sortFilters);
}

export async function getUserWebsiteGroups(userId: string, filters?: QueryFilters) {
  return getWebsiteGroups(
    {
      where: {
        userId,
      },
    },
    filters,
  );
}

export async function getTeamWebsiteGroups(teamId: string, filters?: QueryFilters) {
  return getWebsiteGroups(
    {
      where: {
        teamId,
      },
    },
    filters,
  );
}

export async function getAllWebsiteGroupsForOwner({
  userId,
  teamId,
}: {
  userId?: string | null;
  teamId?: string | null;
}) {
  return prisma.client.websiteGroup.findMany({
    where: teamId ? { teamId } : { userId },
    orderBy: { name: 'asc' },
  });
}

export async function createWebsiteGroup(
  data: Prisma.WebsiteGroupUncheckedCreateInput,
) {
  return prisma.client.websiteGroup.create({ data });
}

export async function updateWebsiteGroup(
  groupId: string,
  data: Prisma.WebsiteGroupUncheckedUpdateInput,
) {
  return prisma.client.websiteGroup.update({
    where: { id: groupId },
    data,
  });
}

export async function deleteWebsiteGroup(groupId: string) {
  return prisma.client.websiteGroup.delete({
    where: { id: groupId },
  });
}

export async function getWebsiteGroupChildCount(groupId: string) {
  const [childGroups, websites] = await Promise.all([
    prisma.client.websiteGroup.count({
      where: { parentId: groupId },
    }),
    prisma.client.website.count({
      where: { groupId, deletedAt: null },
    }),
  ]);

  return childGroups + websites;
}

export async function getWebsiteTreeForOwner({
  userId,
  teamId,
}: {
  userId?: string | null;
  teamId?: string | null;
}) {
  const ownerFilter = teamId ? { teamId } : { userId };

  const [groups, websites] = await Promise.all([
    prisma.client.websiteGroup.findMany({
      where: ownerFilter,
      orderBy: { name: 'asc' },
    }),
    prisma.client.website.findMany({
      where: {
        ...ownerFilter,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return buildWebsiteTree(groups, websites);
}

export async function deleteWebsiteGroupsForOwner({
  userId,
  teamId,
}: {
  userId?: string | null;
  teamId?: string | null;
}) {
  return prisma.client.websiteGroup.deleteMany({
    where: teamId ? { teamId } : { userId },
  });
}
