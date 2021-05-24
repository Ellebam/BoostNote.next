import React, { useState, useCallback } from 'react'
import { FormGroup, FormLabel, FormTextInput } from '../atoms/form'
import { useTranslation } from 'react-i18next'
import { useRouter } from '../../lib/router'
import { useDb } from '../../lib/db'
import { useAnalytics, analyticsEvents } from '../../lib/analytics'
import FormFolderSelector from '../atoms/FormFolderSelector'
import { useToast } from '../../shared/lib/stores/toast'
import Button from '../../shared/components/atoms/Button'

const FSStorageCreateForm = () => {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const { t } = useTranslation()
  const { push } = useRouter()
  const { createStorage } = useDb()
  const { pushMessage } = useToast()
  const { report } = useAnalytics()
  const createStorageCallback = useCallback(async () => {
    try {
      const storage = await createStorage(name, { type: 'fs', location })
      report(analyticsEvents.createStorage)
      push(`/app/storages/${storage.id}/notes`)
      // todo: [komediruzecki-21/05/2021] Not opening sidebar and proper welcome screen, just empty list of notes
    } catch (error) {
      pushMessage({
        title: 'Something went wrong',
        description: error.toString(),
      })
    }
  }, [createStorage, location, name, push, report, pushMessage])

  return (
    <>
      <FormGroup>
        <FormLabel>{t('storage.name')}</FormLabel>
        <FormTextInput
          type='text'
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
      </FormGroup>
      <FormGroup>
        <FormLabel>Location</FormLabel>

        <FormFolderSelector value={location} setValue={setLocation} />
      </FormGroup>
      <FormGroup>
        <Button
          className='form__group__form_button'
          disabled={name.trim().length === 0 || location.trim().length === 0}
          onClick={createStorageCallback}
        >
          {t('storage.create')}
        </Button>
      </FormGroup>
    </>
  )
}

export default FSStorageCreateForm
