import { sendAdminChangeNotification } from '@services/telegram'

interface User {
  email: string
  username: string
}

interface NotifyChangeArgs {
  env: Env
  user: User
  resourceType: string
  resourceId: string | number
  resourceName: string
  resourceShortName?: string
  action: 'updated' | 'created' | 'deleted' | 'added' | 'removed'
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  addedItem?: string
  removedItem?: string
}

export async function notifyAdminChange(args: NotifyChangeArgs) {
  try {
    await sendAdminChangeNotification(args.env, {
      adminEmail: args.user.email,
      adminUsername: args.user.username,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      resourceName: args.resourceName,
      resourceShortName: args.resourceShortName,
      action: args.action,
      changes: args.changes,
      addedItem: args.addedItem,
      removedItem: args.removedItem
    })
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    // Don't throw - we don't want notification failures to break the API
  }
}

export function detectChanges(
  oldData: any,
  newData: any,
  fieldsToTrack: string[]
) {
  const changes = []

  for (const field of fieldsToTrack) {
    if (newData[field] !== undefined && oldData[field] !== newData[field]) {
      changes.push({
        field,
        oldValue: oldData[field],
        newValue: newData[field]
      })
    }
  }

  return changes
}
