import * as admin from 'firebase-admin'

import { CustomUserClaims } from '../types'

export const updateCustomUserClaims = async (
  uid: string,
  data: CustomUserClaims
): Promise<void> => {
  await admin.auth().setCustomUserClaims(uid, data)

  // The front end listens for this change and refreshes the user's token
  const userMetadataRef = admin.database().ref('metadata').child(uid)
  await userMetadataRef.set({ refreshTime: new Date().getTime() })
}
