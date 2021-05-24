import React, { useCallback, useState, CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { getPathByName, showOpenDialog } from '../../lib/electronOnly'
import styled from '../../shared/lib/styled'
import { border } from '../../shared/lib/styled/styleFunctions'
import Button from '../../shared/components/atoms/Button'
import { formButtonStyle } from './form'

const FormFolderSelectorInput = styled.input`
  display: block;
  flex: 1;
  padding: 0.375rem 0.75rem;
  line-height: 1.5;
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
  ${border};
  background-color: white;
  cursor: pointer;
  &:disabled {
    color: gray;
    background-color: #ccc;
  }
`

const FormFolderSelectorContainer = styled.div`
  display: flex;

  .folder__selector__select_folder__button {
    ${formButtonStyle};
  }
`

interface FormFolderSelector {
  value: string
  style?: CSSProperties
  setValue: (value: string) => void
}

const FormFolderSelector = ({ value, style, setValue }: FormFolderSelector) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false)
  const { t } = useTranslation()
  const openDialog = useCallback(async () => {
    if (dialogIsOpen) {
      return
    }
    setDialogIsOpen(true)
    try {
      const result = await showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: t('folder.select'),
        defaultPath: getPathByName('home'),
      })
      if (result.canceled) {
        return
      }
      if (result.filePaths == null) {
        return
      }

      setValue(result.filePaths[0])
    } catch (error) {
      throw error
    } finally {
      setDialogIsOpen(false)
    }
  }, [dialogIsOpen, setValue, t])

  return (
    <FormFolderSelectorContainer style={style}>
      <FormFolderSelectorInput
        type='text'
        onClick={openDialog}
        readOnly
        value={
          value.trim().length === 0 ? t('folder.noLocationSelected') : value
        }
      />
      <Button
        className='folder__selector__select_folder__button'
        variant='primary'
        onClick={openDialog}
      >
        Select Folder
      </Button>
    </FormFolderSelectorContainer>
  )
}

export default FormFolderSelector
