import { describe, expect, test } from 'vitest';
import {
  attachGroupPathToWebsites,
  buildWebsiteTree,
  flattenGroupsForSelect,
  flattenTreeForSelect,
  getGroupPath,
  isGroupDescendant,
} from './websiteTree';

const groups = [
  { id: 'g1', name: 'Muj projekt', parentId: null },
  { id: 'g2', name: 'LAB', parentId: 'g1' },
  { id: 'g3', name: 'PROD', parentId: 'g1' },
  { id: 'g4', name: 'Dalsi websites', parentId: null },
];

const websites = [
  { id: 'w1', name: 'app', groupId: 'g2' },
  { id: 'w2', name: 'www', groupId: 'g2' },
  { id: 'w3', name: 'app', groupId: 'g3' },
  { id: 'w4', name: 'www', groupId: 'g3' },
  { id: 'w5', name: 'website 1', groupId: 'g4' },
  { id: 'w6', name: 'website 2', groupId: 'g4' },
  { id: 'w7', name: 'muj blog', groupId: null },
];

describe('buildWebsiteTree', () => {
  test('builds nested tree with alphabetical sibling ordering', () => {
    const tree = buildWebsiteTree(groups, websites);

    expect(tree).toHaveLength(3);
    expect(tree[0].type).toBe('group');
    expect(tree[0].name).toBe('Dalsi websites');
    expect(tree[1].type).toBe('website');
    expect(tree[1].name).toBe('muj blog');
    expect(tree[2].type).toBe('group');
    expect(tree[2].name).toBe('Muj projekt');

    const project = tree[2];
    expect(project.type).toBe('group');
    if (project.type === 'group') {
      expect(project.children).toHaveLength(2);
      expect(project.children[0].name).toBe('LAB');
      expect(project.children[1].name).toBe('PROD');
    }
  });
});

describe('getGroupPath', () => {
  test('returns full path for nested group', () => {
    const groupsMap = new Map(groups.map(group => [group.id, group]));

    expect(getGroupPath('g2', groupsMap)).toBe('Muj projekt / LAB');
    expect(getGroupPath(null, groupsMap)).toBeNull();
  });
});

describe('attachGroupPathToWebsites', () => {
  test('adds groupPath to websites', () => {
    const result = attachGroupPathToWebsites(websites, groups);

    expect(result.find(website => website.id === 'w1')?.groupPath).toBe('Muj projekt / LAB');
    expect(result.find(website => website.id === 'w7')?.groupPath).toBeNull();
  });
});

describe('flattenTreeForSelect', () => {
  test('flattens tree with depth', () => {
    const tree = buildWebsiteTree(groups, websites);
    const flat = flattenTreeForSelect(tree);

    expect(flat.some(item => item.id === 'g1' && item.depth === 0)).toBe(true);
    expect(flat.some(item => item.id === 'g2' && item.depth === 1)).toBe(true);
    expect(flat.some(item => item.id === 'w7' && item.depth === 0)).toBe(true);
  });
});

describe('flattenGroupsForSelect', () => {
  test('excludes specified group and descendants from select options', () => {
    const options = flattenGroupsForSelect(groups, 'g1');

    expect(options.map(option => option.id)).not.toContain('g1');
    expect(options.map(option => option.id)).toContain('g4');
  });
});

describe('isGroupDescendant', () => {
  test('detects descendant relationship', () => {
    const groupsMap = new Map(groups.map(group => [group.id, group]));

    expect(isGroupDescendant('g2', 'g1', groupsMap)).toBe(true);
    expect(isGroupDescendant('g1', 'g2', groupsMap)).toBe(false);
  });
});
