export interface CategoryItem {
  name: string
  amount: number
  parentName?: string
}

interface TreemapLeaf {
  name: string
  amount: number
  value: number
  fill: string
  parentName?: string
  fillOpacity?: number
  [key: string]: unknown
}

interface TreemapGroup {
  name: string
  value: number
  fill: string
  children?: TreemapLeaf[]
  [key: string]: unknown
}

const MIN_FILL_OPACITY = 0.4
const OPACITY_STEP = 0.15

const groupItemsByParent = (items: CategoryItem[]): Map<string, CategoryItem[]> => {
  const groups = new Map<string, CategoryItem[]>()

  items.forEach(item => {
    const key = item.parentName ?? item.name
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  })

  return groups
}

const buildLeafNode = (item: CategoryItem, color: string): TreemapLeaf => ({
  name: item.name,
  amount: item.amount,
  value: item.amount,
  fill: color
})

const buildGroupNode = (groupName: string, groupItems: CategoryItem[], color: string): TreemapGroup => ({
  name: groupName,
  value: groupItems.reduce((sum, item) => sum + item.amount, 0),
  fill: color,
  children: groupItems.map((item, index) => ({
    name: item.name,
    parentName: groupName,
    amount: item.amount,
    value: item.amount,
    fill: color,
    fillOpacity: Math.max(MIN_FILL_OPACITY, 1 - index * OPACITY_STEP)
  }))
})

const isStandaloneLeaf = (items: CategoryItem[]): boolean =>
  items.length === 1 && !items[0].parentName

const buildTreemapData = (items: CategoryItem[], colors: string[]) => {
  const groups = groupItemsByParent(items)

  const children = Array.from(groups.entries()).map(([groupName, groupItems], index) => {
    const color = colors[index % colors.length]

    return isStandaloneLeaf(groupItems)
      ? buildLeafNode(groupItems[0], color)
      : buildGroupNode(groupName, groupItems, color)
  })

  return [{ name: 'Total', children }]
}

export default buildTreemapData
