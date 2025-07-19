import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import fs from 'fs'
import path from 'path'

// Adapted from https://github.com/drizzle-team/drizzle-orm/discussions/1545#discussioncomment-11115682
const getLocalD1 = () => {
  try {
    const basePath = path.resolve('.wrangler/state/v3/d1')
    const localDbFiles = fs
      .readdirSync(basePath, { encoding: 'utf-8', recursive: true })
      .filter((f) => f.endsWith('.sqlite'))

    if (localDbFiles.length === 0) {
      throw new Error(`No .sqlite files found in ${basePath}`)
    }

    console.log('Found local db files:', localDbFiles)
    const dbFile = localDbFiles[0]
    // const dbFile =
    //   'miniflare-D1DatabaseObject/c6b97b54306f034a0f6566f4e36a1e8d175d81909a21df8009196a0f3e240555.sqlite'

    console.log('Connecting to local db file:', dbFile)

    const url = path.resolve(basePath, dbFile)
    return url
  } catch (err) {
    console.log(`Error: ${err}`)
    throw err
  }
}

const getCredentials = () => {
  const isRemote = process.env.DB_REMOTE === 'true'

  if (!isRemote) {
    console.log('Connecting to local database...')
    return {
      dbCredentials: {
        url: getLocalD1()
      }
    }
  }

  // This value comes from the wrangler.toml file
  const databaseId = '31aa2a7b-6eb4-4639-8588-643e0cc1098b'
  console.log(
    `Connecting to remote database with id ${databaseId}... Account ID: ${process.env.CLOUDFLARE_ACCOUNT_ID}`
  )
  return {
    driver: 'd1-http',
    dbCredentials: {
      databaseId,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      token: process.env.CLOUDFLARE_D1_TOKEN
    }
  }
}

const config = defineConfig({
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'sqlite',
  ...getCredentials()
})

export default config
