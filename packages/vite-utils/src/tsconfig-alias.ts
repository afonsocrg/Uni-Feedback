import * as path from 'path'
import * as fs from 'fs'

/**
 * Reads tsconfig.json and converts the paths configuration to Vite alias format
 * @param tsconfigPath - Path to tsconfig.json file (relative to the project root)
 * @param projectRoot - Root directory of the project (usually __dirname in vite.config)
 * @returns Record of alias mappings for Vite
 */
export function getViteAliasFromTsconfig(
  tsconfigPath: string = './tsconfig.json',
  projectRoot: string = process.cwd()
): Record<string, string> {
  try {
    const tsconfigFullPath = path.resolve(projectRoot, tsconfigPath)
    const tsconfigContent = fs.readFileSync(tsconfigFullPath, 'utf-8')
    const tsconfig = JSON.parse(tsconfigContent)

    const paths = tsconfig.compilerOptions?.paths as
      | Record<string, string[]>
      | undefined
    if (!paths) {
      return {}
    }

    const alias: Record<string, string> = {}

    for (const pathKey in paths) {
      const target = paths[pathKey][0]
      const key = pathKey.replace('/*', '')
      const value = target
        .replace('/*', '')
        .replace('./', '')
        .replace('../', '')

      // Handle relative paths
      if (target.startsWith('../')) {
        alias[key] = path.resolve(projectRoot, target.replace('/*', ''))
      } else {
        alias[key] = path.resolve(projectRoot, value)
      }
    }

    return alias
  } catch (error) {
    console.warn('Failed to read tsconfig.json for alias generation:', error)
    return {}
  }
}
