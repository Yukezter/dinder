import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import * as refs from '../refs'

/* ---------- STORAGE EVENT TRIGGERS ---------- */

/* ON FILE UPLOAD */

export const onFileUpload = functions.storage
  .bucket()
  .object()
  .onFinalize(async object => {
    if (!object.contentType?.startsWith('image/')) {
      return functions.logger.log('This is not an image.')
    }

    if (!object.name?.endsWith('profilePhoto')) {
      return functions.logger.log('This is not valid file name.')
    }

    try {
      if (object.name) {
        const file = admin.storage().bucket().file(object.name)
        if (process.env.FUNCTIONS_EMULATOR) {
          const [fileExists] = await file.exists()
          if (!fileExists) {
            return functions.logger.log('File not found in storage.')
          }
        }

        await file.makePublic()
        let photoURL = file.publicUrl().concat(`?m=${Date.now()}`)
        if (process.env.FIREBASE_STORAGE_EMULATOR_HOST?.startsWith('0.0.0.0')) {
          photoURL = photoURL.replace('0.0.0.0', '192.168.0.196')
        }

        const uid = object.name.split('/')[1]
        await refs.firestore.users.doc(uid).update({ photoURL })
      }
    } catch (error) {
      functions.logger.log(error)
      console.log(error)
    }
  })

/* ON FILE DELETE */

export const onFileDelete = functions.storage.object().onDelete(async object => {
  const { contentType, name } = object

  if (!contentType?.startsWith('image/')) {
    return functions.logger.log('This is not an image.')
  }

  if (!name?.endsWith('profilePhoto')) {
    return functions.logger.log('This is not valid file name.')
  }

  try {
    const uid = object.name?.split('/')[1]
    if (uid) {
      await refs.firestore.users.doc(uid).update({
        photoURL: null,
      })
    }
  } catch (error) {
    functions.logger.log(error)
    console.log(error)
  }
})
