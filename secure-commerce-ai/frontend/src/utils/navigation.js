/**
 * navigation.js — Active Navigation Item Resolver
 *
 * Solves the multi-select / prefix collision bug where child routes like
 * '/seller/products/add' cause both 'My Products' (/seller/products) and
 * 'Add Product' (/seller/products/add) to be highlighted simultaneously.
 *
 * Rules:
 *  1. Exact match takes highest priority.
 *  2. Hash match (e.g. #section) matches if path and hash agree.
 *  3. If another item in allPaths has an exact match, this item is NOT active.
 *  4. For sub-routes (e.g. /seller/products/123/edit), the item with the longest
 *     matching prefix is chosen as the single active item.
 */
export const isNavItemActive = (itemPath, currentPath, allPaths = []) => {
  if (!itemPath || !currentPath) return false

  // 1. Exact match
  if (currentPath === itemPath) return true

  // 2. Hash match
  if (itemPath.includes('#')) {
    const [basePath, hash] = itemPath.split('#')
    return currentPath === basePath && typeof window !== 'undefined' && window.location.hash === `#${hash}`
  }

  // 3. If ANOTHER item in the navigation menu matches currentPath exactly,
  // this item should NOT be highlighted (prevents /seller/products matching when on /seller/products/add)
  const hasExactMatchElsewhere = allPaths.some((p) => p === currentPath)
  if (hasExactMatchElsewhere) {
    return false
  }

  // 4. Sub-route matching (e.g. /seller/products/123/edit or /admin/orders/55)
  const isSubPath = currentPath.startsWith(itemPath + '/')
  if (!isSubPath) return false

  // Find the longest matching prefix among all navigation items
  const matchingPrefixes = allPaths.filter((p) => currentPath.startsWith(p + '/'))
  const longestPrefix = matchingPrefixes.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    ''
  )

  return itemPath === longestPrefix
}

export default isNavItemActive
